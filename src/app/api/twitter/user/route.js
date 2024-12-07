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
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

    console.log('Fetching user data for:', username);
    try {
      const user = await client.v2.userByUsername(username);
      console.log('User data:', user);

      if (!user.data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Mock data for testing
      const mockData = {
        username: user.data.username,
        name: user.data.name || username,
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

    } catch (twitterError) {
      console.error('Twitter API Error:', twitterError);
      // Mock data for testing
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