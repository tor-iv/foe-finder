'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { useQuestionnaire } from '@/hooks/use-questionnaire';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  matchReveal,
  hotTakeCard,
  springs,
} from '@/lib/animations';
import { HotTake } from '@/types';

export default function ResultsPage() {
  const { user } = useAuth();
  const { getHotTakes } = useQuestionnaire();
  const [hotTakes, setHotTakes] = useState<HotTake[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const takes = getHotTakes(3);
    setHotTakes(takes);

    // Trigger reveal animation after a delay
    const timer = setTimeout(() => setIsRevealed(true), 500);
    return () => clearTimeout(timer);
  }, [getHotTakes]);

  const getStanceColor = (stance: HotTake['stance']) => {
    switch (stance) {
      case 'strongly_agree':
        return 'bg-foe-success text-white';
      case 'agree':
        return 'bg-foe-success/70 text-white';
      case 'strongly_disagree':
        return 'bg-foe-error text-white';
      case 'disagree':
        return 'bg-foe-error/70 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStanceLabel = (stance: HotTake['stance']) => {
    return stance.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl md:text-3xl font-display font-black">
            Your <span className="text-foe-accent">Hot Takes</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            These are your most extreme opinions
          </p>
        </motion.header>

        {/* Hot Takes */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          <AnimatePresence>
            {hotTakes.map((take, index) => (
              <motion.div
                key={take.questionId}
                variants={hotTakeCard}
                className="win95-panel"
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="win95-inset w-10 h-10 flex items-center justify-center font-display font-black text-foe-accent">
                    #{index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className="font-medium mb-2">&ldquo;{take.questionText}&rdquo;</p>

                    {/* Stance Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-bold uppercase ${getStanceColor(
                          take.stance
                        )}`}
                      >
                        {getStanceLabel(take.stance)}
                      </span>

                      {/* Intensity Bar */}
                      <div className="flex-1 h-2 win95-inset overflow-hidden">
                        <motion.div
                          className="h-full bg-foe-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${(take.intensity / 3) * 100}%` }}
                          transition={{ delay: 0.5 + index * 0.1, ...springs.smooth }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Match Status */}
        <motion.div
          variants={matchReveal}
          initial="initial"
          animate={isRevealed ? 'animate' : 'initial'}
          className="win95-panel text-center"
        >
          <div className="win95-titlebar -mx-4 -mt-4 mb-4">
            <span className="text-sm">MATCH STATUS</span>
          </div>

          <div className="py-8 space-y-4">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                transition: { repeat: Infinity, duration: 2 },
              }}
              className="text-6xl"
            >
              🔍
            </motion.div>

            <h2 className="text-xl font-display font-bold">Hunting for Your Nemesis...</h2>

            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We&apos;re analyzing responses to find someone with maximally opposite
              opinions. You&apos;ll be notified when we find your perfect match!
            </p>

            <div className="win95-inset p-3 text-sm">
              <p>
                <span className="font-bold">Pro tip:</span> The more questions you
                answer strongly, the better your match will be.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="flex justify-center gap-4"
        >
          <Link href="/profile" className="win95-btn px-6 py-3">
            View Profile
          </Link>
          <Link href="/questionnaire" className="win95-btn win95-btn-primary px-6 py-3">
            Retake Quiz
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
