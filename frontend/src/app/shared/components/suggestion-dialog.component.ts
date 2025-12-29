import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { SuggestionService } from '../../core/services/suggestion.service';
import { AuthService } from '../../core/services/auth.service';
import {
  SuggestionCategory,
  CATEGORY_LABELS,
  CATEGORY_PLACEHOLDERS
} from '../../core/models/suggestion.model';

/**
 * Suggestion Dialog Component
 *
 * A Windows 95 styled modal for submitting:
 * - New questionnaire questions
 * - Feature requests
 * - General feedback
 */
@Component({
  selector: 'app-suggestion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <!-- Title Bar -->
      <div class="title-bar">
        <span class="title-text">SUGGESTION BOX</span>
        <button class="close-button" (click)="onCancel()">X</button>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        @if (submitted()) {
          <!-- Success State -->
          <div class="success-message">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h3>THANKS FOR YOUR SUGGESTION!</h3>
            <p>Your {{ categoryLabels[lastCategory()] || 'feedback' }} has been submitted.</p>
            <p class="small">We read every submission and appreciate your input.</p>
            <button mat-raised-button class="action-button" (click)="onCancel()">
              CLOSE
            </button>
          </div>
        } @else {
          <p class="intro-text">
            Have an idea? Help us make FoeFinder better!
          </p>

          <form [formGroup]="suggestionForm" (ngSubmit)="onSubmit()">
            <!-- Category Select -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>What type of suggestion?</mat-label>
              <mat-select formControlName="category">
                @for (cat of categories; track cat) {
                  <mat-option [value]="cat">{{ categoryLabels[cat] }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Title -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ getTitleLabel() }}</mat-label>
              <input
                matInput
                type="text"
                formControlName="title"
                [placeholder]="getPlaceholder().title"
                maxlength="200"
              >
              @if (suggestionForm.get('title')?.hasError('required') && suggestionForm.get('title')?.touched) {
                <mat-error>Please provide a title</mat-error>
              }
              <mat-hint align="end">{{ suggestionForm.get('title')?.value?.length || 0 }}/200</mat-hint>
            </mat-form-field>

            <!-- Description -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Details (optional)</mat-label>
              <textarea
                matInput
                formControlName="description"
                [placeholder]="getPlaceholder().description"
                rows="4"
                maxlength="2000"
              ></textarea>
              <mat-hint align="end">{{ suggestionForm.get('description')?.value?.length || 0 }}/2000</mat-hint>
            </mat-form-field>

            <!-- Contact Email (for non-authenticated users) -->
            @if (!isAuthenticated()) {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Your email (optional)</mat-label>
                <input
                  matInput
                  type="email"
                  formControlName="contact_email"
                  placeholder="In case we have questions"
                >
                @if (suggestionForm.get('contact_email')?.hasError('email')) {
                  <mat-error>Please enter a valid email</mat-error>
                }
              </mat-form-field>
            }

            @if (errorMessage()) {
              <div class="error-message">
                {{ errorMessage() }}
              </div>
            }

            <!-- Actions -->
            <div class="dialog-actions">
              <button
                type="button"
                mat-raised-button
                class="cancel-button"
                (click)="onCancel()"
              >
                CANCEL
              </button>
              <button
                type="submit"
                mat-raised-button
                class="submit-button"
                [disabled]="loading() || suggestionForm.invalid"
              >
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  SUBMIT
                }
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    /* =============================================
       SUGGESTION DIALOG - Windows 95 Style
       ============================================= */

    .dialog-container {
      background: var(--foe-bg-secondary);
      border: 3px solid var(--foe-border);
      box-shadow: 6px 6px 0px var(--foe-border);
      min-width: 300px;
      max-width: 500px;
      font-family: 'Space Mono', monospace;
    }

    /* Title Bar */
    .title-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(90deg, #000080, #1084d0);
      color: white;
      padding: 4px 6px;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 1px;
    }

    .title-text {
      text-shadow: 1px 1px 0px rgba(0,0,0,0.5);
    }

    .close-button {
      background: var(--foe-bg-tertiary);
      border: 2px outset var(--foe-win95-highlight);
      color: var(--foe-text-primary);
      font-size: 10px;
      font-weight: bold;
      padding: 1px 4px;
      cursor: pointer;
      line-height: 1;

      &:hover {
        background: var(--foe-bg-primary);
      }

      &:active {
        border-style: inset;
      }
    }

    /* Content */
    .dialog-content {
      padding: var(--foe-space-md);
    }

    .intro-text {
      font-size: var(--foe-text-sm);
      color: var(--foe-text-secondary);
      text-align: center;
      margin-bottom: var(--foe-space-md);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: var(--foe-space-sm);
    }

    /* Actions */
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--foe-space-sm);
      margin-top: var(--foe-space-md);
      padding-top: var(--foe-space-md);
      border-top: 2px solid var(--foe-border);
    }

    .cancel-button, .submit-button, .action-button {
      min-width: 100px;
      height: 36px;
      font-size: var(--foe-text-sm);
      font-weight: 700;
      letter-spacing: 1px;
      border: 2px solid var(--foe-border) !important;
      border-radius: 0 !important;
      box-shadow: 3px 3px 0px var(--foe-border) !important;
      transition: all 0.1s ease;
    }

    .cancel-button {
      background: var(--foe-bg-tertiary) !important;
      color: var(--foe-text-primary) !important;
    }

    .submit-button, .action-button {
      background: var(--foe-accent-primary) !important;
      color: var(--foe-text-primary) !important;
    }

    .cancel-button:hover, .submit-button:hover:not([disabled]), .action-button:hover {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0px var(--foe-border) !important;
    }

    .submit-button[disabled] {
      opacity: 0.5;
      background: var(--foe-bg-tertiary) !important;
    }

    /* Error Message */
    .error-message {
      color: var(--foe-error);
      font-size: var(--foe-text-xs);
      margin: var(--foe-space-sm) 0;
      text-align: center;
      padding: var(--foe-space-sm);
      background: var(--foe-error-bg);
      border: 2px solid var(--foe-error);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Success State */
    .success-message {
      text-align: center;
      padding: var(--foe-space-lg) var(--foe-space-md);
    }

    .success-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #00aa00;
      margin-bottom: var(--foe-space-md);
    }

    .success-message h3 {
      font-family: 'Inter', sans-serif;
      font-weight: 900;
      font-size: var(--foe-text-lg);
      margin-bottom: var(--foe-space-sm);
      text-shadow: 2px 2px 0px var(--foe-bg-tertiary);
    }

    .success-message p {
      margin: var(--foe-space-xs) 0;
      font-size: var(--foe-text-sm);
    }

    .success-message .small {
      color: var(--foe-text-secondary);
      font-size: var(--foe-text-xs);
    }

    .success-message .action-button {
      margin-top: var(--foe-space-md);
    }

    mat-spinner {
      display: inline-block;
    }
  `]
})
export class SuggestionDialogComponent {
  private dialogRef = inject(MatDialogRef<SuggestionDialogComponent>);
  private suggestionService = inject(SuggestionService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // State
  loading = signal(false);
  errorMessage = signal('');
  submitted = signal(false);
  lastCategory = signal<SuggestionCategory>('feedback');

  // Category config
  categories: SuggestionCategory[] = ['question', 'feature', 'feedback'];
  categoryLabels = CATEGORY_LABELS;
  private categoryPlaceholders = CATEGORY_PLACEHOLDERS;

  // Form
  suggestionForm: FormGroup = this.fb.group({
    category: ['feedback', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(2000)],
    contact_email: ['', Validators.email]
  });

  isAuthenticated(): boolean {
    return !!this.authService.currentUser();
  }

  getTitleLabel(): string {
    const category = this.suggestionForm.get('category')?.value as SuggestionCategory;
    switch (category) {
      case 'question': return 'Your question/statement idea';
      case 'feature': return 'Feature name or summary';
      default: return 'Summary';
    }
  }

  getPlaceholder(): { title: string; description: string } {
    const category = this.suggestionForm.get('category')?.value as SuggestionCategory;
    return this.categoryPlaceholders[category] || this.categoryPlaceholders.feedback;
  }

  async onSubmit(): Promise<void> {
    if (this.suggestionForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const formValue = this.suggestionForm.value;
      await this.suggestionService.submitSuggestion({
        category: formValue.category,
        title: formValue.title,
        description: formValue.description || undefined,
        contact_email: formValue.contact_email || undefined
      });

      this.lastCategory.set(formValue.category);
      this.submitted.set(true);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to submit. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(this.submitted());
  }
}
