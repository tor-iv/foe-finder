import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * Audio Intro Model
 * Represents a user's recorded audio introduction
 */
export interface AudioIntro {
  id: string;
  userId: string;
  storagePath: string;
  durationSeconds: number;
  fileSizeBytes: number;
  mimeType: string;
  transcription: string | null;
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  isActive: boolean;
  // Computed fields
  audioUrl?: string | null;
}

/**
 * AudioIntroService - Handles audio intro uploads and retrieval
 *
 * Supports dual mode:
 * - Real mode: Uses Supabase Storage and database
 * - Dummy mode: Uses localStorage for development
 */
@Injectable({ providedIn: 'root' })
export class AudioIntroService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  private readonly USE_REAL_AUTH = environment.features.useRealAuth;
  private readonly STORAGE_KEY = 'foe_finder_audio_intro';
  private readonly BUCKET_NAME = 'audio-intros';

  /**
   * Upload an audio intro recording
   *
   * @param audioBlob - The recorded audio blob
   * @param transcription - Optional transcription text
   * @returns The created AudioIntro record
   */
  async uploadAudioIntro(audioBlob: Blob, transcription?: string): Promise<AudioIntro> {
    const user = this.authService.currentUser();
    if (!user) {
      throw new Error('User must be authenticated to upload audio');
    }

    if (this.USE_REAL_AUTH) {
      return this.uploadToSupabase(user.uid, audioBlob, transcription);
    } else {
      return this.uploadToLocalStorage(user.uid, audioBlob, transcription);
    }
  }

  /**
   * Get the current user's audio intro
   */
  async getMyAudioIntro(): Promise<AudioIntro | null> {
    const user = this.authService.currentUser();
    if (!user) return null;

    if (this.USE_REAL_AUTH) {
      return this.getAudioIntroFromSupabase(user.uid);
    } else {
      return this.getAudioIntroFromLocalStorage();
    }
  }

  /**
   * Get another user's audio intro (for matched users)
   *
   * @param userId - The user ID to fetch audio for
   */
  async getAudioIntroForUser(userId: string): Promise<AudioIntro | null> {
    if (this.USE_REAL_AUTH) {
      return this.getAudioIntroFromSupabase(userId);
    } else {
      // Dummy mode doesn't support viewing other users' audio
      return null;
    }
  }

  /**
   * Update transcription for an audio intro
   */
  async updateTranscription(audioIntroId: string, transcription: string): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    if (this.USE_REAL_AUTH) {
      const { error } = await this.supabaseService.client
        .from('audio_intros')
        .update({
          transcription,
          transcription_status: 'completed'
        })
        .eq('id', audioIntroId)
        .eq('user_id', user.uid);

      if (error) throw new Error(error.message);
    } else {
      // Update localStorage
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const intro = JSON.parse(stored) as AudioIntro;
        intro.transcription = transcription;
        intro.transcriptionStatus = 'completed';
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(intro));
      }
    }
  }

  /**
   * Delete the current user's audio intro
   */
  async deleteAudioIntro(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    if (this.USE_REAL_AUTH) {
      // First get the current intro to find the storage path
      const { data: intro, error: fetchError } = await this.supabaseService.client
        .from('audio_intros')
        .select('id, storage_path')
        .eq('user_id', user.uid)
        .eq('is_active', true)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(fetchError.message);
      }

      if (intro) {
        // Delete from storage
        await this.supabaseService.client.storage
          .from(this.BUCKET_NAME)
          .remove([intro.storage_path]);

        // Delete from database
        await this.supabaseService.client
          .from('audio_intros')
          .delete()
          .eq('id', intro.id);
      }
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // ==========================================
  // SUPABASE IMPLEMENTATION
  // ==========================================

  private async uploadToSupabase(userId: string, audioBlob: Blob, transcription?: string): Promise<AudioIntro> {
    const timestamp = Date.now();
    const extension = this.getExtensionFromMimeType(audioBlob.type);
    const storagePath = `${userId}/${timestamp}.${extension}`;

    // Deactivate any existing audio intros
    await this.supabaseService.client
      .from('audio_intros')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Upload to storage
    const { error: uploadError } = await this.supabaseService.client.storage
      .from(this.BUCKET_NAME)
      .upload(storagePath, audioBlob, {
        contentType: audioBlob.type,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get audio duration
    const duration = await this.getAudioDuration(audioBlob);

    // Create database record
    const { data, error: insertError } = await this.supabaseService.client
      .from('audio_intros')
      .insert({
        user_id: userId,
        storage_path: storagePath,
        duration_seconds: duration,
        file_size_bytes: audioBlob.size,
        mime_type: audioBlob.type,
        transcription: transcription || null,
        transcription_status: transcription ? 'completed' : 'pending',
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      // Clean up uploaded file if insert fails
      await this.supabaseService.client.storage
        .from(this.BUCKET_NAME)
        .remove([storagePath]);
      throw new Error(`Failed to save: ${insertError.message}`);
    }

    return this.mapDbToAudioIntro(data);
  }

  private async getAudioIntroFromSupabase(userId: string): Promise<AudioIntro | null> {
    const { data, error } = await this.supabaseService.client
      .from('audio_intros')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(error.message);
    }

    const intro = this.mapDbToAudioIntro(data);

    // Get signed URL for playback
    const { data: urlData } = await this.supabaseService.client.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(data.storage_path, 3600); // 1 hour

    intro.audioUrl = urlData?.signedUrl || null;

    return intro;
  }

  private mapDbToAudioIntro(data: any): AudioIntro {
    return {
      id: data.id,
      userId: data.user_id,
      storagePath: data.storage_path,
      durationSeconds: parseFloat(data.duration_seconds),
      fileSizeBytes: data.file_size_bytes,
      mimeType: data.mime_type,
      transcription: data.transcription,
      transcriptionStatus: data.transcription_status,
      createdAt: new Date(data.created_at),
      isActive: data.is_active
    };
  }

  // ==========================================
  // LOCALSTORAGE IMPLEMENTATION (DUMMY MODE)
  // ==========================================

  private async uploadToLocalStorage(userId: string, audioBlob: Blob, transcription?: string): Promise<AudioIntro> {
    const base64Audio = await this.blobToBase64(audioBlob);
    const duration = await this.getAudioDuration(audioBlob);

    const intro: AudioIntro & { audioData: string } = {
      id: 'local_' + Date.now(),
      userId,
      storagePath: 'local',
      durationSeconds: duration,
      fileSizeBytes: audioBlob.size,
      mimeType: audioBlob.type,
      transcription: transcription || null,
      transcriptionStatus: transcription ? 'completed' : 'pending',
      createdAt: new Date(),
      isActive: true,
      audioData: base64Audio
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(intro));

    // Create audio URL from base64
    const audioIntro: AudioIntro = { ...intro };
    audioIntro.audioUrl = base64Audio;

    return audioIntro;
  }

  private getAudioIntroFromLocalStorage(): AudioIntro | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;

    try {
      const data = JSON.parse(stored) as AudioIntro & { audioData?: string };
      const intro: AudioIntro = {
        id: data.id,
        userId: data.userId,
        storagePath: data.storagePath,
        durationSeconds: data.durationSeconds,
        fileSizeBytes: data.fileSizeBytes,
        mimeType: data.mimeType,
        transcription: data.transcription,
        transcriptionStatus: data.transcriptionStatus,
        createdAt: new Date(data.createdAt),
        isActive: data.isActive,
        audioUrl: data.audioData || null
      };
      return intro;
    } catch {
      return null;
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  private async getAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(blob);

      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        URL.revokeObjectURL(audio.src);
        resolve(Math.round(duration * 10) / 10); // Round to 1 decimal
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(audio.src);
        resolve(0);
      });
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private getExtensionFromMimeType(mimeType: string): string {
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3';
    return 'webm'; // Default
  }
}
