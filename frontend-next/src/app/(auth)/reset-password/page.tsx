'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fadeInUp, shake, scaleIn } from '@/lib/animations';

function ResetPasswordForm() {
  const router = useRouter();
  const { updatePassword, isLoading } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const isValid = password.length >= 6 && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordsMatch) {
      setError('Passwords do not match');
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      return;
    }

    const result = await updatePassword(password);

    if (result.error) {
      setError(result.error);
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  if (success) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        variants={scaleIn}
        className="w-full max-w-md"
      >
        <div className="win95-panel">
          <div className="win95-titlebar -mx-4 -mt-4 mb-4">
            <span className="text-sm">FOE FINDER - Success</span>
          </div>

          <div className="text-center space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="text-xl font-display font-bold">Password Updated!</h2>
            <p className="text-sm text-muted-foreground">
              Redirecting you to login...
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className="w-full max-w-md"
    >
      <div className="win95-panel">
        <div className="win95-titlebar -mx-4 -mt-4 mb-4">
          <span className="text-sm">FOE FINDER - New Password</span>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-xl font-display font-bold">Set New Password</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Choose a strong password for your account.
          </p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          animate={shouldShake ? 'animate' : 'initial'}
          variants={shake}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold uppercase">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="win95-input w-full"
                placeholder="Min 6 characters"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-bold uppercase">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`win95-input w-full ${
                  confirmPassword && !passwordsMatch ? 'ring-2 ring-foe-error' : ''
                }`}
                placeholder="Repeat password"
                required
                disabled={isLoading}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-foe-error text-xs">Passwords do not match</p>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-foe-error text-sm p-2 win95-inset"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={isLoading || !isValid}
              className="win95-btn win95-btn-primary w-full py-3"
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </motion.button>
          </div>
        </motion.form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-foe-accent hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function ResetPasswordLoading() {
  return (
    <div className="w-full max-w-md">
      <div className="win95-panel animate-pulse">
        <div className="win95-titlebar -mx-4 -mt-4 mb-4">
          <span className="text-sm">FOE FINDER - New Password</span>
        </div>
        <div className="h-64 bg-win95-shadow/20" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<ResetPasswordLoading />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
