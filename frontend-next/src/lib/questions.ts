export interface QuestionSeed {
  text: string;
  category: "social" | "opinions" | "lifestyle";
  sortOrder: number;
}

// 30 questions, 1-7 Likert scale, ~10/10/10 category split.
// Source: questions-bank.md. Swapped the weakest self-report questions
// ("I've screenshot texts...", "I've judged someone's bookshelf", etc — these
// measure honesty/behavior more than opinion, which is a weaker signal for
// opposite-matching) for more divisive hot takes from the bank's idea list.
export const QUESTION_SEEDS: QuestionSeed[] = [
  { text: 'Typing "..." is more threatening than a period', category: "social", sortOrder: 1 },
  { text: "You're not a real New Yorker until you've lived here 5+ years", category: "social", sortOrder: 2 },
  { text: "Couples who share a social media account are hiding something", category: "opinions", sortOrder: 3 },
  { text: "People who back into parking spots are trying too hard", category: "opinions", sortOrder: 4 },
  { text: "$20 cocktails are worth it for the vibe", category: "lifestyle", sortOrder: 5 },
  { text: "Watching someone's story without following them is research, not stalking", category: "social", sortOrder: 6 },
  { text: "Living in a shoebox is worth it for the location", category: "lifestyle", sortOrder: 7 },
  { text: "Leaving someone on 'delivered' is a power move", category: "social", sortOrder: 8 },
  { text: "Astrology is harmless fun, not a personality", category: "lifestyle", sortOrder: 9 },
  { text: "People who say 'let's hang soon!' never mean it", category: "social", sortOrder: 10 },
  { text: "First dates should have a hard 90-minute limit", category: "lifestyle", sortOrder: 11 },
  { text: "Eating alone in public is underrated", category: "opinions", sortOrder: 12 },
  { text: "Gym selfies are always cringe", category: "lifestyle", sortOrder: 13 },
  { text: "Main character syndrome is fine actually", category: "opinions", sortOrder: 14 },
  { text: "Read receipts should be illegal", category: "social", sortOrder: 15 },
  { text: "Splitting the bill on dates is the only fair option", category: "lifestyle", sortOrder: 16 },
  { text: "Watching TV on 1.5x speed is valid", category: "opinions", sortOrder: 17 },
  { text: "Talking stages longer than a month are a red flag", category: "lifestyle", sortOrder: 18 },
  { text: "Standing at concerts is overrated", category: "opinions", sortOrder: 19 },
  { text: "Dating apps have actually improved dating", category: "opinions", sortOrder: 20 },
  { text: "It's okay to end things over text", category: "social", sortOrder: 21 },
  { text: "Going to bed before 11pm is peak adulthood", category: "lifestyle", sortOrder: 22 },
  { text: "Voice notes over 30 seconds are inconsiderate", category: "social", sortOrder: 23 },
  { text: "Brunch is just expensive breakfast with permission to drink", category: "opinions", sortOrder: 24 },
  { text: "Therapy speak has ruined normal conversations", category: "social", sortOrder: 25 },
  { text: "You should be embarrassed if you can't cook by 25", category: "opinions", sortOrder: 26 },
  { text: "Remote work is making us worse at being people", category: "opinions", sortOrder: 27 },
  { text: "Being single in your late 20s is underrated", category: "lifestyle", sortOrder: 28 },
  { text: "LinkedIn is just Facebook for people in denial", category: "social", sortOrder: 29 },
  { text: "It's fine to not have your life figured out at 28", category: "lifestyle", sortOrder: 30 },
];
