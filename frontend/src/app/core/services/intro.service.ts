import { Injectable, signal } from '@angular/core';

/**
 * IntroService - Manages intro splash screen state
 *
 * Stores in localStorage whether user has seen the intro screen.
 * Once dismissed, the intro won't show again on the same device.
 */
@Injectable({ providedIn: 'root' })
export class IntroService {
  private readonly STORAGE_KEY = 'foe-intro-seen';

  // Reactive signal for UI binding
  introSeen = signal(false);

  constructor() {
    this.initializeFromLocalStorage();
  }

  /**
   * Check localStorage for existing intro dismissal
   */
  private initializeFromLocalStorage(): void {
    const seen = localStorage.getItem(this.STORAGE_KEY) === 'true';
    this.introSeen.set(seen);
  }

  /**
   * Mark intro as seen and persist to localStorage
   */
  markIntroSeen(): void {
    localStorage.setItem(this.STORAGE_KEY, 'true');
    this.introSeen.set(true);
  }
}
