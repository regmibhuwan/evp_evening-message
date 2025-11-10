import { NextRequest, NextResponse } from 'next/server';
import { CATEGORY_MAPPINGS, REQUIRE_SUPERVISOR_APPROVAL, SUPERVISOR_EMAIL } from '@/config';
import { sendEmail, notifySupervisor } from '@/lib/email';
import { insertMessage } from '@/lib/db';

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

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'full',
      timeStyle: 'long',
    });

    // If supervisor approval is required, store message and notify supervisor
    if (REQUIRE_SUPERVISOR_APPROVAL) {
      const messageId = insertMessage({
        category,
        recipient_email: categoryMapping.email,
        recipient_name: categoryMapping.recipientName,
        worker_name: workerName || null,
        topic,
        message,
        timestamp,
      });

      // Notify supervisor
      try {
        await notifySupervisor(SUPERVISOR_EMAIL, messageId, {
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
      } catch (error) {
        console.error('Failed to notify supervisor:', error);
        // Continue anyway - message is stored
      }

      return NextResponse.json({
        success: true,
        message: 'Message submitted for approval',
        messageId,
      });
    }

    // Otherwise, send email immediately
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

