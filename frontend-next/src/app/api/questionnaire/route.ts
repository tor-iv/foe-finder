import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { questions, responses } from '@/db/schema';
import { user } from '@/db/auth-schema';
import { getServerSession } from '@/lib/auth-server';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.active, true))
    .orderBy(asc(questions.sortOrder));

  const existingResponses = await db
    .select()
    .from(responses)
    .where(eq(responses.userId, session.user.id));

  return NextResponse.json({
    questions: activeQuestions,
    responses: existingResponses.map((r) => ({ questionId: r.questionId, value: r.value })),
  });
}

const submitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number().int().positive(),
        value: z.number().int().min(1).max(7),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = submitSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const userId = session.user.id;

  db.transaction((tx) => {
    for (const answer of parsed.data.answers) {
      tx.insert(responses)
        .values({ userId, questionId: answer.questionId, value: answer.value })
        .onConflictDoUpdate({
          target: [responses.userId, responses.questionId],
          set: { value: answer.value, updatedAt: new Date().toISOString() },
        })
        .run();
    }

    tx.update(user)
      .set({ hasCompletedQuestionnaire: true })
      .where(eq(user.id, userId))
      .run();
  });

  return NextResponse.json({ success: true });
}
