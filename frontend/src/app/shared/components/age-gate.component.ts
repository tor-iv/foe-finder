import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgeVerificationService } from '../../core/services/age-verification.service';

/**
 * Age Gate Component
 *
 * Displays a modal overlay requiring users to verify they are 21 or older.
 * Uses a date picker for birthday input and calculates age to verify eligibility.
 *
 * Verification is stored via AgeVerificationService:
 * - localStorage for anonymous users (same device persistence)
 * - Supabase profiles for logged-in users (cross-device persistence)
 */
@Component({
  selector: 'app-age-gate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="age-gate-overlay">
      <div class="age-gate-modal">
        <div class="age-gate-header">
          <span class="logo-foe">FOE</span>
          <span class="logo-finder">FINDER</span>
        </div>

        <div class="age-gate-content">
          <h2 class="age-gate-title">AGE VERIFICATION</h2>
          <p class="age-gate-subtitle">
            You must be <strong>21 or older</strong> to willingly enter a relationship disaster zone.
          </p>

          <div class="birthday-input-group">
            <label for="birthday" class="birthday-label">ENTER YOUR BIRTHDAY</label>
            <input
              type="date"
              id="birthday"
              class="birthday-input"
              [max]="maxDate"
              [(ngModel)]="birthDate"
              (change)="onDateChange()"
            />
          </div>

          @if (errorMessage()) {
            <div class="error-message">
              {{ errorMessage() }}
            </div>
          }

          <button
            class="verify-btn"
            (click)="verifyAge()"
            [disabled]="!birthDate"
          >
            PROCEED AT YOUR OWN RISK
          </button>

          <p class="age-gate-disclaimer">
            By entering, you accept full responsibility for all future arguments.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* =============================================
       AGE GATE - Mobile-First Responsive Styles
       ============================================= */

    .age-gate-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      z-index: 9999;
      padding: var(--foe-space-sm);
      padding-top: var(--foe-space-md);
      font-family: 'Space Mono', monospace;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    @media (min-height: 550px) {
      .age-gate-overlay {
        align-items: center;
        padding: var(--foe-space-md);
      }
    }

    .age-gate-modal {
      background: var(--foe-bg-secondary);
      border: var(--foe-border-width-responsive) solid var(--foe-border);
      box-shadow: var(--foe-shadow-responsive);
      max-width: 400px;
      width: 100%;
      text-align: center;
      margin-bottom: var(--foe-space-md);
    }

    @media (min-width: 768px) {
      .age-gate-modal {
        max-width: 450px;
      }
    }

    .age-gate-header {
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
      .age-gate-header {
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

    .age-gate-content {
      padding: var(--foe-space-md);
    }

    @media (min-height: 550px) {
      .age-gate-content {
        padding: var(--foe-space-lg);
      }
    }

    @media (min-width: 768px) {
      .age-gate-content {
        padding: var(--foe-space-xl);
      }
    }

    .age-gate-title {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-base);
      font-weight: 900;
      margin-bottom: var(--foe-space-xs);
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    @media (min-height: 550px) {
      .age-gate-title {
        font-size: var(--foe-text-lg);
        margin-bottom: var(--foe-space-sm);
        letter-spacing: 2px;
      }
    }

    @media (min-width: 768px) {
      .age-gate-title {
        font-size: var(--foe-text-xl);
        letter-spacing: 3px;
      }
    }

    .age-gate-subtitle {
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      margin-bottom: var(--foe-space-md);
      text-transform: uppercase;
      letter-spacing: 1px;

      strong {
        color: var(--foe-accent-primary);
        font-weight: 700;
      }
    }

    @media (min-height: 550px) {
      .age-gate-subtitle {
        font-size: var(--foe-text-sm);
        margin-bottom: var(--foe-space-lg);
      }
    }

    .birthday-input-group {
      margin-bottom: var(--foe-space-md);
    }

    @media (min-height: 550px) {
      .birthday-input-group {
        margin-bottom: var(--foe-space-lg);
      }
    }

    .birthday-label {
      display: block;
      font-size: var(--foe-text-xs);
      font-weight: 700;
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: var(--foe-space-sm);
    }

    .birthday-input {
      width: 100%;
      padding: var(--foe-space-md);
      font-family: 'Space Mono', monospace;
      font-size: var(--foe-text-base);
      background: var(--foe-bg-tertiary);
      border: 3px solid var(--foe-border);
      color: var(--foe-text-primary);
      text-align: center;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: var(--foe-accent-primary);
        box-shadow: 0 0 0 2px var(--foe-accent-primary);
      }
    }

    .error-message {
      background: var(--foe-error-bg);
      border: 2px solid var(--foe-error);
      color: var(--foe-error);
      padding: var(--foe-space-sm);
      margin-bottom: var(--foe-space-md);
      font-size: var(--foe-text-xs);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
    }

    .verify-btn {
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

    .age-gate-disclaimer {
      margin-top: var(--foe-space-md);
      font-size: 10px;
      color: var(--foe-text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    @media (min-height: 550px) {
      .age-gate-disclaimer {
        margin-top: var(--foe-space-lg);
      }
    }
  `]
})
export class AgeGateComponent {
  private ageVerificationService = inject(AgeVerificationService);

  @Output() verified = new EventEmitter<void>();

  birthDate: string = '';
  errorMessage = signal('');

  // Prevent future dates
  maxDate = new Date().toISOString().split('T')[0];

  onDateChange() {
    this.errorMessage.set('');
  }

  verifyAge() {
    if (!this.birthDate) {
      this.errorMessage.set('Please enter your birthday');
      return;
    }

    const isOldEnough = this.ageVerificationService.verifyAge(this.birthDate);

    if (isOldEnough) {
      // Also sync to Supabase if user happens to be logged in
      this.ageVerificationService.storeForCurrentUser();
      this.verified.emit();
    } else {
      this.errorMessage.set('You must be 21 or older to enter');
    }
  }
}
