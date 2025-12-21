import { Component, OnDestroy, Output, EventEmitter, signal, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Audio Recorder Component
 *
 * Records audio using the MediaRecorder API with a 20-second maximum duration.
 * Provides visual feedback during recording and allows preview before submission.
 *
 * States:
 * - idle: Ready to start recording
 * - recording: Actively capturing audio
 * - preview: Recording complete, user can listen and confirm or re-record
 *
 * Outputs:
 * - audioSubmitted: Emits the recorded Blob when user confirms
 * - recordingCancelled: Emits when user cancels/skips
 */
@Component({
  selector: 'app-audio-recorder',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="recorder-container">

      <!-- IDLE STATE: Ready to record -->
      @if (recordingState() === 'idle') {
        <div class="idle-state">
          <button class="record-btn" (click)="startRecording()" [disabled]="!hasPermission()">
            <mat-icon>mic</mat-icon>
          </button>
          <p class="instruction">Tap to record (20 sec max)</p>

          @if (permissionError()) {
            <div class="error-message">
              {{ permissionError() }}
            </div>
          }
        </div>
      }

      <!-- RECORDING STATE: Actively capturing -->
      @if (recordingState() === 'recording') {
        <div class="recording-state">
          <div class="recording-indicator">
            <span class="pulse-dot"></span>
            <span class="timer">{{ formattedTime() }}</span>
          </div>

          <mat-progress-bar
            mode="determinate"
            [value]="progressPercent()">
          </mat-progress-bar>

          <button class="stop-btn" (click)="stopRecording()">
            <mat-icon>stop</mat-icon>
            <span>Stop</span>
          </button>
        </div>
      }

      <!-- PREVIEW STATE: Review recording -->
      @if (recordingState() === 'preview') {
        <div class="preview-state">
          <p class="preview-label">Preview your intro:</p>

          <audio #audioPreview [src]="audioUrl()" controls class="audio-preview"></audio>

          <div class="preview-actions">
            <button mat-button class="rerecord-btn" (click)="discardRecording()">
              <mat-icon>refresh</mat-icon>
              Re-record
            </button>
            <button mat-raised-button class="save-btn" (click)="submitRecording()">
              <mat-icon>check</mat-icon>
              Save Intro
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* =============================================
       AUDIO RECORDER - Mobile-First Responsive Styles
       ============================================= */

    .recorder-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--foe-space-lg);
      background: var(--foe-bg-tertiary);
      border: var(--foe-border-width-responsive) solid var(--foe-border);
    }

    /* IDLE STATE */
    .idle-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--foe-space-md);
    }

    .record-btn {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--foe-accent-primary);
      border: 3px solid var(--foe-border);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: var(--foe-shadow-responsive);
    }

    @media (min-width: 768px) {
      .record-btn {
        width: 100px;
        height: 100px;
      }
    }

    .record-btn:hover:not([disabled]) {
      transform: scale(1.05);
      box-shadow: 6px 6px 0px var(--foe-border);
    }

    .record-btn:disabled {
      background: var(--foe-bg-secondary);
      cursor: not-allowed;
      opacity: 0.5;
    }

    .record-btn mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: var(--foe-text-primary);
    }

    @media (min-width: 768px) {
      .record-btn mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }

    .instruction {
      font-family: 'Space Mono', monospace;
      font-size: var(--foe-text-sm);
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: center;
    }

    .error-message {
      color: var(--foe-error);
      text-align: center;
      padding: var(--foe-space-sm);
      background: var(--foe-error-bg);
      border: 2px solid var(--foe-error);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-xs);
      max-width: 300px;
    }

    /* RECORDING STATE */
    .recording-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--foe-space-lg);
      width: 100%;
      max-width: 300px;
    }

    .recording-indicator {
      display: flex;
      align-items: center;
      gap: var(--foe-space-md);
    }

    .pulse-dot {
      width: 16px;
      height: 16px;
      background: #ff4444;
      border-radius: 50%;
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.9); }
    }

    .timer {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-2xl);
      font-weight: 900;
      color: var(--foe-text-primary);
    }

    ::ng-deep .recording-state .mat-mdc-progress-bar {
      width: 100%;
      height: 10px;
      border: 2px solid var(--foe-border);
      border-radius: 0;

      .mdc-linear-progress__bar-inner {
        border-color: var(--foe-accent-primary);
      }

      .mdc-linear-progress__buffer-bar {
        background-color: var(--foe-bg-secondary);
      }
    }

    .stop-btn {
      display: flex;
      align-items: center;
      gap: var(--foe-space-sm);
      padding: var(--foe-space-sm) var(--foe-space-lg);
      background: #ff4444;
      border: 3px solid var(--foe-border);
      color: white;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      font-size: var(--foe-text-base);
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      box-shadow: var(--foe-shadow-responsive);
    }

    .stop-btn:hover {
      background: #cc3333;
    }

    .stop-btn mat-icon {
      color: white;
    }

    /* PREVIEW STATE */
    .preview-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--foe-space-lg);
      width: 100%;
      max-width: 350px;
    }

    .preview-label {
      font-family: 'Space Mono', monospace;
      font-size: var(--foe-text-sm);
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .audio-preview {
      width: 100%;
      height: 48px;
      border: 2px solid var(--foe-border);
      background: var(--foe-bg-secondary);
    }

    .preview-actions {
      display: flex;
      flex-direction: column;
      gap: var(--foe-space-sm);
      width: 100%;
    }

    @media (min-width: 480px) {
      .preview-actions {
        flex-direction: row;
        justify-content: center;
        gap: var(--foe-space-md);
      }
    }

    .rerecord-btn {
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      border: 2px solid var(--foe-border);
      background: var(--foe-bg-secondary);
      color: var(--foe-text-primary);
      border-radius: 0;
      min-height: 48px;
    }

    .save-btn {
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      background: var(--foe-accent-primary);
      color: var(--foe-text-primary);
      border: 3px solid var(--foe-border);
      border-radius: 0;
      box-shadow: var(--foe-shadow-responsive);
      min-height: 48px;
    }

    .save-btn:hover {
      background: var(--foe-accent-light);
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0px var(--foe-border);
    }
  `]
})
export class AudioRecorderComponent implements OnDestroy {
  private ngZone = inject(NgZone);

  @Output() audioSubmitted = new EventEmitter<Blob>();
  @Output() recordingCancelled = new EventEmitter<void>();

  // Recording state machine
  recordingState = signal<'idle' | 'recording' | 'preview'>('idle');

  // Permission and error states
  hasPermission = signal(true);
  permissionError = signal<string | null>(null);

  // Recording progress
  elapsedSeconds = signal(0);
  formattedTime = signal('00:00');
  progressPercent = signal(0);

  // Preview
  audioUrl = signal<string | null>(null);

  // Private recording state
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingInterval: ReturnType<typeof setInterval> | null = null;
  private recordedBlob: Blob | null = null;
  private stream: MediaStream | null = null;

  private readonly MAX_DURATION = 20; // seconds

  async startRecording(): Promise<void> {
    try {
      // Request microphone permission
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.hasPermission.set(true);
      this.permissionError.set(null);

      // Determine best audio format (Safari uses mp4, others use webm)
      const mimeType = this.getSupportedMimeType();

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.finalizeRecording();
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.recordingState.set('recording');
      this.elapsedSeconds.set(0);
      this.updateTimer();

      // Start timer (outside Angular zone for performance)
      this.ngZone.runOutsideAngular(() => {
        this.recordingInterval = setInterval(() => {
          this.ngZone.run(() => {
            const elapsed = this.elapsedSeconds() + 1;
            this.elapsedSeconds.set(elapsed);
            this.updateTimer();

            // Auto-stop at max duration
            if (elapsed >= this.MAX_DURATION) {
              this.stopRecording();
            }
          });
        }, 1000);
      });

    } catch (error: any) {
      this.hasPermission.set(false);
      if (error.name === 'NotAllowedError') {
        this.permissionError.set('Microphone access denied. Please enable it in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        this.permissionError.set('No microphone found. Please connect a microphone and try again.');
      } else {
        this.permissionError.set('Could not access microphone. Please try again.');
      }
    }
  }

  stopRecording(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Stop the media stream tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  private finalizeRecording(): void {
    const mimeType = this.getSupportedMimeType();
    this.recordedBlob = new Blob(this.audioChunks, { type: mimeType });

    // Create URL for preview
    const url = URL.createObjectURL(this.recordedBlob);
    this.audioUrl.set(url);

    this.recordingState.set('preview');
  }

  discardRecording(): void {
    // Clean up preview URL
    const url = this.audioUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }

    this.audioUrl.set(null);
    this.recordedBlob = null;
    this.audioChunks = [];
    this.elapsedSeconds.set(0);
    this.updateTimer();

    this.recordingState.set('idle');
  }

  submitRecording(): void {
    if (this.recordedBlob) {
      this.audioSubmitted.emit(this.recordedBlob);
    }
  }

  private updateTimer(): void {
    const elapsed = this.elapsedSeconds();
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    this.formattedTime.set(
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
    this.progressPercent.set((elapsed / this.MAX_DURATION) * 100);
  }

  private getSupportedMimeType(): string {
    // Safari prefers mp4, Chrome/Firefox prefer webm
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      return 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      return 'audio/webm';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      return 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
      return 'audio/ogg';
    }
    // Fallback - let browser decide
    return '';
  }

  ngOnDestroy(): void {
    // Clean up interval
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
    }

    // Clean up media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Stop media stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    // Clean up preview URL
    const url = this.audioUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
