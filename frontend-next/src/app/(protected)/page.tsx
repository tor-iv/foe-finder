'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { Win95Loading } from '@/components/win95-loading';
import { Win95TitleBar } from '@/components/win95-titlebar';

const DEADPAN_COMMENTS = [
  'Noted.',
  'You feel strongly about this.',
  'The Algorithm remembers.',
  'Interesting.',
  'This has been recorded.',
];

function getDisagreementComment(percentage: number): string {
  if (percentage <= 30) return 'You blend in. Suspiciously normal.';
  if (percentage <= 50) return 'Moderate contrarian tendencies detected.';
  if (percentage <= 70) return 'Solid foe potential.';
  if (percentage <= 85) return 'Excellent foe potential.';
  return 'You disagree with almost everyone. Impressive.';
}

interface DashboardData {
  extremeOpinions: { questionId: number; text: string; value: number }[];
  disagreementPercentage: number;
  hasResponses: boolean;
  isMatched: boolean;
}

function MatchStatusWidget({
  hasCompletedQuestionnaire,
  isMatched,
}: {
  hasCompletedQuestionnaire: boolean;
  isMatched: boolean;
}) {
  if (isMatched) {
    return (
      <Link
        href="/results"
        className="flex items-center gap-2 text-sm hover:text-foe-accent transition-colors"
      >
        <span className="text-foe-success">✓</span>
        <span className="underline">Matched! View your nemesis</span>
      </Link>
    );
  }

  if (hasCompletedQuestionnaire) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">○</span>
        <span>In the pool — matching hasn&apos;t run yet</span>
      </div>
    );
  }

  return (
    <Link
      href="/questionnaire"
      className="flex items-center gap-2 text-sm hover:text-foe-accent transition-colors"
    >
      <span className="text-muted-foreground">○</span>
      <span className="underline">Complete the quiz to enter the pool</span>
    </Link>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok && !cancelled) {
          setData(await res.json());
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasCompletedQuestionnaire = user?.hasCompletedQuestionnaire || false;

  if (isLoading) {
    return <Win95Loading title="FOE FINDER - Control Panel" label="Consulting The Algorithm..." />;
  }

  return (
    <div className="min-h-screen pb-20">
      <motion.div
        className="max-w-2xl mx-auto px-4 py-8"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Welcome Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <h1 className="font-display font-black text-2xl md:text-3xl mb-2">
            {user ? `Welcome back, ${user.displayName}` : 'Welcome back'}
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            The Algorithm has been watching.
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div variants={fadeInUp} className="win95-panel mb-6">
          <Win95TitleBar title="YOUR STATUS" />
          <div className="space-y-3">
            {hasCompletedQuestionnaire ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-foe-success">✓</span>
                <span>Opinions extracted</span>
              </div>
            ) : (
              <Link
                href="/questionnaire"
                className="flex items-center gap-2 text-sm hover:text-foe-accent transition-colors"
              >
                <span className="text-muted-foreground">○</span>
                <span className="underline">Opinion extraction required</span>
              </Link>
            )}
            <MatchStatusWidget
              hasCompletedQuestionnaire={hasCompletedQuestionnaire}
              isMatched={data?.isMatched ?? false}
            />
          </div>
        </motion.div>

        {/* Strongest Opinions Card */}
        {hasCompletedQuestionnaire && data && (
          <motion.div variants={fadeInUp} className="win95-panel mb-6">
            <Win95TitleBar title="YOUR STRONGEST OPINIONS" />
            {data.extremeOpinions.length > 0 ? (
              <div className="space-y-4">
                {data.extremeOpinions.map((opinion, i) => (
                  <div
                    key={opinion.questionId}
                    className="border-2 border-win95-darkShadow p-3 bg-win95-shadow/20"
                  >
                    <p className="text-sm font-medium mb-2">&ldquo;{opinion.text}&rdquo;</p>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-win95-shadow/30 border border-win95-darkShadow">
                        <div
                          className="h-full bg-foe-accent"
                          style={{ width: `${((opinion.value - 1) / 6) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono w-12">You: {opinion.value}</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      {DEADPAN_COMMENTS[i % DEADPAN_COMMENTS.length]}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You answered cautiously. The Algorithm respects your restraint.
              </p>
            )}
          </motion.div>
        )}

        {/* Disagreement Rating Card */}
        {hasCompletedQuestionnaire && data?.hasResponses && (
          <motion.div variants={fadeInUp} className="win95-panel mb-6">
            <Win95TitleBar title="YOUR DISAGREEMENT RATING" />
            <div className="text-center">
              <div className="text-5xl font-display font-black text-foe-accent mb-2">
                {data.disagreementPercentage}%
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                You disagree with the average user on {data.disagreementPercentage}% of topics.
              </p>
              <p className="text-sm font-mono">
                &ldquo;{getDisagreementComment(data.disagreementPercentage)}&rdquo;
              </p>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        {!hasCompletedQuestionnaire && (
          <motion.div variants={fadeInUp} className="text-center">
            <Link
              href="/questionnaire"
              className="win95-btn win95-btn-primary px-8 py-3 text-lg font-bold uppercase tracking-wide"
            >
              Begin Opinion Extraction
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
