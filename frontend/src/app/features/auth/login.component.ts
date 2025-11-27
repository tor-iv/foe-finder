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
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <div class="background-glow"></div>
      <mat-card class="login-card fade-in">
        <mat-card-header>
          <mat-card-title>
            <span class="title-foe">FOE</span>
            <span class="title-finder">FINDER</span>
          </mat-card-title>
          <mat-card-subtitle>Log in to find your opposite match</mat-card-subtitle>
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
                Log In
              }
            </button>
          </form>

          <div class="register-link">
            Don't have an account?
            <a routerLink="/register">Register here</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      padding: 20px;
      background: var(--foe-bg-primary);
      overflow: hidden;
    }

    .background-glow {
      position: absolute;
      top: -50%;
      right: -50%;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(233, 69, 96, 0.15) 0%, transparent 70%);
      animation: pulse 8s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
    }

    .login-card {
      max-width: 450px;
      width: 100%;
      position: relative;
      z-index: 1;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(233, 69, 96, 0.2);
    }

    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 30px;
      padding-top: 20px;
    }

    mat-card-title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      gap: 8px;
    }

    .title-foe {
      color: var(--foe-accent-primary);
      letter-spacing: 2px;
    }

    .title-finder {
      color: var(--foe-text-primary);
      font-weight: 300;
    }

    mat-card-subtitle {
      color: var(--foe-text-secondary) !important;
      font-size: 14px;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 20px;
    }

    .submit-button {
      margin-top: 24px;
      height: 52px;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 1px;
      background: linear-gradient(135deg, var(--foe-accent-primary), var(--foe-accent-secondary)) !important;
      transition: all 0.3s ease;

      &:hover:not([disabled]) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(233, 69, 96, 0.4) !important;
      }

      &[disabled] {
        opacity: 0.6;
      }
    }

    .error-message {
      color: var(--foe-accent-primary);
      font-size: 14px;
      margin: 16px 0;
      text-align: center;
      padding: 12px;
      background: rgba(233, 69, 96, 0.1);
      border-left: 3px solid var(--foe-accent-primary);
      border-radius: 4px;
    }

    .register-link {
      margin-top: 24px;
      text-align: center;
      font-size: 14px;
      color: var(--foe-text-secondary);
    }

    .register-link a {
      color: var(--foe-accent-primary);
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;

      &:hover {
        color: var(--foe-accent-secondary);
        text-decoration: underline;
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
