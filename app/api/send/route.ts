import { NextRequest, NextResponse } from 'next/server';
import { CATEGORY_MAPPINGS } from '@/config';
import { sendEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/supabase/db';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { category, topic, message, isAnonymous } = body;
    
    // Check if anonymous feedback
    const isAnonymousFeedback = category === 'Anonymous Company Feedback' || isAnonymous;
    
    // For non-anonymous messages, require authentication and use verified user info
    let user = null;
    if (!isAnonymousFeedback) {
      if (!authUser) {
        return NextResponse.json(
          { error: 'Authentication required. Please sign in first.' },
          { status: 401 }
        );
      }
      // Fetch user profile from database
      user = await getUserById(authUser.id);
      if (!user) {
        return NextResponse.json(
          { error: 'User profile not found. Please complete your sign up.' },
          { status: 401 }
        );
      }
    }

    // Validation
    if (!category || !topic || !message) {
      return NextResponse.json(
        { error: 'Category, topic, and message are required' },
        { status: 400 }
      );
    }

    // Find category mapping
    const categoryMapping = CATEGORY_MAPPINGS.find(c => c.label === category);
    if (!categoryMapping) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Nova Scotia timezone (GMT-4)
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Halifax',
      dateStyle: 'full',
      timeStyle: 'long',
    });

    // Send email immediately
    // For non-anonymous: Always use verified user info from database (prevents spoofing)
    // For anonymous: Use null values
    try {
      await sendEmail({
        category,
        recipientEmail: categoryMapping.email,
        recipientName: categoryMapping.recipientName,
        workerName: isAnonymousFeedback ? null : (user?.name || null),
        workerEmail: isAnonymousFeedback ? null : (user?.email || null),
        workerPhone: isAnonymousFeedback ? null : (user?.phone || null),
        topic,
        message,
        timestamp,
        isAnonymous: isAnonymousFeedback,
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json(
        { 
          error: emailError instanceof Error ? emailError.message : 'Failed to send email. Please check your RESEND_API_KEY in .env.local' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Error in /api/send:', error);
    // Ensure we always return JSON, never HTML
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

