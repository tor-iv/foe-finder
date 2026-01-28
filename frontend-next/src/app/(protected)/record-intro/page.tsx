import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase-server';
import RecordIntroClient from './record-intro-client';

export default async function RecordIntroPage() {
  const user = await getServerUser();

  if (!user?.email_confirmed_at) {
    redirect('/login?message=verify-email');
  }

  return <RecordIntroClient />;
}
