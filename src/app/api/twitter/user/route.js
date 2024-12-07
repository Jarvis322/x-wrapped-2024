import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // API istemcisini oluştur
    const client = new TwitterApi({
      appKey: process.env.TWITTER_CLIENT_ID,
      appSecret: process.env.TWITTER_CLIENT_SECRET,
      accessToken: process.env.TWITTER_BEARER_TOKEN,
    });

    // Kullanıcı bilgilerini al
    const user = await client.v2.userByUsername(username);
    console.log('User data:', user);

    if (!user.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Son tweetleri al
    const tweets = await client.v2.userTimeline(user.data.id, {
      max_results: 10,
      'tweet.fields': ['public_metrics', 'created_at'],
    });
    console.log('Tweets data:', tweets);

    const tweetData = tweets.data?.data || [];
    
    // İstatistikleri hesapla
    const metrics = {
      totalTweets: tweetData.length,
      totalLikes: 0,
      totalRetweets: 0,
      totalReplies: 0
    };

    let bestTweet = null;
    let bestTweetScore = 0;

    // Tweet'leri analiz et
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

    // Yanıt oluştur
    const response = {
      username: user.data.username,
      ...metrics,
      bestTweet
    };

    console.log('Response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Twitter data',
      message: error.message,
      code: error.code
    }, { status: 500 });
  }
} 