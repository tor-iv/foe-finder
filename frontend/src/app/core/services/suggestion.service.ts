import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';
import { SuggestionInput, Suggestion } from '../models/suggestion.model';

/**
 * SuggestionService - Handles user-submitted suggestions
 *
 * Allows users to submit:
 * - New questionnaire questions/statements
 * - Feature requests
 * - General feedback
 *
 * Submissions are stored in Supabase with optional localStorage fallback
 */
@Injectable({ providedIn: 'root' })
export class SuggestionService {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);

  private readonly USE_SUPABASE = environment.features.useRealAuth;
  private readonly PENDING_KEY = 'foe_finder_pending_suggestions';

  /**
   * Submit a new suggestion
   *
   * @param input - The suggestion data
   * @returns The created suggestion or null if failed
   */
  async submitSuggestion(input: SuggestionInput): Promise<Suggestion | null> {
    const user = this.authService.currentUser();

    // Build the suggestion payload
    const payload = {
      user_id: user?.uid || null,
      category: input.category,
      title: input.title,
      description: input.description || null,
      contact_email: input.contact_email || null,
      status: 'pending'
    };

    if (this.USE_SUPABASE) {
      try {
        const { data, error } = await this.supabaseService.client
          .from('suggestions')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        // Clear any pending offline suggestions on success
        this.clearPendingSuggestions();

        return data as Suggestion;
      } catch (error) {
        console.error('Failed to save suggestion to Supabase:', error);
        // Store locally for later retry
        this.savePendingSuggestion(input);
        throw new Error('Failed to submit suggestion. It has been saved locally.');
      }
    } else {
      // In dummy mode, just store locally
      this.savePendingSuggestion(input);
      return {
        id: crypto.randomUUID(),
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Suggestion;
    }
  }

  /**
   * Get user's own suggestions (if authenticated)
   */
  async getUserSuggestions(): Promise<Suggestion[]> {
    const user = this.authService.currentUser();
    if (!user || !this.USE_SUPABASE) {
      return this.getPendingSuggestions().map((s, i) => ({
        id: `local-${i}`,
        user_id: user?.uid,
        category: s.category,
        title: s.title,
        description: s.description,
        status: 'pending' as const,
        contact_email: s.contact_email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    }

    const { data, error } = await this.supabaseService.client
      .from('suggestions')
      .select('*')
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load suggestions:', error);
      return [];
    }

    return data as Suggestion[];
  }

  /**
   * Save a suggestion locally (for offline/retry)
   */
  private savePendingSuggestion(input: SuggestionInput): void {
    const pending = this.getPendingSuggestions();
    pending.push({
      ...input,
      savedAt: new Date().toISOString()
    });
    localStorage.setItem(this.PENDING_KEY, JSON.stringify(pending));
  }

  /**
   * Get pending local suggestions
   */
  private getPendingSuggestions(): (SuggestionInput & { savedAt?: string })[] {
    try {
      const stored = localStorage.getItem(this.PENDING_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear pending suggestions after successful sync
   */
  private clearPendingSuggestions(): void {
    localStorage.removeItem(this.PENDING_KEY);
  }

  /**
   * Retry submitting pending suggestions
   */
  async syncPendingSuggestions(): Promise<number> {
    const pending = this.getPendingSuggestions();
    if (pending.length === 0) return 0;

    let synced = 0;
    const stillPending: (SuggestionInput & { savedAt?: string })[] = [];

    for (const suggestion of pending) {
      try {
        await this.submitSuggestion(suggestion);
        synced++;
      } catch {
        stillPending.push(suggestion);
      }
    }

    if (stillPending.length > 0) {
      localStorage.setItem(this.PENDING_KEY, JSON.stringify(stillPending));
    } else {
      this.clearPendingSuggestions();
    }

    return synced;
  }
}
