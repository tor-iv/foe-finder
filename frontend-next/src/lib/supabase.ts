import { createBrowserClient } from '@supabase/ssr';

// Singleton browser client
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
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

// Lazy getter - only initializes when accessed at runtime
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof ReturnType<typeof createBrowserClient>];
  },
});
