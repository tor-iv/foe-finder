import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Age Gate Component
 *
 * Displays a modal overlay requiring users to verify they are 21 or older.
 * Uses a date picker for birthday input and calculates age to verify eligibility.
 *
 * The verification state is stored in localStorage so users don't need to
 * re-verify on subsequent visits.
 *
 * Key patterns demonstrated:
 * - signal() for reactive form state
 * - EventEmitter for parent component communication
 * - localStorage for persistence
 * - Date arithmetic for age calculation
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
            You must be <strong>21 or older</strong> to enter this site.
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
            VERIFY AGE
          </button>

          <p class="age-gate-disclaimer">
            By entering, you confirm you are of legal age.
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
      align-items: center;
      z-index: 9999;
      padding: var(--foe-space-md);
      font-family: 'Space Mono', monospace;
    }

    .age-gate-modal {
      background: var(--foe-bg-secondary);
      border: var(--foe-border-width-responsive) solid var(--foe-border);
      box-shadow: var(--foe-shadow-responsive);
      max-width: 400px;
      width: 100%;
      text-align: center;
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
      padding: var(--foe-space-lg);
    }

    @media (min-width: 768px) {
      .age-gate-content {
        padding: var(--foe-space-xl);
      }
    }

    .age-gate-title {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-lg);
      font-weight: 900;
      margin-bottom: var(--foe-space-sm);
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    @media (min-width: 768px) {
      .age-gate-title {
        font-size: var(--foe-text-xl);
        letter-spacing: 3px;
      }
    }

    .age-gate-subtitle {
      font-size: var(--foe-text-sm);
      color: var(--foe-text-secondary);
      margin-bottom: var(--foe-space-lg);
      text-transform: uppercase;
      letter-spacing: 1px;

      strong {
        color: var(--foe-accent-primary);
        font-weight: 700;
      }
    }

    .birthday-input-group {
      margin-bottom: var(--foe-space-lg);
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
      margin-top: var(--foe-space-lg);
      font-size: 10px;
      color: var(--foe-text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `]
})
export class AgeGateComponent {
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

    // Calculate age from birthdate
    const today = new Date();
    const birth = new Date(this.birthDate);

    // Get the difference in years
    let age = today.getFullYear() - birth.getFullYear();

    // Check if birthday hasn't occurred yet this year
    // Compare month first, then day if same month
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    const isOldEnough = age >= 21;

    if (isOldEnough) {
      // Store verification in localStorage
      localStorage.setItem('foe-age-verified', 'true');
      localStorage.setItem('foe-age-verified-date', new Date().toISOString());
      this.verified.emit();
    } else {
      this.errorMessage.set('You must be 21 or older to enter');
    }
  }

  /**
   * Static helper to check if user has already verified their age
   * Can be called from parent components or guards
   */
  static isVerified(): boolean {
    return localStorage.getItem('foe-age-verified') === 'true';
  }
}
