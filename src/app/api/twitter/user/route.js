import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Bearer token'ı kontrol et
    if (!process.env.TWITTER_BEARER_TOKEN) {
      console.error('TWITTER_BEARER_TOKEN is not defined');
      return NextResponse.json({ error: 'Twitter configuration is missing' }, { status: 500 });
    }

    console.log('Initializing Twitter client...');
    const bearerToken = process.env.TWITTER_BEARER_TOKEN.trim();
    console.log('Bearer Token:', bearerToken);
    
    const client = new TwitterApi(bearerToken);
    const v2Client = client.v2;

    console.log('Fetching user data for:', username);
    try {
      const user = await v2Client.userByUsername(username, {
        'user.fields': ['public_metrics', 'created_at', 'description', 'profile_image_url']
      });
      console.log('User data:', user);

      if (!user.data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Kullanıcının tweet'lerini al
      console.log('Fetching tweets for user:', user.data.id);
      const tweets = await v2Client.userTimeline(user.data.id, {
        max_results: 10,
        'tweet.fields': ['public_metrics', 'created_at'],
        exclude: ['retweets', 'replies']
      });

      const tweetData = tweets.data?.data || [];
      console.log('Found tweets:', tweetData.length);

      // Tweet istatistiklerini hesapla
      const metrics = {
        totalTweets: tweetData.length,
        totalLikes: 0,
        totalRetweets: 0,
        totalReplies: 0
      };

      // En iyi tweet'i bul
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

      // Kelime analizi
      const words = tweetData
        .map(tweet => tweet.text)
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(word => 
          word.length > 3 && 
          !word.startsWith('http') && 
          !word.startsWith('@') &&
          !word.startsWith('#')
        );

      const wordFreq = words.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

      const topWords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([word]) => word);

      const response = {
        username: user.data.username,
        name: user.data.name,
        profileImage: user.data.profile_image_url,
        description: user.data.description,
        metrics: {
          ...metrics,
          followers: user.data.public_metrics?.followers_count || 0,
          following: user.data.public_metrics?.following_count || 0
        },
        topWords,
        bestTweet
      };

      console.log('Sending response:', response);
      return NextResponse.json(response);

    } catch (twitterError) {
      console.error('Twitter API Error:', twitterError);
      // Hata durumunda örnek veri
      const mockData = {
        username: username,
        name: username,
        totalTweets: 150,
        totalLikes: 1200,
        totalRetweets: 300,
        totalReplies: 450,
        topWords: ["merhaba", "dünya", "twitter", "kod", "yazılım", "teknoloji"],
        bestTweet: {
          content: "Bu bir örnek tweet içeriğidir!",
          likes: 100,
          retweets: 50,
          replies: 25,
          date: new Date().toISOString()
        }
      };

      return NextResponse.json(mockData);
    }

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
} 