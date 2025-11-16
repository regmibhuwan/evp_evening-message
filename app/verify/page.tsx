'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

declare global {
  interface Window {
    google: any;
  }
}

export default function VerifyPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [clientId, setClientId] = useState<string>('');

  const handleCredentialResponse = useCallback(async (response: any) => {
    setIsVerifying(true);
    setError('');

    try {
      const result = await login(response.credential);
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'Verification failed');
        setIsVerifying(false);
      }
    } catch (err) {
      setError('An error occurred during verification');
      setIsVerifying(false);
    }
  }, [login, router]);

  // Get client ID from environment variable
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    setClientId(id);
    if (!id) {
      setError('Google Client ID is not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file and restart the server.');
    }
  }, []);

  useEffect(() => {
    // Don't initialize if client ID is missing
    if (!clientId) {
      console.log('Google Client ID not found');
      return;
    }

    const initializeGoogleSignIn = () => {
      if (!window.google) {
        console.log('Google API not loaded yet');
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        const buttonEl = document.getElementById('google-signin-button');
        if (buttonEl) {
          // Clear any existing content
          buttonEl.innerHTML = '';
          window.google.accounts.id.renderButton(buttonEl, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: 300,
          });
          console.log('Google Sign-In button rendered');
          return true;
        } else {
          console.log('Button element not found');
          return false;
        }
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        return false;
      }
    };

    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      // Script already loaded, try to initialize
      if (window.google) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          initializeGoogleSignIn();
        }, 100);
      }
      return;
    }

    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google Sign-In script loaded');
      // Try multiple times in case DOM isn't ready
      const tryRender = () => {
        if (initializeGoogleSignIn()) {
          return;
        }
        // Retry after a short delay
        setTimeout(() => {
          if (initializeGoogleSignIn()) {
            return;
          }
          // One more retry
          setTimeout(() => {
            initializeGoogleSignIn();
          }, 500);
        }, 200);
      };
      
      setTimeout(tryRender, 100);
    };

    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
      setError('Failed to load Google Sign-In. Please check your internet connection.');
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup to avoid re-loading
    };
  }, [clientId, handleCredentialResponse]);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (authLoading) {
    return (
      <div className="container">
        <div className="form-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="container">
        <div className="form-container">
          <h1>Already Verified</h1>
          <p>You are already logged in as {user.email}</p>
          <button onClick={() => router.push('/')} className="submit-button">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form-container">
        <h1>Gmail Verification</h1>
        <p className="subtitle">
          Verify your Gmail account to use the platform securely
        </p>

        {error && <div className="error-message">{error}</div>}

        {isVerifying ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Verifying your account...</p>
          </div>
        ) : clientId ? (
          <>
            <div
              id="google-signin-button"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '20px',
                marginBottom: '20px',
                minHeight: '50px',
              }}
            >
              <p style={{ color: '#999', fontSize: '14px' }}>Loading Google Sign-In...</p>
            </div>
            <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
              Click the button above to verify your Gmail account with one click.
              This helps prevent spam and ensures secure communication.
            </p>
            {!error && (
              <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginTop: '10px' }}>
                If the button doesn't appear, please check the browser console for errors.
              </p>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#c33' }}>
            <p><strong>Configuration Error</strong></p>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              Google Client ID is not configured. Please check your .env.local file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

