import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { matches, messages } from '@/db/schema';
import { getServerSession } from '@/lib/auth-server';

// In-memory token bucket: 10 messages per 10s per user. Fine at this scale
// (single container, no Redis) — resets on deploy, which is an acceptable
// tradeoff for a friends-scale chat feature.
const buckets = new Map<string, number[]>();
const WINDOW_MS = 10_000;
const MAX_PER_WINDOW = 10;

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
    .from(messages)
    .where(eq(messages.matchId, matchId))
    .orderBy(asc(messages.createdAt))
    .all();

  return NextResponse.json({ messages: rows });
}

const sendSchema = z.object({
  body: z.string().trim().min(1).max(2000),
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
    return NextResponse.json({ error: 'Too many messages, slow down' }, { status: 429 });
  }

  const parsed = sendSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
  }

  const inserted = db
    .insert(messages)
    .values({ matchId, senderId: auth.userId, body: parsed.data.body })
    .returning()
    .get();

  return NextResponse.json({ message: inserted });
}
