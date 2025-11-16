import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createUser } from '@/lib/supabase/db';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // If user doesn't exist, create them (for Google OAuth sign up)
      if (!existingUser) {
        try {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              phone: '', // Will be set during phone verification
              phone_verified: false,
            });
          
          if (insertError) {
            console.error('Error creating user profile:', insertError);
            // If it's a duplicate key error, that's okay - user might have been created between check and insert
            if (!insertError.message.includes('duplicate') && !insertError.code?.includes('23505')) {
              throw insertError;
            }
          }
        } catch (err) {
          console.error('Error creating user:', err);
          // Don't fail the auth flow if profile creation fails - user can complete it later
        }
      }

      // Redirect to signup phone step if phone not verified, otherwise to home
      const { data: userProfile } = await supabase
        .from('users')
        .select('phone_verified, phone')
        .eq('id', data.user.id)
        .single();
      
      if (!userProfile?.phone_verified || !userProfile?.phone) {
        return NextResponse.redirect(new URL('/signup?step=phone', request.url));
      }
      
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/signin?error=Could not authenticate', request.url));
}

