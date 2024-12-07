import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      console.error('TWITTER_BEARER_TOKEN is missing');
      return NextResponse.json({ error: 'Twitter configuration is missing' }, { status: 500 });
    }

    const client = new TwitterApi(bearerToken);

    try {
      // Kullanıcı bilgilerini al
      const user = await client.v2.userByUsername(username, {
        'user.fields': ['public_metrics', 'description', 'profile_image_url', 'created_at']
      });

      if (!user.data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Son tweet'leri al
      const tweets = await client.v2.userTimeline(user.data.id, {
        max_results: 100,
        'tweet.fields': ['public_metrics', 'created_at'],
        exclude: ['retweets', 'replies']
      });

      // Tweet verilerini analiz et
      const tweetData = tweets.data?.data || [];
      let totalLikes = 0;
      let totalRetweets = 0;
      let totalReplies = 0;
      let bestTweet = null;
      let bestTweetScore = 0;

      // Kelime analizi için
      const words = new Map();
      const excludeWords = new Set(['https', 'http', 'the', 'and', 'for', 'bir', 've', 'bu', 'da', 'de']);

      tweetData.forEach(tweet => {
        const metrics = tweet.public_metrics || {};
        const likes = metrics.like_count || 0;
        const retweets = metrics.retweet_count || 0;
        const replies = metrics.reply_count || 0;

        totalLikes += likes;
        totalRetweets += retweets;
        totalReplies += replies;

        // En iyi tweet'i bul
        const score = likes * 2 + retweets * 3 + replies;
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

        // Kelime analizi
        const tweetWords = tweet.text
          .toLowerCase()
          .split(/[\s.,!?]+/)
          .filter(word => 
            word.length > 3 && 
            !word.startsWith('@') && 
            !word.startsWith('#') && 
            !word.startsWith('http') &&
            !excludeWords.has(word)
          );

        tweetWords.forEach(word => {
          words.set(word, (words.get(word) || 0) + 1);
        });
      });

      // En çok kullanılan kelimeleri bul
      const topWords = Array.from(words.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([word]) => word);

      // Kullanıcının public metriklerini al
      const publicMetrics = user.data.public_metrics || {};

      // Yanıt objesi oluştur
      const response = {
        username: user.data.username,
        name: user.data.name,
        profileImage: user.data.profile_image_url,
        description: user.data.description,
        metrics: {
          totalTweets: publicMetrics.tweet_count || 0,
          totalLikes: totalLikes,
          totalRetweets: totalRetweets,
          totalReplies: totalReplies,
          followers: publicMetrics.followers_count || 0,
          following: publicMetrics.following_count || 0
        },
        topWords,
        bestTweet: bestTweet || {
          content: "Henüz tweet bulunamadı",
          likes: 0,
          retweets: 0,
          replies: 0,
          date: new Date().toISOString()
        }
      };

      return NextResponse.json(response);

    } catch (twitterError) {
      console.error('Twitter API Error:', twitterError);
      
      if (twitterError.code === 429) {
        return NextResponse.json({
          error: 'Rate limit exceeded',
          message: 'Twitter API rate limit reached. Please try again later.',
          code: 429
        }, { status: 429 });
      }

      return NextResponse.json({
        error: 'Twitter API error',
        message: twitterError.message,
        code: twitterError.code
      }, { status: 403 });
    }

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
} 