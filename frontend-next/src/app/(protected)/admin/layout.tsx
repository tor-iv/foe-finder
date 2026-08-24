import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { user } from '@/db/auth-schema';
import { getServerSession } from '@/lib/auth-server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/login');
  }

  const row = db.select().from(user).where(eq(user.id, session.user.id)).get();
  if (!row?.isAdmin) {
    redirect('/profile');
  }

  return <>{children}</>;
}
