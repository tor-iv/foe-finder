'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { useQuestionnaire } from '@/hooks/use-questionnaire';
import {
  fadeInUp,
  staggerContainer,
  matchReveal,
  hotTakeCard,
  springs,
} from '@/lib/animations';
import { HotTake, MatchDisplay } from '@/types';

interface MatchResponse {
  match: MatchDisplay | null;
}

async function fetchMatch(): Promise<MatchResponse> {
  const res = await fetch('/api/match');
  if (!res.ok) throw new Error('Failed to load match');
  return res.json();
}

export default function ResultsPage() {
  const { user } = useAuth();
  const { getHotTakes } = useQuestionnaire();
  const [isRevealed, setIsRevealed] = useState(false);

  const { data } = useQuery({ queryKey: ['match'], queryFn: fetchMatch });
  const match = data?.match ?? null;

  // Compute hot takes once using useMemo instead of effect + state
  const hotTakes = useMemo(() => getHotTakes(3), [getHotTakes]);

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 500);
    return () => clearTimeout(timer);
  }, []);

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

  const stanceFor = (value: number) => {
    if (value === 7) return 'STRONGLY AGREE';
    if (value >= 5) return 'AGREE';
    if (value === 4) return 'NEUTRAL';
    if (value >= 2) return 'DISAGREE';
    return 'STRONGLY DISAGREE';
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
        {hotTakes.length > 0 && (
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
                    <div className="win95-inset w-10 h-10 flex items-center justify-center font-display font-black text-foe-accent">
                      #{index + 1}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium mb-2">&ldquo;{take.questionText}&rdquo;</p>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-bold uppercase ${getStanceColor(
                            take.stance
                          )}`}
                        >
                          {getStanceLabel(take.stance)}
                        </span>

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
        )}

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

          {match ? (
            <div className="py-6 space-y-4 text-left">
              <div className="text-center space-y-2">
                <div className="text-5xl">🎯</div>
                <h2 className="text-xl font-display font-bold">
                  Your Nemesis: <span className="text-foe-accent">{match.opponent.displayName}</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Opposition score: <span className="font-mono font-bold">{match.oppositionScore}</span>
                </p>
              </div>

              <div className="space-y-3">
                <span className="font-bold uppercase text-xs text-muted-foreground">
                  Where you disagree most
                </span>
                {match.topDifferences.map((diff) => (
                  <div key={diff.questionId} className="win95-inset p-3 text-sm space-y-2">
                    <p className="font-medium">&ldquo;{diff.questionText}&rdquo;</p>
                    <div className="flex justify-between text-xs">
                      <span>
                        You: <span className="font-bold">{stanceFor(diff.user1Value)}</span>
                      </span>
                      <span>
                        Them: <span className="font-bold">{stanceFor(diff.user2Value)}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-2">
                <Link href="/game" className="win95-btn win95-btn-primary px-6 py-3 inline-block">
                  Test Your Nemesis Knowledge
                </Link>
              </div>
            </div>
          ) : (
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

              <h2 className="text-xl font-display font-bold">
                {user?.hasCompletedQuestionnaire ? 'Hunting for Your Nemesis...' : 'Take the Quiz First'}
              </h2>

              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {user?.hasCompletedQuestionnaire
                  ? "You're in the pool. Matching runs periodically — check back soon."
                  : 'Complete the questionnaire to enter the matching pool.'}
              </p>
            </div>
          )}
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
          {!match && (
            <Link href="/questionnaire" className="win95-btn win95-btn-primary px-6 py-3">
              {user?.hasCompletedQuestionnaire ? 'Retake Quiz' : 'Take Quiz'}
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
}
