'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient(); // Safe to call - returns mock during build
  const initialStep = searchParams?.get('step') === 'phone' ? 'phone' : 'email';
  const [step, setStep] = useState<'email' | 'phone' | 'verify'>(initialStep);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useGoogle, setUseGoogle] = useState(false);

  useEffect(() => {
    // Check if user is already signed in and has phone verified
    // Only run in browser (not during build)
    if (typeof window === 'undefined') return;
    
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        // Check if user has phone verified
        const { data: userProfile } = await supabase
          .from('users')
          .select('phone_verified, phone')
          .eq('id', user.id)
          .single();
        
        if (userProfile?.phone_verified && userProfile?.phone) {
          router.push('/');
        } else if (userProfile && !userProfile.phone_verified) {
          // User exists but needs phone verification
          setStep('phone');
          // Get user's name from profile
          const { data: profile } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();
          if (profile) {
            setName(profile.name);
          }
        }
      }
    }).catch(() => {
      // Ignore errors during build
    });
  }, [router]);

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');
    setUseGoogle(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
          throw new Error('Google sign in is not enabled. Please contact the administrator or use email/password sign up.');
        }
        throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up with Google');
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password || !name) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile immediately after sign up
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name: name,
            phone: '',
            phone_verified: false,
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // If it's a duplicate, that's okay - user might already exist
          if (!profileError.message.includes('duplicate') && !profileError.message.includes('unique')) {
            throw new Error('Failed to create profile. Please try again.');
          }
        }

        setStep('phone');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!phone) {
      setError('Please enter your phone number');
      setLoading(false);
      return;
    }

    // Validate phone format for Canada (10 digits)
    const cleanPhone = phone.replace(/\s|-|\(|\)/g, ''); // Remove spaces, dashes, parentheses
    
    // Accept 10 digits (Canadian format)
    if (cleanPhone.length !== 10 || !/^\d+$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }
    
    // Format as +1XXXXXXXXXX for storage
    const formattedPhone = '+1' + cleanPhone;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        throw new Error('Please complete email sign up first, then enter your phone number.');
      }

      // Update user profile with phone number
      const { error: profileError } = await supabase
        .from('users')
        .update({
          phone: formattedPhone,
          phone_verified: false,
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
        // If user doesn't exist, create it
        if (profileError.message.includes('No rows') || profileError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email!,
              name: name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              phone: formattedPhone,
              phone_verified: false,
            });
          
          if (insertError) {
            throw new Error('Failed to save phone number. Please try again.');
          }
        } else {
          throw new Error('Failed to save phone number. Please try again.');
        }
      }

      // Send verification code
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          action: 'send',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!verificationCode) {
      setError('Please enter the verification code');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not found');
      }

      // Format phone number (same as in handlePhoneSubmit)
      const cleanPhone = phone.replace(/\s|-|\(|\)/g, '');
      // Format as +1XXXXXXXXXX for storage
      const formattedPhone = '+1' + cleanPhone;

      // Verify code via API
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          code: verificationCode,
          action: 'verify',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h1>Sign Up</h1>
        <p className="subtitle">Create your account to get started</p>

        {error && <div className="error-message">{error}</div>}

        {step === 'email' && (
          <>
            <button
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="submit-button"
              style={{
                width: '100%',
                marginBottom: '20px',
                backgroundColor: '#4285f4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>

            <div style={{ textAlign: 'center', margin: '20px 0', color: '#999' }}>OR</div>

            <form onSubmit={handleEmailSignUp}>
              <div className="form-group">
                <label htmlFor="name">
                  Full Name <span style={{ color: '#c33' }}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email Address <span style={{ color: '#c33' }}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password <span style={{ color: '#c33' }}>*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Signing up...' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit}>
            <div className="form-group">
              <label htmlFor="phone">
                Phone Number <span style={{ color: '#c33' }}>*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit phone number"
                required
                maxLength={10}
              />
              <small style={{ display: 'block', marginTop: '4px', color: '#666', fontSize: '14px' }}>
                Enter your 10-digit Canadian phone number
              </small>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Sending code...' : 'Send Verification Code'}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              style={{
                marginTop: '10px',
                background: 'none',
                border: 'none',
                color: '#4a90e2',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Back
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label htmlFor="code">
                Verification Code <span style={{ color: '#c33' }}>*</span>
              </label>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code"
                required
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
              />
              <small style={{ display: 'block', marginTop: '4px', color: '#666', fontSize: '14px' }}>
                Enter the code sent to {phone}
              </small>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Complete Sign Up'}
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              style={{
                marginTop: '10px',
                background: 'none',
                border: 'none',
                color: '#4a90e2',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Resend Code
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Already have an account? <Link href="/signin" style={{ color: '#4a90e2' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="container">
        <div className="form-container">
          <p>Loading...</p>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}

