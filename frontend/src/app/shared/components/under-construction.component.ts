import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Under Construction Banner
 *
 * Classic 90s-style "under construction" banner with:
 * - Yellow/black striped warning pattern
 * - Construction icon
 * - Customizable message
 */
@Component({
  selector: 'app-under-construction',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="construction-banner">
      <div class="stripe-bar"></div>
      <div class="banner-content">
        <span class="construction-icon">&#9888;</span>
        <div class="banner-text">
          <span class="banner-title">{{ title }}</span>
          <span class="banner-subtitle">{{ subtitle }}</span>
        </div>
        <span class="construction-icon">&#9888;</span>
      </div>
      <div class="stripe-bar"></div>
    </div>
  `,
  styles: [`
    .construction-banner {
      margin: var(--foe-space-md) 0;
      font-family: 'Space Mono', monospace;
    }

    .stripe-bar {
      height: 12px;
      background: repeating-linear-gradient(
        45deg,
        #000000,
        #000000 10px,
        #ffcc00 10px,
        #ffcc00 20px
      );
    }

    .banner-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--foe-space-md);
      padding: var(--foe-space-md);
      background: #ffcc00;
      border-left: 4px solid #000000;
      border-right: 4px solid #000000;
    }

    .construction-icon {
      font-size: 28px;
      color: #000000;
    }

    .banner-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .banner-title {
      font-size: var(--foe-text-base);
      font-weight: bold;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .banner-subtitle {
      font-size: var(--foe-text-xs);
      color: #333333;
      margin-top: 4px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .banner-content {
        gap: var(--foe-space-sm);
        padding: var(--foe-space-sm);
      }

      .construction-icon {
        font-size: 20px;
      }

      .banner-title {
        font-size: var(--foe-text-sm);
        letter-spacing: 1px;
      }
    }
  `]
})
export class UnderConstructionComponent {
  @Input() title = 'UNDER CONSTRUCTION';
  @Input() subtitle = 'This section is coming soon!';
}
