import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { QuestionnaireService } from './questionnaire.service';
import { AudioIntroService, AudioIntro } from './audio-intro.service';

/**
 * Represents a difference between two users on a specific question
 */
export interface QuestionDifference {
  questionId: number;
  questionText: string;
  user1Value: number;
  user2Value: number;
  difference: number;
}

/**
 * Match data with full details for display
 */
export interface MatchWithDetails {
  id: string;
  opponent: {
    id: string;
    displayName: string;
    hasAudioIntro: boolean;
    audioIntro?: {
      audioUrl: string | null;
      transcription: string | null;
      transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
    };
  };
  oppositionScore: number;
  topDifferences: QuestionDifference[];
  createdAt: Date;
}

/**
 * MatchService - Fetches and manages match data from Supabase
 *
 * This service handles:
 * - Fetching the current user's match (if any)
 * - Providing match details including top differing questions
 * - Checking match status for the countdown
 */
@Injectable({ providedIn: 'root' })
export class MatchService {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private questionnaireService = inject(QuestionnaireService);
  private audioIntroService = inject(AudioIntroService);

  // Signal to track if matching has occurred
  hasMatch = signal<boolean>(false);

  // Signal to store the current user's match
  currentMatch = signal<MatchWithDetails | null>(null);

  // Loading state
  isLoading = signal<boolean>(false);

  /**
   * Fetch the current user's match from Supabase
   * Returns null if no match exists yet
   */
  async getMyMatch(): Promise<MatchWithDetails | null> {
    const user = this.authService.currentUser();
    if (!user) {
      return null;
    }

    this.isLoading.set(true);

    try {
      // Query matches where current user is either user1 or user2
      const { data, error } = await this.supabaseService.client
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          opposition_score,
          top_differences,
          created_at
        `)
        .or(`user1_id.eq.${user.uid},user2_id.eq.${user.uid}`)
        .single();

      if (error || !data) {
        this.hasMatch.set(false);
        this.currentMatch.set(null);
        return null;
      }

      // Determine which user is the "opponent"
      const opponentId = data.user1_id === user.uid ? data.user2_id : data.user1_id;

      // Fetch opponent's display name and audio intro status from profiles
      const { data: profileData } = await this.supabaseService.client
        .from('profiles')
        .select('display_name, has_audio_intro')
        .eq('id', opponentId)
        .single();

      // Fetch opponent's audio intro if they have one
      let audioIntroData: AudioIntro | null = null;
      if (profileData?.has_audio_intro) {
        try {
          audioIntroData = await this.audioIntroService.getAudioIntroForUser(opponentId);
        } catch (e) {
          console.warn('Could not fetch opponent audio intro:', e);
        }
      }

      // Get question texts for top differences
      const questions = this.questionnaireService.getQuestions();
      const topDifferences: QuestionDifference[] = (data.top_differences || []).map((diff: any) => {
        const question = questions.find(q => q.id === diff.questionId);
        return {
          questionId: diff.questionId,
          questionText: question?.text || `Question ${diff.questionId}`,
          user1Value: diff.user1Value,
          user2Value: diff.user2Value,
          difference: Math.abs(diff.user1Value - diff.user2Value)
        };
      });

      const match: MatchWithDetails = {
        id: data.id,
        opponent: {
          id: opponentId,
          displayName: profileData?.display_name || 'Your Foe',
          hasAudioIntro: profileData?.has_audio_intro || false,
          audioIntro: audioIntroData ? {
            audioUrl: audioIntroData.audioUrl || null,
            transcription: audioIntroData.transcription,
            transcriptionStatus: audioIntroData.transcriptionStatus
          } : undefined
        },
        oppositionScore: data.opposition_score,
        topDifferences,
        createdAt: new Date(data.created_at)
      };

      this.hasMatch.set(true);
      this.currentMatch.set(match);

      return match;
    } catch (error) {
      console.error('Error fetching match:', error);
      this.hasMatch.set(false);
      this.currentMatch.set(null);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Check if the current user has been matched
   * Lighter weight than getMyMatch - just checks existence
   */
  async checkMatchStatus(): Promise<boolean> {
    const user = this.authService.currentUser();
    if (!user) {
      return false;
    }

    const { count, error } = await this.supabaseService.client
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .or(`user1_id.eq.${user.uid},user2_id.eq.${user.uid}`);

    if (error) {
      return false;
    }

    const matched = (count || 0) > 0;
    this.hasMatch.set(matched);
    return matched;
  }

  /**
   * Get the stance label for a value (1-7 scale)
   */
  getStanceLabel(value: number): string {
    if (value <= 2) return 'Strongly Disagree';
    if (value === 3) return 'Disagree';
    if (value === 4) return 'Neutral';
    if (value === 5) return 'Agree';
    if (value >= 6) return 'Strongly Agree';
    return 'Unknown';
  }
}
