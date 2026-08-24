import { NextResponse } from 'next/server';
import { eq, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { responses, questions, matches } from '@/db/schema';
import { getServerSession } from '@/lib/auth-server';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const myResponses = db
    .select({ questionId: responses.questionId, value: responses.value, text: questions.text })
    .from(responses)
    .innerJoin(questions, eq(questions.id, responses.questionId))
    .where(eq(responses.userId, userId))
    .all();

  const extremeOpinions = myResponses
    .filter((r) => r.value === 1 || r.value === 7)
    .slice(0, 3)
    .map((r) => ({ questionId: r.questionId, text: r.text, value: r.value }));

  const questionAverages = db
    .select({
      questionId: responses.questionId,
      avgValue: sql<number>`avg(${responses.value})`,
    })
    .from(responses)
    .groupBy(responses.questionId)
    .all();
  const avgByQuestion = new Map(questionAverages.map((r) => [r.questionId, r.avgValue]));

  const disagreementCount = myResponses.filter((r) => {
    const avg = avgByQuestion.get(r.questionId);
    return avg !== undefined && Math.abs(r.value - avg) >= 3;
  }).length;
  const disagreementPercentage =
    myResponses.length > 0 ? Math.round((disagreementCount / myResponses.length) * 100) : 0;

  const match = db
    .select({ id: matches.id })
    .from(matches)
    .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
    .get();

  return NextResponse.json({
    extremeOpinions,
    disagreementPercentage,
    hasResponses: myResponses.length > 0,
    isMatched: !!match,
  });
}
