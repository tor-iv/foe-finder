import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { matches, guessRounds } from '@/db/schema';
import { getServerSession } from '@/lib/auth-server';
import { computeScore } from '@/lib/game';

async function requireParticipant(matchId: string) {
  const session = await getServerSession();
  if (!session?.user) return null;

  const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
  if (!match) return null;
  if (match.user1Id !== session.user.id && match.user2Id !== session.user.id) return null;

  return { userId: session.user.id, match };
}

const answerSchema = z.object({
  actualValue: z.number().int().min(1).max(7),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string; roundId: string }> }
) {
  const { matchId, roundId } = await params;
  const auth = await requireParticipant(matchId);
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const round = db
    .select()
    .from(guessRounds)
    .where(and(eq(guessRounds.id, Number(roundId)), eq(guessRounds.matchId, matchId)))
    .get();

  if (!round) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Only the designated answerer may answer — being a match participant
  // isn't enough (the asker is also a participant but must not answer their
  // own question).
  if (round.answererId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (round.actualValue !== null) {
    return NextResponse.json({ error: 'Already answered' }, { status: 409 });
  }

  const parsed = answerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const updated = db
    .update(guessRounds)
    .set({
      actualValue: parsed.data.actualValue,
      answeredAt: new Date().toISOString(),
    })
    .where(eq(guessRounds.id, round.id))
    .returning()
    .get();

  return NextResponse.json({
    round: {
      id: updated.id,
      questionText: updated.questionText,
      guessValue: updated.guessValue,
      actualValue: updated.actualValue,
      points: computeScore(updated.guessValue, updated.actualValue!),
      viewerRole: 'answerer' as const,
      status: 'revealed' as const,
      createdAt: updated.createdAt,
      answeredAt: updated.answeredAt,
    },
  });
}
