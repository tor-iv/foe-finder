'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { scaleIn } from '@/lib/animations';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (error) {
    return (
      <div className="win95-panel">
        <div className="win95-titlebar -mx-4 -mt-4 mb-4">
          <span className="text-sm">FOE FINDER - Error</span>
        </div>

        <div className="text-center space-y-4">
          <div className="text-4xl">❌</div>
          <h2 className="text-xl font-display font-bold text-foe-error">
            Verification Failed
          </h2>
          <p className="text-sm text-muted-foreground">
            This link may have expired or already been used. Try registering again or
            request a new link from the login page.
          </p>
          <Link href="/login" className="win95-btn win95-btn-primary inline-block">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="win95-panel">
      <div className="win95-titlebar -mx-4 -mt-4 mb-4">
        <span className="text-sm">FOE FINDER - Verified</span>
      </div>

      <div className="text-center space-y-4">
        <div className="text-4xl">✅</div>
        <h2 className="text-xl font-display font-bold">Email Verified!</h2>
        <p className="text-sm text-muted-foreground">
          Your account is confirmed. Sign in to find your nemesis.
        </p>
        <Link href="/login" className="win95-btn win95-btn-primary inline-block">
          Continue to Login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial="initial" animate="animate" variants={scaleIn} className="w-full max-w-md">
        <Suspense fallback={<div className="win95-panel h-64 animate-pulse" />}>
          <VerifyEmailContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
