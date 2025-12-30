import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../core/services/admin.service';
import { SuggestionWithUser } from '../../core/models/admin.model';
import {
  SuggestionStatus,
  SuggestionCategory,
  CATEGORY_LABELS
} from '../../core/models/suggestion.model';

@Component({
  selector: 'app-suggestions-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="suggestions-container">
      <!-- Filters -->
      <div class="filters-row">
        <div class="filter-group">
          <label>Status:</label>
          <select [(ngModel)]="selectedStatus" (change)="loadSuggestions()">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Category:</label>
          <select [(ngModel)]="selectedCategory" (change)="loadSuggestions()">
            <option value="all">All</option>
            <option value="question">Questions</option>
            <option value="feature">Features</option>
            <option value="feedback">Feedback</option>
          </select>
        </div>

        <div class="count-badge">
          {{ suggestions().length }} results
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Loading suggestions...</span>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && suggestions().length === 0) {
        <div class="empty-state">
          <p>No suggestions found matching your filters.</p>
        </div>
      }

      <!-- Suggestions List -->
      @if (!loading() && suggestions().length > 0) {
        <div class="suggestions-list">
          @for (suggestion of suggestions(); track suggestion.id) {
            <div class="suggestion-card" [class.expanded]="expandedId === suggestion.id">
              <div class="suggestion-header" (click)="toggleExpand(suggestion.id)">
                <div class="suggestion-meta">
                  <span class="category-badge" [attr.data-category]="suggestion.category">
                    {{ getCategoryLabel(suggestion.category) }}
                  </span>
                  <span class="status-badge" [attr.data-status]="suggestion.status">
                    {{ suggestion.status }}
                  </span>
                </div>
                <h3 class="suggestion-title">{{ suggestion.title }}</h3>
                <div class="suggestion-info">
                  <span class="submitter">
                    {{ suggestion.user_display_name || suggestion.contact_email || 'Anonymous' }}
                  </span>
                  <span class="date">{{ formatDate(suggestion.created_at) }}</span>
                </div>
              </div>

              @if (expandedId === suggestion.id) {
                <div class="suggestion-details">
                  @if (suggestion.description) {
                    <div class="description-section">
                      <label>Description:</label>
                      <p>{{ suggestion.description }}</p>
                    </div>
                  }

                  @if (suggestion.admin_notes) {
                    <div class="notes-section">
                      <label>Admin Notes:</label>
                      <p>{{ suggestion.admin_notes }}</p>
                    </div>
                  }

                  <div class="actions-section">
                    <div class="notes-input">
                      <label>Add/Update Notes:</label>
                      <textarea
                        [(ngModel)]="adminNotes"
                        placeholder="Optional admin notes..."
                        rows="2"
                      ></textarea>
                    </div>

                    <div class="action-buttons">
                      @if (suggestion.status !== 'accepted') {
                        <button
                          class="action-btn accept"
                          (click)="updateStatus(suggestion.id, 'accepted')"
                          [disabled]="updating()"
                        >
                          Accept
                        </button>
                      }
                      @if (suggestion.status !== 'rejected') {
                        <button
                          class="action-btn reject"
                          (click)="updateStatus(suggestion.id, 'rejected')"
                          [disabled]="updating()"
                        >
                          Reject
                        </button>
                      }
                      @if (suggestion.status === 'pending') {
                        <button
                          class="action-btn review"
                          (click)="updateStatus(suggestion.id, 'reviewed')"
                          [disabled]="updating()"
                        >
                          Mark Reviewed
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .suggestions-container {
      font-family: 'Space Mono', monospace;
    }

    /* Filters */
    .filters-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--foe-space-md);
      margin-bottom: var(--foe-space-lg);
      padding: var(--foe-space-md);
      background: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
      align-items: center;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: var(--foe-space-sm);
    }

    .filter-group label {
      text-transform: uppercase;
      font-size: var(--foe-text-xs);
      letter-spacing: 1px;
      color: var(--foe-text-secondary);
    }

    .filter-group select {
      padding: 8px 12px;
      font-family: 'Space Mono', monospace;
      font-size: var(--foe-text-sm);
      border: 2px solid var(--foe-border);
      background: var(--foe-bg-secondary);
      color: var(--foe-text-primary);
      cursor: pointer;
    }

    .count-badge {
      margin-left: auto;
      padding: 4px 12px;
      background: var(--foe-accent-primary);
      border: 2px solid var(--foe-border);
      font-weight: 700;
      font-size: var(--foe-text-xs);
      text-transform: uppercase;
    }

    /* Loading/Empty States */
    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--foe-space-md);
      padding: var(--foe-space-xl);
      text-align: center;
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-xs);
    }

    /* Suggestions List */
    .suggestions-list {
      display: flex;
      flex-direction: column;
      gap: var(--foe-space-md);
    }

    .suggestion-card {
      background: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
      transition: box-shadow 0.1s ease;
    }

    .suggestion-card.expanded {
      box-shadow: 4px 4px 0px var(--foe-border);
    }

    .suggestion-header {
      padding: var(--foe-space-md);
      cursor: pointer;
    }

    .suggestion-header:hover {
      background: var(--foe-bg-secondary);
    }

    .suggestion-meta {
      display: flex;
      gap: var(--foe-space-sm);
      margin-bottom: var(--foe-space-sm);
    }

    .category-badge,
    .status-badge {
      padding: 2px 8px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      border: 1px solid var(--foe-border);
    }

    .category-badge[data-category="question"] {
      background: #a8e6cf;
    }
    .category-badge[data-category="feature"] {
      background: #88d8f5;
    }
    .category-badge[data-category="feedback"] {
      background: #ffd3b6;
    }

    .status-badge[data-status="pending"] {
      background: var(--foe-accent-primary);
    }
    .status-badge[data-status="reviewed"] {
      background: #88d8f5;
    }
    .status-badge[data-status="accepted"] {
      background: #a8e6cf;
    }
    .status-badge[data-status="rejected"] {
      background: #ffaaa5;
    }

    .suggestion-title {
      margin: 0 0 var(--foe-space-sm) 0;
      font-size: var(--foe-text-md);
      font-weight: 700;
      color: var(--foe-text-primary);
    }

    .suggestion-info {
      display: flex;
      justify-content: space-between;
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
    }

    .submitter {
      font-style: italic;
    }

    /* Expanded Details */
    .suggestion-details {
      padding: var(--foe-space-md);
      border-top: 2px solid var(--foe-border);
      background: var(--foe-bg-secondary);
    }

    .description-section,
    .notes-section {
      margin-bottom: var(--foe-space-md);
    }

    .description-section label,
    .notes-section label,
    .notes-input label {
      display: block;
      text-transform: uppercase;
      font-size: var(--foe-text-xs);
      letter-spacing: 1px;
      color: var(--foe-text-secondary);
      margin-bottom: var(--foe-space-xs);
    }

    .description-section p,
    .notes-section p {
      margin: 0;
      padding: var(--foe-space-sm);
      background: var(--foe-bg-tertiary);
      border: 1px solid var(--foe-border);
      white-space: pre-wrap;
    }

    .notes-section p {
      background: var(--foe-accent-primary);
      font-style: italic;
    }

    .actions-section {
      margin-top: var(--foe-space-md);
    }

    .notes-input textarea {
      width: 100%;
      padding: var(--foe-space-sm);
      font-family: 'Space Mono', monospace;
      font-size: var(--foe-text-sm);
      border: 2px solid var(--foe-border);
      background: var(--foe-bg-tertiary);
      color: var(--foe-text-primary);
      resize: vertical;
      box-sizing: border-box;
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--foe-space-sm);
      margin-top: var(--foe-space-md);
    }

    .action-btn {
      padding: 8px 16px;
      font-family: 'Space Mono', monospace;
      font-size: var(--foe-text-xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: 2px solid var(--foe-border);
      cursor: pointer;
      transition: all 0.1s ease;
    }

    .action-btn:hover:not(:disabled) {
      transform: translate(1px, 1px);
      box-shadow: none;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-btn.accept {
      background: #a8e6cf;
      box-shadow: 2px 2px 0px var(--foe-border);
    }

    .action-btn.reject {
      background: #ffaaa5;
      box-shadow: 2px 2px 0px var(--foe-border);
    }

    .action-btn.review {
      background: #88d8f5;
      box-shadow: 2px 2px 0px var(--foe-border);
    }
  `]
})
export class SuggestionsTabComponent implements OnInit {
  private adminService = inject(AdminService);

  suggestions = signal<SuggestionWithUser[]>([]);
  loading = signal(true);
  updating = signal(false);

  selectedStatus: SuggestionStatus | 'all' = 'pending';
  selectedCategory: SuggestionCategory | 'all' = 'all';
  expandedId: string | null = null;
  adminNotes = '';

  ngOnInit() {
    this.loadSuggestions();
  }

  async loadSuggestions() {
    this.loading.set(true);
    try {
      const data = await this.adminService.getAllSuggestions({
        status: this.selectedStatus === 'all' ? undefined : this.selectedStatus,
        category: this.selectedCategory === 'all' ? undefined : this.selectedCategory
      });
      this.suggestions.set(data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      this.loading.set(false);
    }
  }

  toggleExpand(id: string) {
    if (this.expandedId === id) {
      this.expandedId = null;
      this.adminNotes = '';
    } else {
      this.expandedId = id;
      const suggestion = this.suggestions().find(s => s.id === id);
      this.adminNotes = suggestion?.admin_notes || '';
    }
  }

  async updateStatus(id: string, status: SuggestionStatus) {
    this.updating.set(true);
    try {
      await this.adminService.updateSuggestionStatus(id, status, this.adminNotes || undefined);
      await this.loadSuggestions();
      this.expandedId = null;
      this.adminNotes = '';
    } catch (error) {
      console.error('Failed to update suggestion:', error);
    } finally {
      this.updating.set(false);
    }
  }

  getCategoryLabel(category: SuggestionCategory): string {
    return CATEGORY_LABELS[category];
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
