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
      // Tek seferde tüm kullanıcı bilgilerini al
      const user = await client.v2.userByUsername(username, {
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

      if (!user.data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const publicMetrics = user.data.public_metrics || {};

      // Kullanıcı verilerinden özet çıkar
      const tweetCount = publicMetrics.tweet_count || 0;
      const likeCount = publicMetrics.like_count || 0;
      const followersCount = publicMetrics.followers_count || 0;
      const followingCount = publicMetrics.following_count || 0;

      // Kullanıcı seviyesini hesapla
      const engagementScore = (followersCount * 2) + (likeCount * 0.5) + (tweetCount * 1);
      let userLevel = 'Yeni Başlayan';
      
      if (engagementScore > 100000) userLevel = 'Sosyal Medya Fenomeni';
      else if (engagementScore > 50000) userLevel = 'İçerik Üreticisi';
      else if (engagementScore > 10000) userLevel = 'Aktif Kullanıcı';
      else if (engagementScore > 5000) userLevel = 'Düzenli Kullanıcı';

      const response = {
        username: user.data.username,
        name: user.data.name,
        profileImage: user.data.profile_image_url,
        description: user.data.description,
        verified: user.data.verified || false,
        location: user.data.location,
        url: user.data.url,
        metrics: {
          totalTweets: tweetCount,
          totalLikes: likeCount,
          followers: followersCount,
          following: followingCount,
          engagementScore: Math.floor(engagementScore),
          level: userLevel
        },
        joinDate: user.data.created_at,
        accountAge: Math.floor((new Date() - new Date(user.data.created_at)) / (1000 * 60 * 60 * 24))
      };

      return NextResponse.json(response);

    } catch (twitterError) {
      console.error('Twitter API Error:', twitterError);
      
      if (twitterError.code === 429) {
        const resetTime = Number(twitterError.rateLimit?.reset) * 1000;
        const waitSeconds = Math.ceil((resetTime - Date.now()) / 1000);
        
        return NextResponse.json({
          error: 'Rate limit exceeded',
          message: 'Çok fazla istek yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.',
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