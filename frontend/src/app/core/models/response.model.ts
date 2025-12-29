export interface Response {
  id: string;
  userId: string;
  questionnaireId: string;
  questionnaireVersion: number;
  answers: Answer[];
  submittedAt: Date;
  source: 'web' | 'google_forms';
  isProcessed: boolean;
}

export interface Answer {
  questionId: number;
  value: number;  // 1-7
}

/**
 * Represents a statistical outlier - a response where the user's answer
 * is in the top or bottom 10% compared to all other users.
 */
export interface OutlierAnswer {
  questionId: number;
  questionText: string;
  userValue: number;
  populationMean: number;
  stdDev: number;
  percentileRank: number; // 0-100, where the user falls in the distribution
  isTopOutlier: boolean; // True if in top 10% (90th percentile or higher)
  isBottomOutlier: boolean; // True if in bottom 10% (10th percentile or lower)
  responseCount: number; // Total number of responses for this question
}
