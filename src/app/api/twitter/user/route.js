import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

// In-memory cache objesi
const userCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 dakika

// Rate limit takibi için
let rateLimitInfo = {
  remaining: 180, // varsayılan limit
  reset: Date.now() + CACHE_DURATION,
  isLimited: false
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Rate limit kontrolü
    if (rateLimitInfo.isLimited && Date.now() < rateLimitInfo.reset) {
      console.log('Global rate limit active. Checking cache...');
      const cachedData = userCache.get(username);
      if (cachedData) {
        console.log('Returning cached data due to rate limit for:', username);
        return NextResponse.json(cachedData.data);
      }

      const waitMinutes = Math.ceil((rateLimitInfo.reset - Date.now()) / (60 * 1000));
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: `Twitter API limiti aşıldı. ${waitMinutes} dakika sonra tekrar deneyin.`,
        retryAfter: waitMinutes * 60
      }, { 
        status: 429,
        headers: {
          'Retry-After': String(waitMinutes * 60)
        }
      });
    }

    // Cache'den kontrol et
    const cachedData = userCache.get(username);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log('Returning cached data for:', username);
      return NextResponse.json(cachedData.data);
    }

    const bearerToken = process.env.TWITTER_BEARER_TOKEN?.trim();
    if (!bearerToken) {
      console.error('TWITTER_BEARER_TOKEN is missing');
      return NextResponse.json({ error: 'Twitter configuration is missing' }, { status: 500 });
    }

    const client = new TwitterApi(bearerToken);
    const v2Client = client.v2;

    try {
      // Kullanıcı bilgilerini al
      const user = await v2Client.userByUsername(username, {
        'user.fields': [
          'public_metrics',
          'description',
          'profile_image_url',
          'created_at',
          'verified',
          'location',
          'url'
        ]
      });

      // Rate limit bilgisini güncelle
      const userRateLimit = user.rateLimit;
      if (userRateLimit) {
        rateLimitInfo = {
          remaining: userRateLimit.remaining,
          reset: userRateLimit.reset * 1000, // Unix timestamp'i milisaniyeye çevir
          isLimited: userRateLimit.remaining <= 2 // 2 veya daha az istek kaldıysa limit aktif
        };
        console.log('Rate limit status:', {
          remaining: rateLimitInfo.remaining,
          resetIn: Math.ceil((rateLimitInfo.reset - Date.now()) / (60 * 1000)) + ' minutes',
          isLimited: rateLimitInfo.isLimited
        });
      }

      if (!user.data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Kullanıcının tweet'lerini al
      const tweets = await v2Client.userTimeline(user.data.id, {
        max_results: 10,
        'tweet.fields': ['public_metrics', 'created_at'],
        exclude: ['retweets']
      });

      // Tweet rate limit bilgisini de güncelle
      const tweetRateLimit = tweets.rateLimit;
      if (tweetRateLimit && tweetRateLimit.remaining < rateLimitInfo.remaining) {
        rateLimitInfo = {
          remaining: tweetRateLimit.remaining,
          reset: tweetRateLimit.reset * 1000,
          isLimited: tweetRateLimit.remaining <= 2
        };
        console.log('Updated rate limit after tweets:', rateLimitInfo);
      }

      const tweetData = tweets.data?.data || [];
      let totalLikes = 0;
      let totalRetweets = 0;
      let totalReplies = 0;
      let bestTweet = null;
      let bestTweetScore = 0;

      // Tweet'leri analiz et
      tweetData.forEach(tweet => {
        const metrics = tweet.public_metrics || {};
        const likes = metrics.like_count || 0;
        const retweets = metrics.retweet_count || 0;
        const replies = metrics.reply_count || 0;

        totalLikes += likes;
        totalRetweets += retweets;
        totalReplies += replies;

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

      const publicMetrics = user.data.public_metrics || {};
      const accountAge = Math.floor((new Date() - new Date(user.data.created_at)) / (1000 * 60 * 60 * 24));
      const tweetsPerDay = accountAge > 0 ? (publicMetrics.tweet_count / accountAge).toFixed(2) : 0;
      const engagementRate = publicMetrics.tweet_count > 0 ? 
        ((totalLikes + totalRetweets + totalReplies) / publicMetrics.tweet_count).toFixed(2) : 0;

      const responseData = {
        username: user.data.username,
        name: user.data.name,
        profileImage: user.data.profile_image_url,
        description: user.data.description,
        verified: user.data.verified || false,
        location: user.data.location,
        url: user.data.url,
        metrics: {
          totalTweets: publicMetrics.tweet_count || 0,
          totalLikes,
          totalRetweets,
          totalReplies,
          followers: publicMetrics.followers_count || 0,
          following: publicMetrics.following_count || 0,
          tweetsPerDay: Number(tweetsPerDay),
          engagementRate: Number(engagementRate)
        },
        bestTweet,
        joinDate: user.data.created_at,
        accountAge,
        rateLimit: {
          remaining: rateLimitInfo.remaining,
          resetIn: Math.ceil((rateLimitInfo.reset - Date.now()) / (60 * 1000))
        }
      };

      // Cache'e kaydet
      userCache.set(username, {
        data: responseData,
        timestamp: Date.now()
      });

      console.log('Cached new data for:', username);
      return NextResponse.json(responseData);

    } catch (twitterError) {
      console.error('Twitter API Error:', twitterError);
      
      if (twitterError.code === 429 || (twitterError.data && twitterError.data.status === 429)) {
        // Rate limit'i güncelle
        rateLimitInfo.isLimited = true;
        rateLimitInfo.reset = Date.now() + (15 * 60 * 1000); // 15 dakika ekle
        
        // Cache'den veri döndürmeyi dene
        if (cachedData) {
          console.log('Rate limit exceeded, returning cached data for:', username);
          return NextResponse.json(cachedData.data);
        }

        const waitMinutes = Math.ceil((rateLimitInfo.reset - Date.now()) / (60 * 1000));
        return NextResponse.json({
          error: 'Rate limit exceeded',
          message: `Twitter API limiti aşıldı. ${waitMinutes} dakika sonra tekrar deneyin.`,
          retryAfter: waitMinutes * 60
        }, { 
          status: 429,
          headers: {
            'Retry-After': String(waitMinutes * 60)
          }
        });
      }

      return NextResponse.json({
        error: 'Twitter API error',
        message: 'Twitter verilerine erişilemiyor. Lütfen daha sonra tekrar deneyin.',
        code: twitterError.code
      }, { status: 403 });
    }

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
} 