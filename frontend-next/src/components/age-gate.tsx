'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, useAppStoreHydrated } from '@/stores/app-store';
import { modalOverlay, modalContent, shake } from '@/lib/animations';
import { Win95TitleBar } from '@/components/win95-titlebar';

export function AgeGate() {
  const hydrated = useAppStoreHydrated();
  const { ageVerified, verifyAge } = useAppStore();
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [shouldShake, setShouldShake] = useState(false);

  // Don't render until hydrated to avoid flash of age gate
  if (!hydrated) return null;
  if (ageVerified) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!birthDate) {
      setError('Please enter your birthday');
      return;
    }

    const date = new Date(birthDate);
    if (isNaN(date.getTime())) {
      setError('Invalid date');
      return;
    }

    // Check if date is in the future
    if (date > new Date()) {
      setError('Birth date cannot be in the future');
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      return;
    }

    const isVerified = verifyAge(date);

    if (!isVerified) {
      setError('You must be 21 or older to enter');
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={modalOverlay}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
      >
        <motion.div
          variants={modalContent}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full max-w-md"
        >
          <motion.div
            animate={shouldShake ? 'animate' : 'initial'}
            variants={shake}
            className="win95-panel"
          >
            <Win95TitleBar title="FOE FINDER - Age Verification" />

            {/* Header with Logo */}
            <div className="text-center mb-4">
              <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight">
                <span className="text-foe-accent">FOE</span>
                <span className="text-foreground">FINDER</span>
              </h1>
            </div>

            {/* Content */}
            <div className="px-2 pb-2 md:px-4">
              <h2 className="text-lg md:text-xl font-display font-black text-center uppercase tracking-[2px] md:tracking-[3px] mb-2">
                Age Verification
              </h2>
              <p className="text-sm text-muted-foreground text-center uppercase tracking-wide mb-6">
                You must be <strong className="text-foe-accent font-bold">21 or older</strong> to willingly enter a relationship disaster zone.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="birthdate"
                    className="block text-xs font-bold uppercase tracking-wide mb-2 text-center"
                  >
                    Enter Your Birthday
                  </label>
                  <input
                    type="date"
                    id="birthdate"
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      setError('');
                    }}
                    className="win95-input w-full p-3 md:p-4 text-base text-center cursor-pointer"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="win95-inset text-foe-error p-2 text-xs uppercase tracking-wide font-bold text-center"
                  >
                    ⚠ {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={!birthDate}
                  className="win95-btn win95-btn-primary w-full p-3 md:p-4 text-base tracking-[2px]"
                >
                  Proceed at Your Own Risk
                </button>
              </form>

              <p className="text-[10px] text-muted-foreground text-center mt-6 uppercase tracking-wide">
                By entering, you accept full responsibility for all future arguments.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
