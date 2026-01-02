import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { SuggestionsTabComponent } from './suggestions-tab.component';
import { AnalyticsTabComponent } from './analytics-tab.component';
import { UsersTabComponent } from './users-tab.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    SuggestionsTabComponent,
    AnalyticsTabComponent,
    UsersTabComponent
  ],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <h1 class="admin-title">
          <span class="title-admin">ADMIN</span>
          <span class="title-dashboard">DASHBOARD</span>
        </h1>
        <p class="admin-subtitle">FoeFinder Management Console</p>
      </div>

      <mat-tab-group class="admin-tabs" animationDuration="0">
        <mat-tab>
          <ng-template mat-tab-label>
            <span class="tab-label">Suggestions</span>
          </ng-template>
          <app-suggestions-tab />
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <span class="tab-label">Analytics</span>
          </ng-template>
          <app-analytics-tab />
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <span class="tab-label">Users</span>
          </ng-template>
          <app-users-tab />
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    /* =============================================
       ADMIN DASHBOARD - Retro/Win95 Themed
       ============================================= */

    .admin-container {
      min-height: calc(100dvh - var(--foe-navbar-height));
      padding: var(--foe-space-md);
      background: var(--foe-bg-primary);
      font-family: 'Space Mono', monospace;
    }

    @media (min-width: 768px) {
      .admin-container {
        padding: var(--foe-space-lg);
      }
    }

    .admin-header {
      text-align: center;
      margin-bottom: var(--foe-space-lg);
      padding-bottom: var(--foe-space-md);
      border-bottom: 3px solid var(--foe-border);
    }

    .admin-title {
      font-family: 'Inter', sans-serif;
      font-size: 24px;
      font-weight: 900;
      margin: 0 0 var(--foe-space-sm) 0;
      display: flex;
      justify-content: center;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
    }

    @media (min-width: 768px) {
      .admin-title {
        font-size: 32px;
      }
    }

    .title-admin {
      color: var(--foe-accent-primary);
      text-shadow: 2px 2px 0px var(--foe-bg-tertiary);
      letter-spacing: -1px;
    }

    .title-dashboard {
      color: var(--foe-text-primary);
      text-shadow: 2px 2px 0px var(--foe-bg-tertiary);
      letter-spacing: -1px;
    }

    .admin-subtitle {
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: var(--foe-text-xs);
      margin: 0;
    }

    /* Tab styling */
    .admin-tabs {
      background: var(--foe-bg-secondary);
      border: 3px solid var(--foe-border);
      box-shadow: 4px 4px 0px var(--foe-border);
    }

    ::ng-deep .admin-tabs .mat-mdc-tab-header {
      background: var(--foe-bg-tertiary);
      border-bottom: 3px solid var(--foe-border);
    }

    ::ng-deep .admin-tabs .mat-mdc-tab {
      min-width: 100px;
      opacity: 1;
    }

    ::ng-deep .admin-tabs .mat-mdc-tab:not(.mat-mdc-tab-disabled) .mdc-tab__text-label {
      color: var(--foe-text-primary);
    }

    ::ng-deep .admin-tabs .mat-mdc-tab.mdc-tab--active {
      background: var(--foe-accent-primary);
    }

    ::ng-deep .admin-tabs .mat-mdc-tab-body-wrapper {
      padding: var(--foe-space-md);
    }

    @media (min-width: 768px) {
      ::ng-deep .admin-tabs .mat-mdc-tab-body-wrapper {
        padding: var(--foe-space-lg);
      }
    }

    .tab-label {
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: var(--foe-text-xs);
      font-weight: 700;
    }

    @media (min-width: 768px) {
      .tab-label {
        font-size: var(--foe-text-sm);
        letter-spacing: 2px;
      }
    }
  `]
})
export class AdminDashboardComponent {}
