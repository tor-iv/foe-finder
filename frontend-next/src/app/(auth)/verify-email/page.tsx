'use client';

import { Win95TitleBar } from '@/components/win95-titlebar';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { scaleIn } from '@/lib/animations';
import { ResendVerificationButton } from '@/components/resend-verification-button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [email, setEmail] = useState('');

  if (error) {
    return (
      <div className="win95-panel">
        <Win95TitleBar title="FOE FINDER - Error" />

        <div className="text-center space-y-4">
          <div className="text-4xl">❌</div>
          <h2 className="text-xl font-display font-bold text-foe-error">
            Verification Failed
          </h2>
          <p className="text-sm text-muted-foreground">
            This link may have expired or already been used. Enter your email and
            we&apos;ll send you a fresh one.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="win95-input w-full"
            placeholder="you@example.com"
          />
          {email.includes('@') && <ResendVerificationButton email={email} />}
          <Link href="/login" className="win95-btn win95-btn-primary inline-block">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="win95-panel">
      <Win95TitleBar title="FOE FINDER - Verified" />

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
