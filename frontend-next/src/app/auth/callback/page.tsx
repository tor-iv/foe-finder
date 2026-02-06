'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { scaleIn } from '@/lib/animations';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash fragment from the URL (Supabase puts tokens here)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check query params (for some flows)
        const queryParams = new URLSearchParams(window.location.search);
        const errorCode = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');

        if (errorCode || errorDescription) {
          // Provide user-friendly messages for common errors
          if (errorCode === 'access_denied') {
            setError('Email verification failed. The link may have expired or is invalid. Please try registering again or contact support.');
          } else {
            setError(errorDescription || errorCode || 'Authentication failed');
          }
          return;
        }

        // If we have tokens in the hash, set the session
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setError(sessionError.message);
            return;
          }

          // Check if this is a password recovery flow
          if (type === 'recovery') {
            router.push('/reset-password');
            return;
          }

          // Otherwise, go to questionnaire (email verified)
          router.push('/questionnaire');
          return;
        }

        // If no tokens, try to get the session (might already be set)
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          router.push('/questionnaire');
        } else {
          // No session, redirect to login
          router.push('/login');
        }
      } catch (err) {
        setError('An error occurred during authentication');
        console.error('Auth callback error:', err);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial="initial"
          animate="animate"
          variants={scaleIn}
          className="w-full max-w-md"
        >
          <div className="win95-panel">
            <div className="win95-titlebar -mx-4 -mt-4 mb-4">
              <span className="text-sm">FOE FINDER - Error</span>
            </div>

            <div className="text-center space-y-4">
              <div className="text-4xl">❌</div>
              <h2 className="text-xl font-display font-bold text-foe-error">
                Authentication Error
              </h2>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={() => router.push('/login')}
                className="win95-btn win95-btn-primary"
              >
                Back to Login
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial="initial"
        animate="animate"
        variants={scaleIn}
        className="w-full max-w-md"
      >
        <div className="win95-panel">
          <div className="win95-titlebar -mx-4 -mt-4 mb-4">
            <span className="text-sm">FOE FINDER - Authenticating</span>
          </div>

          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-4xl inline-block"
            >
              ⏳
            </motion.div>
            <h2 className="text-xl font-display font-bold">Verifying...</h2>
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your identity.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
