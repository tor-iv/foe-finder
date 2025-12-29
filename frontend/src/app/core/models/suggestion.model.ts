/**
 * Suggestion Model
 *
 * Types for user-submitted suggestions including:
 * - New questionnaire questions
 * - Feature requests
 * - General feedback
 */

export type SuggestionCategory = 'question' | 'feature' | 'feedback';
export type SuggestionStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected';

export interface Suggestion {
  id: string;
  user_id?: string;
  category: SuggestionCategory;
  title: string;
  description?: string;
  status: SuggestionStatus;
  admin_notes?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
}

export interface SuggestionInput {
  category: SuggestionCategory;
  title: string;
  description?: string;
  contact_email?: string;
}

export const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  question: 'New Question/Statement',
  feature: 'Feature Request',
  feedback: 'General Feedback'
};

export const CATEGORY_PLACEHOLDERS: Record<SuggestionCategory, { title: string; description: string }> = {
  question: {
    title: 'e.g., "Pineapple belongs on pizza"',
    description: 'Why should this question be added? What does it reveal about someone?'
  },
  feature: {
    title: 'e.g., "Add dark mode"',
    description: 'Describe the feature and how it would improve FoeFinder'
  },
  feedback: {
    title: 'Brief summary of your feedback',
    description: 'Share your thoughts, suggestions, or report any issues'
  }
};
