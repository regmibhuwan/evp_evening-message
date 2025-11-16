import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Return cached client if available
  if (client) {
    return client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build time (when window is undefined), allow missing env vars
  // This prevents build errors. The actual error will be thrown at runtime in the browser.
  if (!url || !key) {
    if (typeof window === 'undefined') {
      // Server-side during build - create a minimal mock client to prevent build errors
      // This will fail at runtime, but allows the build to complete
      return {
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
          signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
          signUp: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
          signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
        },
        from: () => ({
          select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
          insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
          update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
          upsert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        }),
      } as any;
    }
    // Client-side - throw error immediately
    throw new Error(
      'Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.'
    );
  }

  client = createBrowserClient(url, key);
  return client;
}

