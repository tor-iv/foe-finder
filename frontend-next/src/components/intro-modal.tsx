'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/app-store';
import { modalOverlay, modalContent } from '@/lib/animations';

export function IntroModal() {
  const { introSeen, markIntroSeen } = useAppStore();

  if (introSeen) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={modalOverlay}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
        onClick={markIntroSeen}
      >
        <motion.div
          variants={modalContent}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="win95-panel">
            {/* Title Bar */}
            <div className="win95-titlebar -mx-4 -mt-4 mb-6 flex items-center justify-between">
              <span className="text-sm">WELCOME TO FOE FINDER</span>
              <button
                onClick={markIntroSeen}
                className="w-5 h-5 win95-outset text-xs font-bold hover:win95-pressed"
              >
                ×
              </button>
            </div>

            {/* Logo */}
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight">
                <span className="text-foe-accent">FOE</span>
                <span className="text-foreground">FINDER</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2 italic">
                &ldquo;The Only Honest Dating App&rdquo;
              </p>
            </div>

            {/* Pitch */}
            <div className="space-y-4 text-center">
              <p className="text-sm">
                We promise disappointment and deliver it consistently.
              </p>

              <div className="win95-inset p-4 text-left">
                <p className="font-bold text-sm mb-2">How it works:</p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>📝 Answer 30 spicy questions</li>
                  <li>🔥 We find your hot takes</li>
                  <li>💀 Match you with your polar opposite</li>
                  <li>🎤 Optional: Record a voice intro</li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground">
                Because arguing with strangers is cheaper than therapy.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-6 text-center">
              <motion.button
                onClick={markIntroSeen}
                className="win95-btn win95-btn-primary px-8 py-3 text-lg"
                whileTap={{ scale: 0.98 }}
              >
                FIND MY NEMESIS
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
