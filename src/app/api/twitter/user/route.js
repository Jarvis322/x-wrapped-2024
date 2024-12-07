import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

// Basit önbellek sistemi
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

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
      console.log('Returning cached data for:', username);
      return NextResponse.json(cachedData.data);
    }

    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      console.error('TWITTER_BEARER_TOKEN is missing');
      return NextResponse.json({ error: 'Twitter configuration is missing' }, { status: 500 });
    }

    const client = new TwitterApi(bearerToken);

    try {
      // Önce kullanıcı bilgilerini al
      console.log('Fetching user data for:', username);
      const user = await client.v2.userByUsername(username, {
        'user.fields': ['public_metrics', 'description', 'profile_image_url', 'created_at']
      });

      if (!user.data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Mock tweet verisi (rate limit aşımını önlemek için)
      const mockTweets = {
        data: {
          data: Array(10).fill({
            text: "Tweet içeriği burada olacak",
            public_metrics: {
              like_count: Math.floor(Math.random() * 100),
              retweet_count: Math.floor(Math.random() * 50),
              reply_count: Math.floor(Math.random() * 20)
            },
            created_at: new Date().toISOString()
          })
        }
      };

      const response = {
        username: user.data.username,
        name: user.data.name,
        profileImage: user.data.profile_image_url,
        description: user.data.description,
        metrics: {
          followers: user.data.public_metrics?.followers_count || 0,
          following: user.data.public_metrics?.following_count || 0,
          totalTweets: user.data.public_metrics?.tweet_count || 0,
          totalLikes: user.data.public_metrics?.like_count || 0
        },
        topWords: ["twitter", "web", "teknoloji", "yazılım", "kod", "geliştirici"],
        bestTweet: {
          content: "En popüler tweet içeriği",
          likes: 100,
          retweets: 50,
          replies: 25,
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
      
      // Rate limit hatası için özel yanıt
      if (twitterError.code === 429) {
        // Önbellekte veri varsa onu döndür
        const cachedData = cache.get(username);
        if (cachedData) {
          console.log('Returning stale cached data due to rate limit');
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