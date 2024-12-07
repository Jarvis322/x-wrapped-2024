import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    console.log('Initializing Twitter client...');
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    const v2Client = client.v2;

    console.log('Fetching user data for:', username);
    const user = await v2Client.userByUsername(username);
    console.log('User data:', user);

    if (!user.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Fetching tweets for user ID:', user.data.id);
    const tweets = await v2Client.userTimeline(user.data.id, {
      max_results: 10,
      'tweet.fields': ['public_metrics', 'created_at'],
    });

    const tweetData = tweets.data?.data || [];
    console.log('Found tweets:', tweetData.length);
    
    const metrics = {
      totalTweets: tweetData.length,
      totalLikes: 0,
      totalRetweets: 0,
      totalReplies: 0
    };

    let bestTweet = null;
    let bestTweetScore = 0;

    tweetData.forEach(tweet => {
      const likes = tweet.public_metrics?.like_count || 0;
      const retweets = tweet.public_metrics?.retweet_count || 0;
      const replies = tweet.public_metrics?.reply_count || 0;

      metrics.totalLikes += likes;
      metrics.totalRetweets += retweets;
      metrics.totalReplies += replies;

      const score = likes + (retweets * 2) + replies;
      if (score > bestTweetScore) {
        bestTweetScore = score;
        bestTweet = {
          content: tweet.text,
          likes,
          retweets,
          replies,
          date: tweet.created_at
        };
      }
    });

    const response = {
      username: user.data.username,
      ...metrics,
      bestTweet
    };

    console.log('Sending response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Twitter data',
      message: error.message,
      details: error.data?.errors || [],
      code: error.code
    }, { status: 500 });
  }
} 