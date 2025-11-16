'use client';

import { useState, useEffect } from 'react';
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
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      // Script already loaded, initialize directly
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        const buttonEl = document.getElementById('google-signin-button');
        if (buttonEl) {
          window.google.accounts.id.renderButton(buttonEl, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: 300,
          });
        }
      }
      return;
    }

    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        const buttonEl = document.getElementById('google-signin-button');
        if (buttonEl) {
          window.google.accounts.id.renderButton(buttonEl, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: 300,
          });
        }
      }
    };

    return () => {
      // Safe cleanup - only remove if it exists
      const scriptToRemove = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.parentNode.removeChild(scriptToRemove);
      }
    };
  }, [clientId]);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleCredentialResponse = async (response: any) => {
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
  };

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
                marginTop: '20px',
                marginBottom: '20px',
              }}
            />
            <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
              Click the button above to verify your Gmail account with one click.
              This helps prevent spam and ensures secure communication.
            </p>
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

