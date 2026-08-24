// TypeScript port of rust-matcher's SimpleDifferenceScorer + GreedyMatcher
// (rust-matcher/src/scoring.rs, rust-matcher/src/matching.rs). The Rust crate
// has no #[wasm_bindgen] exports, so wiring up real WASM would mean writing
// the binding layer from scratch for ~15 lines of math that only needs to
// run once per admin click over a few hundred users — not worth it at this
// scale. This file is unit-tested against the Rust crate's exact fixture
// values (see matching.test.ts) as an equivalence check.

export interface MatchCandidate {
  id: string;
  responses: number[];
}

export interface MatchResult {
  user1Id: string;
  user2Id: string;
  score: number;
}

/** Sum of absolute differences between two users' responses. */
export function scoreDifference(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Users must have same number of responses');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
}

/**
 * Greedy matcher: score all pairs (O(n^2)), sort by opposition score
 * descending, then greedily pair off the highest-scoring pairs where both
 * users are still unmatched. Leaves one user unmatched if the pool is odd
 * — that's "still searching," not an error.
 */
export function greedyMatch(users: MatchCandidate[]): MatchResult[] {
  if (users.length < 2) return [];

  const pairs: { i: number; j: number; score: number }[] = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      pairs.push({ i, j, score: scoreDifference(users[i].responses, users[j].responses) });
    }
  }

  pairs.sort((a, b) => b.score - a.score);

  const matched = new Set<string>();
  const matches: MatchResult[] = [];

  for (const { i, j, score } of pairs) {
    const idA = users[i].id;
    const idB = users[j].id;

    if (!matched.has(idA) && !matched.has(idB)) {
      matched.add(idA);
      matched.add(idB);
      matches.push({ user1Id: idA, user2Id: idB, score });
    }
  }

  return matches;
}
