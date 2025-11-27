import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
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
    MatRadioModule,
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

                <div class="scale-container">
                  <div class="scale-labels">
                    <span class="scale-label">{{ currentQuestion()!.scaleMinLabel }}</span>
                    <span class="scale-label">{{ currentQuestion()!.scaleMaxLabel }}</span>
                  </div>

                  <div class="scale-options">
                    @for (option of scaleOptions; track option) {
                      <button
                        mat-raised-button
                        class="scale-button"
                        [class.selected]="answers()[currentQuestion()!.id] === option"
                        (click)="selectAnswer(option)"
                      >
                        {{ option }}
                      </button>
                    }
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .questionnaire-card {
      max-width: 800px;
      width: 100%;
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
    }

    mat-card-subtitle {
      text-align: center;
      font-size: 16px;
    }

    .progress-container {
      margin-bottom: 30px;
    }

    .progress-text {
      margin-bottom: 8px;
      font-weight: 500;
      color: #666;
    }

    .question-container {
      padding: 20px 0;
    }

    .question-text {
      font-size: 22px;
      font-weight: 500;
      margin-bottom: 30px;
      text-align: center;
      color: #333;
    }

    .scale-container {
      margin: 40px 0;
    }

    .scale-labels {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 14px;
      color: #666;
    }

    .scale-label {
      font-weight: 500;
    }

    .scale-options {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .scale-button {
      flex: 1;
      min-width: 50px;
      height: 50px;
      font-size: 18px;
      font-weight: 500;
    }

    .scale-button.selected {
      background-color: #667eea;
      color: white;
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
      color: #4caf50;
      margin-bottom: 16px;
    }

    .success-message p {
      font-size: 16px;
      margin-bottom: 24px;
    }

    .error-message {
      color: #f44336;
      text-align: center;
      margin-top: 20px;
      padding: 12px;
      background-color: #ffebee;
      border-radius: 4px;
    }

    mat-spinner {
      margin: 0 auto;
    }

    @media (max-width: 600px) {
      .scale-options {
        flex-wrap: wrap;
      }

      .scale-button {
        min-width: 40px;
        height: 40px;
        font-size: 16px;
      }
    }
  `]
})
export class QuestionnaireComponent implements OnInit {
  private questionnaireService = inject(QuestionnaireService);
  private router = inject(Router);

  questions: Question[] = [];
  scaleOptions = [1, 2, 3, 4, 5, 6, 7];

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
