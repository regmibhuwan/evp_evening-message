'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/lib/supabase/db';

export function useSupabaseAuth() {
  const supabase = createClient(); // Returns mock during build
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run in browser (not during build)
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    
    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        await fetchUserProfile(authUser.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching user profile:', error);
        setUser(null);
        return;
      }

      setUser(data as User);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    }
  };

  const logout = async () => {
    if (typeof window === 'undefined') return;
    
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/signin';
  };

  return { user, loading, logout, refresh: checkUser };
}

