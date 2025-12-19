import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { QuestionnaireService } from '../../core/services/questionnaire.service';
import { CountdownTimerComponent } from '../../shared/components/countdown-timer.component';

/**
 * Hot Take type - represents a user's extreme opinion
 */
interface HotTake {
  question: string;
  value: number;
  stance: 'strongly_agree' | 'agree' | 'disagree' | 'strongly_disagree';
}

/**
 * ResultsComponent - Displays the user's "hot takes" after completing the questionnaire
 *
 * Shows their most extreme opinions and a playful message about finding their foe.
 */
@Component({
  selector: 'app-results',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    CountdownTimerComponent
  ],
  template: `
    <div class="results-container">
      <app-countdown-timer class="countdown-section"></app-countdown-timer>
      @if (hotTakes().length > 0) {
        <mat-card class="results-card">
          <mat-card-header>
            <mat-card-title class="hot-takes-title">
              Your Hot Takes
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <div class="hot-takes-list">
              @for (take of hotTakes(); track take.question) {
                <div class="hot-take-item">
                  <p class="take-question">"{{ take.question }}"</p>
                  <span class="take-stance" [class]="take.stance">
                    {{ getStanceLabel(take.stance) }}
                  </span>
                </div>
              }
            </div>

            <!-- Foe hunting message -->
            <div class="foe-hunting-box">
              <div class="foe-icon">🔍</div>
              <div class="foe-message">
                <p class="foe-title">Now we're hunting for your nemesis</p>
                <p class="foe-subtitle">Someone who thinks you're completely wrong about everything.</p>
                <p class="foe-eta">You'll hear from us soon.</p>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button (click)="retakeQuiz()">
              Retake Quiz
            </button>
          </mat-card-actions>
        </mat-card>
      } @else {
        <mat-card class="no-results-card">
          <mat-card-content>
            <h2>No Results Found</h2>
            <p>It looks like you haven't completed the quiz yet.</p>
            <button mat-raised-button color="primary" (click)="goToQuestionnaire()">
              Take the Quiz
            </button>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    /* =============================================
       RESULTS - Mobile-First Responsive Styles
       ============================================= */

    .results-container {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      gap: var(--foe-space-md);
      min-height: calc(100vh - var(--foe-navbar-height));
      padding: var(--foe-space-md);
      background: var(--foe-bg-primary);
      font-family: 'Space Mono', monospace;
    }

    .countdown-section {
      width: 100%;
      max-width: var(--foe-container-md);
    }

    .results-card, .no-results-card {
      max-width: var(--foe-container-md);
      width: 100%;
      background: var(--foe-bg-secondary) !important;
      border: var(--foe-border-width-responsive) solid var(--foe-border) !important;
      border-radius: 0 !important;
      box-shadow: var(--foe-shadow-responsive) !important;
    }

    mat-card-header {
      display: flex;
      justify-content: center;
      margin-bottom: var(--foe-space-md);
      border-bottom: 3px solid var(--foe-border);
      padding-bottom: var(--foe-space-md);
    }

    .hot-takes-title {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-xl);
      font-weight: 900;
      text-align: center;
      color: var(--foe-text-primary);
      text-shadow: 2px 2px 0px var(--foe-bg-tertiary);
      text-transform: uppercase;
      letter-spacing: -1px;
    }

    @media (min-width: 768px) {
      .hot-takes-title {
        font-size: var(--foe-text-3xl);
        text-shadow: 3px 3px 0px var(--foe-bg-tertiary);
      }
    }

    .hot-takes-list {
      display: flex;
      flex-direction: column;
      gap: var(--foe-space-sm);
      margin-bottom: var(--foe-space-lg);
    }

    @media (min-width: 768px) {
      .hot-takes-list {
        gap: var(--foe-space-md);
      }
    }

    .hot-take-item {
      background: var(--foe-bg-tertiary);
      padding: var(--foe-space-sm);
      border: 2px solid var(--foe-border);
      border-left: 4px solid var(--foe-accent-primary);
    }

    @media (min-width: 768px) {
      .hot-take-item {
        padding: var(--foe-space-md);
        border-width: 3px;
        border-left-width: 6px;
      }
    }

    .take-question {
      font-size: var(--foe-text-sm);
      font-weight: 700;
      color: var(--foe-text-primary);
      margin: 0 0 var(--foe-space-sm) 0;
      font-style: normal;
      line-height: 1.4;
    }

    @media (min-width: 768px) {
      .take-question {
        font-size: var(--foe-text-base);
      }
    }

    .take-stance {
      display: inline-block;
      padding: 4px 8px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 2px solid var(--foe-border);
    }

    @media (min-width: 768px) {
      .take-stance {
        padding: 6px 12px;
        font-size: var(--foe-text-xs);
        letter-spacing: 1px;
      }
    }

    /* Neon green tints for stance badges */
    .take-stance.strongly_agree {
      background: var(--foe-accent-primary);
      color: var(--foe-text-primary);
    }

    .take-stance.agree {
      background: var(--foe-bg-secondary);
      color: var(--foe-text-primary);
    }

    .take-stance.strongly_disagree {
      background: var(--foe-text-primary);
      color: var(--foe-bg-secondary);
    }

    .take-stance.disagree {
      background: var(--foe-bg-tertiary);
      color: var(--foe-text-primary);
    }

    /* Foe hunting box - stacked on mobile */
    .foe-hunting-box {
      display: flex;
      flex-direction: column;
      text-align: center;
      gap: var(--foe-space-sm);
      padding: var(--foe-space-md);
      background: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
      border-left: 4px solid var(--foe-accent-primary);
      margin-top: var(--foe-space-lg);
    }

    @media (min-width: 480px) {
      .foe-hunting-box {
        flex-direction: row;
        text-align: left;
        gap: var(--foe-space-md);
        padding: var(--foe-space-lg);
        border-width: 3px;
        border-left-width: 6px;
      }
    }

    .foe-icon {
      font-size: 32px;
      flex-shrink: 0;
    }

    @media (min-width: 768px) {
      .foe-icon {
        font-size: 40px;
      }
    }

    .foe-message {
      flex: 1;
    }

    .foe-title {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-base);
      font-weight: 900;
      color: var(--foe-text-primary);
      margin: 0 0 var(--foe-space-xs) 0;
      text-transform: uppercase;
    }

    @media (min-width: 768px) {
      .foe-title {
        font-size: var(--foe-text-lg);
        margin: 0 0 var(--foe-space-sm) 0;
      }
    }

    .foe-subtitle {
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      margin: 0 0 var(--foe-space-sm) 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.4;
    }

    @media (min-width: 768px) {
      .foe-subtitle {
        letter-spacing: 1px;
      }
    }

    .foe-eta {
      font-size: var(--foe-text-xs);
      color: var(--foe-text-primary);
      background: var(--foe-accent-primary);
      padding: 4px 8px;
      display: inline-block;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0;
    }

    mat-card-actions {
      display: flex;
      justify-content: center;
      padding: var(--foe-space-md);
      border-top: 3px solid var(--foe-border);
    }

    mat-card-actions button {
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      border: 2px solid var(--foe-border) !important;
      border-radius: 0 !important;
      background: var(--foe-bg-tertiary) !important;
      color: var(--foe-text-primary) !important;
      min-height: 48px;
    }

    @media (min-width: 768px) {
      mat-card-actions button {
        letter-spacing: 2px;
      }

      mat-card-actions button:hover {
        background: var(--foe-accent-primary) !important;
      }
    }

    .no-results-card {
      text-align: center;
      padding: var(--foe-space-xl) var(--foe-space-md);
    }

    .no-results-card h2 {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-xl);
      font-weight: 900;
      color: var(--foe-text-primary);
      margin-bottom: var(--foe-space-md);
      text-transform: uppercase;
      text-shadow: 2px 2px 0px var(--foe-bg-tertiary);
    }

    @media (min-width: 768px) {
      .no-results-card h2 {
        font-size: var(--foe-text-2xl);
        text-shadow: 3px 3px 0px var(--foe-bg-tertiary);
      }
    }

    .no-results-card p {
      color: var(--foe-text-secondary);
      margin-bottom: var(--foe-space-lg);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-xs);
      line-height: 1.5;
    }

    .no-results-card button {
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
      .no-results-card button {
        width: auto;
        letter-spacing: 2px;
        border-width: 3px !important;
      }

      .no-results-card button:hover {
        transform: translate(2px, 2px);
        box-shadow: 1px 1px 0px var(--foe-border) !important;
        background: var(--foe-accent-light) !important;
      }
    }
  `]
})
export class ResultsComponent implements OnInit {
  private questionnaireService = inject(QuestionnaireService);
  private router = inject(Router);

  // Signal to hold the user's hot takes
  hotTakes = signal<HotTake[]>([]);

  ngOnInit(): void {
    // Get the user's most extreme opinions
    const takes = this.questionnaireService.getHotTakes(3);
    this.hotTakes.set(takes);
  }

  /**
   * Convert stance enum to human-readable label
   */
  getStanceLabel(stance: string): string {
    const labels: Record<string, string> = {
      'strongly_agree': 'You strongly agree',
      'agree': 'You agree',
      'disagree': 'You disagree',
      'strongly_disagree': 'You strongly disagree'
    };
    return labels[stance] || stance;
  }

  /**
   * Navigate to questionnaire to retake the quiz
   */
  retakeQuiz(): void {
    localStorage.removeItem('foe_finder_neighborhood');
    localStorage.removeItem('foe_finder_responses');
    this.router.navigate(['/questionnaire']);
  }

  /**
   * Navigate to questionnaire (for users who haven't taken it)
   */
  goToQuestionnaire(): void {
    this.router.navigate(['/questionnaire']);
  }
}
