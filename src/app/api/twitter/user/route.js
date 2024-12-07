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
    const v2Client = client.v2;

    try {
      // Kullanıcı bilgilerini al
      const user = await v2Client.userByUsername(username, {
        'user.fields': ['public_metrics']
      });

      if (!user.data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Son tweetleri al
      const tweets = await v2Client.userTimeline(user.data.id, {
        max_results: 100,
        'tweet.fields': ['public_metrics', 'created_at'],
        exclude: ['retweets', 'replies']
      });

      // İstatistikleri hesapla
      const tweetData = tweets.data?.data || [];
      const metrics = tweetData.reduce((acc, tweet) => {
        const publicMetrics = tweet.public_metrics || {};
        acc.totalLikes += publicMetrics.like_count || 0;
        acc.totalRetweets += publicMetrics.retweet_count || 0;
        acc.totalReplies += publicMetrics.reply_count || 0;
        return acc;
      }, { totalLikes: 0, totalRetweets: 0, totalReplies: 0 });

      // En popüler tweet'i bul
      const bestTweet = tweetData.reduce((best, current) => {
        if (!best || !current) return best || current;

        const currentMetrics = current.public_metrics || {};
        const bestMetrics = best.public_metrics || {};

        const currentScore = 
          (currentMetrics.like_count || 0) + 
          ((currentMetrics.retweet_count || 0) * 2) + 
          (currentMetrics.reply_count || 0);
        
        const bestScore = 
          (bestMetrics.like_count || 0) + 
          ((bestMetrics.retweet_count || 0) * 2) + 
          (bestMetrics.reply_count || 0);

        return currentScore > bestScore ? current : best;
      }, null);

      // Kelime analizi
      const words = tweetData
        .map(tweet => tweet.text)
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !word.startsWith('http'));

      const wordFreq = words.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

      const topWords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([word]) => word);

      return NextResponse.json({
        username: user.data.username,
        totalTweets: tweetData.length,
        totalLikes: metrics.totalLikes,
        totalRetweets: metrics.totalRetweets,
        totalReplies: metrics.totalReplies,
        topWords,
        bestTweet: bestTweet ? {
          content: bestTweet.text,
          likes: bestTweet.public_metrics?.like_count || 0,
          retweets: bestTweet.public_metrics?.retweet_count || 0,
          replies: bestTweet.public_metrics?.reply_count || 0,
          date: bestTweet.created_at
        } : null
      });
    } catch (twitterError) {
      console.error('Twitter API Error:', twitterError);
      return NextResponse.json({ 
        error: 'Failed to fetch Twitter data',
        details: twitterError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 