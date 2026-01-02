import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../core/services/supabase.service';

/**
 * AuthCallbackComponent - Handles Supabase email link authentication
 *
 * When users click an email link (verification, password reset, magic link),
 * Supabase redirects them here with tokens in the URL hash.
 * This component:
 * 1. Extracts tokens from the URL
 * 2. Exchanges them for a session
 * 3. Redirects to the appropriate page
 */
@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="callback-container">
      <mat-card class="callback-card">
        @if (error()) {
          <div class="error-state">
            <h2>Authentication Error</h2>
            <p>{{ error() }}</p>
            <a href="/login">Return to Login</a>
          </div>
        } @else {
          <div class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
            <p>{{ statusMessage() }}</p>
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100dvh - var(--foe-navbar-height));
      padding: var(--foe-space-md);
      background: var(--foe-bg-primary);
      font-family: 'Space Mono', monospace;
    }

    .callback-card {
      max-width: var(--foe-container-sm);
      width: 100%;
      padding: var(--foe-space-xl);
      background: var(--foe-bg-secondary) !important;
      border: 3px solid var(--foe-border) !important;
      border-radius: 0 !important;
      text-align: center;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--foe-space-md);
    }

    .loading-state p {
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-sm);
    }

    .error-state h2 {
      color: var(--foe-error);
      margin-bottom: var(--foe-space-md);
      text-transform: uppercase;
    }

    .error-state p {
      color: var(--foe-text-secondary);
      margin-bottom: var(--foe-space-lg);
    }

    .error-state a {
      color: var(--foe-accent-primary);
      text-decoration: none;
      text-transform: uppercase;
      font-weight: 700;
      padding: var(--foe-space-sm) var(--foe-space-md);
      border: 2px solid var(--foe-border);
    }

    .error-state a:hover {
      background: var(--foe-accent-primary);
      color: var(--foe-text-primary);
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  error = signal<string | null>(null);
  statusMessage = signal('Verifying your email...');

  async ngOnInit(): Promise<void> {
    await this.handleAuthCallback();
  }

  private async handleAuthCallback(): Promise<void> {
    try {
      // Get the full URL with hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      // Also check for code-based flow (PKCE)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        // PKCE flow - exchange code for session
        this.statusMessage.set('Completing sign in...');
        const { error } = await this.supabaseService.client.auth.exchangeCodeForSession(code);

        if (error) {
          this.error.set(error.message);
          return;
        }
      } else if (accessToken && refreshToken) {
        // Implicit flow - set session directly
        this.statusMessage.set('Setting up your session...');
        const { error } = await this.supabaseService.client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          this.error.set(error.message);
          return;
        }
      } else {
        // No tokens found - might be an error or invalid link
        const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');
        if (errorDescription) {
          this.error.set(errorDescription);
          return;
        }

        // Try to get existing session anyway
        const { data: { session } } = await this.supabaseService.client.auth.getSession();
        if (!session) {
          this.error.set('Invalid or expired link. Please try again.');
          return;
        }
      }

      // Success! Check what type of auth this was
      this.statusMessage.set('Success! Redirecting...');

      // Brief delay so user sees success message
      await new Promise(resolve => setTimeout(resolve, 500));

      // Determine redirect based on auth type
      if (type === 'recovery') {
        // Password reset flow
        await this.router.navigate(['/reset-password']);
      } else {
        // Email verification or sign in - go to questionnaire
        await this.router.navigate(['/questionnaire']);
      }

    } catch (err: any) {
      console.error('Auth callback error:', err);
      this.error.set(err.message || 'An unexpected error occurred');
    }
  }
}
