# Supabase Database Migrations

This folder contains SQL migrations for the FoeFinder database schema.

## How to Run Migrations

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run each migration file **in order** (001, 002, 003...)
4. Check the migration tracking table after each run

## Migration Files

| File | Description | Dependencies |
|------|-------------|--------------|
| `001_questionnaire_responses.sql` | Stores user quiz answers | None |
| `002_matches.sql` | Stores matched user pairs | None |
| `003_profiles.sql` | User profiles with status flags | 001, 002 |

## Supabase Dashboard Settings

After running migrations, configure these settings:

### Authentication > Settings
- **Site URL**: `https://foefinder.me`
- **Redirect URLs**:
  - `https://foefinder.me/login`
  - `https://foefinder.me/reset-password`
  - `http://localhost:4200/login` (for local dev)
  - `http://localhost:4200/reset-password` (for local dev)

### Authentication > Email Templates
Customize the confirmation email if desired.

## Schema Overview

```
auth.users (Supabase built-in)
    │
    ├── profiles (1:1)
    │   - display_name
    │   - has_completed_questionnaire
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
