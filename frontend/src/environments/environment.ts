/**
 * Development environment configuration
 *
 * Environment variables are loaded from .env file via @ngx-env/builder.
 * Create a .env file in the frontend folder with:
 *   NG_APP_SUPABASE_URL=https://your-project.supabase.co
 *   NG_APP_SUPABASE_ANON_KEY=your-anon-key
 *
 * See .env.example for a template.
 */

declare const process: { env: Record<string, string> };

export const environment = {
  production: false,

  // Supabase configuration - loaded from .env
  supabase: {
    url: process.env['NG_APP_SUPABASE_URL'] || '',
    anonKey: process.env['NG_APP_SUPABASE_ANON_KEY'] || ''
  },

  // Feature flags
  features: {
    // Set to true to use real Supabase authentication
    useRealAuth: true
  }
};
