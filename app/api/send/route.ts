import { NextRequest, NextResponse } from 'next/server';
import { CATEGORY_MAPPINGS } from '@/config';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { category, topic, message, workerName, workerEmail, isAnonymous } = body;

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
    try {
      await sendEmail({
        category,
        recipientEmail: categoryMapping.email,
        recipientName: categoryMapping.recipientName,
        workerName: workerName || null,
        workerEmail: workerEmail || null,
        topic,
        message,
        timestamp,
        isAnonymous: isAnonymous || false,
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

