'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { authClient } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

function extractSecret(totpURI: string): string {
  try {
    return new URL(totpURI).searchParams.get('secret') ?? '';
  } catch {
    return '';
  }
}

function TwoFactorSection({
  enabled,
  onChanged,
}: {
  enabled: boolean;
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<{ secret: string; backupCodes: string[] } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const startEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
        method: 'totp',
      });
      if (error) {
        setError(error.message ?? 'Could not enable 2FA');
        return;
      }
      if (data && data.method === 'totp') {
        setSetup({
          secret: extractSecret(data.totpURI),
          backupCodes: data.backupCodes ?? [],
        });
      }
    } finally {
      setBusy(false);
    }
  };

  // enable() only generates the secret — twoFactorEnabled doesn't flip true
  // until a code from the app is confirmed, so the user proves they actually
  // scanned it before we treat 2FA as active on future logins.
  const confirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code });
      if (error) {
        setError(error.message ?? 'Invalid code');
        return;
      }
      setConfirmed(true);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { error } = await authClient.twoFactor.disable({ password });
      if (error) {
        setError(error.message ?? 'Could not disable 2FA');
        return;
      }
      setShowForm(false);
      setPassword('');
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  if (setup && confirmed) {
    return (
      <div className="win95-inset p-4 space-y-3">
        <span className="font-bold uppercase text-sm block">Two-Factor Enabled</span>
        <p className="text-xs text-muted-foreground">
          Save these backup codes somewhere safe — each works once if you lose access to your
          app:
        </p>
        <code className="block win95-outset p-2 text-xs break-all bg-background">
          {setup.backupCodes.join('  ')}
        </code>
        <button
          onClick={() => {
            setSetup(null);
            setConfirmed(false);
            setShowForm(false);
            setPassword('');
          }}
          className="win95-btn text-xs px-3 py-1"
        >
          Done
        </button>
      </div>
    );
  }

  if (setup) {
    return (
      <div className="win95-inset p-4 space-y-3">
        <span className="font-bold uppercase text-sm block">Confirm Two-Factor Setup</span>
        <p className="text-xs text-muted-foreground">
          Add this secret to your authenticator app (Google Authenticator, 1Password, etc), then
          enter the 6-digit code it shows to confirm setup:
        </p>
        <code className="block win95-outset p-2 text-xs break-all bg-background">
          {setup.secret}
        </code>
        <form onSubmit={confirmEnable} className="space-y-2">
          <Input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="win95-input w-full text-center text-lg tracking-[0.4em]"
            placeholder="000000"
            maxLength={6}
            required
            disabled={busy}
          />
          {error && <p className="text-foe-error text-xs">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="win95-btn win95-btn-primary text-xs px-3 py-1"
          >
            {busy ? 'Confirming...' : 'Confirm'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="win95-inset p-4">
      <div className="flex justify-between items-center">
        <span className="font-bold uppercase text-sm">Two-Factor Auth</span>
        <span
          className={`px-2 py-1 text-xs font-bold ${
            enabled ? 'bg-foe-success text-white' : 'bg-foe-warning text-white'
          }`}
        >
          {enabled ? 'ENABLED' : 'DISABLED'}
        </span>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="win95-btn text-xs px-3 py-1 mt-3"
        >
          {enabled ? 'Disable 2FA' : 'Enable 2FA'}
        </button>
      ) : (
        <form onSubmit={enabled ? handleDisable : startEnable} className="mt-3 space-y-2">
          <Label htmlFor="tfa-password" className="text-xs font-bold uppercase">
            Confirm Password
          </Label>
          <Input
            id="tfa-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="win95-input w-full text-sm"
            required
            disabled={busy}
          />
          {error && <p className="text-foe-error text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="win95-btn win95-btn-primary text-xs px-3 py-1"
            >
              {busy ? 'Working...' : enabled ? 'Disable' : 'Enable'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="win95-btn text-xs px-3 py-1"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="win95-panel"
        >
          <div className="win95-titlebar -mx-4 -mt-4 mb-6">
            <span className="text-sm">USER PROFILE</span>
          </div>

          {/* Avatar & Name */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 win95-outset flex items-center justify-center text-4xl">
              👤
            </div>
            <h1 className="text-2xl font-display font-bold">{user.displayName}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* Status Cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            {/* Questionnaire Status */}
            <motion.div variants={staggerItem} className="win95-inset p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase text-sm">Questionnaire</span>
                <span
                  className={`px-2 py-1 text-xs font-bold ${
                    user.hasCompletedQuestionnaire
                      ? 'bg-foe-success text-white'
                      : 'bg-foe-warning text-white'
                  }`}
                >
                  {user.hasCompletedQuestionnaire ? 'COMPLETED' : 'INCOMPLETE'}
                </span>
              </div>
            </motion.div>

            {/* Match Status */}
            <motion.div variants={staggerItem} className="win95-inset p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase text-sm">Match Status</span>
                <span
                  className={`px-2 py-1 text-xs font-bold ${
                    user.isMatched
                      ? 'bg-foe-success text-white'
                      : 'bg-foe-accent text-white'
                  }`}
                >
                  {user.isMatched ? 'MATCHED' : 'SEARCHING'}
                </span>
              </div>
            </motion.div>

            {/* Email Verification */}
            <motion.div variants={staggerItem} className="win95-inset p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase text-sm">Email</span>
                <span
                  className={`px-2 py-1 text-xs font-bold ${
                    user.emailVerified
                      ? 'bg-foe-success text-white'
                      : 'bg-foe-error text-white'
                  }`}
                >
                  {user.emailVerified ? 'VERIFIED' : 'UNVERIFIED'}
                </span>
              </div>
            </motion.div>

            {/* Member Since */}
            <motion.div variants={staggerItem} className="win95-inset p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase text-sm">Member Since</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>

            {/* Two-Factor Auth */}
            <motion.div variants={staggerItem}>
              <TwoFactorSection enabled={!!user.twoFactorEnabled} onChanged={refreshUser} />
            </motion.div>
          </motion.div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {!user.hasCompletedQuestionnaire && (
              <Link href="/questionnaire" className="win95-btn win95-btn-primary px-6 py-3">
                Take Quiz
              </Link>
            )}
            <Link href="/results" className="win95-btn px-6 py-3">
              View Results
            </Link>
            {user.isAdmin && (
              <Link href="/admin" className="win95-btn px-6 py-3">
                Admin
              </Link>
            )}
            <button
              onClick={() => logout()}
              className="win95-btn px-6 py-3 hover:bg-foe-error hover:text-white"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
