/**
 * Admin Model
 *
 * Types for admin dashboard functionality including:
 * - Question statistics and analytics
 * - Response distributions
 * - Admin user views
 */

import { Suggestion } from './suggestion.model';

/**
 * Question statistics from the question_statistics materialized view
 */
export interface QuestionStats {
  question_id: number;
  response_count: number;
  mean_value: number;
  std_dev: number;
  percentile_10: number;
  percentile_25: number;
  percentile_50: number;
  percentile_75: number;
  percentile_90: number;
  min_value: number;
  max_value: number;
}

/**
 * Response distribution for a single question (values 1-7)
 */
export interface ResponseDistribution {
  value: number;
  count: number;
  percentage: number;
}

/**
 * User view for admin dashboard
 */
export interface AdminUserView {
  id: string;
  display_name: string | null;
  has_completed_questionnaire: boolean;
  has_audio_intro: boolean;
  is_admin: boolean;
  match_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * User statistics summary
 */
export interface UserStats {
  total: number;
  completed: number;
  matched: number;
}

/**
 * Suggestion with user display name (from suggestions_with_user view)
 */
export interface SuggestionWithUser extends Suggestion {
  user_display_name: string | null;
}

/**
 * Filter options for suggestions list
 */
export interface SuggestionFilters {
  status?: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'all';
  category?: 'question' | 'feature' | 'feedback' | 'all';
}

/**
 * Filter options for users list
 */
export interface UserFilters {
  hasCompleted?: boolean | null;
  limit?: number;
  offset?: number;
}
