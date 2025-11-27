//! Matching algorithms for pairing users with opposite opinions
//!
//! This module implements algorithms to find optimal pairings:
//! - **Greedy**: Fast, approximate solution
//! - **Hungarian**: Optimal, but slower

use crate::{Match, ScoringStrategy, User};
use std::collections::HashSet;

// ============================================================================
// Greedy Matcher
// ============================================================================

/// A greedy matching algorithm that pairs users with maximum opposition
///
/// This matcher is **generic** over the scoring strategy, meaning it can work
/// with ANY scorer that implements the `ScoringStrategy` trait.
///
/// # Generics Deep Dive
///
/// ```rust
/// pub struct GreedyMatcher<S: ScoringStrategy>
///                          ^  ^
///                          |  |
///                          |  └─ Trait bound: S must implement ScoringStrategy
///                          └─ Generic type parameter: S can be ANY type
/// ```
///
/// ## Why Generics?
///
/// Without generics, we'd need separate matchers for each scorer:
/// ```ignore
/// struct SimpleDifferenceGreedyMatcher { ... }
/// struct EuclideanGreedyMatcher { ... }
/// struct PolarizationGreedyMatcher { ... }
/// // Code duplication! 😱
/// ```
///
/// With generics, ONE matcher works with ALL scorers:
/// ```rust
/// use rust_matcher::{GreedyMatcher, SimpleDifferenceScorer, PolarizationScorer};
///
/// let matcher1 = GreedyMatcher::new(SimpleDifferenceScorer);
/// let matcher2 = GreedyMatcher::new(PolarizationScorer::default());
/// // Same GreedyMatcher code, different behavior!
/// ```
///
/// ## Monomorphization
///
/// Rust compiles a SEPARATE version of GreedyMatcher for each scorer type:
/// - `GreedyMatcher<SimpleDifferenceScorer>` → Compiled code #1
/// - `GreedyMatcher<PolarizationScorer>` → Compiled code #2
///
/// **Zero runtime cost!** As fast as hand-written specialized code.
///
/// # Algorithm
///
/// 1. Calculate scores for all possible user pairs: O(n²)
/// 2. Sort pairs by score (highest first): O(n² log n)
/// 3. Greedily select pairs where both users unmatched: O(n²)
///
/// Total: **O(n² log n)**
///
/// # Example
///
/// ```rust
/// use rust_matcher::{User, GreedyMatcher, PolarizationScorer};
///
/// let users = vec![
///     User::new("user1".to_string(), vec![1, 2, 3]).unwrap(),
///     User::new("user2".to_string(), vec![7, 6, 5]).unwrap(),
///     User::new("user3".to_string(), vec![4, 4, 4]).unwrap(),
///     User::new("user4".to_string(), vec![1, 7, 1]).unwrap(),
/// ];
///
/// let scorer = PolarizationScorer::default();
/// let matcher = GreedyMatcher::new(scorer);
///
/// let matches = matcher.find_matches(&users);
/// // Returns Vec<Match> with 2 pairs (4 users = 2 matches)
/// ```
pub struct GreedyMatcher<S: ScoringStrategy> {
    /// The scoring strategy used to calculate opposition between users
    ///
    /// This field is generic - it could be SimpleDifferenceScorer,
    /// PolarizationScorer, or any future scorer you create!
    scorer: S,
}

impl<S: ScoringStrategy> GreedyMatcher<S> {
    /// Create a new greedy matcher with the given scoring strategy
    ///
    /// # Arguments
    /// * `scorer` - Any type that implements ScoringStrategy
    ///
    /// # Example
    /// ```rust
    /// use rust_matcher::{GreedyMatcher, SimpleDifferenceScorer};
    ///
    /// let matcher = GreedyMatcher::new(SimpleDifferenceScorer);
    /// ```
    pub fn new(scorer: S) -> Self {
        GreedyMatcher { scorer }
    }

    /// Find matches for all users using the greedy algorithm
    ///
    /// # Arguments
    /// * `users` - Slice of users to match
    ///
    /// # Returns
    /// * Vector of Match objects (one for each pair)
    /// * If odd number of users, one will be left unmatched
    ///
    /// # Borrowing Note
    /// We take `&[User]` (borrowed slice) rather than `Vec<User>` (owned vector)
    /// because we only need to READ the users, not modify or take ownership.
    pub fn find_matches(&self, users: &[User]) -> Vec<Match> {
        // Handle edge cases
        if users.len() < 2 {
            return Vec::new(); // Can't match 0 or 1 user
        }

        // Step 1: Calculate all possible pair scores
        let mut pairs = self.calculate_all_pairs(users);

        // Step 2: Sort pairs by score (highest opposition first)
        pairs.sort_by(|a, b| {
            // Compare f64 scores (b first for descending order)
            b.2.partial_cmp(&a.2).unwrap_or(std::cmp::Ordering::Equal)
        });

        // Step 3: Greedily select pairs
        self.greedy_select(users, pairs)
    }

    fn calculate_all_pairs(&self, users: &[User]) -> Vec<(usize, usize, f64)> {
        let mut pairs = Vec::new();
        for i in 0..users.len() {
            for j in (i + 1)..users.len() {
                let score = self.scorer.calculate_score(&users[i], &users[j]);
                pairs.push((i, j, score));  // Push tuple
            }
        }
    }

    /// Greedily select pairs from sorted candidates
    ///
    /// Iterates through pairs (sorted by score) and matches users that
    /// haven't been matched yet.
    ///
    /// # Arguments
    /// * `users` - Reference to user slice (for looking up IDs)
    /// * `pairs` - Sorted pairs (highest score first)
    ///
    /// # Returns
    /// * Vec<Match> - Final matched pairs
    fn greedy_select(&self, users: &[User], pairs: Vec<(usize, usize, f64)>) -> Vec<Match> {
        let mut matched: HashSet<String> = HashSet::new();
        let mut matches = Vec::new();

        for (i, j, score) in pairs {
            let user_i_id = &users[i].id;
            let user_j_id = &users[j].id;

            // Check if both users are unmatched
            if !matched.contains(user_i_id) && !matched.contains(user_j_id) {
                // Match them!
                matched.insert(user_i_id.clone());
                matched.insert(user_j_id.clone());

                matches.push(Match::new(
                    user_i_id.clone(),
                    user_j_id.clone(),
                    score,
                ));
            }
        }

        matches
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{SimpleDifferenceScorer, PolarizationScorer};

    #[test]
    fn test_greedy_matcher_creation() {
        let scorer = SimpleDifferenceScorer;
        let _matcher = GreedyMatcher::new(scorer);
        // Just testing it compiles and creates
    }

    // More tests will be added after you implement calculate_all_pairs!
}
