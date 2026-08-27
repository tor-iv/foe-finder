'use client';

import { useEffect, useRef, useState } from 'react';
import { authClient } from '@/lib/auth-client';

const COOLDOWN_SECONDS = 45; // stays under the 20-req/60s auth rate limit

export function ResendVerificationButton({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleClick = async () => {
    setState('sending');
    setErrorMsg('');
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: '/verify-email',
    });
    if (error) {
      setState('error');
      setErrorMsg(error.message ?? 'Could not send email. Try again shortly.');
    } else {
      setState('sent');
    }
    startCooldown();
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'sending' || cooldown > 0}
        className="win95-btn text-xs px-3 py-1"
      >
        {cooldown > 0
          ? `Resend in ${cooldown}s`
          : state === 'sending'
            ? 'Sending...'
            : 'Resend Verification Email'}
      </button>
      {state === 'sent' && (
        <p className="text-xs text-foe-success">Sent — check your inbox.</p>
      )}
      {state === 'error' && <p className="text-xs text-foe-error">{errorMsg}</p>}
    </div>
  );
}
