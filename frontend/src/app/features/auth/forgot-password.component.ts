import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="forgot-password-container">
      <mat-card class="forgot-password-card">
        <mat-card-header>
          <mat-card-title>Reset Password</mat-card-title>
          <mat-card-subtitle>Enter your email to receive a reset link</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (!emailSent()) {
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="email">
                @if (forgotPasswordForm.get('email')?.hasError('required') && forgotPasswordForm.get('email')?.touched) {
                  <mat-error>Email is required</mat-error>
                }
                @if (forgotPasswordForm.get('email')?.hasError('email') && forgotPasswordForm.get('email')?.touched) {
                  <mat-error>Please enter a valid email</mat-error>
                }
              </mat-form-field>

              @if (errorMessage()) {
                <div class="error-message">
                  {{ errorMessage() }}
                </div>
              }

              <button
                mat-raised-button
                color="primary"
                type="submit"
                class="full-width submit-button"
                [disabled]="loading() || forgotPasswordForm.invalid"
              >
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Send Reset Link
                }
              </button>
            </form>
          } @else {
            <div class="success-message">
              <div class="success-icon">✓</div>
              <p>Check your email!</p>
              <p class="success-details">We've sent a password reset link to <strong>{{ submittedEmail() }}</strong></p>
              <p class="success-note">The link will expire in 1 hour.</p>
            </div>
          }

          <div class="back-link">
            <a routerLink="/login">← Back to Login</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100dvh - var(--foe-navbar-height));
      padding: var(--foe-space-md);
      background: var(--foe-bg-primary);
      font-family: 'Space Mono', monospace;
    }

    .forgot-password-card {
      max-width: var(--foe-container-sm);
      width: 100%;
      background: var(--foe-bg-secondary) !important;
      border: var(--foe-border-width-responsive) solid var(--foe-border) !important;
      border-radius: 0 !important;
      box-shadow: var(--foe-shadow-responsive) !important;
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
      text-shadow: 3px 3px 0px var(--foe-bg-tertiary);
      text-transform: uppercase;
      letter-spacing: -1px;
    }

    @media (min-width: 768px) {
      mat-card-title {
        font-size: 28px;
      }
    }

    mat-card-subtitle {
      font-size: var(--foe-text-xs);
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--foe-text-secondary) !important;
      text-align: center;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: var(--foe-space-md);
    }

    .submit-button {
      margin-top: var(--foe-space-md);
      height: 48px;
      min-height: 48px;
      font-size: var(--foe-text-base);
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      background: var(--foe-accent-primary) !important;
      color: var(--foe-text-primary) !important;
      border: var(--foe-border-width-responsive) solid var(--foe-border) !important;
      border-radius: 0 !important;
      box-shadow: var(--foe-shadow-responsive) !important;
      transition: all 0.1s ease;
    }

    @media (min-width: 768px) {
      .submit-button {
        height: 52px;
        letter-spacing: 2px;
      }

      .submit-button:hover:not([disabled]) {
        transform: translate(4px, 4px);
        box-shadow: 2px 2px 0px var(--foe-border) !important;
        background: var(--foe-accent-light) !important;
      }
    }

    .submit-button[disabled] {
      opacity: 0.5;
      background: var(--foe-bg-tertiary) !important;
    }

    .error-message {
      color: var(--foe-error);
      font-size: var(--foe-text-xs);
      margin: var(--foe-space-md) 0;
      text-align: center;
      padding: var(--foe-space-sm);
      background: var(--foe-error-bg);
      border: 2px solid var(--foe-error);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .success-message {
      text-align: center;
      padding: var(--foe-space-lg) var(--foe-space-md);
    }

    .success-icon {
      width: 60px;
      height: 60px;
      margin: 0 auto var(--foe-space-md);
      background: var(--foe-accent-primary);
      border: 3px solid var(--foe-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: bold;
    }

    .success-message p {
      margin: var(--foe-space-sm) 0;
      font-size: var(--foe-text-base);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .success-details {
      font-size: var(--foe-text-sm) !important;
      color: var(--foe-text-secondary);
    }

    .success-note {
      font-size: var(--foe-text-xs) !important;
      color: var(--foe-text-secondary);
      margin-top: var(--foe-space-md) !important;
    }

    .back-link {
      margin-top: var(--foe-space-lg);
      text-align: center;
      font-size: var(--foe-text-xs);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .back-link a {
      color: var(--foe-text-primary);
      text-decoration: none;
      font-weight: 700;
      background: var(--foe-accent-primary);
      padding: 4px 8px;
      border: 2px solid var(--foe-border);
      transition: all 0.1s ease;
    }

    @media (min-width: 768px) {
      .back-link a:hover {
        background: var(--foe-accent-light);
        transform: translate(-1px, -1px);
        box-shadow: 2px 2px 0px var(--foe-border);
      }
    }

    mat-spinner {
      margin: 0 auto;
    }
  `]
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  forgotPasswordForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  emailSent = signal(false);
  submittedEmail = signal('');

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { email } = this.forgotPasswordForm.value;

    try {
      await this.authService.requestPasswordReset(email);
      this.submittedEmail.set(email);
      this.emailSent.set(true);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
