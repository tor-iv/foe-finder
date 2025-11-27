import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar class="foe-navbar">
      <span class="logo" routerLink="/">
        <span class="logo-foe">FOE</span>
        <span class="logo-finder">FINDER</span>
      </span>
      <span class="tagline">Find Your Opposite</span>
      <span class="spacer"></span>

      @if (authService.currentUser(); as user) {
        <span class="welcome">Welcome, <strong>{{ user.displayName }}</strong></span>
        <button mat-button routerLink="/profile" class="nav-btn">Profile</button>
        <button mat-button (click)="logout()" class="nav-btn logout-btn">Logout</button>
      } @else {
        <button mat-button routerLink="/login" class="nav-btn">Login</button>
        <button mat-raised-button routerLink="/register" color="accent" class="register-btn">Register</button>
      }
    </mat-toolbar>
  `,
  styles: [`
    .foe-navbar {
      background: var(--foe-bg-secondary) !important;
      border-bottom: 2px solid var(--foe-accent-primary);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      padding: 0 24px;
    }

    .logo {
      font-size: 24px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: baseline;
      gap: 4px;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.05);
      }
    }

    .logo-foe {
      color: var(--foe-accent-primary);
      letter-spacing: 2px;
    }

    .logo-finder {
      color: var(--foe-text-primary);
      font-weight: 300;
      letter-spacing: 1px;
    }

    .tagline {
      margin-left: 16px;
      font-size: 14px;
      color: var(--foe-text-secondary);
      font-style: italic;
      border-left: 2px solid var(--foe-border);
      padding-left: 16px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .welcome {
      margin-right: 20px;
      font-size: 14px;
      color: var(--foe-text-secondary);

      strong {
        color: var(--foe-accent-primary);
      }
    }

    .nav-btn {
      margin: 0 4px;
      color: var(--foe-text-primary) !important;
      transition: all 0.3s ease;

      &:hover {
        color: var(--foe-accent-light) !important;
        background-color: rgba(107, 33, 168, 0.1) !important;
      }
    }

    .logout-btn:hover {
      color: var(--foe-accent-primary) !important;
    }

    .register-btn {
      margin-left: 8px;
      background: var(--foe-accent-primary) !important;
      font-weight: 600;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--foe-accent-light) !important;
      }
    }

    @media (max-width: 768px) {
      .tagline {
        display: none;
      }

      .welcome {
        display: none;
      }

      .logo {
        font-size: 18px;
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);

  async logout() {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
