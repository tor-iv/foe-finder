'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fadeInUp, scaleIn } from '@/lib/animations';

export default function ForgotPasswordPage() {
  const { requestPasswordReset, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await requestPasswordReset(email);

    if (result.error) {
      setError(result.error);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial="initial"
            animate="animate"
            variants={scaleIn}
            className="w-full max-w-md"
          >
            <div className="win95-panel">
              <div className="win95-titlebar -mx-4 -mt-4 mb-4">
                <span className="text-sm">FOE FINDER - Email Sent</span>
              </div>

              <div className="text-center space-y-4">
                <div className="text-4xl">📬</div>
                <h2 className="text-xl font-display font-bold">Check Your Email</h2>
                <p className="text-sm text-muted-foreground">
                  If an account exists for:
                </p>
                <p className="font-mono text-foe-accent break-all">{email}</p>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll receive a password reset link shortly.
                </p>
                <Link href="/login" className="win95-btn inline-block mt-4">
                  Back to Login
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="w-full max-w-md"
          >
            <div className="win95-panel">
              <div className="win95-titlebar -mx-4 -mt-4 mb-4">
                <span className="text-sm">FOE FINDER - Reset Password</span>
              </div>

              <div className="text-center mb-6">
                <h1 className="text-xl font-display font-bold">Forgot Password?</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold uppercase">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="win95-input w-full"
                      placeholder="you@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-foe-error text-sm p-2 win95-inset"
                    >
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isLoading || !email}
                    className="win95-btn win95-btn-primary w-full py-3"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </motion.button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-foe-accent hover:underline"
                >
                  ← Back to Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
