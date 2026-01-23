import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IntroService } from '../../core/services/intro.service';

/**
 * Intro Component
 *
 * Displays a splash screen introducing the app's absurdist premise:
 * "The Only Honest Dating App" - we promise disappointment and deliver it.
 *
 * Shows before the age gate and only appears once per device.
 */
@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="intro-overlay">
      <div class="intro-modal">
        <div class="intro-header">
          <span class="logo-foe">FOE</span>
          <span class="logo-finder">FINDER</span>
        </div>

        <div class="intro-content">
          <h1 class="intro-tagline">THE ONLY HONEST DATING APP</h1>

          <div class="intro-pitch">
            <p class="pitch-line">Other apps promise your soulmate</p>
            <p class="pitch-line">and deliver disappointment.</p>
            <p class="pitch-line pitch-highlight">We promise disappointment</p>
            <p class="pitch-line pitch-highlight">and deliver it consistently.</p>
          </div>

          <div class="feature-box">
            <div class="feature-icon">*</div>
            <div class="feature-content">
              <h3 class="feature-title">PROPRIETARY INCOMPATIBILITY ALGORITHM&trade;</h3>
              <p class="feature-desc">
                Answer a few questions. Our algorithm finds someone
                guaranteed to disagree with everything you believe in.
              </p>
            </div>
          </div>

          <button class="enter-btn" (click)="enterSite()">
            FIND MY NEMESIS
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* =============================================
       INTRO SCREEN - Mobile-First Responsive Styles
       ============================================= */

    .intro-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      z-index: 9999;
      padding: var(--foe-space-sm);
      padding-top: var(--foe-space-md);
      font-family: 'Space Mono', monospace;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    @media (min-height: 600px) {
      .intro-overlay {
        align-items: center;
        padding: var(--foe-space-md);
      }
    }

    .intro-modal {
      background: var(--foe-bg-secondary);
      border: var(--foe-border-width-responsive) solid var(--foe-border);
      box-shadow: var(--foe-shadow-responsive);
      max-width: 480px;
      width: 100%;
      text-align: center;
      animation: modalSlideIn 0.3s ease-out;
      margin-bottom: var(--foe-space-md);
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (min-width: 768px) {
      .intro-modal {
        max-width: 520px;
      }
    }

    .intro-header {
      background: var(--foe-bg-tertiary);
      padding: var(--foe-space-md);
      border-bottom: 3px solid var(--foe-border);
      font-family: 'Inter', sans-serif;
      font-size: 28px;
      font-weight: 900;
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    @media (min-width: 768px) {
      .intro-header {
        font-size: 36px;
        padding: var(--foe-space-lg);
        gap: 10px;
      }
    }

    .logo-foe {
      color: var(--foe-accent-primary);
      letter-spacing: -1px;
      text-shadow: 2px 2px 0px var(--foe-border);
    }

    .logo-finder {
      color: var(--foe-text-primary);
      font-weight: 700;
      letter-spacing: -1px;
      text-shadow: 2px 2px 0px var(--foe-bg-tertiary);
    }

    .intro-content {
      padding: var(--foe-space-md);
    }

    @media (min-width: 768px) {
      .intro-content {
        padding: var(--foe-space-xl);
      }
    }

    @media (min-height: 600px) {
      .intro-content {
        padding: var(--foe-space-lg);
      }
    }

    .intro-tagline {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-base);
      font-weight: 900;
      margin-bottom: var(--foe-space-md);
      color: var(--foe-accent-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
      line-height: 1.2;
    }

    @media (min-height: 600px) {
      .intro-tagline {
        font-size: var(--foe-text-lg);
        margin-bottom: var(--foe-space-lg);
        letter-spacing: 2px;
      }
    }

    @media (min-width: 768px) {
      .intro-tagline {
        font-size: var(--foe-text-xl);
        letter-spacing: 3px;
      }
    }

    .intro-pitch {
      margin-bottom: var(--foe-space-md);
    }

    @media (min-height: 600px) {
      .intro-pitch {
        margin-bottom: var(--foe-space-lg);
      }
    }

    .pitch-line {
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 2px 0;
      line-height: 1.5;
    }

    @media (min-height: 600px) {
      .pitch-line {
        font-size: var(--foe-text-sm);
        line-height: 1.6;
      }
    }

    .pitch-highlight {
      color: var(--foe-text-primary);
      font-weight: 700;
    }

    @media (min-width: 768px) {
      .pitch-line {
        font-size: var(--foe-text-base);
      }
    }

    .feature-box {
      background: var(--foe-bg-tertiary);
      border: 2px solid var(--foe-border);
      padding: var(--foe-space-sm);
      margin-bottom: var(--foe-space-md);
      display: flex;
      align-items: flex-start;
      gap: var(--foe-space-sm);
      text-align: left;
    }

    @media (min-height: 600px) {
      .feature-box {
        padding: var(--foe-space-md);
        margin-bottom: var(--foe-space-lg);
        gap: var(--foe-space-md);
      }
    }

    .feature-icon {
      font-size: 24px;
      color: var(--foe-accent-primary);
      font-weight: 900;
      line-height: 1;
      flex-shrink: 0;
    }

    @media (min-width: 768px) {
      .feature-icon {
        font-size: 28px;
      }
    }

    .feature-content {
      flex: 1;
    }

    .feature-title {
      font-family: 'Inter', sans-serif;
      font-size: var(--foe-text-xs);
      font-weight: 900;
      color: var(--foe-text-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: var(--foe-space-xs);
    }

    @media (min-width: 768px) {
      .feature-title {
        font-size: var(--foe-text-sm);
      }
    }

    .feature-desc {
      font-size: var(--foe-text-xs);
      color: var(--foe-text-secondary);
      line-height: 1.5;
    }

    @media (min-width: 768px) {
      .feature-desc {
        font-size: var(--foe-text-sm);
      }
    }

    .enter-btn {
      width: 100%;
      padding: var(--foe-space-md);
      background: var(--foe-accent-primary);
      color: #ffffff;
      font-family: 'Space Mono', monospace;
      font-size: var(--foe-text-base);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      border: 3px solid var(--foe-border);
      box-shadow: 4px 4px 0px var(--foe-border);
      cursor: pointer;
      transition: all 0.1s ease;
    }

    .enter-btn:hover {
      background: var(--foe-accent-light);
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px var(--foe-border);
    }

    .enter-btn:active {
      transform: translate(4px, 4px);
      box-shadow: 0px 0px 0px var(--foe-border);
    }

    @media (min-width: 768px) {
      .enter-btn {
        font-size: var(--foe-text-lg);
        padding: var(--foe-space-lg) var(--foe-space-xl);
      }
    }
  `]
})
export class IntroComponent {
  private introService = inject(IntroService);

  @Output() dismissed = new EventEmitter<void>();

  enterSite() {
    this.introService.markIntroSeen();
    this.dismissed.emit();
  }
}
