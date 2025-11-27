import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule],
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
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      padding: 20px;
      background: var(--foe-bg-primary);
      font-family: 'Space Mono', monospace;
    }

    .profile-card {
      max-width: 600px;
      width: 100%;
      background: var(--foe-bg-secondary) !important;
      border: var(--foe-border-width) solid var(--foe-border) !important;
      border-radius: 0 !important;
      box-shadow: var(--foe-shadow) !important;
    }

    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 3px solid var(--foe-border);
      padding-bottom: 16px;
    }

    mat-card-title {
      font-family: 'Inter', sans-serif;
      font-size: 28px;
      font-weight: 900;
      text-transform: uppercase;
      text-shadow: 3px 3px 0px var(--foe-bg-tertiary);
      letter-spacing: -1px;
    }

    .profile-info {
      margin: 20px 0;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 2px solid var(--foe-border);
      background: var(--foe-bg-tertiary);
      margin-bottom: 8px;
    }

    .info-row strong {
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
    }

    .info-row span {
      color: var(--foe-text-primary);
      font-weight: 700;
    }

    .status.completed,
    .status.matched {
      color: var(--foe-text-primary) !important;
      background: var(--foe-accent-primary);
      padding: 4px 8px;
      font-weight: 700;
    }

    .alert {
      background-color: var(--foe-bg-tertiary);
      border: 3px solid var(--foe-border);
      border-left: 6px solid var(--foe-accent-primary);
      padding: 20px;
      margin-top: 20px;
      text-align: center;
    }

    .alert p {
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 12px;
      color: var(--foe-text-secondary);
    }

    .alert button {
      background: var(--foe-accent-primary) !important;
      color: var(--foe-text-primary) !important;
      border: 3px solid var(--foe-border) !important;
      border-radius: 0 !important;
      box-shadow: var(--foe-shadow-sm) !important;
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 700;

      &:hover {
        transform: translate(2px, 2px);
        box-shadow: 1px 1px 0px var(--foe-border) !important;
        background: var(--foe-accent-light) !important;
      }
    }

    .info-message {
      background-color: var(--foe-bg-tertiary);
      border: 3px solid var(--foe-border);
      padding: 20px;
      margin-top: 20px;
      text-align: center;
    }

    .info-message p {
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 12px;
      color: var(--foe-text-secondary);
      margin: 0;
    }
  `]
})
export class ProfileComponent {
  authService = inject(AuthService);
}
