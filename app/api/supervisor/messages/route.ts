import { NextResponse } from 'next/server';
import { REQUIRE_SUPERVISOR_APPROVAL } from '@/config';
import { getPendingMessages } from '@/lib/db';

export async function GET() {
  if (!REQUIRE_SUPERVISOR_APPROVAL) {
    return NextResponse.json(
      { error: 'Supervisor approval is not enabled' },
      { status: 403 }
    );
  }

  try {
    const messages = getPendingMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

