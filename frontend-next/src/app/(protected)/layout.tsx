import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase-server';
import { ProtectedLayoutClient } from './layout-client';

async function validateSession() {
  try {
    const user = await getServerUser();
    return user;
  } catch (error) {
    console.error('Protected layout error:', error);
    return null;
  }
}

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await validateSession();

  // Full session validation (proxy only checked cookie existence)
  if (!user) {
    redirect('/login');
  }

  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
