import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeoFenceService } from '../../core/services/geo-fence.service';

/**
 * Geo Gate Component
 *
 * Displays a modal overlay requiring users to verify they are in NYC.
 * Users outside NYC or who deny location access can join a waitlist.
 *
 * Three states:
 * 1. Checking - GPS request in progress
 * 2. Verified - User in NYC, emits verified event
 * 3. Blocked - User outside NYC or GPS error, shows waitlist form
 */
@Component({
  selector: 'app-geo-gate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="geo-gate-overlay">
      <div class="geo-gate-modal">
        <div class="geo-gate-header">
          <span class="logo-foe">FOE</span>
          <span class="logo-finder">FINDER</span>
        </div>

        <div class="geo-gate-content">
          <!-- Checking State -->
          @if (checking()) {
            <div class="checking-state">
              <div class="spinner"></div>
              <h2 class="geo-gate-title">CHECKING LOCATION</h2>
              <p class="geo-gate-subtitle">
                Please allow location access when prompted...
              </p>
            </div>
          }

          <!-- Initial State - Before Check -->
          @if (!checking() && !hasChecked()) {
            <div class="initial-state">
              <h2 class="geo-gate-title">LOCATION REQUIRED</h2>
              <p class="geo-gate-subtitle">
                FoeFinder is currently available in <strong>NYC only</strong>.
              </p>
              <p class="geo-gate-info">
                We need to verify your location to continue.
              </p>
              <button class="verify-btn" (click)="checkLocation()">
                CHECK MY LOCATION
              </button>
            </div>
          }

          <!-- Blocked State - Outside NYC or Error -->
          @if (!checking() && hasChecked() && !geoVerified()) {
            <div class="blocked-state">
              <h2 class="geo-gate-title">
                @if (error() === 'permission_denied') {
                  LOCATION ACCESS DENIED
                } @else if (error() === 'outside_nyc') {
                  NOT IN NYC YET
                } @else {
                  LOCATION UNAVAILABLE
                }
              </h2>

              <p class="geo-gate-subtitle">
                @if (error() === 'permission_denied') {
                  Please enable location access in your browser to use FoeFinder.
                } @else if (error() === 'outside_nyc') {
                  FoeFinder is currently only available in <strong>New York City</strong>.
                } @else {
                  We couldn't determine your location. Please try again.
                }
              </p>

              @if (error() === 'timeout' || error() === 'position_unavailable') {
                <button class="retry-btn" (click)="retryCheck()">
                  TRY AGAIN
                </button>
              }

              <!-- Waitlist Form -->
              @if (!waitlistSubmitted()) {
                <div class="waitlist-section">
                  <p class="waitlist-intro">
                    Join the waitlist to be notified when we launch in your area:
                  </p>
                  <div class="waitlist-form">
                    <input
                      type="email"
                      class="email-input"
                      placeholder="your@email.com"
                      [(ngModel)]="waitlistEmail"
                      (keyup.enter)="submitWaitlist()"
                    />
                    <button
                      class="waitlist-btn"
                      (click)="submitWaitlist()"
                      [disabled]="!isValidEmail() || waitlistSubmitting()"
                    >
                      @if (waitlistSubmitting()) {
                        ...
                      } @else {
                        JOIN
                      }
                    </button>
                  </div>
                  @if (waitlistError()) {
                    <div class="error-message">
                      @if (waitlistError() === 'already_registered') {
                        This email is already on the waitlist!
                      } @else {
                        Something went wrong. Please try again.
                      }
                    </div>
                  }
                </div>
              }

              <!-- Waitlist Success -->
              @if (waitlistSubmitted()) {
                <div class="waitlist-success">
                  <p class="success-message">
                    You're on the list! We'll email you when FoeFinder launches in your area.
                  </p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* =============================================
       GEO GATE - Mobile-First Responsive Styles
       ============================================= */

    .geo-gate-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      padding: var(--foe-space-md);
      font-family: 'Space Mono', monospace;
    }

    .geo-gate-modal {
      background: var(--foe-bg-secondary);
      border: var(--foe-border-width-responsive) solid var(--foe-border);
      box-shadow: var(--foe-shadow-responsive);
      max-width: 400px;
      width: 100%;
      text-align: center;
    }

    @media (min-width: 768px) {
      .geo-gate-modal {
        max-width: 450px;
      }
    }

    .geo-gate-header {
      background: var(--foe-bg-tertiary);
      padding: var(--foe-space-md);
      border-bottom: 3px solid var(--foe-border);
      font-family: 'Inter', sans-serif;
      font-size: 24px;
      font-weight: 900;
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    @media (min-width: 768px) {
      .geo-gate-header {
        font-size: 32px;
        padding: var(--foe-space-lg);
        gap: 10px;
      }
    }

    .logo-foe {
      color: var(--foe-accent-primary);
      letter-spacing: -1px;
      text-shadow: 2px 2px 0px var(--foe-border);
    }

    .logo-finder {
      color: var(--foe-text-primary);
      font-weight: 700;
      letter-spacing: -1px;
      text-shadow: 2px 2px 0px var(--foe-bg-tertiary);
    }

    .geo-gate-content {
      padding: var(--foe-space-lg);
    }

    @media (min-width: 768px) {
      .geo-gate-content {
        padding: var(--foe-space-xl);
      }
    }

    .geo-gate-title {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-lg);
      font-weight: 900;
      margin-bottom: var(--foe-space-sm);
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    @media (min-width: 768px) {
      .geo-gate-title {
        font-size: var(--foe-text-xl);
        letter-spacing: 3px;
      }
    }

    .geo-gate-subtitle {
      font-size: var(--foe-text-sm);
      color: var(--foe-text-secondary);
      margin-bottom: var(--foe-space-md);
      text-transform: uppercase;
      letter-spacing: 1px;
      line-height: 1.6;

      strong {
        color: var(--foe-accent-primary);
        font-weight: 700;
      }
    }

    .geo-gate-info {
      font-size: var(--foe-text-xs);
      color: var(--foe-text-muted);
      margin-bottom: var(--foe-space-lg);
    }

    /* Spinner */
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--foe-bg-tertiary);
      border-top-color: var(--foe-accent-primary);
      border-radius: 50%;
      margin: 0 auto var(--foe-space-lg);
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Buttons */
    .verify-btn, .retry-btn {
      width: 100%;
      padding: var(--foe-space-md);
      background: var(--foe-accent-primary);
      color: var(--foe-text-primary);
      font-family: 'Space Mono', monospace;
      font-size: var(--foe-text-base);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      border: 3px solid var(--foe-border);
      box-shadow: var(--foe-shadow-sm);
      cursor: pointer;
      transition: all 0.1s ease;

      &:hover:not(:disabled) {
        background: var(--foe-accent-light);
        transform: translate(2px, 2px);
        box-shadow: 1px 1px 0px var(--foe-border);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: var(--foe-bg-tertiary);
      }
    }

    .retry-btn {
      margin-bottom: var(--foe-space-lg);
    }

    /* Waitlist Section */
    .waitlist-section {
      margin-top: var(--foe-space-lg);
      padding-top: var(--foe-space-lg);
      border-top: 2px dashed var(--foe-border);
    }

    .waitlist-intro {
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      margin-bottom: var(--foe-space-md);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .waitlist-form {
      display: flex;
      gap: var(--foe-space-sm);
    }

    .email-input {
      flex: 1;
      padding: var(--foe-space-sm) var(--foe-space-md);
      font-family: 'Space Mono', monospace;
      font-size: var(--foe-text-sm);
      background: var(--foe-bg-tertiary);
      border: 3px solid var(--foe-border);
      color: var(--foe-text-primary);

      &:focus {
        outline: none;
        border-color: var(--foe-accent-primary);
      }

      &::placeholder {
        color: var(--foe-text-muted);
      }
    }

    .waitlist-btn {
      padding: var(--foe-space-sm) var(--foe-space-md);
      background: var(--foe-accent-secondary);
      color: var(--foe-text-primary);
      font-family: 'Space Mono', monospace;
      font-size: var(--foe-text-sm);
      font-weight: 700;
      text-transform: uppercase;
      border: 3px solid var(--foe-border);
      cursor: pointer;
      transition: all 0.1s ease;

      &:hover:not(:disabled) {
        background: var(--foe-accent-primary);
        transform: translate(1px, 1px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .error-message {
      background: var(--foe-error-bg);
      border: 2px solid var(--foe-error);
      color: var(--foe-error);
      padding: var(--foe-space-sm);
      margin-top: var(--foe-space-md);
      font-size: var(--foe-text-xs);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
    }

    .waitlist-success {
      margin-top: var(--foe-space-lg);
      padding: var(--foe-space-md);
      background: var(--foe-success-bg);
      border: 2px solid var(--foe-success);
    }

    .success-message {
      color: var(--foe-success);
      font-size: var(--foe-text-sm);
      font-weight: 700;
      margin: 0;
    }
  `]
})
export class GeoGateComponent {
  private geoFenceService = inject(GeoFenceService);

  @Output() verified = new EventEmitter<void>();

  // State signals from service
  checking = this.geoFenceService.geoCheckInProgress;
  error = this.geoFenceService.geoError;
  geoVerified = this.geoFenceService.geoVerified;

  // Local state
  hasChecked = signal(false);
  waitlistEmail = '';
  waitlistSubmitted = signal(false);
  waitlistSubmitting = signal(false);
  waitlistError = signal<string | null>(null);

  async checkLocation(): Promise<void> {
    this.hasChecked.set(true);
    const isVerified = await this.geoFenceService.verifyLocation();

    if (isVerified) {
      this.verified.emit();
    }
  }

  async retryCheck(): Promise<void> {
    this.geoFenceService.clearVerification();
    await this.checkLocation();
  }

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.waitlistEmail);
  }

  async submitWaitlist(): Promise<void> {
    if (!this.isValidEmail() || this.waitlistSubmitting()) {
      return;
    }

    this.waitlistSubmitting.set(true);
    this.waitlistError.set(null);

    const result = await this.geoFenceService.submitToWaitlist(this.waitlistEmail);

    this.waitlistSubmitting.set(false);

    if (result.success) {
      this.waitlistSubmitted.set(true);
    } else {
      this.waitlistError.set(result.error || 'unknown');
    }
  }
}
