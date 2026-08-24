import { describe, test, expect } from 'bun:test';
import { scoreDifference, greedyMatch } from './matching';

// Fixture values ported directly from rust-matcher/src/scoring.rs's
// #[cfg(test)] module for SimpleDifferenceScorer, to prove numeric
// equivalence with the Rust reference implementation.
describe('scoreDifference (SimpleDifferenceScorer port)', () => {
  test('identical users score 0', () => {
    expect(scoreDifference([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])).toBe(0);
  });

  test('maximum opposition: all 1s vs all 7s scores 30', () => {
    expect(scoreDifference([1, 1, 1, 1, 1], [7, 7, 7, 7, 7])).toBe(30);
  });

  test('mixed responses score 15', () => {
    // |1-7| + |7-1| + |3-5| + |5-4| = 6 + 6 + 2 + 1 = 15
    expect(scoreDifference([1, 7, 3, 5], [7, 1, 5, 4])).toBe(15);
  });

  test('is symmetric', () => {
    const a = [1, 5, 2, 7];
    const b = [6, 2, 7, 1];
    expect(scoreDifference(a, b)).toBe(scoreDifference(b, a));
  });

  test('throws on mismatched lengths', () => {
    expect(() => scoreDifference([1, 2], [1, 2, 3])).toThrow();
  });
});

describe('greedyMatch', () => {
  test('returns no matches for fewer than 2 users', () => {
    expect(greedyMatch([])).toEqual([]);
    expect(greedyMatch([{ id: 'a', responses: [1, 2] }])).toEqual([]);
  });

  test('pairs the two most-opposite users first', () => {
    const users = [
      { id: 'a', responses: [1, 1, 1, 1, 1] },
      { id: 'b', responses: [7, 7, 7, 7, 7] }, // opposite of a: score 30
      { id: 'c', responses: [4, 4, 4, 4, 4] },
      { id: 'd', responses: [4, 4, 4, 4, 5] }, // near c: low score
    ];

    const matches = greedyMatch(users);
    expect(matches).toHaveLength(2);

    const abMatch = matches.find(
      (m) => (m.user1Id === 'a' && m.user2Id === 'b') || (m.user1Id === 'b' && m.user2Id === 'a')
    );
    expect(abMatch?.score).toBe(30);
  });

  test('leaves one user unmatched when the pool is odd', () => {
    const users = [
      { id: 'a', responses: [1, 1, 1] },
      { id: 'b', responses: [7, 7, 7] },
      { id: 'c', responses: [4, 4, 4] },
    ];

    const matches = greedyMatch(users);
    expect(matches).toHaveLength(1);

    const matchedIds = new Set(matches.flatMap((m) => [m.user1Id, m.user2Id]));
    expect(matchedIds.size).toBe(2);
  });

  test('every user appears in at most one match', () => {
    const users = Array.from({ length: 9 }, (_, i) => ({
      id: `u${i}`,
      responses: [i % 7, (i * 3) % 7, (i * 5) % 7],
    }));

    const matches = greedyMatch(users);
    const seen = new Set<string>();
    for (const m of matches) {
      expect(seen.has(m.user1Id)).toBe(false);
      expect(seen.has(m.user2Id)).toBe(false);
      seen.add(m.user1Id);
      seen.add(m.user2Id);
    }
  });
});
