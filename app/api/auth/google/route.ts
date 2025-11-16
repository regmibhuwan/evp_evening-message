import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken, createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify Google token and get/create user
    const user = await verifyGoogleToken(idToken);

    // Create session
    const sessionToken = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    console.error('Error details:', {
      message: errorMessage,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    });
    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}

