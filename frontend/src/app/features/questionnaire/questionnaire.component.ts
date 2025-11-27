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

                  <mat-slider min="1" max="7" step="1" discrete showTickMarks class="opinion-slider">
                    <input matSliderThumb
                           [value]="answers()[currentQuestion()!.id] || 4"
                           (valueChange)="selectAnswer($event)">
                  </mat-slider>

                  <div class="slider-value">
                    {{ answers()[currentQuestion()!.id] || 4 }}
                  </div>
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
                      [disabled]="!answers()[currentQuestion()!.id]"
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
    }

    .questionnaire-card {
      max-width: 800px;
      width: 100%;
      background: var(--foe-bg-secondary) !important;
      border: 1px solid var(--foe-border);
    }

    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
    }

    mat-card-title {
      font-size: 28px;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--foe-text-primary);
    }

    mat-card-subtitle {
      text-align: center;
      font-size: 16px;
      color: var(--foe-text-secondary) !important;
    }

    .progress-container {
      margin-bottom: 30px;
    }

    .progress-text {
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--foe-text-muted);
    }

    .question-container {
      padding: 20px 0;
    }

    .question-text {
      font-size: 22px;
      font-weight: 500;
      margin-bottom: 30px;
      text-align: center;
      color: var(--foe-text-primary);
    }

    .slider-container {
      margin: 40px 0;
      padding: 0 10px;
    }

    .scale-labels {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      font-size: 14px;
      color: var(--foe-text-secondary);
    }

    .scale-label {
      font-weight: 500;
    }

    .opinion-slider {
      width: 100%;
    }

    .slider-value {
      text-align: center;
      margin-top: 20px;
      font-size: 32px;
      font-weight: bold;
      color: var(--foe-accent-primary);
    }

    .navigation-buttons {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }

    .success-message {
      text-align: center;
      padding: 40px 20px;
    }

    .success-message h2 {
      color: var(--foe-accent-primary);
      margin-bottom: 16px;
    }

    .success-message p {
      font-size: 16px;
      margin-bottom: 24px;
      color: var(--foe-text-secondary);
    }

    .error-message {
      color: var(--foe-error);
      text-align: center;
      margin-top: 20px;
      padding: 12px;
      background-color: rgba(220, 38, 38, 0.1);
      border-radius: 4px;
      border-left: 3px solid var(--foe-error);
    }

    mat-spinner {
      margin: 0 auto;
    }

    @media (max-width: 600px) {
      .slider-value {
        font-size: 28px;
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

  selectAnswer(value: number) {
    const currentAnswers = { ...this.answers() };
    currentAnswers[this.currentQuestion().id] = value;
    this.answers.set(currentAnswers);
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
      // Convert answers to array format
      const answerArray: Answer[] = this.questions.map(q => ({
        questionId: q.id,
        value: this.answers()[q.id]
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
