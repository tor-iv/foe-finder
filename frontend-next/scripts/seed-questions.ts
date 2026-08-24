import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { questions } from "../src/db/schema";
import { QUESTION_SEEDS } from "../src/lib/questions";

const dbPath = process.env.DB_PATH ?? "./data/foefinder.db";
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

for (const seed of QUESTION_SEEDS) {
  const existing = db
    .select()
    .from(questions)
    .where(eq(questions.sortOrder, seed.sortOrder))
    .get();

  if (existing) {
    db.update(questions)
      .set({ text: seed.text, category: seed.category, active: true })
      .where(eq(questions.id, existing.id))
      .run();
  } else {
    db.insert(questions)
      .values({
        text: seed.text,
        category: seed.category,
        sortOrder: seed.sortOrder,
        active: true,
      })
      .run();
  }
}

const count = db.select().from(questions).all().length;
console.log(`Seeded questions table: ${count} active questions.`);
sqlite.close();
