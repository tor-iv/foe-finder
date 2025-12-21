# Supabase Database Migrations

SQL migrations for the FoeFinder database schema.

## How to Run Migrations

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run each migration file **in order** (001, 002, 003)
4. Verify tables exist in **Table Editor**

## Migration Files

| File | Description | Dependencies |
|------|-------------|--------------|
| `001_questionnaire_responses.sql` | Stores user quiz answers | None |
| `002_matches.sql` | Stores matched user pairs | None |
| `003_profiles.sql` | User profiles with auto-creation trigger | 001, 002 |
| `004_marketing_consent.sql` | Adds marketing consent column | 003 |

## Schema Overview

```
auth.users (Supabase built-in)
    │
    ├── profiles (1:1, auto-created on signup)
    │   - display_name
    │   - has_completed_questionnaire
    │   - marketing_consent
    │   - match_id → matches
    │
    ├── questionnaire_responses (1:1)
    │   - responses (JSONB)
    │   - submitted_at
    │
    └── matches (user can be in user1_id OR user2_id)
        - opposition_score
        - top_differences (JSONB)
```

## Row Level Security (RLS)

All tables have RLS enabled:
- Users can only read/write their own data
- Match viewing is allowed for both users in the pair
- Profile INSERT is allowed for the signup trigger

## Supabase Dashboard Settings

After running migrations, configure:

### Authentication > Settings
- **Site URL**: `https://foefinder.me`
- **Redirect URLs**:
  - `https://foefinder.me/login`
  - `https://foefinder.me/reset-password`
  - `http://localhost:4200/login` (local dev)
  - `http://localhost:4200/reset-password` (local dev)

## Applying Fixes to Existing Database

If you already have the database set up and need to apply updates, run `004_marketing_consent.sql` in SQL Editor. This will:
1. Add the `marketing_consent` column to profiles
2. Update the trigger to save marketing consent from user metadata
