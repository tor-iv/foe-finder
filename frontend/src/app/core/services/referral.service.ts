import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * ReferralService - Handles referral link generation and sharing
 *
 * This service:
 * - Generates unique referral links based on user ID
 * - Provides share functionality via Web Share API (mobile)
 * - Offers fallback sharing methods (copy, email, SMS)
 */
@Injectable({ providedIn: 'root' })
export class ReferralService {
  private authService = inject(AuthService);

  // Base URL for referral links
  private readonly BASE_URL = 'https://foefinder.me';

  /**
   * Generate a referral link for the current user
   * The link includes a ref parameter with the user's ID
   */
  getReferralLink(): string {
    const user = this.authService.currentUser();
    if (!user) {
      return `${this.BASE_URL}/register`;
    }

    // Create a short referral code from the user ID
    const refCode = this.generateRefCode(user.uid);
    return `${this.BASE_URL}/register?ref=${refCode}`;
  }

  /**
   * Generate a short referral code from user ID
   * Takes first 8 characters for brevity
   */
  private generateRefCode(uid: string): string {
    // Remove any prefix like 'user_' and take first 8 chars
    return uid.replace(/^user_/, '').substring(0, 8);
  }

  /**
   * Get the share message with referral link
   */
  getShareMessage(): { title: string; text: string; url: string } {
    const user = this.authService.currentUser();
    const displayName = user?.displayName || 'Someone';

    return {
      title: 'Join FoeFinder - Find Your Opposite!',
      text: `${displayName} invited you to FoeFinder! Escape your echo chamber and find someone with opposite opinions to have meaningful conversations.`,
      url: this.getReferralLink()
    };
  }

  /**
   * Check if Web Share API is available (mainly mobile browsers)
   */
  canUseWebShare(): boolean {
    return 'share' in navigator && typeof navigator.share === 'function';
  }

  /**
   * Share using the native Web Share API
   * Returns true if share was successful, false otherwise
   */
  async shareNative(): Promise<boolean> {
    if (!this.canUseWebShare()) {
      return false;
    }

    const shareData = this.getShareMessage();

    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      // User cancelled or share failed
      console.log('Share cancelled or failed:', error);
      return false;
    }
  }

  /**
   * Copy referral link to clipboard
   */
  async copyToClipboard(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(this.getReferralLink());
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Generate SMS share URL (works on mobile)
   * Uses sms: protocol which opens iMessage on iOS, Messages on Android
   */
  getSmsShareUrl(): string {
    const { text, url } = this.getShareMessage();
    const message = `${text}\n\n${url}`;

    // Use different formats for iOS vs Android
    // iOS: sms:&body=message
    // Android: sms:?body=message
    // This format works on both
    return `sms:?&body=${encodeURIComponent(message)}`;
  }

  /**
   * Generate email share URL
   * Uses mailto: protocol
   */
  getEmailShareUrl(): string {
    const { title, text, url } = this.getShareMessage();
    const body = `${text}\n\n${url}`;

    return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  /**
   * Generate WhatsApp share URL
   */
  getWhatsAppShareUrl(): string {
    const { text, url } = this.getShareMessage();
    const message = `${text}\n\n${url}`;

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  /**
   * Generate Twitter/X share URL
   */
  getTwitterShareUrl(): string {
    const { text, url } = this.getShareMessage();

    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  }
}
