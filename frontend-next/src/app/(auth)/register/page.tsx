'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fadeInUp, shake, scaleIn } from '@/lib/animations';

function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, emailVerificationPending } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState('');
  const [shouldShake, setShouldShake] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const isValid =
    displayName.length >= 2 &&
    email.includes('@') &&
    password.length >= 6 &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordsMatch) {
      setError('Passwords do not match');
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      return;
    }

    const result = await register(email, password, displayName, marketingConsent);

    if (result.error) {
      setError(result.error);
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    }
  };

  // Show verification pending screen
  if (emailVerificationPending) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        variants={scaleIn}
        className="w-full max-w-md"
      >
        <div className="win95-panel">
          <div className="win95-titlebar -mx-4 -mt-4 mb-4">
            <span className="text-sm">FOE FINDER - Verify Email</span>
          </div>

          <div className="text-center space-y-4">
            <div className="text-4xl">📧</div>
            <h2 className="text-xl font-display font-bold">Check Your Email</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a verification link to:
            </p>
            <p className="font-mono text-foe-accent break-all">{email}</p>
            <div className="win95-inset p-3 text-sm text-left">
              <p>Click the link in the email to verify your account.</p>
              <p className="mt-2 text-muted-foreground">
                Didn&apos;t receive it? Check your spam folder.
              </p>
            </div>
            <Link href="/login" className="win95-btn inline-block mt-4">
              Back to Login
            </Link>
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
          <span className="text-sm">FOE FINDER - Register</span>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-display font-black tracking-tight">
            <span className="text-foe-accent">FOE</span>
            <span className="text-foreground">FINDER</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find Your Perfect Nemesis
          </p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          animate={shouldShake ? 'animate' : 'initial'}
          variants={shake}
        >
          <div className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-bold uppercase">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="win95-input w-full"
                placeholder="Your nemesis name"
                required
                minLength={2}
                disabled={isLoading}
              />
            </div>

            {/* Email */}
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

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold uppercase">
                Password
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

            {/* Confirm Password */}
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

            {/* Marketing Consent */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-1 w-4 h-4 accent-foe-accent"
                disabled={isLoading}
              />
              <span className="text-xs text-muted-foreground">
                I want to receive updates about new features and matching opportunities
              </span>
            </label>

            {/* Error */}
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

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading || !isValid}
              className="win95-btn win95-btn-primary w-full py-3"
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </motion.button>
          </div>
        </motion.form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-foe-accent hover:underline font-bold">
            Sign In
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function RegisterLoading() {
  return (
    <div className="w-full max-w-md">
      <div className="win95-panel animate-pulse">
        <div className="win95-titlebar -mx-4 -mt-4 mb-4">
          <span className="text-sm">FOE FINDER - Register</span>
        </div>
        <div className="h-96 bg-win95-shadow/20" />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<RegisterLoading />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
