import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

    // Kullanıcı bilgilerini al
    const user = await client.v2.userByUsername(username);
    if (!user.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Son tweetleri al
    const tweets = await client.v2.userTimeline(user.data.id, {
      'tweet.fields': ['public_metrics', 'created_at'],
      max_results: 100,
    });

    // İstatistikleri hesapla
    const tweetData = tweets.data.data || [];
    const metrics = tweetData.reduce((acc, tweet) => {
      acc.totalLikes += tweet.public_metrics.like_count;
      acc.totalRetweets += tweet.public_metrics.retweet_count;
      acc.totalReplies += tweet.public_metrics.reply_count;
      return acc;
    }, { totalLikes: 0, totalRetweets: 0, totalReplies: 0 });

    // En popüler tweet'i bul
    const bestTweet = tweetData.reduce((best, current) => {
      const currentScore = 
        current.public_metrics.like_count + 
        (current.public_metrics.retweet_count * 2) + 
        current.public_metrics.reply_count;
      
      const bestScore = 
        best.public_metrics?.like_count + 
        (best.public_metrics?.retweet_count * 2) + 
        best.public_metrics?.reply_count;

      return currentScore > bestScore ? current : best;
    }, tweetData[0]);

    return NextResponse.json({
      username: user.data.username,
      totalTweets: tweetData.length,
      totalLikes: metrics.totalLikes,
      totalRetweets: metrics.totalRetweets,
      totalReplies: metrics.totalReplies,
      bestTweet: bestTweet ? {
        content: bestTweet.text,
        likes: bestTweet.public_metrics.like_count,
        retweets: bestTweet.public_metrics.retweet_count,
        replies: bestTweet.public_metrics.reply_count,
        date: bestTweet.created_at
      } : null
    });
  } catch (error) {
    console.error('Twitter API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch Twitter data' }, { status: 500 });
  }
} 