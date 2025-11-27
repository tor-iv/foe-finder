import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { QuestionnaireService } from '../../core/services/questionnaire.service';

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
    MatIconModule
  ],
  template: `
    <div class="results-container">
      @if (hotTakes().length > 0) {
        <mat-card class="results-card">
          <mat-card-header>
            <mat-card-title class="hot-takes-title">
              🎯 Your Hot Takes
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
    .results-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      padding: 20px;
      background: var(--foe-bg-primary);
    }

    .results-card, .no-results-card {
      max-width: 600px;
      width: 100%;
      background: var(--foe-bg-secondary) !important;
      border: 1px solid var(--foe-border);
    }

    mat-card-header {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .hot-takes-title {
      font-size: 28px;
      font-weight: 600;
      text-align: center;
      color: var(--foe-text-primary);
    }

    .hot-takes-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .hot-take-item {
      background: var(--foe-bg-tertiary);
      border-radius: 12px;
      padding: 16px;
      border-left: 4px solid var(--foe-accent-primary);
    }

    .take-question {
      font-size: 16px;
      font-weight: 500;
      color: var(--foe-text-primary);
      margin: 0 0 8px 0;
      font-style: italic;
    }

    .take-stance {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Purple tints for stance badges - lighter = agree, darker = disagree */
    .take-stance.strongly_agree {
      background: rgba(107, 33, 168, 0.15);
      color: var(--foe-accent-light);
    }

    .take-stance.agree {
      background: rgba(107, 33, 168, 0.1);
      color: var(--foe-text-secondary);
    }

    .take-stance.strongly_disagree {
      background: var(--foe-accent-primary);
      color: var(--foe-text-primary);
    }

    .take-stance.disagree {
      background: rgba(107, 33, 168, 0.3);
      color: var(--foe-text-primary);
    }

    .foe-hunting-box {
      display: flex;
      gap: 16px;
      padding: 24px;
      background: rgba(107, 33, 168, 0.1);
      border-radius: 12px;
      border: 1px solid rgba(107, 33, 168, 0.3);
      margin-top: 24px;
    }

    .foe-icon {
      font-size: 40px;
      flex-shrink: 0;
    }

    .foe-message {
      flex: 1;
    }

    .foe-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--foe-text-primary);
      margin: 0 0 8px 0;
    }

    .foe-subtitle {
      font-size: 14px;
      color: var(--foe-text-secondary);
      margin: 0 0 12px 0;
    }

    .foe-eta {
      font-size: 14px;
      color: var(--foe-accent-light);
      font-weight: 500;
      margin: 0;
    }

    mat-card-actions {
      display: flex;
      justify-content: center;
      padding: 16px;
    }

    .no-results-card {
      text-align: center;
      padding: 40px 20px;
    }

    .no-results-card h2 {
      color: var(--foe-text-primary);
      margin-bottom: 16px;
    }

    .no-results-card p {
      color: var(--foe-text-secondary);
      margin-bottom: 24px;
    }

    @media (max-width: 600px) {
      .hot-takes-title {
        font-size: 22px;
      }

      .foe-hunting-box {
        flex-direction: column;
        text-align: center;
      }

      .foe-icon {
        font-size: 32px;
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
