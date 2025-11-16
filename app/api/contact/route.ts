import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createContactExchange, getContactExchange, getUserById } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { other_user_id, post_id, post_type } = body;

    if (!other_user_id || !post_id || !post_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (post_type !== 'carpool' && post_type !== 'housing') {
      return NextResponse.json(
        { error: 'post_type must be "carpool" or "housing"' },
        { status: 400 }
      );
    }

    // Create contact exchange
    const exchangeId = createContactExchange({
      user1_id: session.id,
      user2_id: parseInt(other_user_id),
      post_id: parseInt(post_id),
      post_type,
      contact_shared_by: session.id,
    });

    // Get other user's info to return
    const otherUser = getUserById(parseInt(other_user_id));

    return NextResponse.json({
      success: true,
      exchangeId,
      contactInfo: otherUser
        ? {
            name: otherUser.name,
            email: otherUser.email,
          }
        : null,
    });
  } catch (error) {
    console.error('Error creating contact exchange:', error);
    return NextResponse.json(
      { error: 'Failed to exchange contact information' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const other_user_id = searchParams.get('other_user_id');
    const post_id = searchParams.get('post_id');
    const post_type = searchParams.get('post_type') as 'carpool' | 'housing' | null;

    if (!other_user_id || !post_id || !post_type) {
      return NextResponse.json(
        { error: 'other_user_id, post_id, and post_type are required' },
        { status: 400 }
      );
    }

    const exchange = getContactExchange(
      session.id,
      parseInt(other_user_id),
      parseInt(post_id),
      post_type
    );

    if (!exchange) {
      return NextResponse.json({ exchanged: false });
    }

    // Get other user's info
    const otherUser = getUserById(parseInt(other_user_id));

    return NextResponse.json({
      exchanged: true,
      contactInfo: otherUser
        ? {
            name: otherUser.name,
            email: otherUser.email,
          }
        : null,
    });
  } catch (error) {
    console.error('Error checking contact exchange:', error);
    return NextResponse.json(
      { error: 'Failed to check contact exchange' },
      { status: 500 }
    );
  }
}

