import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../core/services/admin.service';
import { AdminUserView, UserStats } from '../../core/models/admin.model';

@Component({
  selector: 'app-users-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  template: `
    <div class="users-container">
      <!-- Stats Cards -->
      @if (userStats()) {
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-value">{{ userStats()!.total }}</div>
            <div class="stat-label">Total Users</div>
          </div>
          <div class="stat-card completed">
            <div class="stat-value">{{ userStats()!.completed }}</div>
            <div class="stat-label">Completed Quiz</div>
          </div>
          <div class="stat-card matched">
            <div class="stat-value">{{ userStats()!.matched }}</div>
            <div class="stat-label">Matched</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ completionRate() }}%</div>
            <div class="stat-label">Completion Rate</div>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="filters-row">
        <div class="filter-group">
          <label>Status:</label>
          <select [(ngModel)]="filterCompleted" (change)="loadUsers()">
            <option [ngValue]="null">All Users</option>
            <option [ngValue]="true">Completed Quiz</option>
            <option [ngValue]="false">Not Completed</option>
          </select>
        </div>

        <div class="pagination-info">
          Showing {{ users().length }} of {{ userStats()?.total || 0 }}
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Loading users...</span>
        </div>
      }

      <!-- Users Table -->
      @if (!loading()) {
        <div class="users-table-wrapper">
          <table class="users-table">
            <thead>
              <tr>
                <th>Display Name</th>
                <th>Quiz</th>
                <th>Audio</th>
                <th>Match</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr [class.is-admin]="user.is_admin">
                  <td class="name-cell">
                    <span class="user-name">{{ user.display_name || 'Anonymous' }}</span>
                    @if (user.is_admin) {
                      <span class="admin-badge">ADMIN</span>
                    }
                  </td>
                  <td>
                    <span class="status-icon" [class.yes]="user.has_completed_questionnaire">
                      {{ user.has_completed_questionnaire ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td>
                    <span class="status-icon" [class.yes]="user.has_audio_intro">
                      {{ user.has_audio_intro ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td>
                    <span class="status-icon" [class.yes]="user.match_id">
                      {{ user.match_id ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td class="date-cell">
                    {{ formatDate(user.created_at) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-controls">
          <button
            class="page-btn"
            [disabled]="page() === 0"
            (click)="prevPage()"
          >
            Previous
          </button>
          <span class="page-info">Page {{ page() + 1 }}</span>
          <button
            class="page-btn"
            [disabled]="users().length < pageSize"
            (click)="nextPage()"
          >
            Next
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .users-container {
      font-family: 'Space Mono', monospace;
    }

    /* Stats Cards */
    .stats-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--foe-space-md);
      margin-bottom: var(--foe-space-lg);
    }

    @media (min-width: 768px) {
      .stats-cards {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .stat-card {
      background: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
      padding: var(--foe-space-md);
      text-align: center;
    }

    .stat-card.completed {
      border-left: 4px solid #a8e6cf;
    }

    .stat-card.matched {
      border-left: 4px solid var(--foe-accent-primary);
    }

    .stat-value {
      font-size: 28px;
      font-weight: 900;
      font-family: 'Inter', sans-serif;
      color: var(--foe-text-primary);
    }

    .stat-label {
      font-size: var(--foe-text-xs);
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--foe-text-secondary);
      margin-top: var(--foe-space-xs);
    }

    /* Filters */
    .filters-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--foe-space-md);
      margin-bottom: var(--foe-space-md);
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

    .pagination-info {
      margin-left: auto;
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
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

    /* Users Table */
    .users-table-wrapper {
      overflow-x: auto;
      border: 2px solid var(--foe-border);
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--foe-text-sm);
    }

    .users-table th,
    .users-table td {
      padding: var(--foe-space-sm) var(--foe-space-md);
      text-align: left;
      border-bottom: 1px solid var(--foe-border);
    }

    .users-table th {
      background: var(--foe-bg-tertiary);
      font-weight: 700;
      text-transform: uppercase;
      font-size: var(--foe-text-xs);
      letter-spacing: 1px;
      color: var(--foe-text-secondary);
      white-space: nowrap;
    }

    .users-table tbody tr {
      background: var(--foe-bg-secondary);
    }

    .users-table tbody tr:nth-child(even) {
      background: var(--foe-bg-tertiary);
    }

    .users-table tbody tr:hover {
      background: var(--foe-accent-primary);
    }

    .users-table tbody tr.is-admin {
      background: linear-gradient(90deg, rgba(255,213,79,0.2) 0%, transparent 50%);
    }

    .name-cell {
      display: flex;
      align-items: center;
      gap: var(--foe-space-sm);
    }

    .user-name {
      font-weight: 700;
    }

    .admin-badge {
      padding: 1px 6px;
      background: var(--foe-accent-primary);
      border: 1px solid var(--foe-border);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .status-icon {
      padding: 2px 8px;
      font-size: var(--foe-text-xs);
      font-weight: 700;
      text-transform: uppercase;
    }

    .status-icon.yes {
      color: #2e7d32;
    }

    .date-cell {
      white-space: nowrap;
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
    }

    /* Pagination */
    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: var(--foe-space-md);
      margin-top: var(--foe-space-md);
      padding: var(--foe-space-md);
    }

    .page-btn {
      padding: 8px 16px;
      font-family: 'Space Mono', monospace;
      font-size: var(--foe-text-xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: 2px solid var(--foe-border);
      background: var(--foe-bg-tertiary);
      cursor: pointer;
      transition: all 0.1s ease;
    }

    .page-btn:hover:not(:disabled) {
      background: var(--foe-accent-primary);
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: var(--foe-text-xs);
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--foe-text-secondary);
    }
  `]
})
export class UsersTabComponent implements OnInit {
  private adminService = inject(AdminService);

  users = signal<AdminUserView[]>([]);
  userStats = signal<UserStats | null>(null);
  loading = signal(true);
  page = signal(0);
  pageSize = 20;
  filterCompleted: boolean | null = null;

  ngOnInit() {
    this.loadUserStats();
    this.loadUsers();
  }

  async loadUserStats() {
    try {
      const stats = await this.adminService.getUserStats();
      this.userStats.set(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  }

  async loadUsers() {
    this.loading.set(true);
    try {
      const data = await this.adminService.getAllUsers({
        limit: this.pageSize,
        offset: this.page() * this.pageSize,
        hasCompleted: this.filterCompleted
      });
      this.users.set(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      this.loading.set(false);
    }
  }

  completionRate(): number {
    const stats = this.userStats();
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  prevPage() {
    if (this.page() > 0) {
      this.page.set(this.page() - 1);
      this.loadUsers();
    }
  }

  nextPage() {
    if (this.users().length >= this.pageSize) {
      this.page.set(this.page() + 1);
      this.loadUsers();
    }
  }
}
