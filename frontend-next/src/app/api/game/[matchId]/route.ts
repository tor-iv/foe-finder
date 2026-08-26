import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { matches, guessRounds } from '@/db/schema';
import { getServerSession } from '@/lib/auth-server';
import { computeScore } from '@/lib/game';
import type { GuessRound, GuessRoundStats } from '@/types';

// In-memory token bucket: 5 new questions per 60s per user. Lower than the
// old chat limit — posing a question is a heavier action than a chat message.
const buckets = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (buckets.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_PER_WINDOW) {
    buckets.set(userId, timestamps);
    return true;
  }
  timestamps.push(now);
  buckets.set(userId, timestamps);
  return false;
}

async function requireParticipant(matchId: string) {
  const session = await getServerSession();
  if (!session?.user) return null;

  const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
  if (!match) return null;
  if (match.user1Id !== session.user.id && match.user2Id !== session.user.id) return null;

  return { userId: session.user.id, match };
}

function redact(row: typeof guessRounds.$inferSelect, viewerId: string): GuessRound {
  const isAsker = row.askerId === viewerId;
  const answered = row.actualValue !== null;

  const status = answered ? 'revealed' : isAsker ? 'pending_them' : 'pending_you';
  const hideGuess = !isAsker && !answered;

  return {
    id: row.id,
    questionText: row.questionText,
    guessValue: hideGuess ? null : row.guessValue,
    actualValue: row.actualValue,
    points: answered ? computeScore(row.guessValue, row.actualValue!) : null,
    viewerRole: isAsker ? 'asker' : 'answerer',
    status,
    createdAt: row.createdAt,
    answeredAt: row.answeredAt,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const auth = await requireParticipant(matchId);
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = db
    .select()
    .from(guessRounds)
    .where(eq(guessRounds.matchId, matchId))
    .orderBy(desc(guessRounds.createdAt))
    .all();

  const rounds = rows.map((row) => redact(row, auth.userId));

  const revealedPoints = rounds
    .filter((r) => r.points !== null)
    .map((r) => r.points as number);

  const stats: GuessRoundStats = {
    roundsPlayed: revealedPoints.length,
    totalPoints: revealedPoints.reduce((sum, p) => sum + p, 0),
    avgPoints: revealedPoints.length
      ? revealedPoints.reduce((sum, p) => sum + p, 0) / revealedPoints.length
      : 0,
  };

  return NextResponse.json({ rounds, stats });
}

const createSchema = z.object({
  questionText: z.string().trim().min(3).max(300),
  guessValue: z.number().int().min(1).max(7),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const auth = await requireParticipant(matchId);
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (rateLimited(auth.userId)) {
    return NextResponse.json(
      { error: 'Too many questions, slow down' },
      { status: 429 }
    );
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const answererId =
    auth.match.user1Id === auth.userId ? auth.match.user2Id : auth.match.user1Id;

  const inserted = db
    .insert(guessRounds)
    .values({
      matchId,
      askerId: auth.userId,
      answererId,
      questionText: parsed.data.questionText,
      guessValue: parsed.data.guessValue,
    })
    .returning()
    .get();

  return NextResponse.json({ round: redact(inserted, auth.userId) });
}
