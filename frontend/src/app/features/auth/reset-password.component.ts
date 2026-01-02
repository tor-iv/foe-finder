import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
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
    <div class="reset-password-container">
      <mat-card class="reset-password-card">
        <mat-card-header>
          <mat-card-title>Set New Password</mat-card-title>
          <mat-card-subtitle>Enter your new password below</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (!resetComplete()) {
            <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Password</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="new-password">
                @if (resetPasswordForm.get('password')?.hasError('required') && resetPasswordForm.get('password')?.touched) {
                  <mat-error>Password is required</mat-error>
                }
                @if (resetPasswordForm.get('password')?.hasError('minlength') && resetPasswordForm.get('password')?.touched) {
                  <mat-error>Password must be at least 6 characters</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm New Password</mat-label>
                <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password">
                @if (resetPasswordForm.get('confirmPassword')?.hasError('required') && resetPasswordForm.get('confirmPassword')?.touched) {
                  <mat-error>Please confirm your password</mat-error>
                }
                @if (resetPasswordForm.hasError('passwordMismatch') && resetPasswordForm.get('confirmPassword')?.touched) {
                  <mat-error>Passwords do not match</mat-error>
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
                [disabled]="loading() || resetPasswordForm.invalid"
              >
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Update Password
                }
              </button>
            </form>
          } @else {
            <div class="success-message">
              <div class="success-icon">✓</div>
              <p>Password Updated!</p>
              <p class="success-details">Your password has been successfully reset.</p>
              <a routerLink="/login" class="login-button">Go to Login</a>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .reset-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100dvh - var(--foe-navbar-height));
      padding: var(--foe-space-md);
      background: var(--foe-bg-primary);
      font-family: 'Space Mono', monospace;
    }

    .reset-password-card {
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

    .login-button {
      display: inline-block;
      margin-top: var(--foe-space-lg);
      padding: 12px 24px;
      background: var(--foe-accent-primary);
      color: var(--foe-text-primary);
      text-decoration: none;
      font-weight: 700;
      font-size: var(--foe-text-sm);
      text-transform: uppercase;
      letter-spacing: 1px;
      border: 3px solid var(--foe-border);
      transition: all 0.1s ease;
    }

    @media (min-width: 768px) {
      .login-button:hover {
        background: var(--foe-accent-light);
        transform: translate(-2px, -2px);
        box-shadow: 4px 4px 0px var(--foe-border);
      }
    }

    mat-spinner {
      margin: 0 auto;
    }
  `]
})
export class ResetPasswordComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  resetPasswordForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  resetComplete = signal(false);

  constructor() {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { password } = this.resetPasswordForm.value;

    try {
      await this.authService.updatePassword(password);
      this.resetComplete.set(true);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to update password. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
