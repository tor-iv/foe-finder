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
    .questionnaire-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      padding: 20px;
      background: var(--foe-bg-primary);
      font-family: 'Space Mono', monospace;
    }

    .questionnaire-card {
      max-width: 800px;
      width: 100%;
      background: var(--foe-bg-secondary) !important;
      border: var(--foe-border-width) solid var(--foe-border) !important;
      border-radius: 0 !important;
      box-shadow: var(--foe-shadow-lg) !important;
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
      font-size: 32px;
      font-weight: 900;
      margin-bottom: 8px;
      color: var(--foe-text-primary);
      text-shadow: 3px 3px 0px var(--foe-bg-tertiary);
      text-transform: uppercase;
      letter-spacing: -1px;
    }

    mat-card-subtitle {
      text-align: center;
      font-size: 12px;
      color: var(--foe-text-secondary) !important;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .progress-container {
      margin-bottom: 30px;
      background: var(--foe-bg-tertiary);
      padding: 16px;
      border: 3px solid var(--foe-border);
    }

    .progress-text {
      margin-bottom: 12px;
      font-weight: 700;
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 14px;
    }

    ::ng-deep .mat-mdc-progress-bar {
      height: 12px !important;
      border: 2px solid var(--foe-border);
      border-radius: 0 !important;

      .mdc-linear-progress__bar-inner {
        border-color: var(--foe-accent-primary) !important;
      }

      .mdc-linear-progress__buffer-bar {
        background-color: var(--foe-bg-secondary) !important;
      }
    }

    .question-container {
      padding: 20px 0;
    }

    .question-text {
      font-family: 'Inter', sans-serif;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 30px;
      text-align: center;
      color: var(--foe-text-primary);
      line-height: 1.4;
    }

    .slider-container {
      margin: 40px 0;
      padding: 20px;
      background: var(--foe-bg-tertiary);
      border: 3px solid var(--foe-border);
    }

    .scale-labels {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 12px;
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .scale-label {
      font-weight: 700;
      background: var(--foe-bg-secondary);
      padding: 6px 12px;
      border: 2px solid var(--foe-border);
    }

    .opinion-slider {
      width: 100%;
    }

    ::ng-deep .mat-mdc-slider {
      .mdc-slider__track {
        height: 12px !important;
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
        width: 24px !important;
        height: 24px !important;
        border-radius: 0 !important;
        background-color: var(--foe-accent-primary) !important;
        border: 3px solid var(--foe-border) !important;
        box-shadow: 3px 3px 0px var(--foe-border) !important;
      }
    }

    .navigation-buttons {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      gap: 16px;
    }

    .navigation-buttons button {
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 700;
      border-radius: 0 !important;
    }

    .navigation-buttons button[mat-button] {
      border: 2px solid var(--foe-border);
      background: var(--foe-bg-tertiary);
      color: var(--foe-text-primary);

      &:hover:not([disabled]) {
        background: var(--foe-bg-secondary);
      }

      &[disabled] {
        opacity: 0.4;
      }
    }

    .navigation-buttons button[mat-raised-button] {
      background: var(--foe-accent-primary) !important;
      color: var(--foe-text-primary) !important;
      border: 3px solid var(--foe-border) !important;
      box-shadow: var(--foe-shadow-sm) !important;
      padding: 8px 24px;

      &:hover:not([disabled]) {
        background: var(--foe-accent-light) !important;
        transform: translate(2px, 2px);
        box-shadow: 1px 1px 0px var(--foe-border) !important;
      }

      &[disabled] {
        opacity: 0.4;
        background: var(--foe-bg-tertiary) !important;
      }
    }

    .success-message {
      text-align: center;
      padding: 40px 20px;
    }

    .success-message h2 {
      color: var(--foe-accent-primary);
      margin-bottom: 16px;
      font-family: 'Inter', sans-serif;
      font-weight: 900;
    }

    .success-message p {
      font-size: 14px;
      margin-bottom: 24px;
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .error-message {
      color: var(--foe-error);
      text-align: center;
      margin-top: 20px;
      padding: 12px;
      background: var(--foe-error-bg);
      border: 3px solid var(--foe-error);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 12px;
    }

    mat-spinner {
      margin: 0 auto;
    }

    @media (max-width: 600px) {
      .question-text {
        font-size: 18px;
      }

      .scale-labels {
        font-size: 10px;
      }

      .scale-label {
        padding: 4px 8px;
      }
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
