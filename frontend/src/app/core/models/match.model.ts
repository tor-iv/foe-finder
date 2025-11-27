// TODO(human): Create the Match interface here
// This interface represents a match between two users with opposite opinions
//
// Required fields to include:
// - id: unique identifier for the match
// - userId1: first user's UID
// - userId2: second user's UID
// - compatibilityScore: numerical score (higher = more opposite)
// - createdAt: when the match was created
// - status: current state of the match
//
// Optional fields to consider:
// - topDifferences: array of question IDs where they differed most
// - viewedBy: array of user IDs who have seen this match


export interface Match {
    id: string;
    userId1: string;
    userId2: string;
    compatibilityScore: number;
    createdAt: Date;
    status: 'pending' | 'accepted' | 'rejected';
    topDifferences?: number[];
    viewedBy?: string[];
}