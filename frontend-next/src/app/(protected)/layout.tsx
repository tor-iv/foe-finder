import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import { ProtectedLayoutClient } from './layout-client';

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode
}) {
  const result = await getServerSession();

  // Full session validation (proxy only checked cookie existence)
  if (!result?.user) {
    redirect('/login');
  }

  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
