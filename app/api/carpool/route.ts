import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createCarpoolPost,
  getCarpoolPosts,
  getCarpoolPostById,
  deleteCarpoolPost,
} from '@/lib/supabase/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const post = await getCarpoolPostById(parseInt(id));
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      return NextResponse.json({ post });
    }

    const posts = await getCarpoolPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching carpool posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carpool posts' },
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
    const { type, starting_point, destination, date, time, price, availability, additional_info } = body;

    if (!type || !starting_point || !destination || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type !== 'offer' && type !== 'request') {
      return NextResponse.json(
        { error: 'Type must be "offer" or "request"' },
        { status: 400 }
      );
    }

    const postId = await createCarpoolPost({
      user_id: user.id,
      type,
      starting_point,
      destination,
      date,
      time,
      price: price || null,
      availability: availability || null,
      additional_info: additional_info || null,
    });

    return NextResponse.json({ success: true, postId });
  } catch (error) {
    console.error('Error creating carpool post:', error);
    return NextResponse.json(
      { error: 'Failed to create carpool post' },
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

    const deleted = await deleteCarpoolPost(parseInt(id), user.id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Post not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting carpool post:', error);
    return NextResponse.json(
      { error: 'Failed to delete carpool post' },
      { status: 500 }
    );
  }
}

