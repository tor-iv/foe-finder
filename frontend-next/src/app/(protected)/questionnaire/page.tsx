import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase-server';
import QuestionnaireClient from './questionnaire-client';

export default async function QuestionnairePage() {
  const user = await getServerUser();

  if (!user?.email_confirmed_at) {
    redirect('/login?message=verify-email');
  }

  return <QuestionnaireClient />;
}
