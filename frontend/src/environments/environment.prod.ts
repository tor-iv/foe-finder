/**
 * Production environment configuration
 *
 * Environment variables are loaded from Vercel via @ngx-env/builder.
 * Set these in Vercel dashboard:
 *   NG_APP_SUPABASE_URL=https://your-project.supabase.co
 *   NG_APP_SUPABASE_ANON_KEY=your-anon-key
 */

declare const process: { env: Record<string, string> };

export const environment = {
  production: true,

  // Supabase configuration - loaded from Vercel environment variables
  supabase: {
    url: process.env['NG_APP_SUPABASE_URL'] || '',
    anonKey: process.env['NG_APP_SUPABASE_ANON_KEY'] || ''
  },

  // Feature flags
  features: {
    useRealAuth: true,
    // Geo-fence to NYC area only (set to true when ready to enforce)
    geoFenceEnabled: false
  }
};
