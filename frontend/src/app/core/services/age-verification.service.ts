import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

/**
 * AgeVerificationService - Manages age verification state
 *
 * Handles age verification with dual storage:
 * - localStorage: For anonymous users (persists across sessions on same device)
 * - Supabase profiles: For authenticated users (persists across devices)
 *
 * Flow:
 * 1. Anonymous user passes age gate → stored in localStorage
 * 2. User registers/logs in → localStorage synced to Supabase
 * 3. User logs in on new device → Supabase verification restored
 */
@Injectable({ providedIn: 'root' })
export class AgeVerificationService {
  private supabaseService = inject(SupabaseService);

  private readonly STORAGE_KEY = 'foe-age-verified';
  private readonly STORAGE_DATE_KEY = 'foe-age-verified-date';
  private readonly USE_REAL_AUTH = environment.features.useRealAuth;

  // Reactive signal for UI binding
  ageVerified = signal(false);

  constructor() {
    // Initialize from localStorage on startup
    this.initializeFromLocalStorage();
  }

  /**
   * Check localStorage for existing verification
   * Called on app startup before we know if user is logged in
   */
  private initializeFromLocalStorage(): void {
    const verified = localStorage.getItem(this.STORAGE_KEY) === 'true';
    this.ageVerified.set(verified);
  }

  /**
   * Verify user's age from birthdate
   * Stores in localStorage immediately, Supabase sync happens on login
   *
   * @param birthDate - User's birthdate in YYYY-MM-DD format
   * @returns true if user is 21+, false otherwise
   */
  verifyAge(birthDate: string): boolean {
    const age = this.calculateAge(birthDate);
    const isOldEnough = age >= 21;

    if (isOldEnough) {
      // Store in localStorage (works for anonymous users)
      localStorage.setItem(this.STORAGE_KEY, 'true');
      localStorage.setItem(this.STORAGE_DATE_KEY, new Date().toISOString());
      this.ageVerified.set(true);
    }

    return isOldEnough;
  }

  /**
   * Calculate age from birthdate
   */
  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();

    // Check if birthday hasn't occurred yet this year
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Check if user is verified in localStorage
   */
  isLocalStorageVerified(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  /**
   * Sync age verification to Supabase after login/registration
   * Called by AuthService after successful authentication
   *
   * @param userId - The authenticated user's ID
   */
  async syncToSupabaseOnLogin(userId: string): Promise<void> {
    if (!this.USE_REAL_AUTH) {
      return; // Skip in dummy mode
    }

    // Check if localStorage has verification
    const localVerified = this.isLocalStorageVerified();

    if (localVerified) {
      // Sync localStorage verification to Supabase
      await this.storeInSupabase(userId);
    } else {
      // Check if user verified on another device
      await this.checkSupabaseVerification(userId);
    }
  }

  /**
   * Store age verification in Supabase profile
   */
  private async storeInSupabase(userId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('profiles')
        .update({
          age_verified: true,
          age_verified_date: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Failed to store age verification in Supabase:', error);
      }
    } catch (err) {
      console.error('Error storing age verification:', err);
    }
  }

  /**
   * Check Supabase for existing age verification
   * If verified in Supabase, update localStorage and signal
   */
  async checkSupabaseVerification(userId: string): Promise<void> {
    if (!this.USE_REAL_AUTH) {
      return; // Skip in dummy mode
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('age_verified, age_verified_date')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to check age verification in Supabase:', error);
        return;
      }

      if (data?.age_verified) {
        // User verified on another device - update local state
        localStorage.setItem(this.STORAGE_KEY, 'true');
        if (data.age_verified_date) {
          localStorage.setItem(this.STORAGE_DATE_KEY, data.age_verified_date);
        }
        this.ageVerified.set(true);
      }
    } catch (err) {
      console.error('Error checking age verification:', err);
    }
  }

  /**
   * Store verification in Supabase for currently logged-in user
   * Used when user verifies age while already logged in
   */
  async storeForCurrentUser(): Promise<void> {
    if (!this.USE_REAL_AUTH) {
      return;
    }

    try {
      const { data: { user } } = await this.supabaseService.client.auth.getUser();
      if (user) {
        await this.storeInSupabase(user.id);
      }
    } catch (err) {
      console.error('Error storing verification for current user:', err);
    }
  }
}
