import { Component, Input, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Audio Player Component
 *
 * Custom audio player with transcription display.
 * Designed to show a matched user's audio intro with their transcribed text.
 *
 * Features:
 * - Custom play/pause controls
 * - Progress bar with seek functionality
 * - Duration display
 * - Transcription text display
 * - "Has Intro" badge
 */
@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="audio-player-container">
      <!-- Header with name and badge -->
      <div class="player-header">
        <span class="speaker-name">{{ displayName }}'s Intro</span>
        @if (hasAudioIntro) {
          <span class="audio-badge" title="Has audio intro">
            <mat-icon>mic</mat-icon>
          </span>
        }
      </div>

      @if (audioUrl) {
        <!-- Hidden native audio element -->
        <audio
          #audioElement
          [src]="audioUrl"
          (loadedmetadata)="onMetadataLoaded()"
          (timeupdate)="onTimeUpdate()"
          (ended)="onEnded()"
          preload="metadata">
        </audio>

        <!-- Custom player controls -->
        <div class="player-controls">
          <button class="play-btn" (click)="togglePlay()">
            <mat-icon>{{ isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
          </button>

          <div class="progress-container" (click)="seek($event)">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progressPercent()"></div>
            </div>
          </div>

          <span class="duration">{{ currentTimeFormatted() }} / {{ durationFormatted() }}</span>
        </div>

        <!-- Transcription -->
        @if (transcription) {
          <div class="transcription">
            <p class="transcription-label">What they said:</p>
            <p class="transcription-text">"{{ transcription }}"</p>
          </div>
        } @else if (transcriptionStatus === 'processing') {
          <div class="transcription transcription-pending">
            <p class="transcription-label">Transcribing...</p>
          </div>
        }
      } @else {
        <div class="no-intro">
          <mat-icon>mic_off</mat-icon>
          <p>No audio intro recorded</p>
        </div>
      }
    </div>
  `,
  styles: [`
    /* =============================================
       AUDIO PLAYER - Mobile-First Responsive Styles
       ============================================= */

    .audio-player-container {
      background: var(--foe-bg-tertiary);
      border: var(--foe-border-width-responsive) solid var(--foe-border);
      padding: var(--foe-space-md);
      font-family: 'Space Mono', monospace;
    }

    @media (min-width: 768px) {
      .audio-player-container {
        padding: var(--foe-space-lg);
      }
    }

    /* Header */
    .player-header {
      display: flex;
      align-items: center;
      gap: var(--foe-space-sm);
      margin-bottom: var(--foe-space-md);
      padding-bottom: var(--foe-space-sm);
      border-bottom: 2px solid var(--foe-border);
    }

    .speaker-name {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: var(--foe-text-base);
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    @media (min-width: 768px) {
      .speaker-name {
        font-size: var(--foe-text-lg);
      }
    }

    .audio-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--foe-accent-primary);
      border: 2px solid var(--foe-border);
      padding: 4px;
    }

    .audio-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--foe-text-primary);
    }

    /* Player Controls */
    .player-controls {
      display: flex;
      align-items: center;
      gap: var(--foe-space-md);
    }

    .play-btn {
      width: 48px;
      height: 48px;
      border-radius: 0;
      background: var(--foe-accent-primary);
      border: 3px solid var(--foe-border);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 3px 3px 0px var(--foe-border);
      transition: transform 0.1s, box-shadow 0.1s;
    }

    .play-btn:hover {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0px var(--foe-border);
    }

    .play-btn mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: var(--foe-text-primary);
    }

    .progress-container {
      flex: 1;
      cursor: pointer;
      padding: var(--foe-space-sm) 0;
    }

    .progress-bar {
      height: 8px;
      background: var(--foe-bg-secondary);
      border: 2px solid var(--foe-border);
      position: relative;
    }

    @media (min-width: 768px) {
      .progress-bar {
        height: 10px;
      }
    }

    .progress-fill {
      height: 100%;
      background: var(--foe-accent-primary);
      transition: width 0.1s linear;
    }

    .duration {
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      font-weight: 700;
      white-space: nowrap;
    }

    @media (min-width: 768px) {
      .duration {
        font-size: var(--foe-text-sm);
      }
    }

    /* Transcription */
    .transcription {
      margin-top: var(--foe-space-md);
      padding-top: var(--foe-space-md);
      border-top: 2px dashed var(--foe-border);
    }

    .transcription-label {
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: var(--foe-space-xs);
    }

    .transcription-text {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-base);
      color: var(--foe-text-primary);
      line-height: 1.6;
      font-style: italic;
    }

    @media (min-width: 768px) {
      .transcription-text {
        font-size: var(--foe-text-lg);
      }
    }

    .transcription-pending {
      opacity: 0.6;
    }

    /* No Intro State */
    .no-intro {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--foe-space-sm);
      padding: var(--foe-space-lg);
      color: var(--foe-text-secondary);
    }

    .no-intro mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      opacity: 0.5;
    }

    .no-intro p {
      font-size: var(--foe-text-sm);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `]
})
export class AudioPlayerComponent {
  @ViewChild('audioElement') audioElement!: ElementRef<HTMLAudioElement>;

  @Input() audioUrl: string | null = null;
  @Input() transcription: string | null = null;
  @Input() transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed' = 'completed';
  @Input() displayName: string = '';
  @Input() hasAudioIntro: boolean = false;

  // Playback state
  isPlaying = signal(false);
  progressPercent = signal(0);
  currentTimeFormatted = signal('0:00');
  durationFormatted = signal('0:00');

  private duration = 0;

  togglePlay(): void {
    const audio = this.audioElement?.nativeElement;
    if (!audio) return;

    if (this.isPlaying()) {
      audio.pause();
      this.isPlaying.set(false);
    } else {
      audio.play();
      this.isPlaying.set(true);
    }
  }

  onMetadataLoaded(): void {
    const audio = this.audioElement?.nativeElement;
    if (!audio) return;

    this.duration = audio.duration;
    this.durationFormatted.set(this.formatTime(audio.duration));
  }

  onTimeUpdate(): void {
    const audio = this.audioElement?.nativeElement;
    if (!audio) return;

    const currentTime = audio.currentTime;
    this.currentTimeFormatted.set(this.formatTime(currentTime));

    if (this.duration > 0) {
      this.progressPercent.set((currentTime / this.duration) * 100);
    }
  }

  onEnded(): void {
    this.isPlaying.set(false);
    this.progressPercent.set(0);
    this.currentTimeFormatted.set('0:00');
  }

  seek(event: MouseEvent): void {
    const audio = this.audioElement?.nativeElement;
    if (!audio || this.duration === 0) return;

    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percent = clickX / rect.width;

    audio.currentTime = percent * this.duration;
  }

  private formatTime(seconds: number): string {
    if (!isFinite(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
