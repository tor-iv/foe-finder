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
  supabase: {
    url: 'https://olwudfnezboliuftwvtj.supabase.co',
    // TODO: Replace with your anon key from Supabase Dashboard → Settings → API
    anonKey: 'YOUR_ANON_KEY_HERE'
  },

  // Feature flags
  features: {
    // Set to true to use real Supabase authentication
    useRealAuth: true
  }
};
