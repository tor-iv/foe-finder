import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AudioRecorderComponent, AudioRecordingResult } from '../../shared/components/audio-recorder.component';
import { AudioIntroService } from '../../core/services/audio-intro.service';
import { TRANSCRIPTION_SERVICE, TranscriptionService } from '../../core/services/transcription';

/**
 * Record Intro Page
 *
 * Shown after completing the questionnaire.
 * Allows users to record a 20-second audio intro with optional transcription.
 *
 * Flow:
 * 1. User records audio (or skips)
 * 2. Audio is transcribed on-device using Whisper
 * 3. Audio + transcription are uploaded to Supabase
 * 4. User is redirected to results page
 */
@Component({
  selector: 'app-record-intro',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    AudioRecorderComponent
  ],
  template: `
    <div class="record-intro-container">
      <mat-card class="record-intro-card">
        <mat-card-header>
          <mat-card-title>Introduce Yourself</mat-card-title>
          <mat-card-subtitle>
            Record a 20-second intro for your future foe
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Recording phase -->
          @if (!isProcessing() && !isUploading()) {
            <div class="prompt-suggestions">
              <p class="suggestions-title">Ideas for your intro:</p>
              <ul>
                <li>What makes you tick?</li>
                <li>Your most controversial opinion</li>
                <li>Why you're here to find your opposite</li>
              </ul>
            </div>

            <app-audio-recorder
              (audioSubmitted)="onAudioSubmitted($event)"
              (recordingCancelled)="skipForNow()">
            </app-audio-recorder>
          }

          <!-- Transcription phase -->
          @if (isProcessing()) {
            <div class="processing-state">
              <div class="processing-icon">
                <mat-icon>hearing</mat-icon>
              </div>
              <p class="processing-title">{{ transcriptionStatus() }}</p>
              <mat-progress-bar
                mode="determinate"
                [value]="transcriptionProgress()">
              </mat-progress-bar>
              <p class="processing-hint">This may take a moment on first use...</p>
            </div>
          }

          <!-- Uploading phase -->
          @if (isUploading()) {
            <div class="processing-state">
              <div class="processing-icon uploading">
                <mat-icon>cloud_upload</mat-icon>
              </div>
              <p class="processing-title">Saving your intro...</p>
              <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            </div>
          }

          <!-- Error state -->
          @if (error()) {
            <div class="error-message">
              {{ error() }}
              <button mat-button (click)="clearError()">Try Again</button>
            </div>
          }

          <!-- Incentive badge -->
          @if (!isProcessing() && !isUploading()) {
            <div class="incentive-box">
              <mat-icon>emoji_events</mat-icon>
              <p>Foes with audio intros get <strong>more engagement</strong>!</p>
            </div>
          }
        </mat-card-content>

        <mat-card-actions>
          @if (!isProcessing() && !isUploading()) {
            <button mat-button class="skip-btn" (click)="skipForNow()">
              Skip for Now
            </button>
          }
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    /* =============================================
       RECORD INTRO - Mobile-First Responsive Styles
       ============================================= */

    .record-intro-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: calc(100vh - var(--foe-navbar-height));
      padding: var(--foe-space-sm);
      background: var(--foe-bg-primary);
      font-family: 'Space Mono', monospace;
    }

    @media (min-width: 768px) {
      .record-intro-container {
        align-items: center;
        padding: var(--foe-space-lg);
      }
    }

    .record-intro-card {
      max-width: 100%;
      width: 100%;
      background: var(--foe-bg-secondary) !important;
      border: var(--foe-border-width-responsive) solid var(--foe-border) !important;
      border-radius: 0 !important;
      box-shadow: var(--foe-shadow-responsive) !important;
    }

    @media (min-width: 768px) {
      .record-intro-card {
        max-width: 500px;
      }
    }

    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: var(--foe-space-md);
      border-bottom: 3px solid var(--foe-border);
      padding-bottom: var(--foe-space-md);
    }

    mat-card-title {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-xl);
      font-weight: 900;
      margin-bottom: 8px;
      color: var(--foe-text-primary);
      text-shadow: 2px 2px 0px var(--foe-bg-tertiary);
      text-transform: uppercase;
      letter-spacing: -1px;
      text-align: center;
    }

    @media (min-width: 768px) {
      mat-card-title {
        font-size: var(--foe-text-2xl);
      }
    }

    mat-card-subtitle {
      text-align: center;
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary) !important;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Prompt Suggestions */
    .prompt-suggestions {
      background: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
      padding: var(--foe-space-md);
      margin-bottom: var(--foe-space-lg);
    }

    .suggestions-title {
      font-weight: 700;
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-sm);
      margin-bottom: var(--foe-space-sm);
    }

    .prompt-suggestions ul {
      margin: 0;
      padding-left: var(--foe-space-lg);
      color: var(--foe-text-secondary);
      font-size: var(--foe-text-sm);
    }

    .prompt-suggestions li {
      margin-bottom: var(--foe-space-xs);
    }

    /* Processing State */
    .processing-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--foe-space-md);
      padding: var(--foe-space-xl);
    }

    .processing-icon {
      width: 80px;
      height: 80px;
      background: var(--foe-accent-primary);
      border: 3px solid var(--foe-border);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .processing-icon.uploading {
      animation: bounce 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .processing-icon mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--foe-text-primary);
    }

    .processing-title {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: var(--foe-text-lg);
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .processing-hint {
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
    }

    ::ng-deep .processing-state .mat-mdc-progress-bar {
      width: 100%;
      max-width: 300px;
      height: 8px;
      border: 2px solid var(--foe-border);
      border-radius: 0;

      .mdc-linear-progress__bar-inner {
        border-color: var(--foe-accent-primary);
      }

      .mdc-linear-progress__buffer-bar {
        background-color: var(--foe-bg-tertiary);
      }
    }

    /* Incentive Box */
    .incentive-box {
      display: flex;
      align-items: center;
      gap: var(--foe-space-sm);
      background: var(--foe-bg-tertiary);
      border: 2px dashed var(--foe-accent-primary);
      padding: var(--foe-space-md);
      margin-top: var(--foe-space-lg);
    }

    .incentive-box mat-icon {
      color: var(--foe-accent-primary);
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .incentive-box p {
      font-size: var(--foe-text-sm);
      color: var(--foe-text-secondary);
      margin: 0;
    }

    .incentive-box strong {
      color: var(--foe-accent-primary);
    }

    /* Error Message */
    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--foe-space-md);
      color: var(--foe-error);
      text-align: center;
      padding: var(--foe-space-lg);
      background: var(--foe-error-bg);
      border: 2px solid var(--foe-error);
    }

    /* Actions */
    mat-card-actions {
      display: flex;
      justify-content: center;
      padding: var(--foe-space-md);
      border-top: 2px solid var(--foe-border);
    }

    .skip-btn {
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--foe-text-secondary);
    }

    .skip-btn:hover {
      color: var(--foe-text-primary);
    }
  `]
})
export class RecordIntroComponent {
  private router = inject(Router);
  private audioIntroService = inject(AudioIntroService);
  private transcriptionService = inject(TRANSCRIPTION_SERVICE) as TranscriptionService;

  // State
  isProcessing = signal(false);
  isUploading = signal(false);
  error = signal<string | null>(null);

  // Transcription progress (from service)
  transcriptionProgress = this.transcriptionService.loadingProgress;
  transcriptionStatus = this.transcriptionService.statusMessage;

  async onAudioSubmitted(result: AudioRecordingResult): Promise<void> {
    this.error.set(null);

    try {
      // Phase 1: Transcribe on device
      this.isProcessing.set(true);
      let transcription: string | undefined;

      try {
        if (this.transcriptionService.isAvailable()) {
          transcription = await this.transcriptionService.transcribe(result.blob);
        }
      } catch (transcribeError: any) {
        // Transcription failed - continue without it
        console.warn('Transcription failed:', transcribeError.message);
      }

      this.isProcessing.set(false);

      // Phase 2: Upload to storage (pass duration as fallback for iOS)
      this.isUploading.set(true);
      await this.audioIntroService.uploadAudioIntro(
        result.blob,
        transcription,
        result.durationSeconds
      );
      this.isUploading.set(false);

      // Navigate to results
      await this.router.navigate(['/results']);

    } catch (err: any) {
      this.isProcessing.set(false);
      this.isUploading.set(false);
      this.error.set(err.message || 'Failed to save your intro. Please try again.');
    }
  }

  async skipForNow(): Promise<void> {
    await this.router.navigate(['/results']);
  }

  clearError(): void {
    this.error.set(null);
  }
}
