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
      border-bottom: var(--foe-border-width) solid var(--foe-border);
      box-shadow: 0 4px 0 var(--foe-border);
      padding: 0 24px;
      font-family: 'Space Mono', monospace;
    }

    .logo {
      font-family: 'Inter', sans-serif;
      font-size: 28px;
      font-weight: 900;
      cursor: pointer;
      display: flex;
      align-items: baseline;
      gap: 2px;
      transition: all 0.1s ease;
      text-shadow: 2px 2px 0px var(--foe-bg-tertiary);

      &:hover {
        transform: translate(-2px, -2px);
        text-shadow: 4px 4px 0px var(--foe-bg-tertiary);
      }
    }

    .logo-foe {
      color: var(--foe-accent-primary);
      letter-spacing: -1px;
    }

    .logo-finder {
      color: var(--foe-text-primary);
      font-weight: 700;
      letter-spacing: -1px;
    }

    .tagline {
      margin-left: 16px;
      font-size: 12px;
      color: var(--foe-text-secondary);
      font-style: normal;
      text-transform: uppercase;
      letter-spacing: 2px;
      border-left: 3px solid var(--foe-border);
      padding-left: 16px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .welcome {
      margin-right: 20px;
      font-size: 12px;
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;

      strong {
        color: var(--foe-text-primary);
        background: var(--foe-accent-primary);
        padding: 2px 6px;
      }
    }

    .nav-btn {
      margin: 0 4px;
      color: var(--foe-text-primary) !important;
      border: 2px solid transparent !important;
      border-radius: 0 !important;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
      transition: all 0.1s ease;

      &:hover {
        color: var(--foe-text-primary) !important;
        background-color: var(--foe-bg-tertiary) !important;
        border: 2px solid var(--foe-border) !important;
      }
    }

    .logout-btn:hover {
      background-color: var(--foe-error) !important;
      color: white !important;
      border-color: var(--foe-border) !important;
    }

    .register-btn {
      margin-left: 8px;
      background: var(--foe-accent-primary) !important;
      color: var(--foe-text-primary) !important;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-size: 12px;
      border: 3px solid var(--foe-border) !important;
      border-radius: 0 !important;
      box-shadow: 3px 3px 0px var(--foe-border);
      transition: all 0.1s ease;

      &:hover {
        background: var(--foe-accent-light) !important;
        box-shadow: 1px 1px 0px var(--foe-border);
        transform: translate(2px, 2px);
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
        font-size: 20px;
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
