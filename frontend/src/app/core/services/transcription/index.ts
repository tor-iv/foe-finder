/**
 * Transcription Service Module
 *
 * Provides swappable transcription implementations.
 *
 * Current implementation: WhisperLocalService (on-device, zero cost)
 *
 * To swap to server-side:
 * 1. Change useClass to WhisperApiService below
 * 2. Deploy Supabase Edge Function (see whisper-api.service.ts)
 * 3. Set OPENAI_API_KEY in Supabase secrets
 */

export type { TranscriptionService } from './transcription.interface';
export { TRANSCRIPTION_SERVICE } from './transcription.interface';
export { WhisperLocalService } from './whisper-local.service';
export { WhisperApiService } from './whisper-api.service';

import { Provider } from '@angular/core';
import { TRANSCRIPTION_SERVICE } from './transcription.interface';
import { WhisperLocalService } from './whisper-local.service';
// import { WhisperApiService } from './whisper-api.service';

/**
 * Provider configuration for transcription service.
 *
 * SWAP IMPLEMENTATIONS:
 * - On-device (current): useClass: WhisperLocalService
 * - Server-side: useClass: WhisperApiService
 */
export const transcriptionProviders: Provider[] = [
  {
    provide: TRANSCRIPTION_SERVICE,
    useClass: WhisperLocalService  // ← Swap to WhisperApiService for server-side
  }
];
