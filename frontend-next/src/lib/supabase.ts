import { createBrowserClient } from '@supabase/ssr';

// Singleton browser client
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}

// For convenience - direct export
export const supabase = getSupabaseClient();
