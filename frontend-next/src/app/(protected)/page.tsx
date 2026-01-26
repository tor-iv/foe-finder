'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { QUESTIONS } from '@/hooks/use-questionnaire';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface UserResponse {
  questionId: number;
  value: number;
}

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

export default function HomePage() {
  const { user } = useAuth();
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [averages, setAverages] = useState<Map<number, number>>(new Map());
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [hasAudioIntro, setHasAudioIntro] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch user's responses
        const { data: responseData } = await supabase
          .from('questionnaire_responses')
          .select('responses')
          .eq('user_id', user.uid)
          .single();

        if (responseData?.responses) {
          setResponses(responseData.responses as UserResponse[]);
        }

        // Fetch profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('has_audio_intro, match_id')
          .eq('id', user.uid)
          .single();

        if (profileData) {
          setHasAudioIntro(profileData.has_audio_intro || false);
          setMatchId(profileData.match_id);
        }

        // Fetch all responses to compute averages
        const { data: allResponses } = await supabase
          .from('questionnaire_responses')
          .select('responses');

        if (allResponses && allResponses.length > 0) {
          const sums = new Map<number, number>();
          const counts = new Map<number, number>();

          allResponses.forEach((row: { responses: UserResponse[] | null }) => {
            const resp = row.responses;
            resp?.forEach((r) => {
              sums.set(r.questionId, (sums.get(r.questionId) || 0) + r.value);
              counts.set(r.questionId, (counts.get(r.questionId) || 0) + 1);
            });
          });

          const avgMap = new Map<number, number>();
          sums.forEach((sum, qId) => {
            avgMap.set(qId, sum / (counts.get(qId) || 1));
          });
          setAverages(avgMap);
        }

        // Fetch visitor count
        const { data: statsData } = await supabase
          .from('site_stats')
          .select('visitor_count')
          .eq('id', 'global')
          .single();

        if (statsData) {
          setVisitorCount(statsData.visitor_count || 0);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Get extreme opinions (value 1 or 7)
  const extremeOpinions = responses
    .filter((r) => r.value === 1 || r.value === 7)
    .slice(0, 3)
    .map((r, i) => {
      const question = QUESTIONS.find((q) => q.id === r.questionId);
      return {
        ...r,
        text: question?.text || '',
        comment: DEADPAN_COMMENTS[i % DEADPAN_COMMENTS.length],
      };
    });

  // Calculate disagreement percentage
  const disagreementCount = responses.filter((r) => {
    const avg = averages.get(r.questionId);
    return avg !== undefined && Math.abs(r.value - avg) >= 3;
  }).length;
  const disagreementPercentage =
    responses.length > 0
      ? Math.round((disagreementCount / responses.length) * 100)
      : 0;

  const hasCompletedQuestionnaire = user?.hasCompletedQuestionnaire || false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg font-mono">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <motion.div
        className="max-w-2xl mx-auto px-4 py-8"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Welcome Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <h1 className="font-display font-black text-2xl md:text-3xl mb-2">
            Welcome back, {user?.displayName || 'User'}
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            The Algorithm has been watching.
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div variants={fadeInUp} className="win95-panel mb-6">
          <h2 className="font-display font-bold text-lg mb-4 uppercase tracking-wide">
            Your Status
          </h2>
          <div className="space-y-3">
            <StatusItem
              done={hasCompletedQuestionnaire}
              doneText="Opinions extracted"
              pendingText="Opinion extraction required"
              href="/questionnaire"
            />
            <StatusItem
              done={hasAudioIntro}
              doneText="Voice sample collected"
              pendingText="Voice sample pending"
              href="/record-intro"
            />
            <StatusItem
              done={!!matchId}
              doneText="Match assigned"
              pendingText="Awaiting match assignment"
              href="/results"
            />
          </div>
        </motion.div>

        {/* Strongest Opinions Card */}
        {hasCompletedQuestionnaire && (
          <motion.div variants={fadeInUp} className="win95-panel mb-6">
            <h2 className="font-display font-bold text-lg mb-4 uppercase tracking-wide">
              Your Strongest Opinions
            </h2>
            {extremeOpinions.length > 0 ? (
              <div className="space-y-4">
                {extremeOpinions.map((opinion) => (
                  <div
                    key={opinion.questionId}
                    className="border-2 border-win95-darkShadow p-3 bg-win95-shadow/20"
                  >
                    <p className="text-sm font-medium mb-2">"{opinion.text}"</p>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-win95-shadow/30 border border-win95-darkShadow">
                        <div
                          className="h-full bg-foe-accent"
                          style={{ width: `${((opinion.value - 1) / 6) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono w-12">
                        You: {opinion.value}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      {opinion.comment}
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
        {hasCompletedQuestionnaire && averages.size > 0 && (
          <motion.div variants={fadeInUp} className="win95-panel mb-6">
            <h2 className="font-display font-bold text-lg mb-4 uppercase tracking-wide">
              Your Disagreement Rating
            </h2>
            <div className="text-center">
              <div className="text-5xl font-display font-black text-foe-accent mb-2">
                {disagreementPercentage}%
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                You disagree with the average user on {disagreementPercentage}% of
                topics.
              </p>
              <p className="text-sm font-mono">
                "{getDisagreementComment(disagreementPercentage)}"
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

      {/* Visitor Counter - Fixed at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 py-3 bg-win95-face border-t-2 border-win95-darkShadow text-center"
      >
        <span className="text-sm font-mono text-muted-foreground">
          👁 {visitorCount.toLocaleString()} souls observed
        </span>
      </motion.div>
    </div>
  );
}

function StatusItem({
  done,
  doneText,
  pendingText,
  href,
}: {
  done: boolean;
  doneText: string;
  pendingText: string;
  href: string;
}) {
  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-foe-success">✓</span>
        <span>{doneText}</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-sm hover:text-foe-accent transition-colors"
    >
      <span className="text-muted-foreground">○</span>
      <span className="underline">{pendingText}</span>
    </Link>
  );
}
