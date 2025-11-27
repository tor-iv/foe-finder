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
  selector: 'app-register',
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
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Join Foe Finder</mat-card-title>
          <mat-card-subtitle>Create an account to find your opposite match</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Display Name</mat-label>
              <input matInput type="text" formControlName="displayName" autocomplete="name">
              @if (registerForm.get('displayName')?.hasError('required') && registerForm.get('displayName')?.touched) {
                <mat-error>Display name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email">
              @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched) {
                <mat-error>Please enter a valid email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password">
              @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
              @if (registerForm.get('password')?.hasError('minlength') && registerForm.get('password')?.touched) {
                <mat-error>Password must be at least 6 characters</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password">
              @if (registerForm.get('confirmPassword')?.hasError('required') && registerForm.get('confirmPassword')?.touched) {
                <mat-error>Please confirm your password</mat-error>
              }
              @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
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
              [disabled]="loading() || registerForm.invalid"
            >
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Create Account
              }
            </button>
          </form>

          <div class="login-link">
            Already have an account?
            <a routerLink="/login">Log in here</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    /* =============================================
       REGISTER - Mobile-First Responsive Styles
       ============================================= */

    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - var(--foe-navbar-height));
      padding: var(--foe-space-md);
      background: var(--foe-bg-primary);
      font-family: 'Space Mono', monospace;
    }

    .register-card {
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
      margin-top: var(--foe-space-md);
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

    .login-link {
      margin-top: var(--foe-space-lg);
      text-align: center;
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .login-link a {
      color: var(--foe-text-primary);
      text-decoration: none;
      font-weight: 700;
      background: var(--foe-accent-primary);
      padding: 4px 8px;
      border: 2px solid var(--foe-border);
      transition: all 0.1s ease;
    }

    @media (min-width: 768px) {
      .login-link a:hover {
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
export class RegisterComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  registerForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');

  constructor() {
    this.registerForm = this.fb.group({
      displayName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
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
    if (this.registerForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password, displayName } = this.registerForm.value;

    try {
      await this.authService.register(email, password, displayName);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Registration failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
