import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { CountdownTimerComponent } from '../../shared/components/countdown-timer.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CountdownTimerComponent
  ],
  template: `
    <div class="login-container">
      <div class="background-glow"></div>
      <app-countdown-timer class="countdown-section"></app-countdown-timer>
      <mat-card class="login-card fade-in">
        <mat-card-header>
          <mat-card-title>
            <span class="title-foe">FOE</span>
            <span class="title-finder">FINDER</span>
          </mat-card-title>
          <mat-card-subtitle>Log in to resume your quest for incompatibility</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email">
              @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                <mat-error>Please enter a valid email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password">
              @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
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
              [disabled]="loading() || loginForm.invalid"
            >
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Return to the Chaos
              }
            </button>
          </form>

          <div class="forgot-password-link">
            <a routerLink="/forgot-password">Forgot password?</a>
          </div>

          <div class="register-link">
            Not yet registered for disappointment?
            <a routerLink="/register">Join the Misery</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    /* =============================================
       LOGIN - Mobile-First Responsive Styles
       ============================================= */

    .login-container {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      gap: var(--foe-space-md);
      min-height: calc(100dvh - var(--foe-navbar-height));
      padding: var(--foe-space-md);
      background: var(--foe-bg-primary);
      overflow: hidden;
      font-family: 'Space Mono', monospace;
    }

    .countdown-section {
      width: 100%;
      max-width: var(--foe-container-sm);
    }

    .background-glow {
      display: none;
    }

    .login-card {
      max-width: var(--foe-container-sm);
      width: 100%;
      position: relative;
      z-index: 1;
      background: var(--foe-bg-secondary) !important;
      border: var(--foe-border-width-responsive) solid var(--foe-border) !important;
      border-radius: 0 !important;
      box-shadow: var(--foe-shadow-responsive) !important;
    }

    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: var(--foe-space-lg);
      padding-top: var(--foe-space-md);
      border-bottom: 3px solid var(--foe-border);
    }

    mat-card-title {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-2xl);
      font-weight: 900;
      margin-bottom: 12px;
      display: flex;
      gap: 4px;
      text-shadow: 3px 3px 0px var(--foe-bg-tertiary);
    }

    @media (min-width: 768px) {
      mat-card-title {
        font-size: 36px;
      }
    }

    .title-foe {
      color: var(--foe-accent-primary);
      letter-spacing: -1px;
    }

    .title-finder {
      color: var(--foe-text-primary);
      font-weight: 900;
      letter-spacing: -1px;
    }

    mat-card-subtitle {
      color: var(--foe-text-secondary) !important;
      font-size: var(--foe-text-xs);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    @media (min-width: 768px) {
      mat-card-subtitle {
        letter-spacing: 2px;
      }
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: var(--foe-space-md);
    }

    .submit-button {
      margin-top: var(--foe-space-lg);
      height: 48px;
      min-height: 48px; /* Touch target */
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

    @media (min-width: 768px) {
      .error-message {
        padding: 12px;
        border-width: 3px;
      }
    }

    .forgot-password-link {
      margin-top: var(--foe-space-lg);
      text-align: center;
      font-size: var(--foe-text-xs);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .forgot-password-link a {
      color: var(--foe-text-secondary);
      text-decoration: none;
      transition: color 0.1s ease;
    }

    .forgot-password-link a:hover {
      color: var(--foe-text-primary);
    }

    .register-link {
      margin-top: var(--foe-space-md);
      text-align: center;
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .register-link a {
      color: var(--foe-text-primary);
      text-decoration: none;
      font-weight: 700;
      background: var(--foe-accent-primary);
      padding: 4px 8px;
      border: 2px solid var(--foe-border);
      transition: all 0.1s ease;
    }

    @media (min-width: 768px) {
      .register-link a:hover {
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
export class LoginComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  loginForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email, password);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Login failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
