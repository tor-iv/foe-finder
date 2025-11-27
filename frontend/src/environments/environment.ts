/**
 * Development environment configuration
 *
 * This file contains environment-specific settings. During build,
 * Angular can replace this with environment.prod.ts for production builds.
 *
 * To set up Supabase:
 * 1. Go to https://supabase.com and create a project
 * 2. Go to Project Settings > API
 * 3. Copy the Project URL and anon/public key
 * 4. Replace the placeholder values below
 */

export const environment = {
  production: false,

  // Supabase configuration
  // Replace these with your actual Supabase project values
  supabase: {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-key-here'
  },

  // Feature flags
  features: {
    // Set to true when ready to use real Supabase authentication
    // When false, auth uses localStorage (dummy mode for development)
    useRealAuth: false
  }
};
