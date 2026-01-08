import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SupabaseService } from '../../core/services/supabase.service';
import { SuggestionDialogComponent } from './suggestion-dialog.component';

/**
 * Retro Footer Component
 *
 * Classic 90s-style footer with:
 * - "Best viewed in Netscape" badge
 * - Visitor counter
 * - Web ring navigation (decorative)
 * - Various retro badges
 */
@Component({
  selector: 'app-retro-footer',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <footer class="retro-footer">
      <div class="footer-content">
        <!-- Visitor Counter -->
        <div class="visitor-counter win95-panel">
          <span class="counter-label">YOU ARE VISITOR</span>
          <span class="counter-number">#{{ visitorCount() | number }}</span>
        </div>

        <!-- Suggestion Box -->
        <div class="suggestion-box">
          <button class="suggestion-button" (click)="openSuggestionDialog()">
            <span class="button-icon">&#128172;</span>
            SUGGEST A QUESTION / FEATURE
          </button>
        </div>

        <!-- Contact Us -->
        <div class="webmaster">
          <button class="contact-button" (click)="openSuggestionDialog()">
            <span class="blink">*</span>
            CONTACT US
            <span class="blink">*</span>
          </button>
        </div>

        <!-- Copyright -->
        <div class="copyright">
          <p>&copy; {{ currentYear }} FOEFINDER.ME - ALL RIGHTS RESERVED</p>
          <p class="disclaimer">This site is not responsible for any arguments, breakups, or existential crises.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .retro-footer {
      background: var(--foe-bg-tertiary);
      border-top: 4px solid var(--foe-border);
      padding: var(--foe-space-lg) var(--foe-space-md);
      margin-top: auto;
      font-family: 'Space Mono', monospace;
    }

    .footer-content {
      max-width: var(--foe-container-lg);
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--foe-space-lg);
    }

    /* Visitor Counter */
    .visitor-counter {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--foe-space-md);
      background: #000080;
      color: #00ff00;
    }

    .counter-label {
      font-size: 10px;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }

    .counter-number {
      font-size: 24px;
      font-weight: bold;
      font-family: 'Courier New', monospace;
    }

    /* Suggestion Box */
    .suggestion-box {
      margin-top: var(--foe-space-sm);
    }

    .suggestion-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--foe-accent-primary);
      color: var(--foe-text-primary);
      border: 3px solid var(--foe-border);
      padding: 10px 16px;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1px;
      cursor: pointer;
      box-shadow: 4px 4px 0px var(--foe-border);
      transition: all 0.1s ease;

      &:hover {
        background: var(--foe-accent-light);
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0px var(--foe-border);
      }

      &:active {
        transform: translate(4px, 4px);
        box-shadow: none;
      }
    }

    .button-icon {
      font-size: 14px;
    }

    /* Webmaster Email */
    .webmaster {
      margin-top: var(--foe-space-sm);
    }

    .contact-button {
      background: transparent;
      border: none;
      color: var(--foe-accent-primary);
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1px;
      cursor: pointer;
      padding: 0;

      &:hover {
        text-decoration: underline;
      }
    }

    /* Copyright */
    .copyright {
      text-align: center;
      font-size: 10px;
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;

      p {
        margin: 4px 0;
      }

      .disclaimer {
        font-size: 9px;
        color: var(--foe-text-muted);
      }
    }

  `]
})
export class RetroFooterComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private dialog = inject(MatDialog);

  visitorCount = signal(0);
  currentYear = new Date().getFullYear();

  private readonly VISITOR_KEY = 'foe-visitor-count';
  private readonly SESSION_KEY = 'foe-visitor-counted';
  private readonly BASE_COUNT = 12847;

  ngOnInit() {
    this.initVisitorCount();
  }

  openSuggestionDialog(): void {
    this.dialog.open(SuggestionDialogComponent, {
      panelClass: 'suggestion-dialog-panel',
      maxWidth: '95vw',
      autoFocus: true
    });
  }

  private async initVisitorCount() {
    // Check if we've already counted this visitor in this session
    const alreadyCounted = sessionStorage.getItem(this.SESSION_KEY);

    if (alreadyCounted) {
      // Already counted this session - just display the stored count
      const stored = localStorage.getItem(this.VISITOR_KEY);
      this.visitorCount.set(stored ? parseInt(stored, 10) : this.BASE_COUNT);
      return;
    }

    try {
      // Call Supabase function to increment and get visitor count
      const { data, error } = await this.supabase.client.rpc('increment_visitor_count');

      if (error) throw error;

      this.visitorCount.set(data);
      localStorage.setItem(this.VISITOR_KEY, data.toString());
      sessionStorage.setItem(this.SESSION_KEY, 'true');
    } catch {
      // Fallback to localStorage if Supabase fails
      const stored = localStorage.getItem(this.VISITOR_KEY);
      if (stored) {
        const count = parseInt(stored, 10) + 1;
        localStorage.setItem(this.VISITOR_KEY, count.toString());
        this.visitorCount.set(count);
      } else {
        localStorage.setItem(this.VISITOR_KEY, this.BASE_COUNT.toString());
        this.visitorCount.set(this.BASE_COUNT);
      }
      sessionStorage.setItem(this.SESSION_KEY, 'true');
    }
  }
}
