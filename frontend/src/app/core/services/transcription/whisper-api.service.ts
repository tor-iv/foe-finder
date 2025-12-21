import { Injectable, signal, inject } from '@angular/core';
import { TranscriptionService } from './transcription.interface';
import { SupabaseService } from '../supabase.service';

/**
 * Server-Side Whisper API Transcription Service
 *
 * Uses OpenAI's Whisper API via a Supabase Edge Function.
 * This is a placeholder for future implementation.
 *
 * To enable:
 * 1. Create Supabase Edge Function 'transcribe-audio'
 * 2. Add OPENAI_API_KEY to Supabase secrets
 * 3. Swap provider in transcription.providers.ts
 *
 * Pros:
 * - Fast (2-3 seconds)
 * - No model download for user
 * - Consistent performance across devices
 *
 * Cons:
 * - Costs ~$0.002 per transcription
 * - Audio uploaded to server
 * - Requires network connection
 */
@Injectable({
  providedIn: 'root'
})
export class WhisperApiService implements TranscriptionService {
  private supabaseService = inject(SupabaseService);

  // Status signals
  loadingProgress = signal(100); // Always "loaded" for API
  statusMessage = signal('Ready');
  isProcessing = signal(false);

  isAvailable(): boolean {
    // Check if we have network connectivity
    return navigator.onLine;
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('No network connection. Please check your internet and try again.');
    }

    try {
      this.isProcessing.set(true);
      this.statusMessage.set('Uploading audio...');

      // Convert blob to base64 for transmission
      const base64Audio = await this.blobToBase64(audioBlob);

      this.statusMessage.set('Transcribing...');

      // Call Supabase Edge Function
      const { data, error } = await this.supabaseService.client.functions.invoke('transcribe-audio', {
        body: {
          audio: base64Audio,
          mimeType: audioBlob.type
        }
      });

      if (error) {
        throw new Error(error.message || 'Transcription failed');
      }

      this.statusMessage.set('Complete');
      return data.transcription;

    } catch (error: any) {
      this.statusMessage.set('Error: ' + error.message);
      throw error;
    } finally {
      this.isProcessing.set(false);
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
