import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createChatMessage, getChatMessages, getUserById } from '@/lib/supabase/db';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const postType = searchParams.get('postType') as 'carpool' | 'housing' | null;

    if (!postId || !postType) {
      return NextResponse.json(
        { error: 'postId and postType are required' },
        { status: 400 }
      );
    }

    if (postType !== 'carpool' && postType !== 'housing') {
      return NextResponse.json(
        { error: 'postType must be "carpool" or "housing"' },
        { status: 400 }
      );
    }

    const messages = await getChatMessages(parseInt(postId), postType);
    
    // Include sender names
    const messagesWithNames = await Promise.all(
      messages.map(async (msg) => {
        const sender = await getUserById(msg.sender_id);
        return {
          ...msg,
          senderName: sender?.name || 'Unknown',
          senderEmail: sender?.email || '',
        };
      })
    );

    return NextResponse.json({ messages: messagesWithNames });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiver_id, post_id, post_type, message } = body;

    if (!receiver_id || !post_id || !post_type || !message) {
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

    // Create chat message
    const messageId = await createChatMessage({
      sender_id: user.id,
      receiver_id: receiver_id,
      post_id: parseInt(post_id),
      post_type,
      message,
    });

    // Send email notification to receiver
    try {
      const receiver = await getUserById(receiver_id);
      const sender = await getUserById(user.id);
      if (receiver && sender) {
        const postTypeLabel = post_type === 'carpool' ? 'Carpool' : 'Housing';
        await sendEmail({
          category: 'Chat Notification',
          recipientEmail: receiver.email,
          recipientName: receiver.name,
          workerName: sender.name,
          workerEmail: sender.email,
          workerPhone: sender.phone,
          topic: `New message from ${sender.name} - ${postTypeLabel} Post #${post_id}`,
          message: `You have received a new message:\n\n${message}\n\nYou can view and reply to this message on the platform.`,
          timestamp: new Date().toLocaleString('en-US', {
            timeZone: 'America/Halifax',
            dateStyle: 'full',
            timeStyle: 'long',
          }),
          isAnonymous: false,
        });
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

