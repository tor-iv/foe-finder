/**
 * Seeds two verified, maximally-opposed test users against a RUNNING dev server
 * and triggers a match, so /game and /results have real state for UI passes.
 *
 * Usage: npx tsx scripts/seed-e2e-fixtures.ts [baseUrl]
 * Requires: nemesis-b@foefinder.test in ADMIN_EMAILS (for the match trigger).
 */
const base = process.argv[2] ?? "http://localhost:3000";
const PASSWORD = "nemesis-pass-1";

type UserSpec = { email: string; name: string; answer: number };
const USERS: UserSpec[] = [
  { email: "nemesis-a@foefinder.test", name: "Nemesis A", answer: 1 },
  { email: "nemesis-b@foefinder.test", name: "Nemesis B", answer: 7 },
];

async function signUp(u: UserSpec): Promise<string> {
  const res = await fetch(`${base}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: base },
    body: JSON.stringify({ email: u.email, password: PASSWORD, name: u.name }),
  });
  if (!res.ok && res.status !== 422) {
    throw new Error(`sign-up ${u.email}: ${res.status} ${await res.text()}`);
  }
  return res.status === 422 ? "exists" : "created";
}

async function signIn(u: UserSpec): Promise<string> {
  const res = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: base },
    body: JSON.stringify({ email: u.email, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`sign-in ${u.email}: ${res.status} ${await res.text()}`);
  const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  if (!cookie) throw new Error(`no session cookie for ${u.email}`);
  return cookie;
}

async function answerAll(cookie: string, value: number) {
  const qRes = await fetch(`${base}/api/questionnaire`, { headers: { cookie } });
  if (!qRes.ok) throw new Error(`GET questionnaire: ${qRes.status}`);
  const { questions } = (await qRes.json()) as { questions: { id: number }[] };
  const answers = questions.map((q) => ({ questionId: q.id, value }));
  const pRes = await fetch(`${base}/api/questionnaire`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: base, cookie },
    body: JSON.stringify({ answers }),
  });
  if (!pRes.ok) throw new Error(`POST questionnaire: ${pRes.status} ${await pRes.text()}`);
  return questions.length;
}

async function main() {
  for (const u of USERS) console.log(`${u.email}: ${await signUp(u)}`);

  // email_verified must be set before sign-in (requireEmailVerification)
  const { execSync } = await import("node:child_process");
  execSync(`npx tsx scripts/verify-test-user.ts ${USERS.map((u) => u.email).join(" ")}`, {
    stdio: "inherit",
  });

  const cookies: string[] = [];
  for (const u of USERS) {
    const cookie = await signIn(u);
    cookies.push(cookie);
    const n = await answerAll(cookie, u.answer);
    console.log(`${u.email}: answered ${n} questions with ${u.answer}s`);
  }

  const matchRes = await fetch(`${base}/api/admin/match`, {
    method: "POST",
    headers: { origin: base, cookie: cookies[1] },
  });
  console.log(`admin match: ${matchRes.status} ${await matchRes.text()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
