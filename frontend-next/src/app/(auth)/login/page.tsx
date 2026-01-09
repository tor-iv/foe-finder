'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fadeInUp, shake } from '@/lib/animations';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shouldShake, setShouldShake] = useState(false);

  // Check for redirect message
  const message = searchParams.get('message');
  const redirect = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    } else {
      router.push(redirect || '/questionnaire');
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className="w-full max-w-md"
    >
      {/* Win95 Window */}
      <div className="win95-panel">
        {/* Title Bar */}
        <div className="win95-titlebar -mx-4 -mt-4 mb-4 flex items-center gap-2">
          <span className="text-sm">FOE FINDER - Login</span>
        </div>

        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-display font-black tracking-tight">
            <span className="text-foe-accent">FOE</span>
            <span className="text-foreground">FINDER</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            The Only Honest Dating App
          </p>
        </div>

        {/* Messages */}
        {message === 'verify-email' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="win95-inset p-3 mb-4 text-sm"
          >
            Please verify your email before continuing.
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          animate={shouldShake ? 'animate' : 'initial'}
          variants={shake}
        >
          <div className="space-y-4">
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
              <Label
                htmlFor="password"
                className="text-sm font-bold uppercase"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="win95-input w-full"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-foe-error text-sm p-2 win95-inset"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="win95-btn win95-btn-primary w-full py-3"
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </div>
        </motion.form>

        {/* Links */}
        <div className="mt-6 space-y-2 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-foe-accent hover:underline block"
          >
            Forgot password?
          </Link>
          <div className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-foe-accent hover:underline font-bold"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LoginLoading() {
  return (
    <div className="w-full max-w-md">
      <div className="win95-panel animate-pulse">
        <div className="win95-titlebar -mx-4 -mt-4 mb-4">
          <span className="text-sm">FOE FINDER - Login</span>
        </div>
        <div className="h-48 bg-win95-shadow/20" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<LoginLoading />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
