import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { SupabaseService } from './supabase.service';
import { AgeVerificationService } from './age-verification.service';
import { environment } from '../../../environments/environment';

/**
 * AuthService - Handles user authentication
 *
 * This service supports two modes controlled by environment.features.useRealAuth:
 *
 * 1. DUMMY MODE (useRealAuth = false):
 *    - Uses localStorage to store user data
 *    - No real authentication - any email/password works
 *    - Perfect for development and testing without Supabase setup
 *
 * 2. REAL MODE (useRealAuth = true):
 *    - Uses Supabase authentication
 *    - Requires valid Supabase credentials in environment.ts
 *    - Full email/password authentication with session management
 *
 * To switch modes, change environment.features.useRealAuth in environment.ts
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private ageVerificationService = inject(AgeVerificationService);

  // Feature flag: when true, use Supabase; when false, use localStorage
  private readonly USE_REAL_AUTH = environment.features.useRealAuth;

  // Storage key for dummy auth mode
  private readonly STORAGE_KEY = 'foe_finder_user';

  // BehaviorSubject allows components to subscribe to auth state changes
  // A BehaviorSubject always has a current value (initially null = no user logged in)
  private userSubject = new BehaviorSubject<User | null>(null);

  // Public observable for components to subscribe to
  // The $ suffix is a convention indicating this is an Observable
  user$: Observable<User | null> = this.userSubject.asObservable();

  // Signal for reactive UI updates (modern Angular approach)
  currentUser = signal<User | null>(null);

  // Signal to track if user just registered and needs to verify email
  emailVerificationPending = signal(false);

  constructor() {
    // Initialize auth state from storage or Supabase session
    this.initializeAuth();
  }

  /**
   * Initialize authentication state
   *
   * In dummy mode: Load user from localStorage
   * In real mode: Set up Supabase auth state listener
   */
  private async initializeAuth(): Promise<void> {
    if (this.USE_REAL_AUTH) {
      // Real mode: Listen to Supabase auth state changes
      // onAuthStateChange fires whenever the user logs in, out, or token refreshes
      this.supabaseService.client.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          // Don't auto-login if email not verified
          if (!session.user.email_confirmed_at) {
            this.setUser(null);
            return;
          }
          const user = await this.mapSupabaseUserToUser(session.user);
          this.setUser(user);

          // Sync age verification on auth state changes (e.g., email verification callback)
          await this.ageVerificationService.syncToSupabaseOnLogin(session.user.id);
        } else {
          this.setUser(null);
        }
      });

      // Check for existing session (only if email is verified)
      const { data: { session } } = await this.supabaseService.client.auth.getSession();
      if (session?.user && session.user.email_confirmed_at) {
        const user = await this.mapSupabaseUserToUser(session.user);
        this.setUser(user);

        // Sync age verification on session restore
        await this.ageVerificationService.syncToSupabaseOnLogin(session.user.id);
      }
    } else {
      // Dummy mode: Load user from localStorage
      const storedUser = localStorage.getItem(this.STORAGE_KEY);
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as User;
          this.setUser(user);
        } catch (e) {
          // Invalid JSON, clear it
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    }
  }

  /**
   * Register a new user
   *
   * @param email - User's email address
   * @param password - User's password (min 6 characters recommended)
   * @param displayName - Name to display in the app
   * @param marketingConsent - Whether user opted in to marketing emails
   */
  async register(email: string, password: string, displayName: string, marketingConsent: boolean = false): Promise<void> {
    if (this.USE_REAL_AUTH) {
      // Real mode: Use Supabase authentication
      const { data, error } = await this.supabaseService.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            marketing_consent: marketingConsent
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw new Error(this.getErrorMessage(error.message));
      }

      if (data.user) {
        // Check if email confirmation is required
        // Supabase returns identities as empty array when email confirmation is pending
        const needsEmailVerification = !data.user.email_confirmed_at;

        if (needsEmailVerification) {
          // Don't set user or navigate - show verification pending message
          this.emailVerificationPending.set(true);
        } else {
          // Email already confirmed (e.g., email confirmation disabled in Supabase)
          const user = await this.mapSupabaseUserToUser(data.user, displayName);
          this.setUser(user);

          // Note: syncToSupabaseOnLogin is handled by onAuthStateChange listener

          await this.router.navigate(['/questionnaire']);
        }
      }
    } else {
      // Dummy mode: Create a mock user and store in localStorage
      // Generate a random ID to simulate a real user ID
      const uid = 'user_' + Math.random().toString(36).substring(2, 15);

      const user: User = {
        uid,
        email,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true, // Dummy mode: no email verification needed
        hasCompletedQuestionnaire: false,
        isMatched: false,
        preferences: {
          notifications: true,
          emailUpdates: true
        }
      };

      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      this.setUser(user);

      // Navigate to questionnaire after registration
      await this.router.navigate(['/questionnaire']);
    }
  }

  /**
   * Log in an existing user
   *
   * @param email - User's email address
   * @param password - User's password
   */
  async login(email: string, password: string): Promise<void> {
    if (this.USE_REAL_AUTH) {
      // Real mode: Use Supabase authentication
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(this.getErrorMessage(error.message));
      }

      if (data.user) {
        const user = await this.mapSupabaseUserToUser(data.user);
        this.setUser(user);

        // Note: syncToSupabaseOnLogin is handled by onAuthStateChange listener
        // to avoid duplicate database calls

        // Navigate based on questionnaire completion
        if (!user.hasCompletedQuestionnaire) {
          await this.router.navigate(['/questionnaire']);
        } else {
          await this.router.navigate(['/profile']);
        }
      }
    } else {
      // Dummy mode: Accept any email/password combination
      // Check if user already exists in localStorage
      const storedUser = localStorage.getItem(this.STORAGE_KEY);

      if (storedUser) {
        // User exists - restore their session
        const user = JSON.parse(storedUser) as User;

        // Only allow login if email matches (basic validation)
        if (user.email !== email) {
          throw new Error('No account found with this email.');
        }

        this.setUser(user);
      } else {
        // Create a new user for this email (auto-register on login for simplicity)
        const uid = 'user_' + Math.random().toString(36).substring(2, 15);
        const user: User = {
          uid,
          email,
          displayName: email.split('@')[0], // Use part before @ as display name
          createdAt: new Date(),
          updatedAt: new Date(),
          emailVerified: true, // Dummy mode: no email verification needed
          hasCompletedQuestionnaire: false,
          isMatched: false,
          preferences: {
            notifications: true,
            emailUpdates: true
          }
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        this.setUser(user);
      }

      // Navigate based on questionnaire completion
      const currentUser = this.currentUser();
      if (currentUser && !currentUser.hasCompletedQuestionnaire) {
        await this.router.navigate(['/questionnaire']);
      } else {
        await this.router.navigate(['/profile']);
      }
    }
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    if (this.USE_REAL_AUTH) {
      // Real mode: Sign out from Supabase
      await this.supabaseService.client.auth.signOut();
    } else {
      // Dummy mode: Clear localStorage
      localStorage.removeItem(this.STORAGE_KEY);
    }

    this.setUser(null);
    await this.router.navigate(['/login']);
  }

  /**
   * Request a password reset email
   *
   * Supabase will send an email with a magic link that redirects to /reset-password
   * The link contains a recovery token that Supabase handles automatically
   *
   * @param email - User's email address
   */
  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`
    });

    if (error) {
      throw new Error(this.getErrorMessage(error.message));
    }
  }

  /**
   * Update user's password (called after clicking reset link)
   *
   * This method is called when the user submits a new password on the reset page.
   * Supabase automatically handles the recovery token from the URL.
   *
   * @param newPassword - The new password to set
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabaseService.client.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(this.getErrorMessage(error.message));
    }

    // Sign out after password change so user can log in with new password
    await this.supabaseService.client.auth.signOut();
    this.setUser(null);
  }

  /**
   * Update the user's questionnaire completion status
   */
  markQuestionnaireComplete(): void {
    const user = this.currentUser();
    if (user) {
      user.hasCompletedQuestionnaire = true;
      user.updatedAt = new Date();

      if (!this.USE_REAL_AUTH) {
        // Dummy mode: Update localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      }

      this.setUser(user);
    }
  }

  /**
   * Helper to set user in both BehaviorSubject and signal
   */
  private setUser(user: User | null): void {
    this.userSubject.next(user);
    this.currentUser.set(user);
  }

  /**
   * Map Supabase user to our User model
   * Fetches is_admin flag from profiles table
   */
  private async mapSupabaseUserToUser(supabaseUser: any, displayName?: string): Promise<User> {
    // Fetch is_admin from profiles table
    let isAdmin = false;
    if (this.USE_REAL_AUTH) {
      const { data } = await this.supabaseService.client
        .from('profiles')
        .select('is_admin')
        .eq('id', supabaseUser.id)
        .single();
      isAdmin = data?.is_admin ?? false;
    }

    return {
      uid: supabaseUser.id,
      email: supabaseUser.email || '',
      displayName: displayName || supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || 'User',
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(),
      emailVerified: !!supabaseUser.email_confirmed_at,
      hasCompletedQuestionnaire: supabaseUser.user_metadata?.hasCompletedQuestionnaire || false,
      isMatched: supabaseUser.user_metadata?.isMatched || false,
      isAdmin,
      preferences: {
        notifications: true,
        emailUpdates: true
      }
    };
  }

  /**
   * Check if current user has verified their email
   */
  isEmailVerified(): boolean {
    const user = this.currentUser();
    return user?.emailVerified ?? false;
  }

  /**
   * Convert error messages to user-friendly text
   */
  private getErrorMessage(errorMessage: string): string {
    // Handle common Supabase error messages
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Invalid email or password.';
    }
    if (errorMessage.includes('Email not confirmed')) {
      return 'Please confirm your email before logging in.';
    }
    if (errorMessage.includes('User already registered')) {
      return 'This email is already registered. Please log in instead.';
    }
    if (errorMessage.includes('Password should be')) {
      return 'Password is too weak. Please use at least 6 characters.';
    }

    return errorMessage || 'An error occurred. Please try again.';
  }
}
