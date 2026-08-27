'use client';

import { Win95TitleBar } from '@/components/win95-titlebar';
import { Win95Loading } from '@/components/win95-loading';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LikertSlider } from '@/components/game/likert-slider';
import { fadeInUp } from '@/lib/animations';
import { getAccuracyComment } from '@/lib/game';
import { MatchDisplay, GuessRound, GuessRoundStats } from '@/types';

interface MatchResponse {
  match: MatchDisplay | null;
}

interface GameResponse {
  rounds: GuessRound[];
  stats: GuessRoundStats;
}

async function fetchMatch(): Promise<MatchResponse> {
  const res = await fetch('/api/match');
  if (!res.ok) throw new Error('Failed to load match');
  return res.json();
}

async function fetchGame(matchId: string): Promise<GameResponse> {
  const res = await fetch(`/api/game/${matchId}`);
  if (!res.ok) throw new Error('Failed to load game');
  return res.json();
}

export default function GamePage() {
  const queryClient = useQueryClient();
  const [questionText, setQuestionText] = useState('');
  const [guessValue, setGuessValue] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, number>>({});

  const { data: matchData, isLoading: isLoadingMatch } = useQuery({
    queryKey: ['match'],
    queryFn: fetchMatch,
  });
  const match = matchData?.match ?? null;

  const { data: gameData } = useQuery({
    queryKey: ['game', match?.id],
    queryFn: () => fetchGame(match!.id),
    enabled: !!match,
    refetchInterval: 8000,
  });
  const rounds = gameData?.rounds ?? [];
  const stats = gameData?.stats;

  const pendingForYou = rounds.filter((r) => r.status === 'pending_you');
  const pendingForThem = rounds.filter((r) => r.status === 'pending_them');
  const revealed = rounds.filter((r) => r.status === 'revealed');

  const invalidateGame = () => queryClient.invalidateQueries({ queryKey: ['game', match?.id] });

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match || !questionText.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/game/${match.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: questionText.trim(), guessValue }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to ask');
        return;
      }

      setQuestionText('');
      setGuessValue(4);
      await invalidateGame();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (roundId: number) => {
    if (!match) return;
    const actualValue = answerDrafts[roundId] ?? 4;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/game/${match.id}/${roundId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualValue }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to answer');
        return;
      }

      await invalidateGame();
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoadingMatch) {
    return <Win95Loading title="NEMESIS KNOWLEDGE" label="Locating your nemesis..." />;
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="win95-panel max-w-md w-full text-center"
        >
          <Win95TitleBar title="NO MATCH YET" />
          <p className="text-sm text-muted-foreground mb-4">
            You need a nemesis before you can test how well you know them.
          </p>
          <Link href="/results" className="win95-btn win95-btn-primary inline-block px-6 py-3">
            Back to Results
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="win95-panel">
          <Win95TitleBar
            title={`NEMESIS KNOWLEDGE: ${match.opponent.displayName.toUpperCase()}`}
            right={
              <Link href="/results" className="text-xs underline">
                Back
              </Link>
            }
          />

          {stats && (
            <div className="text-center space-y-1">
              <div className="text-4xl font-display font-black text-foe-accent">
                {stats.totalPoints} pts
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.roundsPlayed} round{stats.roundsPlayed === 1 ? '' : 's'} played
                {stats.roundsPlayed > 0 && ` · avg ${stats.avgPoints.toFixed(1)}/6`}
              </p>
              <p className="text-sm font-mono">
                {getAccuracyComment(stats.avgPoints, stats.roundsPlayed)}
              </p>
            </div>
          )}
        </div>

        <div className="win95-panel">
          <Win95TitleBar title="ASK A QUESTION" />

          <form onSubmit={handleAsk} className="space-y-3">
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="win95-input w-full text-sm p-2 resize-none"
              placeholder="Write something only they can answer honestly..."
              maxLength={300}
              rows={2}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">Guess how they&apos;ll rate it:</p>
            <LikertSlider value={guessValue} onChange={setGuessValue} disabled={submitting} />
            {error && <p className="text-foe-error text-xs">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !questionText.trim()}
              className="win95-btn win95-btn-primary w-full py-2"
            >
              {submitting ? 'Sending...' : 'Ask & Guess'}
            </button>
          </form>
        </div>

        {pendingForYou.length > 0 && (
          <div className="win95-panel">
            <Win95TitleBar title="AWAITING YOUR ANSWER" />
            <div className="space-y-4">
              {pendingForYou.map((round) => (
                <div key={round.id} className="win95-inset p-3 space-y-2">
                  <p className="text-sm font-medium">&ldquo;{round.questionText}&rdquo;</p>
                  <LikertSlider
                    value={answerDrafts[round.id] ?? 4}
                    onChange={(v) => setAnswerDrafts((prev) => ({ ...prev, [round.id]: v }))}
                    disabled={submitting}
                  />
                  <button
                    onClick={() => handleAnswer(round.id)}
                    disabled={submitting}
                    className="win95-btn win95-btn-primary text-xs px-3 py-1"
                  >
                    Submit Answer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingForThem.length > 0 && (
          <div className="win95-panel">
            <Win95TitleBar title={`WAITING ON ${match.opponent.displayName.toUpperCase()}`} />
            <div className="space-y-2">
              {pendingForThem.map((round) => (
                <div key={round.id} className="win95-inset p-3 text-sm">
                  &ldquo;{round.questionText}&rdquo;
                  <span className="text-muted-foreground"> — your guess: {round.guessValue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {revealed.length > 0 && (
          <div className="win95-panel">
            <Win95TitleBar title="HISTORY" />
            <div className="space-y-3">
              {revealed.map((round) => (
                <div key={round.id} className="win95-inset p-3 text-sm space-y-1">
                  <p className="font-medium">&ldquo;{round.questionText}&rdquo;</p>
                  <p className="text-xs text-muted-foreground">
                    {round.viewerRole === 'asker' ? 'You asked' : 'They asked'}
                  </p>
                  <div className="flex justify-between text-xs">
                    <span>Guess: {round.guessValue}</span>
                    <span>Actual: {round.actualValue}</span>
                    <span className="font-bold text-foe-accent">{round.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
