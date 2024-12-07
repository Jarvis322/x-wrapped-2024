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
          totalRetweets: 0, // API sınırlaması nedeniyle
          totalReplies: 0, // API sınırlaması nedeniyle
          followers: publicMetrics.followers_count || 0,
          following: publicMetrics.following_count || 0
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

      return NextResponse.json(response);

    } catch (twitterError) {
      console.error('Twitter API Error:', twitterError);
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