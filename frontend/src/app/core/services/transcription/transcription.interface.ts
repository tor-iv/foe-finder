import { InjectionToken, Signal } from '@angular/core';

/**
 * Transcription Service Interface
 *
 * Abstract interface for audio transcription services.
 * Allows swapping between on-device (Whisper.js) and server-side (Whisper API) implementations.
 *
 * To swap implementations:
 * 1. Change the useClass in transcription.providers.ts
 * 2. No other code changes needed - all consumers use the interface
 */
export interface TranscriptionService {
  /**
   * Transcribe audio blob to text
   * @param audioBlob - The audio file to transcribe
   * @returns Promise resolving to transcribed text
   */
  transcribe(audioBlob: Blob): Promise<string>;

  /**
   * Check if transcription service is available/ready
   * For on-device: checks if model is loaded or can be loaded
   * For API: checks if network is available
   */
  isAvailable(): boolean;

  /**
   * Get current loading progress (0-100)
   * Useful for showing model download progress for on-device transcription
   */
  loadingProgress: Signal<number>;

  /**
   * Get current status message
   * e.g., "Downloading model...", "Transcribing...", "Ready"
   */
  statusMessage: Signal<string>;

  /**
   * Whether the service is currently processing
   */
  isProcessing: Signal<boolean>;
}

/**
 * Injection token for the transcription service
 * Usage: inject(TRANSCRIPTION_SERVICE)
 */
export const TRANSCRIPTION_SERVICE = new InjectionToken<TranscriptionService>('TranscriptionService');
