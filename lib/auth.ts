/**
 * Authentication utilities for Gmail verification
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { OAuth2Client } from 'google-auth-library';
import { createOrUpdateUser, getUserByEmail, type User } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

export interface SessionUser {
  id: number;
  email: string;
  name: string;
}

/**
 * Create a JWT session token
 */
export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ userId: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and get session from JWT token
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.userId as number,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Verify Google ID token and create/update user
 */
export async function verifyGoogleToken(idToken: string): Promise<User> {
  if (!GOOGLE_CLIENT_ID) {
    console.error('GOOGLE_CLIENT_ID is not configured');
    throw new Error('Google Client ID is not configured on the server. Please check environment variables.');
  }

  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token: No payload received');
    }

    if (!payload.email) {
      throw new Error('Invalid Google token: No email in payload');
    }

    if (!payload.name) {
      // Use email as fallback if name is not available
      payload.name = payload.email.split('@')[0];
    }

    // Verify it's a Gmail account
    if (!payload.email.endsWith('@gmail.com')) {
      throw new Error(`Only Gmail accounts are allowed. Your email (${payload.email}) is not a Gmail account.`);
    }

    // Create or update user
    const user = createOrUpdateUser(
      payload.email,
      payload.name,
      payload.sub
    );

    return user;
  } catch (error) {
    console.error('Google token verification error:', error);
    if (error instanceof Error) {
      // Pass through specific error messages
      throw error;
    }
    throw new Error('Failed to verify Google account. Please try again.');
  }
}

/**
 * Clear session (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

