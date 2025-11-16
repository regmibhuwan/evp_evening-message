import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createHousingPost,
  getHousingPosts,
  getHousingPostById,
  deleteHousingPost,
} from '@/lib/supabase/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const post = await getHousingPostById(parseInt(id));
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      return NextResponse.json({ post });
    }

    const posts = await getHousingPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching housing posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch housing posts' },
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
    const { location, type, title, description, price, contact_info } = body;

    if (!location || !type || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type !== 'shared' && type !== 'private') {
      return NextResponse.json(
        { error: 'Type must be "shared" or "private"' },
        { status: 400 }
      );
    }

    const postId = await createHousingPost({
      user_id: user.id,
      location,
      type,
      title,
      description,
      price: price || null,
      contact_info: contact_info || null,
    });

    return NextResponse.json({ success: true, postId });
  } catch (error) {
    console.error('Error creating housing post:', error);
    return NextResponse.json(
      { error: 'Failed to create housing post' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const deleted = await deleteHousingPost(parseInt(id), user.id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Post not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting housing post:', error);
    return NextResponse.json(
      { error: 'Failed to delete housing post' },
      { status: 500 }
    );
  }
}

