import { NextResponse } from 'next/server';
import { eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { matches } from '@/db/schema';
import { user } from '@/db/auth-schema';
import { getServerSession } from '@/lib/auth-server';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const match = db
    .select()
    .from(matches)
    .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
    .get();

  if (!match) {
    return NextResponse.json({ match: null });
  }

  const isUser1 = match.user1Id === userId;
  const opponentId = isUser1 ? match.user2Id : match.user1Id;
  const opponent = db.select().from(user).where(eq(user.id, opponentId)).get();

  // topDifferences is stored in DB user1Id/user2Id order, which has nothing
  // to do with which side the viewer is on — remap so user1Value always
  // means "the viewer" regardless of DB storage order.
  interface StoredDiff {
    questionId: number;
    questionText: string;
    user1Value: number;
    user2Value: number;
  }
  const storedDifferences: StoredDiff[] = JSON.parse(match.topDifferences);
  const topDifferences = storedDifferences.map((d) => ({
    questionId: d.questionId,
    questionText: d.questionText,
    user1Value: isUser1 ? d.user1Value : d.user2Value,
    user2Value: isUser1 ? d.user2Value : d.user1Value,
  }));

  return NextResponse.json({
    match: {
      id: match.id,
      opponent: { id: opponentId, displayName: opponent?.name ?? 'Unknown' },
      oppositionScore: match.oppositionScore,
      topDifferences,
      createdAt: match.createdAt,
    },
  });
}
