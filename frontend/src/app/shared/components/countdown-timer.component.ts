import { Component, OnInit, OnDestroy, inject, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Countdown Timer Component
 *
 * Displays a countdown to the matching algorithm execution date (January 25th, 2025 at midnight).
 * Uses Angular Signals for reactive state management and runs the timer outside NgZone
 * for optimal performance (avoids triggering change detection every second).
 *
 * Key patterns demonstrated:
 * - signal() for reactive state
 * - NgZone.runOutsideAngular() for performance optimization
 * - OnDestroy cleanup to prevent memory leaks
 */
@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="countdown-container">
      <div class="countdown-header">
        <span class="countdown-label">NEMESIS REVEAL IN</span>
      </div>

      <div class="countdown-grid">
        <div class="countdown-unit">
          <span class="countdown-value">{{ days() }}</span>
          <span class="countdown-unit-label">DAYS</span>
        </div>
        <div class="countdown-separator">:</div>
        <div class="countdown-unit">
          <span class="countdown-value">{{ hours() }}</span>
          <span class="countdown-unit-label">HRS</span>
        </div>
        <div class="countdown-separator">:</div>
        <div class="countdown-unit">
          <span class="countdown-value">{{ minutes() }}</span>
          <span class="countdown-unit-label">MIN</span>
        </div>
        <div class="countdown-separator">:</div>
        <div class="countdown-unit">
          <span class="countdown-value">{{ seconds() }}</span>
          <span class="countdown-unit-label">SEC</span>
        </div>
      </div>

      @if (isExpired()) {
        <div class="countdown-expired">
          <span>🎯 MATCHING COMPLETE - FIND YOUR FOE!</span>
        </div>
      }
    </div>
  `,
  styles: [`
    /* =============================================
       COUNTDOWN TIMER - Mobile-First Responsive Styles
       ============================================= */

    .countdown-container {
      background: var(--foe-bg-secondary);
      border: var(--foe-border-width-responsive) solid var(--foe-border);
      padding: var(--foe-space-md);
      text-align: center;
      font-family: 'Space Mono', monospace;
      box-shadow: var(--foe-shadow-responsive);
    }

    @media (min-width: 768px) {
      .countdown-container {
        padding: var(--foe-space-lg);
      }
    }

    .countdown-header {
      margin-bottom: var(--foe-space-md);
      border-bottom: 3px solid var(--foe-border);
      padding-bottom: var(--foe-space-sm);
    }

    .countdown-label {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-sm);
      font-weight: 900;
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    @media (min-width: 768px) {
      .countdown-label {
        font-size: var(--foe-text-base);
        letter-spacing: 3px;
      }
    }

    .countdown-grid {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: var(--foe-space-xs);
    }

    @media (min-width: 768px) {
      .countdown-grid {
        gap: var(--foe-space-sm);
      }
    }

    .countdown-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
      padding: var(--foe-space-sm);
      min-width: 50px;
    }

    @media (min-width: 768px) {
      .countdown-unit {
        padding: var(--foe-space-md);
        min-width: 70px;
        border-width: 3px;
      }
    }

    .countdown-value {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-xl);
      font-weight: 900;
      color: var(--foe-accent-primary);
      text-shadow: 2px 2px 0px var(--foe-border);
      line-height: 1;
    }

    @media (min-width: 768px) {
      .countdown-value {
        font-size: var(--foe-text-3xl);
      }
    }

    .countdown-unit-label {
      font-size: 8px;
      font-weight: 700;
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }

    @media (min-width: 768px) {
      .countdown-unit-label {
        font-size: var(--foe-text-xs);
      }
    }

    .countdown-separator {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-xl);
      font-weight: 900;
      color: var(--foe-text-primary);
      line-height: 1;
    }

    @media (min-width: 768px) {
      .countdown-separator {
        font-size: var(--foe-text-3xl);
      }
    }

    .countdown-expired {
      margin-top: var(--foe-space-md);
      padding: var(--foe-space-sm);
      background: var(--foe-accent-primary);
      border: 3px solid var(--foe-border);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-sm);
      animation: pulse 1s ease-in-out infinite;
    }

    @media (min-width: 768px) {
      .countdown-expired {
        padding: var(--foe-space-md);
        font-size: var(--foe-text-base);
        letter-spacing: 2px;
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `]
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  private ngZone = inject(NgZone);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Target date: Valentine's Day 2026 at midnight (local time)
  private targetDate = new Date('2026-02-14T00:00:00');

  // Signals for reactive countdown display
  days = signal('00');
  hours = signal('00');
  minutes = signal('00');
  seconds = signal('00');
  isExpired = signal(false);

  ngOnInit() {
    // Initial calculation
    this.updateCountdown();

    // Run interval OUTSIDE Angular zone for performance
    // This prevents change detection from running every second
    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        // Re-enter zone only when updating signals (triggers change detection once)
        this.ngZone.run(() => this.updateCountdown());
      }, 1000);
    });
  }

  ngOnDestroy() {
    // Clean up interval to prevent memory leaks
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateCountdown() {
    const now = new Date().getTime();
    const target = this.targetDate.getTime();
    const difference = target - now;

    if (difference <= 0) {
      this.isExpired.set(true);
      this.days.set('00');
      this.hours.set('00');
      this.minutes.set('00');
      this.seconds.set('00');

      // Stop the interval when expired
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      return;
    }

    // Calculate time units
    const d = Math.floor(difference / (1000 * 60 * 60 * 24));
    const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((difference % (1000 * 60)) / 1000);

    // Update signals with zero-padded values
    this.days.set(this.padZero(d));
    this.hours.set(this.padZero(h));
    this.minutes.set(this.padZero(m));
    this.seconds.set(this.padZero(s));
  }

  private padZero(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
