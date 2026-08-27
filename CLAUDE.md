# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FoeFinder** (foefinder.me) is a social matching app that connects people with opposite opinions. Unlike traditional matching apps that find similarities, FoeFinder maximizes opinion differences to facilitate diverse conversations.

## Active Frontends

The project has **two frontend implementations**:

### Next.js Frontend (primary, in development)
```bash
cd frontend-next
bun install           # Install dependencies
bun run dev           # Dev server at http://localhost:3000
bun run build         # Production build
bun run lint          # Run ESLint
bun run test          # Run Playwright tests
bun run test:ui       # Playwright test UI
bun run test:headed   # Headed browser tests
```

**Stack:** Next.js 16, React 19, Better Auth (email/password + 2FA), SQLite (better-sqlite3 + Drizzle), Resend (transactional email), TanStack Query, Zustand, Tailwind CSS 4, shadcn/ui (Radix), Framer Motion

**Note:** `bun run dev` fails — better-sqlite3 native bindings don't load under Bun's runtime. Use `npx next dev` (Node) for the dev server; `bun` works fine for install/lint/test commands.

### Angular Frontend (legacy)
```bash
cd frontend
bun install           # Install dependencies
bun start             # Dev server at http://localhost:4200
bun run build         # Production build
bun run test          # Run Jasmine/Karma tests
```

**Stack:** Angular 20, Angular Material, Supabase JS client

### Rust Matching Engine
```bash
cd rust-matcher
cargo test                      # Run tests
cargo test -- --nocapture       # Tests with output
wasm-pack build --target web    # Build WASM for browser
wasm-pack build --target nodejs # Build for Node.js
```

## Architecture

### Backend: Self-hosted (migrated off Supabase/Vercel, Aug 2026)
- **Auth**: Better Auth (`src/lib/auth.ts`) — email/password with required email verification, TOTP 2FA. Verification/reset emails via Resend from noreply@foefinder.me.
- **Database**: SQLite via better-sqlite3 + Drizzle (`src/db/`, auth tables in `src/db/auth-schema.ts`). `DB_PATH` env var, migrations in `drizzle/`, `npx tsx scripts/migrate.ts`.
- **Deploy**: Docker on the Hetzner box (5.161.201.101). Compose service `foefinder` lives in `/opt/fieldhouse/docker-compose.yml`, env in `/opt/foefinder/.env`, repo checkout at `/opt/foefinder`. Caddy fronts https://foefinder.me. Deploy = server-side `git pull` + `docker compose build foefinder && docker compose up -d --force-recreate foefinder`.

Key tables: `user`, `session`, `verification`, `two_factor` (Better Auth), plus `questions`, `responses`, `matches`, `guess_rounds` (game).

### Test fixtures
`npx tsx scripts/seed-e2e-fixtures.ts` (against a running dev server) creates two verified, maximally-opposed users (nemesis-a/b@foefinder.test) and triggers a match; `scripts/verify-test-user.ts <email>` flips email_verified directly in SQLite. Playwright visual specs in `tests/visual/` shoot every screen at desktop+mobile into `polish-shots/`.

### Matching Algorithm (Rust → WASM)
- `lib.rs`: Core User/Match structs, ScoringStrategy trait, WASM bindings
- `scoring.rs`: SimpleDifferenceScorer, EuclideanDistanceScorer, WeightedScorer, PolarizationScorer
- `matching.rs`: GreedyMatcher algorithm

Calculates sum of absolute differences between users' 1-7 scale responses; higher scores = more opposite opinions.

### Data Flow
```
User completes questionnaire (1-7 scale)
  → Responses stored in Supabase
  → Rust WASM matcher calculates opposition scores
  → Users matched with maximum difference scores
```

## Environment Configuration

### Next.js (`frontend-next/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Angular (`frontend/.env`)
```
NG_APP_SUPABASE_URL=https://your-project.supabase.co
NG_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Deployment

- Self-hosted on Hetzner (see Architecture above). No Vercel/Supabase — `vercel.json`, `supabase/`, and `supabase-schema.sql` are legacy artifacts.

## Important Notes

### Angular Package Versions
All `@angular/*` packages must be the same version (currently ^20.3.0). Mismatches cause peer dependency errors.

### Design System
The app uses a dark "Nemesis" theme - see `frontend/THEME.md` for CSS variables, color palette, and component styles. Key accent color: `#e94560` (pink-red).

### Questionnaire Format
Questions use a 1-7 Likert scale with categories (social, opinions, lifestyle). See seed data in `supabase-schema.sql` for current question bank.

## Learning Goals

The developer is learning the full stack. When implementing:
1. Explain what code does and why patterns are used
2. Quiz periodically to reinforce concepts
3. Suggest hands-on modifications to deepen understanding
4. Use `TODO(human)` comments for areas requiring developer implementation
