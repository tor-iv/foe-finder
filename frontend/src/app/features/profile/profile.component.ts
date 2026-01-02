import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { ShareButtonComponent } from '../../shared/components/share-button.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, ShareButtonComponent],
  template: `
    <div class="profile-container">
      <mat-card class="profile-card">
        <mat-card-header>
          <mat-card-title>Your Profile</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          @if (authService.currentUser(); as user) {
            <div class="profile-info">
              <div class="info-row">
                <strong>Name:</strong>
                <span>{{ user.displayName }}</span>
              </div>
              <div class="info-row">
                <strong>Email:</strong>
                <span>{{ user.email }}</span>
              </div>
              <div class="info-row">
                <strong>Questionnaire:</strong>
                <span class="status" [class.completed]="user.hasCompletedQuestionnaire">
                  {{ user.hasCompletedQuestionnaire ? 'Completed' : 'Not Completed' }}
                </span>
              </div>
              <div class="info-row">
                <strong>Match Status:</strong>
                <span class="status" [class.matched]="user.isMatched">
                  {{ user.isMatched ? 'Matched!' : 'Waiting for match' }}
                </span>
              </div>
            </div>

            @if (!user.hasCompletedQuestionnaire) {
              <div class="alert">
                <p>You haven't completed the questionnaire yet.</p>
                <button mat-raised-button color="primary" routerLink="/questionnaire">
                  Complete Questionnaire
                </button>
              </div>
            }

            @if (user.hasCompletedQuestionnaire && !user.isMatched) {
              <div class="info-message">
                <p>We're working on finding your opposite match. Check back soon!</p>
              </div>
            }

            <!-- Invite Friends Section -->
            <div class="invite-section">
              <p class="invite-text">Know someone who needs their echo chamber popped?</p>
              <app-share-button></app-share-button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    /* =============================================
       PROFILE - Mobile-First Responsive Styles
       ============================================= */

    .profile-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100dvh - var(--foe-navbar-height));
      padding: var(--foe-space-md);
      background: var(--foe-bg-primary);
      font-family: 'Space Mono', monospace;
    }

    .profile-card {
      max-width: var(--foe-container-md);
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
      text-transform: uppercase;
      text-shadow: 2px 2px 0px var(--foe-bg-tertiary);
      letter-spacing: -1px;
    }

    @media (min-width: 768px) {
      mat-card-title {
        font-size: 28px;
        text-shadow: 3px 3px 0px var(--foe-bg-tertiary);
      }
    }

    .profile-info {
      margin: var(--foe-space-md) 0;
    }

    /* Info rows - stack on mobile, side-by-side on larger screens */
    .info-row {
      display: flex;
      flex-direction: column;
      gap: var(--foe-space-xs);
      padding: var(--foe-space-sm);
      border-bottom: 2px solid var(--foe-border);
      background: var(--foe-bg-tertiary);
      margin-bottom: var(--foe-space-sm);
    }

    @media (min-width: 480px) {
      .info-row {
        flex-direction: row;
        justify-content: space-between;
        padding: var(--foe-space-md);
      }
    }

    .info-row strong {
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      font-size: var(--foe-text-xs);
      letter-spacing: 1px;
    }

    .info-row span {
      color: var(--foe-text-primary);
      font-weight: 700;
      font-size: var(--foe-text-sm);
    }

    .status.completed,
    .status.matched {
      color: var(--foe-text-primary) !important;
      background: var(--foe-accent-primary);
      padding: 4px 8px;
      font-weight: 700;
      display: inline-block;
    }

    .alert {
      background-color: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
      border-left: 4px solid var(--foe-accent-primary);
      padding: var(--foe-space-md);
      margin-top: var(--foe-space-md);
      text-align: center;
    }

    @media (min-width: 768px) {
      .alert {
        border-width: 3px;
        border-left-width: 6px;
        padding: var(--foe-space-lg);
      }
    }

    .alert p {
      margin-bottom: var(--foe-space-md);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
    }

    .alert button {
      background: var(--foe-accent-primary) !important;
      color: var(--foe-text-primary) !important;
      border: 2px solid var(--foe-border) !important;
      border-radius: 0 !important;
      box-shadow: var(--foe-shadow-responsive) !important;
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      min-height: 48px;
      width: 100%;
    }

    @media (min-width: 480px) {
      .alert button {
        width: auto;
        letter-spacing: 2px;
        border-width: 3px !important;
      }

      .alert button:hover {
        transform: translate(2px, 2px);
        box-shadow: 1px 1px 0px var(--foe-border) !important;
        background: var(--foe-accent-light) !important;
      }
    }

    .info-message {
      background-color: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
      padding: var(--foe-space-md);
      margin-top: var(--foe-space-md);
      text-align: center;
    }

    @media (min-width: 768px) {
      .info-message {
        border-width: 3px;
        padding: var(--foe-space-lg);
      }
    }

    .info-message p {
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    /* Invite Friends Section */
    .invite-section {
      margin-top: var(--foe-space-lg);
      padding-top: var(--foe-space-lg);
      border-top: 3px solid var(--foe-border);
      text-align: center;
    }

    .invite-text {
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      margin-bottom: var(--foe-space-md);
    }
  `]
})
export class ProfileComponent {
  authService = inject(AuthService);
}
