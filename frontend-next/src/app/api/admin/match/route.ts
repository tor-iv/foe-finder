import { NextResponse } from 'next/server';
import { eq, inArray, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { questions, responses, matches } from '@/db/schema';
import { user } from '@/db/auth-schema';
import { getServerSession } from '@/lib/auth-server';
import { greedyMatch, type MatchCandidate } from '@/lib/matching';

async function requireAdmin() {
  const session = await getServerSession();
  if (!session?.user) return null;

  // Re-read from the DB rather than trusting the session claim.
  const row = db.select().from(user).where(eq(user.id, session.user.id)).get();
  return row?.isAdmin ? row : null;
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const activeQuestions = db
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.active, true))
    .orderBy(asc(questions.sortOrder))
    .all();
  const activeQuestionIds = activeQuestions.map((q) => q.id);

  if (activeQuestionIds.length === 0) {
    return NextResponse.json({ error: 'No active questions configured' }, { status: 400 });
  }

  const completedUsers = db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.hasCompletedQuestionnaire, true))
    .all();

  if (completedUsers.length === 0) {
    return NextResponse.json({ created: 0, stillSearching: 0 });
  }

  const existingMatches = db.select().from(matches).all();
  const alreadyMatched = new Set(existingMatches.flatMap((m) => [m.user1Id, m.user2Id]));

  const unmatchedUserIds = completedUsers
    .map((u) => u.id)
    .filter((id) => !alreadyMatched.has(id));

  if (unmatchedUserIds.length < 2) {
    return NextResponse.json({ created: 0, stillSearching: unmatchedUserIds.length });
  }

  const allResponses = db
    .select()
    .from(responses)
    .where(inArray(responses.userId, unmatchedUserIds))
    .all();

  const responsesByUser = new Map<string, Map<number, number>>();
  for (const r of allResponses) {
    if (!responsesByUser.has(r.userId)) responsesByUser.set(r.userId, new Map());
    responsesByUser.get(r.userId)!.set(r.questionId, r.value);
  }

  // Only match users who have answered every currently-active question —
  // guards against drift if the question set changed after they submitted.
  const candidates: MatchCandidate[] = [];
  for (const id of unmatchedUserIds) {
    const answerMap = responsesByUser.get(id);
    if (!answerMap) continue;
    const ordered = activeQuestionIds.map((qId) => answerMap.get(qId));
    if (ordered.some((v) => v === undefined)) continue;
    candidates.push({ id, responses: ordered as number[] });
  }

  if (candidates.length < 2) {
    return NextResponse.json({ created: 0, stillSearching: candidates.length });
  }

  const questionRows = db
    .select()
    .from(questions)
    .where(inArray(questions.id, activeQuestionIds))
    .all();
  const questionTextById = new Map(questionRows.map((q) => [q.id, q.text]));
  const responsesById = new Map(candidates.map((c) => [c.id, c.responses]));

  const results = greedyMatch(candidates);

  db.transaction((tx) => {
    for (const m of results) {
      const [user1Id, user2Id] =
        m.user1Id < m.user2Id ? [m.user1Id, m.user2Id] : [m.user2Id, m.user1Id];

      const v1 = responsesById.get(user1Id)!;
      const v2 = responsesById.get(user2Id)!;

      const topDifferences = activeQuestionIds
        .map((qId, idx) => ({
          questionId: qId,
          questionText: questionTextById.get(qId) ?? '',
          user1Value: v1[idx],
          user2Value: v2[idx],
          diff: Math.abs(v1[idx] - v2[idx]),
        }))
        .sort((a, b) => b.diff - a.diff)
        .slice(0, 3)
        .map(({ questionId, questionText, user1Value, user2Value }) => ({
          questionId,
          questionText,
          user1Value,
          user2Value,
        }));

      tx.insert(matches)
        .values({
          id: nanoid(),
          user1Id,
          user2Id,
          oppositionScore: m.score,
          topDifferences: JSON.stringify(topDifferences),
        })
        .run();
    }
  });

  const matchedCount = results.length * 2;
  const stillSearching = candidates.length - matchedCount;

  return NextResponse.json({ created: results.length, stillSearching });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const totalUsers = db.select({ id: user.id }).from(user).all().length;
  const completed = db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.hasCompletedQuestionnaire, true))
    .all().length;
  const allMatches = db.select().from(matches).all();
  const matchedUserCount = new Set(allMatches.flatMap((m) => [m.user1Id, m.user2Id])).size;

  return NextResponse.json({
    totalUsers,
    completedQuestionnaire: completed,
    totalMatches: allMatches.length,
    matchedUsers: matchedUserCount,
    unmatchedCompleted: completed - matchedUserCount,
  });
}
