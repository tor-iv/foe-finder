import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';
import {
  QuestionStats,
  ResponseDistribution,
  AdminUserView,
  UserStats,
  SuggestionWithUser,
  SuggestionFilters,
  UserFilters
} from '../models/admin.model';
import { SuggestionStatus } from '../models/suggestion.model';

/**
 * AdminService - Handles admin dashboard functionality
 *
 * Provides methods for:
 * - Managing suggestions (view all, approve/reject)
 * - Viewing question statistics and response distributions
 * - Managing users (view list, stats)
 *
 * Requires is_admin = true in profiles table
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private supabaseService = inject(SupabaseService);

  private readonly USE_SUPABASE = environment.features.useRealAuth;

  // ===== SUGGESTIONS =====

  /**
   * Get all suggestions (with optional filters)
   * Uses suggestions_with_user view for display names
   */
  async getAllSuggestions(filters?: SuggestionFilters): Promise<SuggestionWithUser[]> {
    if (!this.USE_SUPABASE) {
      console.warn('Admin features require Supabase');
      return [];
    }

    let query = this.supabaseService.client
      .from('suggestions_with_user')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to load suggestions:', error);
      throw new Error('Failed to load suggestions');
    }

    return data as SuggestionWithUser[];
  }

  /**
   * Update a suggestion's status (approve/reject)
   */
  async updateSuggestionStatus(
    id: string,
    status: SuggestionStatus,
    adminNotes?: string
  ): Promise<void> {
    if (!this.USE_SUPABASE) {
      console.warn('Admin features require Supabase');
      return;
    }

    const { error } = await this.supabaseService.client
      .from('suggestions')
      .update({
        status,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to update suggestion:', error);
      throw new Error('Failed to update suggestion');
    }
  }

  // ===== ANALYTICS =====

  /**
   * Get question statistics from materialized view
   */
  async getQuestionStatistics(): Promise<QuestionStats[]> {
    if (!this.USE_SUPABASE) {
      console.warn('Admin features require Supabase');
      return [];
    }

    const { data, error } = await this.supabaseService.client
      .from('question_statistics')
      .select('*')
      .order('question_id');

    if (error) {
      console.error('Failed to load question statistics:', error);
      throw new Error('Failed to load question statistics');
    }

    return data as QuestionStats[];
  }

  /**
   * Get response distribution for a specific question (values 1-7)
   */
  async getResponseDistribution(questionId: number): Promise<ResponseDistribution[]> {
    if (!this.USE_SUPABASE) {
      console.warn('Admin features require Supabase');
      return [];
    }

    const { data, error } = await this.supabaseService.client
      .rpc('get_response_distribution', { p_question_id: questionId });

    if (error) {
      console.error('Failed to load response distribution:', error);
      throw new Error('Failed to load response distribution');
    }

    return data as ResponseDistribution[];
  }

  // ===== USERS =====

  /**
   * Get all users with optional filters and pagination
   */
  async getAllUsers(filters?: UserFilters): Promise<AdminUserView[]> {
    if (!this.USE_SUPABASE) {
      console.warn('Admin features require Supabase');
      return [];
    }

    let query = this.supabaseService.client
      .from('profiles')
      .select(`
        id,
        display_name,
        has_completed_questionnaire,
        has_audio_intro,
        is_admin,
        match_id,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (filters?.hasCompleted !== undefined && filters?.hasCompleted !== null) {
      query = query.eq('has_completed_questionnaire', filters.hasCompleted);
    }

    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to load users:', error);
      throw new Error('Failed to load users');
    }

    return data as AdminUserView[];
  }

  /**
   * Get user statistics (total, completed, matched)
   */
  async getUserStats(): Promise<UserStats> {
    if (!this.USE_SUPABASE) {
      console.warn('Admin features require Supabase');
      return { total: 0, completed: 0, matched: 0 };
    }

    const { data, error } = await this.supabaseService.client
      .rpc('get_user_stats');

    if (error) {
      console.error('Failed to load user stats:', error);
      throw new Error('Failed to load user stats');
    }

    return data as UserStats;
  }

  /**
   * Get total count of suggestions by status
   */
  async getSuggestionCounts(): Promise<Record<SuggestionStatus | 'total', number>> {
    if (!this.USE_SUPABASE) {
      return { pending: 0, reviewed: 0, accepted: 0, rejected: 0, total: 0 };
    }

    const { data, error } = await this.supabaseService.client
      .from('suggestions')
      .select('status');

    if (error) {
      console.error('Failed to load suggestion counts:', error);
      return { pending: 0, reviewed: 0, accepted: 0, rejected: 0, total: 0 };
    }

    const counts: Record<SuggestionStatus | 'total', number> = {
      pending: 0,
      reviewed: 0,
      accepted: 0,
      rejected: 0,
      total: data.length
    };

    for (const item of data) {
      if (item.status in counts) {
        counts[item.status as SuggestionStatus]++;
      }
    }

    return counts;
  }
}
