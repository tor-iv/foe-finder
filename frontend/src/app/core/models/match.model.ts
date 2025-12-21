/**
 * Match interface - represents a matched pair of users with opposite opinions
 */
export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  oppositionScore: number;
  topDifferences: TopDifference[];
  createdAt: Date;
}

/**
 * Represents a question where two matched users had very different answers
 */
export interface TopDifference {
  questionId: number;
  questionText: string;
  user1Value: number;
  user2Value: number;
}

/**
 * Match with opponent details for display in the UI
 */
export interface MatchDisplay {
  id: string;
  opponent: {
    id: string;
    displayName: string;
  };
  oppositionScore: number;
  topDifferences: TopDifference[];
  createdAt: Date;
}