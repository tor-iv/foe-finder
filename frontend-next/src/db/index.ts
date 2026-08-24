import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as authSchema from "./auth-schema";
import * as appSchema from "./schema";

const dbPath = process.env.DB_PATH ?? "./data/foefinder.db";
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema: { ...authSchema, ...appSchema } });
export const schema = { ...authSchema, ...appSchema };
