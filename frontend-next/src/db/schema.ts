import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  category: text("category", {
    enum: ["social", "opinions", "lifestyle"],
  }).notNull(),
  sortOrder: integer("sort_order").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const responses = sqliteTable(
  "responses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id),
    value: integer("value").notNull(),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    uniqueIndex("responses_user_question_unique").on(t.userId, t.questionId),
    index("idx_responses_user").on(t.userId),
    index("idx_responses_question").on(t.questionId),
  ],
);

export const matches = sqliteTable(
  "matches",
  {
    id: text("id").primaryKey(),
    user1Id: text("user1_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    user2Id: text("user2_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    oppositionScore: real("opposition_score").notNull(),
    topDifferences: text("top_differences").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    uniqueIndex("matches_pair_unique").on(t.user1Id, t.user2Id),
    index("idx_matches_user1").on(t.user1Id),
    index("idx_matches_user2").on(t.user2Id),
  ],
);

export const guessRounds = sqliteTable(
  "guess_rounds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    askerId: text("asker_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    answererId: text("answerer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questionText: text("question_text").notNull(),
    guessValue: integer("guess_value").notNull(),
    actualValue: integer("actual_value"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    answeredAt: text("answered_at"),
  },
  (t) => [
    index("idx_guess_rounds_match").on(t.matchId, t.createdAt),
    index("idx_guess_rounds_answerer_pending").on(t.answererId, t.answeredAt),
  ],
);
