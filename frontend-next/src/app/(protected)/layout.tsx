import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase-server';
import { ProtectedLayoutClient } from './layout-client';

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser();

  // Full session validation (proxy only checked cookie existence)
  if (!user) {
    redirect('/login');
  }

  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
