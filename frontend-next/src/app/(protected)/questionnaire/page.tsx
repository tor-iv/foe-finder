import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import QuestionnaireClient from './questionnaire-client';

export default async function QuestionnairePage() {
  const result = await getServerSession();

  if (!result?.user?.emailVerified) {
    redirect('/login?message=verify-email');
  }

  return <QuestionnaireClient />;
}
