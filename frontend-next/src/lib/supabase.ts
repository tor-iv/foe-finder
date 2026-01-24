import { createBrowserClient } from '@supabase/ssr';

type SupabaseClient = ReturnType<typeof createBrowserClient>;

// Singleton browser client - created lazily on first access
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Check your Supabase project\'s API settings to find these values: ' +
      'https://supabase.com/dashboard/project/_/settings/api'
    );
  }

  client = createBrowserClient(url, key);
  return client;
}

// Export getter function for explicit initialization
export function getSupabaseClient(): SupabaseClient {
  return getClient();
}

// Lazy proxy that preserves method binding
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getClient();
    const value = client[prop as keyof SupabaseClient];
    // Bind methods to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
