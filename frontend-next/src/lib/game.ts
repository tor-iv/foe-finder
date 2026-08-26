// Scoring + copy for the "guess the bar" nemesis game. Shared between the
// API routes (compute points server-side, never trust a client-sent score)
// and the UI (render the same tier copy).

export function computeScore(guessValue: number, actualValue: number): number {
  return Math.max(0, 6 - Math.abs(guessValue - actualValue));
}

export function getAccuracyComment(avgPoints: number, roundsPlayed: number): string {
  if (roundsPlayed === 0) return 'No data yet. The Algorithm awaits your first move.';
  if (avgPoints >= 5) return 'You know them disturbingly well.';
  if (avgPoints >= 3.5) return 'Adequate nemesis intelligence.';
  if (avgPoints >= 2) return 'You are guessing. It shows.';
  return 'You know nothing about this person. Concerning.';
}
