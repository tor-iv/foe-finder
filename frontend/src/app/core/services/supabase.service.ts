import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * SupabaseService - Singleton service providing the Supabase client
 *
 * This service creates a single instance of the Supabase client that can be
 * injected throughout the application. The client handles:
 * - Authentication (sign up, sign in, sign out)
 * - Database operations (Postgres via Supabase)
 * - Real-time subscriptions
 *
 * The client is configured using environment variables for the Supabase URL
 * and anonymous key, which are safe to expose in the frontend.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // createClient initializes the Supabase client with your project URL and anon key
    // The anon key is safe to use in the browser - it's rate limited and requires
    // Row Level Security (RLS) policies for data protection
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  /**
   * Returns the Supabase client instance
   * Use this to access auth, database, storage, etc.
   *
   * Example usage:
   *   const { data, error } = await supabaseService.client.from('users').select()
   *   const { data: user } = await supabaseService.client.auth.signUp({...})
   */
  get client(): SupabaseClient {
    return this.supabase;
  }
}
