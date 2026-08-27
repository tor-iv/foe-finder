import Database from "better-sqlite3";

const dbPath = process.env.DB_PATH ?? "./data/foefinder.db";
const emails = process.argv.slice(2);
if (emails.length === 0) {
  console.error("Usage: tsx scripts/verify-test-user.ts <email> [email...]");
  process.exit(1);
}

const sqlite = new Database(dbPath);
for (const email of emails) {
  const result = sqlite
    .prepare(`UPDATE user SET email_verified = 1 WHERE email = ?`)
    .run(email);
  console.log(`${email}: updated ${result.changes} row(s)`);
}
sqlite.close();
