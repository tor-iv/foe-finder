import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReferralService } from '../../core/services/referral.service';

/**
 * ShareButtonComponent - Invite friends via various channels
 *
 * This component provides:
 * - Native share on mobile (Web Share API)
 * - Fallback share options: Copy link, iMessage/SMS, Email, WhatsApp, Twitter
 * - Visual feedback when link is copied
 */
@Component({
  selector: 'app-share-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="share-container">
      <button class="share-main-btn" (click)="handleShare()">
        <span class="share-icon">&#9993;</span>
        Invite Friends
      </button>

      @if (showOptions()) {
        <div class="share-dropdown">
          <div class="dropdown-header">
            <span>Share FoeFinder</span>
            <button class="close-btn" (click)="showOptions.set(false)">&times;</button>
          </div>

          <div class="share-options">
            <!-- Copy Link -->
            <button class="share-option" (click)="copyLink()">
              <span class="option-icon">&#128203;</span>
              <span class="option-text">{{ copied() ? 'Copied!' : 'Copy Link' }}</span>
            </button>

            <!-- iMessage / SMS -->
            <a class="share-option" [href]="referralService.getSmsShareUrl()">
              <span class="option-icon">&#128172;</span>
              <span class="option-text">iMessage / SMS</span>
            </a>

            <!-- Email -->
            <a class="share-option" [href]="referralService.getEmailShareUrl()">
              <span class="option-icon">&#9993;</span>
              <span class="option-text">Email</span>
            </a>

            <!-- WhatsApp -->
            <a class="share-option" [href]="referralService.getWhatsAppShareUrl()" target="_blank" rel="noopener">
              <span class="option-icon">&#128242;</span>
              <span class="option-text">WhatsApp</span>
            </a>

            <!-- Twitter/X -->
            <a class="share-option" [href]="referralService.getTwitterShareUrl()" target="_blank" rel="noopener">
              <span class="option-icon">&#128038;</span>
              <span class="option-text">Twitter / X</span>
            </a>
          </div>

          <div class="referral-link">
            <input
              type="text"
              [value]="referralService.getReferralLink()"
              readonly
              (click)="copyLink()"
            />
          </div>
        </div>
      }

      @if (showOptions()) {
        <div class="backdrop" (click)="showOptions.set(false)"></div>
      }
    </div>
  `,
  styles: [`
    /* =============================================
       SHARE BUTTON - Windows 95 Retro Style
       ============================================= */

    .share-container {
      position: relative;
      display: inline-block;
    }

    .share-main-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: var(--foe-accent-primary);
      color: var(--foe-text-primary);
      border: 3px solid var(--foe-border);
      border-radius: 0;
      font-family: 'Space Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      box-shadow: 4px 4px 0px var(--foe-border);
      transition: all 0.1s ease;
      min-height: 48px;
    }

    .share-main-btn:hover {
      background: var(--foe-accent-light);
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px var(--foe-border);
    }

    .share-main-btn:active {
      transform: translate(4px, 4px);
      box-shadow: none;
    }

    .share-icon {
      font-size: 18px;
    }

    /* Dropdown panel */
    .share-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      width: 280px;
      background: var(--foe-bg-secondary);
      border: 3px solid var(--foe-border);
      box-shadow: 6px 6px 0px var(--foe-border);
      z-index: 1000;
      font-family: 'Space Mono', monospace;
    }

    @media (max-width: 480px) {
      .share-dropdown {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: calc(100vw - 32px);
        max-width: 320px;
      }
    }

    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(90deg, #000080, #1084d0);
      color: white;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
    }

    .close-btn {
      background: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
      color: var(--foe-text-primary);
      width: 24px;
      height: 24px;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      line-height: 1;
    }

    .close-btn:hover {
      background: var(--foe-error);
      color: white;
    }

    .share-options {
      padding: 8px;
    }

    .share-option {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px;
      background: var(--foe-bg-tertiary);
      border: 2px solid transparent;
      color: var(--foe-text-primary);
      font-family: 'Space Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      margin-bottom: 4px;
      transition: all 0.1s ease;
    }

    .share-option:hover {
      background: var(--foe-accent-primary);
      border-color: var(--foe-border);
    }

    .option-icon {
      font-size: 18px;
      width: 24px;
      text-align: center;
    }

    .referral-link {
      padding: 8px 8px 12px 8px;
      border-top: 2px solid var(--foe-border);
    }

    .referral-link input {
      width: 100%;
      padding: 10px;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      background: var(--foe-bg-primary);
      border: 2px inset var(--foe-border);
      color: var(--foe-text-secondary);
      cursor: pointer;
    }

    .referral-link input:focus {
      outline: none;
      border-color: var(--foe-accent-primary);
    }

    /* Backdrop for mobile */
    .backdrop {
      display: none;
    }

    @media (max-width: 480px) {
      .backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
      }
    }
  `]
})
export class ShareButtonComponent {
  referralService = inject(ReferralService);

  showOptions = signal(false);
  copied = signal(false);

  /**
   * Handle main share button click
   * Uses native share on mobile, shows dropdown on desktop
   */
  async handleShare(): Promise<void> {
    // Try native share first (works on mobile)
    if (this.referralService.canUseWebShare()) {
      const shared = await this.referralService.shareNative();
      if (shared) {
        return; // Native share succeeded
      }
    }

    // Fall back to showing options dropdown
    this.showOptions.set(true);
  }

  /**
   * Copy referral link to clipboard
   */
  async copyLink(): Promise<void> {
    const success = await this.referralService.copyToClipboard();
    if (success) {
      this.copied.set(true);
      // Reset after 2 seconds
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}
