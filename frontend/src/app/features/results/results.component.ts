import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { QuestionnaireService, NYCNeighborhood } from '../../core/services/questionnaire.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * ResultsComponent - Displays the user's NYC neighborhood personality match
 *
 * This component shows the result of the questionnaire - which NYC neighborhood
 * best matches the user's personality based on their quiz answers.
 *
 * The page displays:
 * - The matched neighborhood name
 * - A description of why they match this neighborhood
 * - Personality traits associated with the neighborhood
 * - The "vibe" of the neighborhood
 *
 * Key Angular concepts used:
 * - signal(): Reactive state management (modern Angular approach)
 * - inject(): Dependency injection without constructor
 * - OnInit lifecycle hook: Run code when component initializes
 * - Standalone component: No NgModule required
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
      @if (neighborhood()) {
        <mat-card class="results-card">
          <mat-card-header>
            <mat-card-title class="neighborhood-title">
              You're a {{ neighborhood()!.name }} Person!
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <div class="neighborhood-content">
              <!-- Description -->
              <p class="description">{{ neighborhood()!.description }}</p>

              <!-- Traits -->
              <div class="traits-section">
                <h3>Your Personality Traits</h3>
                <mat-chip-set>
                  @for (trait of neighborhood()!.traits; track trait) {
                    <mat-chip highlighted>{{ trait }}</mat-chip>
                  }
                </mat-chip-set>
              </div>

              <!-- Vibe -->
              <div class="vibe-section">
                <h3>Your Vibe</h3>
                <p class="vibe-text">{{ neighborhood()!.vibe }}</p>
              </div>

              <!-- Fun fact about matching -->
              <div class="matching-info">
                <mat-icon>people</mat-icon>
                <p>
                  Now we'll find your <strong>Foe</strong> - someone from a completely
                  different neighborhood with opposite views!
                </p>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="goToProfile()">
              View Profile
            </button>
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .results-card, .no-results-card {
      max-width: 600px;
      width: 100%;
    }

    mat-card-header {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .neighborhood-title {
      font-size: 28px;
      font-weight: 600;
      color: #667eea;
      text-align: center;
    }

    .neighborhood-content {
      padding: 20px 0;
    }

    .description {
      font-size: 18px;
      line-height: 1.6;
      color: #333;
      margin-bottom: 30px;
      text-align: center;
    }

    .traits-section {
      margin-bottom: 30px;
    }

    .traits-section h3,
    .vibe-section h3 {
      font-size: 16px;
      font-weight: 500;
      color: #666;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    mat-chip-set {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    mat-chip {
      background-color: #667eea !important;
      color: white !important;
    }

    .vibe-section {
      margin-bottom: 30px;
      text-align: center;
    }

    .vibe-text {
      font-size: 16px;
      font-style: italic;
      color: #555;
    }

    .matching-info {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 8px;
      margin-top: 20px;
    }

    .matching-info mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #764ba2;
    }

    .matching-info p {
      margin: 0;
      font-size: 14px;
      color: #555;
    }

    .matching-info strong {
      color: #764ba2;
    }

    mat-card-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      padding: 16px;
    }

    .no-results-card {
      text-align: center;
      padding: 40px 20px;
    }

    .no-results-card h2 {
      color: #333;
      margin-bottom: 16px;
    }

    .no-results-card p {
      color: #666;
      margin-bottom: 24px;
    }

    @media (max-width: 600px) {
      .neighborhood-title {
        font-size: 22px;
      }

      .description {
        font-size: 16px;
      }

      .matching-info {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class ResultsComponent implements OnInit {
  // inject() is a modern way to do dependency injection in Angular
  // It replaces the traditional constructor injection pattern
  private questionnaireService = inject(QuestionnaireService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // signal() creates reactive state - when it changes, the template updates
  // This is the modern Angular approach (Angular 16+)
  neighborhood = signal<NYCNeighborhood | null>(null);

  /**
   * ngOnInit lifecycle hook
   *
   * This runs once when the component is initialized, after the constructor.
   * It's the standard place to:
   * - Fetch data from services
   * - Set up subscriptions
   * - Initialize component state
   */
  ngOnInit(): void {
    // Get the stored neighborhood result from the questionnaire service
    const storedNeighborhood = this.questionnaireService.getStoredNeighborhood();
    this.neighborhood.set(storedNeighborhood);
  }

  /**
   * Navigate to the user profile page
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Navigate to questionnaire to retake the quiz
   * First clear the stored results
   */
  retakeQuiz(): void {
    // Clear stored neighborhood
    localStorage.removeItem('foe_finder_neighborhood');
    localStorage.removeItem('foe_finder_responses');

    // Navigate to questionnaire
    this.router.navigate(['/questionnaire']);
  }

  /**
   * Navigate to questionnaire (for users who haven't taken it)
   */
  goToQuestionnaire(): void {
    this.router.navigate(['/questionnaire']);
  }
}
