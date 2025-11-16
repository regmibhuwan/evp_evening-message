import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserById, updateUserPhoneVerified } from '@/lib/supabase/db';

// Store verification codes in memory (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: number; phone: string }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, code, action } = body;

    if (action === 'send') {
      // Send verification code
      if (!phone) {
        return NextResponse.json(
          { error: 'Phone number is required' },
          { status: 400 }
        );
      }

      const verificationCode = generateCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      verificationCodes.set(user.id, {
        code: verificationCode,
        expiresAt,
        phone,
      });

      // In production, send SMS via Twilio, AWS SNS, or similar
      // For now, we'll log it (in development) or use a service
      console.log(`Verification code for ${phone}: ${verificationCode}`);

      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      // For now, return the code in development
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Verification code sent',
          code: verificationCode, // Only in development
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your phone',
      });
    } else if (action === 'verify') {
      // Verify code
      if (!code || !phone) {
        return NextResponse.json(
          { error: 'Code and phone number are required' },
          { status: 400 }
        );
      }

      const stored = verificationCodes.get(user.id);
      if (!stored) {
        return NextResponse.json(
          { error: 'No verification code found. Please request a new one.' },
          { status: 400 }
        );
      }

      if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(user.id);
        return NextResponse.json(
          { error: 'Verification code expired. Please request a new one.' },
          { status: 400 }
        );
      }

      if (stored.phone !== phone) {
        return NextResponse.json(
          { error: 'Phone number mismatch' },
          { status: 400 }
        );
      }

      if (stored.code !== code) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        );
      }

      // Code is valid - update user phone and mark as verified
      const userProfile = await getUserById(user.id);
      if (!userProfile) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        );
      }

      // Update user phone in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          phone: phone,
          phone_verified: true,
        })
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update phone number' },
          { status: 500 }
        );
      }

      // Clean up verification code
      verificationCodes.delete(user.id);

      return NextResponse.json({
        success: true,
        message: 'Phone number verified successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "send" or "verify"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Phone verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

