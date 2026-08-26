export type GuessRoundStatus = 'pending_you' | 'pending_them' | 'revealed';

/**
 * Viewer-relative, already-redacted shape returned by the game API.
 * guessValue is null when the viewer is the answerer and hasn't answered yet
 * — the server strips it, not just the UI.
 */
export interface GuessRound {
  id: number;
  questionText: string;
  guessValue: number | null;
  actualValue: number | null;
  points: number | null;
  viewerRole: 'asker' | 'answerer';
  status: GuessRoundStatus;
  createdAt: string;
  answeredAt: string | null;
}

export interface GuessRoundStats {
  roundsPlayed: number;
  totalPoints: number;
  avgPoints: number;
}
