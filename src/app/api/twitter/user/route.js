import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

// Önbellek sistemi
const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 dakika

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Önbellekten kontrol et
    const cachedData = cache.get(username);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedData.data,
        _cached: true,
        _cacheAge: Math.floor((Date.now() - cachedData.timestamp) / 1000)
      });
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
          totalLikes: publicMetrics.like_count || 0,
          totalRetweets: 0,
          totalReplies: 0,
          followers: publicMetrics.followers_count || 0,
          following: publicMetrics.following_count || 0
        },
        topWords: ["twitter", "web", "teknoloji", "yazılım", "kod", "geliştirici"],
        bestTweet: {
          content: "Rate limit nedeniyle tweet içerikleri gösterilemiyor",
          likes: 0,
          retweets: 0,
          replies: 0,
          date: new Date().toISOString()
        }
      };

      // Veriyi önbelleğe al
      cache.set(username, {
        timestamp: Date.now(),
        data: response
      });

      return NextResponse.json(response);

    } catch (twitterError) {
      console.error('Twitter API Error:', twitterError);
      
      // Rate limit hatası için önbellekten veri dön
      if (twitterError.code === 429) {
        const cachedData = cache.get(username);
        if (cachedData) {
          return NextResponse.json({
            ...cachedData.data,
            _cached: true,
            _cacheAge: Math.floor((Date.now() - cachedData.timestamp) / 1000)
          });
        }

        const resetTime = Number(twitterError.rateLimit?.reset) * 1000;
        const waitSeconds = Math.ceil((resetTime - Date.now()) / 1000);
        
        return NextResponse.json({
          error: 'Rate limit exceeded',
          message: 'Twitter API rate limit reached. Please try again later.',
          retryAfter: waitSeconds
        }, { 
          status: 429,
          headers: {
            'Retry-After': String(waitSeconds)
          }
        });
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