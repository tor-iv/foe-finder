'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, useAppStoreHydrated } from '@/stores/app-store';
import { modalOverlay, modalContent, shake } from '@/lib/animations';

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
            className="bg-win95-face border-[3px] border-win95-darkShadow shadow-[4px_4px_0px_#333]"
          >
            {/* Header with Logo */}
            <div className="bg-win95-shadow/30 p-4 md:p-6 border-b-[3px] border-win95-darkShadow text-center">
              <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight">
                <span className="text-foe-accent drop-shadow-[2px_2px_0px_#333]">FOE</span>
                <span className="text-foreground drop-shadow-[2px_2px_0px_#a0a0a0]">FINDER</span>
              </h1>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
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
                    className="w-full p-3 md:p-4 font-mono text-base bg-win95-shadow/30 border-[3px] border-win95-darkShadow text-center cursor-pointer focus:outline-none focus:border-foe-accent focus:ring-2 focus:ring-foe-accent"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-foe-error/10 border-2 border-foe-error text-foe-error p-2 text-xs uppercase tracking-wide font-bold text-center"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={!birthDate}
                  className="w-full p-3 md:p-4 bg-foe-accent text-foreground font-mono text-base font-bold uppercase tracking-[2px] border-[3px] border-win95-darkShadow shadow-[3px_3px_0px_#333] hover:bg-foe-accent/80 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#333] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-win95-shadow/30 transition-all duration-100"
                  whileTap={{ scale: 0.98 }}
                >
                  Proceed at Your Own Risk
                </motion.button>
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
