# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FoeFinder** (foefinder.me) is a matchmaking app that connects people with opposite opinions. Unlike traditional matching apps that find similarities, this project maximizes opinion differences to facilitate diverse conversations and challenge echo chambers.

## Current Status

- ✅ **Working**: Angular 20 frontend with Supabase auth, questionnaire system, user profiles
- ✅ **Working**: Rust matching engine (WebAssembly)
- ⏳ **Planned**: Ionic/Capacitor migration for mobile, Cloud Functions for matching triggers

## Development Commands

### Frontend (Angular)
```bash
cd frontend

npm install          # Install dependencies
npm start            # Dev server at http://localhost:4200
npm run build        # Production build to dist/frontend/browser/
npm test             # Run Jasmine/Karma tests
npm run watch        # Dev build with watch mode
```

### Rust Matching Engine
```bash
cd rust-matcher

cargo test                      # Run tests
cargo test -- --nocapture       # Run tests with output
wasm-pack build --target web    # Build for browser (WebAssembly)
wasm-pack build --target nodejs # Build for Node.js/Cloud Functions
cargo check                     # Check code without building
```

### Deployment
Vercel auto-deploys from `main` branch. Configuration in `/vercel.json`.

## Architecture

### Frontend (`frontend/src/app/`)
```
app/
├── core/
│   ├── services/       # AuthService, SupabaseService, QuestionnaireService
│   ├── guards/         # AuthGuard (route protection)
│   └── models/         # User, Match, Questionnaire, Response interfaces
├── features/
│   ├── auth/           # Login, Register components
│   ├── questionnaire/  # 1-7 scale questionnaire
│   ├── results/        # Match results display
│   └── profile/        # User profile
└── shared/components/  # Navbar, reusable UI
```

**Key patterns:**
- Standalone components (no NgModules)
- Services use `providedIn: 'root'`
- Lazy-loaded routes in `app.routes.ts`
- Auth has dual mode: real Supabase or dummy localStorage (controlled by `environment.features.useRealAuth`)

### Rust Matcher (`rust-matcher/src/`)
- **lib.rs**: WASM bindings, User/Match structs, ScoringStrategy trait
- **scoring.rs**: SimpleDifferenceScorer, EuclideanDistanceScorer, WeightedScorer, PolarizationScorer
- **matching.rs**: GreedyMatcher algorithm

**Matching algorithm**: Calculates sum of absolute differences between users' 1-7 scale responses; higher scores = more opposite opinions.

### Data Flow
```
User completes questionnaire (1-7 scale)
  → Responses stored in Supabase
  → Rust WASM matcher calculates opposition scores
  → Users matched with maximum difference scores
```

## Important Notes

### Angular Package Versions
All `@angular/*` packages must be the same version. Version mismatches cause npm peer dependency errors.

### Auth Modes
Toggle `environment.features.useRealAuth` in `frontend/src/environments/environment.ts`:
- `false`: Dummy mode using localStorage (no Supabase needed)
- `true`: Real Supabase auth (requires valid credentials)

### File Naming
- Components: `name.component.ts`
- Services: `name.service.ts`
- Models: `name.model.ts`
- Guards: `name.guard.ts`

## Learning Goals

The developer is learning the full stack. When implementing:
1. Explain what code does and why patterns are used
2. Quiz periodically to reinforce concepts
3. Suggest hands-on modifications to deepen understanding
4. Use `TODO(human)` comments to mark areas for developer implementation

## Related Documentation

- `IONIC_MIGRATION.md` - Planned Ionic/Capacitor mobile migration
- `FIREBASE_IMPLEMENTATION_PLAN.md` - Cloud Functions integration plan
- `frontend/QUICKSTART.md` - Environment setup guide
