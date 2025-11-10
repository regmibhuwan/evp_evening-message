import { NextRequest, NextResponse } from 'next/server';
import { REQUIRE_SUPERVISOR_APPROVAL } from '@/config';
import { getMessageById, updateMessageStatus } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  if (!REQUIRE_SUPERVISOR_APPROVAL) {
    return NextResponse.json(
      { error: 'Supervisor approval is not enabled' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { messageId, action } = body;

    if (!messageId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const message = getMessageById(messageId);
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.status !== 'pending') {
      return NextResponse.json(
        { error: 'Message already processed' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Send the email
      await sendEmail({
        category: message.category,
        recipientEmail: message.recipient_email,
        recipientName: message.recipient_name,
        workerName: message.worker_name,
        topic: message.topic,
        message: message.message,
        timestamp: message.timestamp,
      });

      updateMessageStatus(messageId, 'sent');
    } else {
      // Reject the message
      updateMessageStatus(messageId, 'rejected');
    }

    return NextResponse.json({
      success: true,
      message: `Message ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error processing supervisor action:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

