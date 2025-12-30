import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../core/services/admin.service';
import { QuestionnaireService } from '../../core/services/questionnaire.service';
import { QuestionStats, ResponseDistribution } from '../../core/models/admin.model';
import { Question } from '../../core/models/questionnaire.model';

@Component({
  selector: 'app-analytics-tab',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="analytics-container">
      <!-- Summary Stats -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-value">{{ totalResponses() }}</div>
          <div class="card-label">Total Responses</div>
        </div>
        <div class="summary-card">
          <div class="card-value">{{ questions().length }}</div>
          <div class="card-label">Questions</div>
        </div>
        <div class="summary-card">
          <div class="card-value">{{ highVarianceCount() }}</div>
          <div class="card-label">High Variance</div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Loading statistics...</span>
        </div>
      }

      <!-- Questions List -->
      @if (!loading()) {
        <div class="questions-section">
          <h2 class="section-title">Question Statistics</h2>

          @for (question of questions(); track question.id; let i = $index) {
            <div
              class="question-row"
              [class.selected]="selectedQuestionId() === question.id"
              [class.high-variance]="isHighVariance(question.id)"
              (click)="selectQuestion(question.id)"
            >
              <div class="question-info">
                <span class="question-num">Q{{ question.id }}</span>
                <span class="question-text">{{ question.text }}</span>
              </div>

              @if (getStats(question.id); as stats) {
                <div class="question-stats">
                  <div class="stat">
                    <span class="stat-value">{{ stats.response_count }}</span>
                    <span class="stat-label">Responses</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{ stats.mean_value | number:'1.1-1' }}</span>
                    <span class="stat-label">Mean</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{ stats.std_dev | number:'1.2-2' }}</span>
                    <span class="stat-label">Std Dev</span>
                  </div>
                </div>
              } @else {
                <div class="question-stats no-data">
                  <span>No data</span>
                </div>
              }
            </div>

            <!-- Distribution Chart (when selected) -->
            @if (selectedQuestionId() === question.id && distribution().length > 0) {
              <div class="distribution-panel">
                <h3>Response Distribution</h3>
                <div class="chart-container">
                  @for (item of distribution(); track item.value) {
                    <div class="bar-group">
                      <div class="bar-wrapper">
                        <div
                          class="bar"
                          [style.height.%]="item.percentage"
                          [attr.data-value]="item.value"
                        ></div>
                      </div>
                      <div class="bar-label">{{ item.value }}</div>
                      <div class="bar-count">{{ item.count }}</div>
                      <div class="bar-pct">{{ item.percentage }}%</div>
                    </div>
                  }
                </div>
                <div class="scale-labels">
                  <span>{{ question.scaleMinLabel }}</span>
                  <span>{{ question.scaleMaxLabel }}</span>
                </div>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .analytics-container {
      font-family: 'Space Mono', monospace;
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--foe-space-md);
      margin-bottom: var(--foe-space-lg);
    }

    .summary-card {
      background: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
      padding: var(--foe-space-md);
      text-align: center;
    }

    .card-value {
      font-size: 28px;
      font-weight: 900;
      color: var(--foe-accent-primary);
      font-family: 'Inter', sans-serif;
    }

    .card-label {
      font-size: var(--foe-text-xs);
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--foe-text-secondary);
      margin-top: var(--foe-space-xs);
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--foe-space-md);
      padding: var(--foe-space-xl);
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-xs);
    }

    /* Section */
    .section-title {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-lg);
      font-weight: 900;
      text-transform: uppercase;
      margin: 0 0 var(--foe-space-md) 0;
      padding-bottom: var(--foe-space-sm);
      border-bottom: 2px solid var(--foe-border);
    }

    /* Question Rows */
    .question-row {
      display: flex;
      flex-direction: column;
      gap: var(--foe-space-sm);
      padding: var(--foe-space-md);
      background: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
      margin-bottom: var(--foe-space-sm);
      cursor: pointer;
      transition: all 0.1s ease;
    }

    @media (min-width: 768px) {
      .question-row {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .question-row:hover {
      background: var(--foe-bg-secondary);
    }

    .question-row.selected {
      border-color: var(--foe-accent-primary);
      box-shadow: 3px 3px 0px var(--foe-border);
    }

    .question-row.high-variance {
      border-left: 4px solid var(--foe-accent-primary);
    }

    .question-info {
      display: flex;
      gap: var(--foe-space-sm);
      align-items: flex-start;
      flex: 1;
    }

    .question-num {
      background: var(--foe-accent-primary);
      padding: 2px 6px;
      font-size: var(--foe-text-xs);
      font-weight: 700;
      white-space: nowrap;
    }

    .question-text {
      font-size: var(--foe-text-sm);
      line-height: 1.4;
    }

    .question-stats {
      display: flex;
      gap: var(--foe-space-md);
      flex-shrink: 0;
    }

    .question-stats.no-data {
      color: var(--foe-text-secondary);
      font-style: italic;
      font-size: var(--foe-text-xs);
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;
    }

    .stat-value {
      font-weight: 700;
      font-size: var(--foe-text-md);
    }

    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--foe-text-secondary);
    }

    /* Distribution Panel */
    .distribution-panel {
      background: var(--foe-bg-secondary);
      border: 2px solid var(--foe-border);
      border-top: none;
      padding: var(--foe-space-md);
      margin-top: -2px;
      margin-bottom: var(--foe-space-sm);
    }

    .distribution-panel h3 {
      font-size: var(--foe-text-sm);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 var(--foe-space-md) 0;
      color: var(--foe-text-secondary);
    }

    .chart-container {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 150px;
      padding: var(--foe-space-sm);
      background: var(--foe-bg-tertiary);
      border: 1px solid var(--foe-border);
    }

    .bar-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      max-width: 60px;
    }

    .bar-wrapper {
      height: 100px;
      width: 30px;
      display: flex;
      align-items: flex-end;
    }

    .bar {
      width: 100%;
      min-height: 2px;
      background: var(--foe-accent-primary);
      border: 1px solid var(--foe-border);
      transition: height 0.3s ease;
    }

    .bar[data-value="1"],
    .bar[data-value="2"] {
      background: #ffaaa5;
    }
    .bar[data-value="3"] {
      background: #ffd3b6;
    }
    .bar[data-value="4"] {
      background: #e8e8e8;
    }
    .bar[data-value="5"] {
      background: #dcedc1;
    }
    .bar[data-value="6"],
    .bar[data-value="7"] {
      background: #a8e6cf;
    }

    .bar-label {
      font-weight: 700;
      font-size: var(--foe-text-sm);
      margin-top: var(--foe-space-xs);
    }

    .bar-count {
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
    }

    .bar-pct {
      font-size: 10px;
      color: var(--foe-text-secondary);
    }

    .scale-labels {
      display: flex;
      justify-content: space-between;
      margin-top: var(--foe-space-sm);
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      text-transform: uppercase;
    }
  `]
})
export class AnalyticsTabComponent implements OnInit {
  private adminService = inject(AdminService);
  private questionnaireService = inject(QuestionnaireService);

  stats = signal<QuestionStats[]>([]);
  questions = signal<Question[]>([]);
  distribution = signal<ResponseDistribution[]>([]);
  loading = signal(true);
  selectedQuestionId = signal<number | null>(null);

  // Computed values
  totalResponses = computed(() => {
    const allStats = this.stats();
    return allStats.length > 0 ? allStats[0].response_count : 0;
  });

  highVarianceCount = computed(() => {
    return this.stats().filter(s => s.std_dev > 1.8).length;
  });

  ngOnInit() {
    this.questions.set(this.questionnaireService.getQuestions());
    this.loadStats();
  }

  async loadStats() {
    this.loading.set(true);
    try {
      const data = await this.adminService.getQuestionStatistics();
      this.stats.set(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getStats(questionId: number): QuestionStats | undefined {
    return this.stats().find(s => s.question_id === questionId);
  }

  isHighVariance(questionId: number): boolean {
    const s = this.getStats(questionId);
    return s ? s.std_dev > 1.8 : false;
  }

  async selectQuestion(questionId: number) {
    if (this.selectedQuestionId() === questionId) {
      this.selectedQuestionId.set(null);
      this.distribution.set([]);
      return;
    }

    this.selectedQuestionId.set(questionId);
    try {
      const data = await this.adminService.getResponseDistribution(questionId);
      this.distribution.set(data);
    } catch (error) {
      console.error('Failed to load distribution:', error);
      this.distribution.set([]);
    }
  }
}
