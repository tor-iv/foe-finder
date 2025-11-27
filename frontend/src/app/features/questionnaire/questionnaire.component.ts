import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QuestionnaireService } from '../../core/services/questionnaire.service';
import { Question } from '../../core/models/questionnaire.model';
import { Answer } from '../../core/models/response.model';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    MatSliderModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="questionnaire-container">
      <mat-card class="questionnaire-card">
        <mat-card-header>
          <mat-card-title>Find Your Opposite Match</mat-card-title>
          <mat-card-subtitle>
            Answer these questions honestly. We'll match you with someone who sees things differently.
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
            <div class="progress-container">
              <div class="progress-text">
                Question {{ currentQuestionIndex() + 1 }} of {{ questions.length }}
              </div>
              <mat-progress-bar
                mode="determinate"
                [value]="progress()"
              ></mat-progress-bar>
            </div>

            @if (currentQuestion()) {
              <div class="question-container">
                <h2 class="question-text">{{ currentQuestion()!.text }}</h2>

                <div class="slider-container">
                  <div class="scale-labels">
                    <span class="scale-label">{{ currentQuestion()!.scaleMinLabel }}</span>
                    <span class="scale-label">{{ currentQuestion()!.scaleMaxLabel }}</span>
                  </div>

                  <mat-slider min="0" max="100" class="opinion-slider">
                    <input matSliderThumb
                           [value]="getSliderValue()"
                           (input)="onSliderChange($event)">
                  </mat-slider>

                </div>

                <div class="navigation-buttons">
                  <button
                    mat-button
                    (click)="previousQuestion()"
                    [disabled]="currentQuestionIndex() === 0"
                  >
                    Previous
                  </button>

                  @if (currentQuestionIndex() < questions.length - 1) {
                    <button
                      mat-raised-button
                      color="primary"
                      (click)="nextQuestion()"
                      [disabled]="answers()[currentQuestion()!.id] === undefined"
                    >
                      Next
                    </button>
                  } @else {
                    <button
                      mat-raised-button
                      color="accent"
                      (click)="submitQuestionnaire()"
                      [disabled]="!isComplete() || submitting()"
                    >
                      @if (submitting()) {
                        <mat-spinner diameter="20"></mat-spinner>
                      } @else {
                        Submit
                      }
                    </button>
                  }
                </div>
              </div>
            }

          @if (errorMessage()) {
            <div class="error-message">
              {{ errorMessage() }}
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    /* =============================================
       QUESTIONNAIRE - Mobile-First Responsive Styles
       ============================================= */

    .questionnaire-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: calc(100vh - var(--foe-navbar-height));
      padding: var(--foe-space-sm);
      background: var(--foe-bg-primary);
      font-family: 'Space Mono', monospace;
    }

    @media (min-width: 768px) {
      .questionnaire-container {
        align-items: center;
        padding: var(--foe-space-lg);
      }
    }

    .questionnaire-card {
      max-width: 100%;
      width: 100%;
      background: var(--foe-bg-secondary) !important;
      border: var(--foe-border-width-responsive) solid var(--foe-border) !important;
      border-radius: 0 !important;
      box-shadow: var(--foe-shadow-responsive) !important;
    }

    @media (min-width: 768px) {
      .questionnaire-card {
        max-width: var(--foe-container-lg);
      }
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
      color: var(--foe-text-primary);
      text-shadow: 2px 2px 0px var(--foe-bg-tertiary);
      text-transform: uppercase;
      letter-spacing: -1px;
      text-align: center;
    }

    @media (min-width: 768px) {
      mat-card-title {
        font-size: var(--foe-text-3xl);
        text-shadow: 3px 3px 0px var(--foe-bg-tertiary);
      }
    }

    mat-card-subtitle {
      text-align: center;
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary) !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.5;
    }

    @media (min-width: 768px) {
      mat-card-subtitle {
        letter-spacing: 1px;
      }
    }

    .progress-container {
      margin-bottom: var(--foe-space-lg);
      background: var(--foe-bg-tertiary);
      padding: var(--foe-space-sm);
      border: 2px solid var(--foe-border);
    }

    @media (min-width: 768px) {
      .progress-container {
        padding: var(--foe-space-md);
        border-width: 3px;
      }
    }

    .progress-text {
      margin-bottom: var(--foe-space-sm);
      font-weight: 700;
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-sm);
    }

    @media (min-width: 768px) {
      .progress-text {
        letter-spacing: 2px;
        font-size: var(--foe-text-base);
      }
    }

    ::ng-deep .mat-mdc-progress-bar {
      height: 10px !important;
      border: 2px solid var(--foe-border);
      border-radius: 0 !important;

      .mdc-linear-progress__bar-inner {
        border-color: var(--foe-accent-primary) !important;
      }

      .mdc-linear-progress__buffer-bar {
        background-color: var(--foe-bg-secondary) !important;
      }
    }

    @media (min-width: 768px) {
      ::ng-deep .mat-mdc-progress-bar {
        height: 12px !important;
      }
    }

    .question-container {
      padding: var(--foe-space-sm) 0;
    }

    @media (min-width: 768px) {
      .question-container {
        padding: var(--foe-space-lg) 0;
      }
    }

    .question-text {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-lg);
      font-weight: 700;
      margin-bottom: var(--foe-space-lg);
      text-align: center;
      color: var(--foe-text-primary);
      line-height: 1.4;
    }

    @media (min-width: 768px) {
      .question-text {
        font-size: var(--foe-text-2xl);
      }
    }

    .slider-container {
      margin: var(--foe-space-lg) 0;
      padding: var(--foe-space-md);
      background: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
    }

    @media (min-width: 768px) {
      .slider-container {
        margin: var(--foe-space-xl) 0;
        padding: var(--foe-space-lg);
        border-width: 3px;
      }
    }

    .scale-labels {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--foe-space-md);
      font-size: 9px;
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      gap: var(--foe-space-sm);
    }

    @media (min-width: 768px) {
      .scale-labels {
        font-size: var(--foe-text-sm);
        letter-spacing: 1px;
      }
    }

    .scale-label {
      font-weight: 700;
      background: var(--foe-bg-secondary);
      padding: 4px 6px;
      border: 2px solid var(--foe-border);
      text-align: center;
      max-width: 45%;
    }

    @media (min-width: 768px) {
      .scale-label {
        padding: 6px 12px;
        max-width: none;
      }
    }

    .opinion-slider {
      width: 100%;
    }

    /* Slider thumb - larger for touch on mobile */
    ::ng-deep .mat-mdc-slider {
      .mdc-slider__track {
        height: 10px !important;
        border: 2px solid var(--foe-border) !important;
        border-radius: 0 !important;
      }

      .mdc-slider__track--active_fill {
        background-color: var(--foe-accent-primary) !important;
        border-color: var(--foe-accent-primary) !important;
      }

      .mdc-slider__track--inactive {
        background-color: var(--foe-bg-secondary) !important;
      }

      .mdc-slider__thumb-knob {
        width: 32px !important;
        height: 32px !important;
        border-radius: 0 !important;
        background-color: var(--foe-accent-primary) !important;
        border: 2px solid var(--foe-border) !important;
        box-shadow: 2px 2px 0px var(--foe-border) !important;
      }
    }

    @media (min-width: 768px) {
      ::ng-deep .mat-mdc-slider {
        .mdc-slider__track {
          height: 12px !important;
        }

        .mdc-slider__thumb-knob {
          width: 24px !important;
          height: 24px !important;
          border-width: 3px !important;
          box-shadow: 3px 3px 0px var(--foe-border) !important;
        }
      }
    }

    /* Navigation buttons - stack on mobile */
    .navigation-buttons {
      display: flex;
      flex-direction: column;
      margin-top: var(--foe-space-lg);
      gap: var(--foe-space-sm);
    }

    @media (min-width: 480px) {
      .navigation-buttons {
        flex-direction: row;
        justify-content: space-between;
        gap: var(--foe-space-md);
      }
    }

    .navigation-buttons button {
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      border-radius: 0 !important;
      min-height: 48px;
      width: 100%;
    }

    @media (min-width: 480px) {
      .navigation-buttons button {
        width: auto;
        letter-spacing: 2px;
      }
    }

    .navigation-buttons button[mat-button] {
      border: 2px solid var(--foe-border);
      background: var(--foe-bg-tertiary);
      color: var(--foe-text-primary);
      order: 2;
    }

    @media (min-width: 480px) {
      .navigation-buttons button[mat-button] {
        order: 0;
      }

      .navigation-buttons button[mat-button]:hover:not([disabled]) {
        background: var(--foe-bg-secondary);
      }
    }

    .navigation-buttons button[mat-button][disabled] {
      opacity: 0.4;
    }

    .navigation-buttons button[mat-raised-button] {
      background: var(--foe-accent-primary) !important;
      color: var(--foe-text-primary) !important;
      border: 2px solid var(--foe-border) !important;
      box-shadow: var(--foe-shadow-responsive) !important;
      padding: 8px 16px;
      order: 1;
    }

    @media (min-width: 480px) {
      .navigation-buttons button[mat-raised-button] {
        order: 0;
        border-width: 3px !important;
        padding: 8px 24px;
      }

      .navigation-buttons button[mat-raised-button]:hover:not([disabled]) {
        background: var(--foe-accent-light) !important;
        transform: translate(2px, 2px);
        box-shadow: 1px 1px 0px var(--foe-border) !important;
      }
    }

    .navigation-buttons button[mat-raised-button][disabled] {
      opacity: 0.4;
      background: var(--foe-bg-tertiary) !important;
    }

    .success-message {
      text-align: center;
      padding: var(--foe-space-xl) var(--foe-space-md);
    }

    .success-message h2 {
      color: var(--foe-accent-primary);
      margin-bottom: var(--foe-space-md);
      font-family: 'Inter', sans-serif;
      font-weight: 900;
    }

    .success-message p {
      font-size: var(--foe-text-base);
      margin-bottom: var(--foe-space-lg);
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .error-message {
      color: var(--foe-error);
      text-align: center;
      margin-top: var(--foe-space-md);
      padding: var(--foe-space-sm);
      background: var(--foe-error-bg);
      border: 2px solid var(--foe-error);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-xs);
    }

    @media (min-width: 768px) {
      .error-message {
        padding: 12px;
        border-width: 3px;
      }
    }

    mat-spinner {
      margin: 0 auto;
    }
  `]
})
export class QuestionnaireComponent implements OnInit {
  private questionnaireService = inject(QuestionnaireService);
  private router = inject(Router);

  questions: Question[] = [];

  currentQuestionIndex = signal(0);
  answers = signal<Record<number, number>>({});
  submitting = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    this.questions = this.questionnaireService.getQuestions();
  }

  currentQuestion = () => {
    return this.questions[this.currentQuestionIndex()];
  };

  progress = () => {
    return ((this.currentQuestionIndex() + 1) / this.questions.length) * 100;
  };

  onSliderChange(event: Event) {
    const value = +(event.target as HTMLInputElement).value;
    const currentAnswers = { ...this.answers() };
    currentAnswers[this.currentQuestion().id] = value;
    this.answers.set(currentAnswers);
  }

  // Returns the current slider value (0-100), defaults to 50 (center)
  getSliderValue(): number {
    const questionId = this.currentQuestion()?.id;
    if (questionId === undefined) return 50;
    return this.answers()[questionId] ?? 50;
  }

  // Convert 0-100 slider scale to 1-7 backend scale
  private convertToBackendScale(value: number): number {
    // 0 → 1, 50 → 4, 100 → 7
    return Math.round((value / 100) * 6) + 1;
  }

  nextQuestion() {
    if (this.currentQuestionIndex() < this.questions.length - 1) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
    }
  }

  isComplete(): boolean {
    return this.questions.every(q => this.answers()[q.id] !== undefined);
  }

  async submitQuestionnaire() {
    if (!this.isComplete()) {
      this.errorMessage.set('Please answer all questions before submitting.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    try {
      // Convert answers to array format (0-100 slider scale → 1-7 backend scale)
      const answerArray: Answer[] = this.questions.map(q => ({
        questionId: q.id,
        value: this.convertToBackendScale(this.answers()[q.id])
      }));

      // Submit and get neighborhood result
      await this.questionnaireService.submitResponse(answerArray);

      // Navigate to results page to show the neighborhood match
      await this.router.navigate(['/results']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to submit questionnaire. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
