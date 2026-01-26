# Home Dashboard Design

## Overview

Personal insights dashboard for logged-in users at `/`. Shows progress, strongest opinions, disagreement rating, and visitor counter. Deadpan, slightly ominous tone.

## Page Structure

```
┌─────────────────────────────────────────┐
│  FOEFINDER logo        [Profile] [Logout]│
├─────────────────────────────────────────┤
│  Welcome back, {name}                   │
│  "The Algorithm has been watching."     │
│                                         │
│  ┌─ YOUR STATUS ────────────────────┐   │
│  │ ✓ Opinions extracted             │   │
│  │ ✓ Voice sample collected         │   │
│  │ ○ Awaiting match assignment      │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌─ YOUR STRONGEST OPINIONS ────────┐   │
│  │ "Question text here"             │   │
│  │  ████████████████░░░░  You: 7    │   │
│  │  "Noted."                        │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌─ YOUR DISAGREEMENT RATING ───────┐   │
│  │          73%                     │   │
│  │  "Excellent foe potential."      │   │
│  └──────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│         👁 1,247 souls observed         │
└─────────────────────────────────────────┘
```

## Components

### 1. Status Card
Checklist showing completion progress.

**States:**
- `has_completed_questionnaire` → "Opinions extracted" / "Opinion extraction required"
- `has_audio_intro` → "Voice sample collected" / "Voice sample pending"
- `match_id` exists → "Match assigned" / "Awaiting match assignment"

Incomplete items link to their respective pages.

### 2. Strongest Opinions Card
Shows 2-3 questions where user answered 1 or 7.

**Deadpan commentary (randomized):**
- "Noted."
- "You feel strongly about this."
- "The Algorithm remembers."
- "Interesting."
- "This has been recorded."

**Fallback:** "You answered cautiously. The Algorithm respects your restraint."

### 3. Disagreement Rating Card
Percentage showing how much user differs from average.

**Logic:** If answer differs by 3+ points from average, count as disagreement.

**Commentary by score:**
- 0-30%: "You blend in. Suspiciously normal."
- 31-50%: "Moderate contrarian tendencies detected."
- 51-70%: "Solid foe potential."
- 71-85%: "Excellent foe potential."
- 86-100%: "You disagree with almost everyone. Impressive."

### 4. Visitor Counter
Footer showing total visitors from `site_stats` table.

Format: "👁 X souls observed"

## Data Requirements

- User profile (from `profiles` table)
- User's questionnaire responses (from `questionnaire_responses` table)
- Average responses per question (computed or cached)
- Site visitor count (from `site_stats` table)

## Files to Create/Modify

- `frontend-next/src/app/(protected)/page.tsx` - New home page (rename existing or create)
- Update navbar logo link to `/`
- Possibly add database function for computing averages
