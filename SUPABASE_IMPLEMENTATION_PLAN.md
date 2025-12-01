# FoeFinder - Supabase Implementation Plan

## Executive Summary

This document outlines the implementation plan for FoeFinder using **Supabase** as the backend. Supabase provides PostgreSQL (relational queries ideal for matching), built-in auth with email verification, Row Level Security, and Edge Functions for the Rust matching engine.

**Timeline**: 1-2 months to production-ready
**Key Features**: Email verification, NYC geofencing, question analytics, user behavior tracking

---

## Why Supabase for FoeFinder?

### Advantages for This Project
✅ **PostgreSQL** - Relational queries perfect for "find users with opposite responses"
✅ **Row Level Security** - Users only see their own data + their matches
✅ **Edge Functions** - Deploy Rust/WASM matching engine as serverless function
✅ **Built-in Auth** - Email verification, magic links, social auth ready
✅ **Real-time** - Live updates when matches are found
✅ **Already Configured** - SDK installed, service structure exists
✅ **Generous Free Tier** - 50K monthly active users, 500MB database

### Considerations
⚠️ **Newer Platform** - Less mature than Firebase (but rapidly improving)
⚠️ **Self-Hosted Option** - Can migrate to self-hosted if needed (no vendor lock-in)

---

## Database Schema

### Core Tables

```sql
-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  photo_url TEXT,

  -- Verification & Location
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  location_verified BOOLEAN DEFAULT FALSE,
  signup_location JSONB, -- {lat, lng, city, verified_at}

  -- Status
  has_completed_questionnaire BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Preferences
  preferences JSONB DEFAULT '{"notifications": true, "emailUpdates": true}'::jsonb,

  -- Personality Results (calculated from responses)
  personality_result JSONB, -- {neighborhood, scores: {progressive, artistic, social}}

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUESTIONNAIRES TABLE (for easy question swapping)
-- ============================================
CREATE TABLE questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT FALSE, -- Only one active at a time

  -- Questions stored as JSONB for flexibility
  questions JSONB NOT NULL,
  /*
  Example questions structure:
  [
    {
      "id": 1,
      "text": "Typing '...' is more threatening than a period",
      "category": "social",
      "weight": 1.0,
      "scaleMinLabel": "Strongly Disagree",
      "scaleMaxLabel": "Strongly Agree"
    },
    ...
  ]
  */

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- RESPONSES TABLE
-- ============================================
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id),
  questionnaire_version INTEGER NOT NULL,

  -- Answers as JSONB array
  answers JSONB NOT NULL,
  /*
  Example answers structure:
  [
    {"questionId": 1, "value": 6, "answeredAt": "2024-01-15T10:30:00Z"},
    {"questionId": 2, "value": 2, "answeredAt": "2024-01-15T10:30:15Z"},
    ...
  ]
  */

  -- Processing status
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,

  -- Metadata
  source TEXT DEFAULT 'web', -- 'web', 'mobile', 'import'
  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one response per user per questionnaire version
  UNIQUE(user_id, questionnaire_id, questionnaire_version)
);

-- ============================================
-- MATCHES TABLE
-- ============================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The two users (user1_id < user2_id to prevent duplicates)
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Matching details
  compatibility_score DECIMAL(5,2) NOT NULL, -- Higher = more opposite
  scoring_strategy TEXT DEFAULT 'simple_difference',
  top_differences JSONB, -- [{questionId, user1Value, user2Value, diff}, ...]

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'revealed', 'connected', 'declined')),

  -- Interaction tracking
  user1_viewed_at TIMESTAMPTZ,
  user2_viewed_at TIMESTAMPTZ,
  user1_action TEXT CHECK (user1_action IN ('accepted', 'declined')),
  user2_action TEXT CHECK (user2_action IN ('accepted', 'declined')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revealed_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,

  -- Prevent duplicate matches
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Enforce ordering to prevent (A,B) and (B,A)
);

-- ============================================
-- ANALYTICS: USER EVENTS
-- ============================================
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT, -- Anonymous session tracking

  -- Event details
  event_type TEXT NOT NULL,
  /*
  Event types:
  - 'page_view': {page, referrer}
  - 'questionnaire_start': {questionnaire_id}
  - 'question_answer': {question_id, value, time_to_answer_ms}
  - 'question_skip': {question_id}
  - 'question_change': {question_id, old_value, new_value}
  - 'questionnaire_complete': {questionnaire_id, total_time_ms}
  - 'questionnaire_abandon': {questionnaire_id, last_question_id, completed_count}
  - 'match_view': {match_id}
  - 'match_action': {match_id, action}
  - 'signup_start': {}
  - 'signup_complete': {method}
  - 'location_prompt': {result: 'allowed'|'denied'|'dismissed'}
  */
  event_data JSONB DEFAULT '{}'::jsonb,

  -- Context
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  user_agent TEXT,
  ip_hash TEXT, -- Hashed for privacy, but allows geo lookup

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS: QUESTION PERFORMANCE
-- ============================================
CREATE TABLE question_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id),
  question_id INTEGER NOT NULL,

  -- Aggregated metrics (updated by scheduled function)
  total_answers INTEGER DEFAULT 0,
  avg_value DECIMAL(3,2),
  std_deviation DECIMAL(3,2),

  -- Distribution (how many picked each value 1-7)
  value_distribution JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0}'::jsonb,

  -- Engagement metrics
  avg_time_to_answer_ms INTEGER,
  skip_count INTEGER DEFAULT 0,
  change_count INTEGER DEFAULT 0, -- How often do users change their answer?

  -- Polarization score (are answers clustered at extremes or middle?)
  polarization_score DECIMAL(3,2),

  -- Last updated
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(questionnaire_id, question_id)
);

-- ============================================
-- NYC GEOFENCING: INVITE CODES
-- ============================================
CREATE TABLE invite_codes (
  code TEXT PRIMARY KEY,
  created_by UUID REFERENCES users(id),

  -- Limits
  max_uses INTEGER DEFAULT 1,
  uses_remaining INTEGER DEFAULT 1,

  -- Location context (optional - where was this code distributed?)
  location_context TEXT, -- 'washington_square_park', 'comedy_cellar', etc.

  -- Validity
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL REFERENCES invite_codes(code),
  user_id UUID NOT NULL REFERENCES users(id),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id) -- One invite per user
);
```

### Indexes for Performance

```sql
-- Fast user lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- Response queries
CREATE INDEX idx_responses_user ON responses(user_id);
CREATE INDEX idx_responses_unprocessed ON responses(is_processed) WHERE is_processed = FALSE;

-- Match queries
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_matches_status ON matches(status);

-- Analytics
CREATE INDEX idx_events_user ON user_events(user_id);
CREATE INDEX idx_events_type ON user_events(event_type);
CREATE INDEX idx_events_created ON user_events(created_at);
```

---

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- New users are created via trigger (see below)

-- ============================================
-- RESPONSES POLICIES
-- ============================================

-- Users can view their own responses
CREATE POLICY "Users can view own responses"
  ON responses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can submit responses"
  ON responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MATCHES POLICIES
-- ============================================

-- Users can view matches they're part of
CREATE POLICY "Users can view their matches"
  ON matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can update their own actions on matches
CREATE POLICY "Users can update their match actions"
  ON matches FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================
-- QUESTIONNAIRES POLICIES
-- ============================================

-- Anyone can read active questionnaires
CREATE POLICY "Anyone can view active questionnaires"
  ON questionnaires FOR SELECT
  USING (is_active = TRUE);

-- ============================================
-- USER EVENTS POLICIES
-- ============================================

-- Users can insert their own events
CREATE POLICY "Users can log events"
  ON user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own events (for debugging)
CREATE POLICY "Users can view own events"
  ON user_events FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Database Functions & Triggers

```sql
-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, display_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- UPDATE USER TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- MARK USER AS COMPLETED QUESTIONNAIRE
-- ============================================
CREATE OR REPLACE FUNCTION handle_response_submitted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET has_completed_questionnaire = TRUE,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_response_submitted
  AFTER INSERT ON responses
  FOR EACH ROW EXECUTE FUNCTION handle_response_submitted();

-- ============================================
-- ENFORCE MATCH ORDERING (user1_id < user2_id)
-- ============================================
CREATE OR REPLACE FUNCTION order_match_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user1_id > NEW.user2_id THEN
    -- Swap them
    DECLARE temp UUID;
    BEGIN
      temp := NEW.user1_id;
      NEW.user1_id := NEW.user2_id;
      NEW.user2_id := temp;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_match_users_trigger
  BEFORE INSERT ON matches
  FOR EACH ROW EXECUTE FUNCTION order_match_users();
```

---

## Edge Functions

### 1. Run Matching Algorithm

```typescript
// supabase/functions/run-matching/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import compiled Rust WASM
import init, { find_matches } from './rust_matcher_bg.wasm'

serve(async (req) => {
  await init()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get unprocessed responses
  const { data: responses } = await supabase
    .from('responses')
    .select('user_id, answers')
    .eq('is_processed', false)

  if (!responses?.length) {
    return new Response(JSON.stringify({ message: 'No new responses' }))
  }

  // Get all processed users for matching
  const { data: allResponses } = await supabase
    .from('responses')
    .select('user_id, answers')
    .eq('is_processed', true)

  // Run Rust matching algorithm
  const matches = find_matches(responses, allResponses)

  // Insert new matches
  for (const match of matches) {
    await supabase.from('matches').upsert({
      user1_id: match.user1_id,
      user2_id: match.user2_id,
      compatibility_score: match.score,
      top_differences: match.top_differences
    }, { onConflict: 'user1_id,user2_id' })
  }

  // Mark responses as processed
  await supabase
    .from('responses')
    .update({ is_processed: true, processed_at: new Date() })
    .in('user_id', responses.map(r => r.user_id))

  return new Response(JSON.stringify({
    processed: responses.length,
    matches_created: matches.length
  }))
})
```

### 2. Verify NYC Location

```typescript
// supabase/functions/verify-location/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// NYC bounding box (approximate)
const NYC_BOUNDS = {
  minLat: 40.4774,
  maxLat: 40.9176,
  minLng: -74.2591,
  maxLng: -73.7004
}

serve(async (req) => {
  const { lat, lng, userId } = await req.json()

  const isInNYC =
    lat >= NYC_BOUNDS.minLat &&
    lat <= NYC_BOUNDS.maxLat &&
    lng >= NYC_BOUNDS.minLng &&
    lng <= NYC_BOUNDS.maxLng

  if (!isInNYC) {
    return new Response(JSON.stringify({
      verified: false,
      message: 'FoeFinder is currently NYC-only. Stay tuned for expansion!'
    }), { status: 403 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  await supabase
    .from('users')
    .update({
      location_verified: true,
      signup_location: { lat, lng, city: 'NYC', verified_at: new Date() }
    })
    .eq('id', userId)

  return new Response(JSON.stringify({ verified: true }))
})
```

### 3. Aggregate Question Analytics (Scheduled)

```typescript
// supabase/functions/aggregate-analytics/index.ts
// This runs on a schedule (e.g., daily) to update question_analytics

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get active questionnaire
  const { data: questionnaire } = await supabase
    .from('questionnaires')
    .select('id, questions')
    .eq('is_active', true)
    .single()

  if (!questionnaire) return new Response('No active questionnaire')

  // Get all responses for this questionnaire
  const { data: responses } = await supabase
    .from('responses')
    .select('answers')
    .eq('questionnaire_id', questionnaire.id)

  // Calculate analytics per question
  for (const question of questionnaire.questions) {
    const questionAnswers = responses
      .flatMap(r => r.answers)
      .filter(a => a.questionId === question.id)

    const values = questionAnswers.map(a => a.value)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    // Distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 }
    values.forEach(v => distribution[v]++)

    // Polarization: high when answers cluster at 1-2 or 6-7, low when centered
    const extremeCount = distribution[1] + distribution[2] + distribution[6] + distribution[7]
    const polarization = extremeCount / values.length

    await supabase.from('question_analytics').upsert({
      questionnaire_id: questionnaire.id,
      question_id: question.id,
      total_answers: values.length,
      avg_value: avg,
      std_deviation: stdDev,
      value_distribution: distribution,
      polarization_score: polarization,
      updated_at: new Date()
    }, { onConflict: 'questionnaire_id,question_id' })
  }

  return new Response(JSON.stringify({ success: true }))
})
```

---

## Frontend Service Updates

### Updated SupabaseService

```typescript
// frontend/src/app/core/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  get client() {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }

  // Typed table accessors
  get users() {
    return this.supabase.from('users');
  }

  get responses() {
    return this.supabase.from('responses');
  }

  get matches() {
    return this.supabase.from('matches');
  }

  get questionnaires() {
    return this.supabase.from('questionnaires');
  }

  get userEvents() {
    return this.supabase.from('user_events');
  }
}
```

### Analytics Service

```typescript
// frontend/src/app/core/services/analytics.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export type EventType =
  | 'page_view'
  | 'questionnaire_start'
  | 'question_answer'
  | 'question_skip'
  | 'question_change'
  | 'questionnaire_complete'
  | 'questionnaire_abandon'
  | 'match_view'
  | 'match_action'
  | 'signup_start'
  | 'signup_complete'
  | 'location_prompt';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private sessionId: string;

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('foe_finder_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('foe_finder_session', sessionId);
    }
    return sessionId;
  }

  async track(eventType: EventType, eventData: Record<string, any> = {}) {
    const user = this.auth.currentUser();

    await this.supabase.userEvents.insert({
      user_id: user?.uid || null,
      session_id: this.sessionId,
      event_type: eventType,
      event_data: eventData,
      device_type: this.getDeviceType(),
      user_agent: navigator.userAgent
    });
  }

  // Track time spent on each question
  trackQuestionAnswer(questionId: number, value: number, timeToAnswerMs: number) {
    return this.track('question_answer', {
      question_id: questionId,
      value,
      time_to_answer_ms: timeToAnswerMs
    });
  }

  trackQuestionChange(questionId: number, oldValue: number, newValue: number) {
    return this.track('question_change', {
      question_id: questionId,
      old_value: oldValue,
      new_value: newValue
    });
  }

  trackQuestionnaireAbandon(questionnaireId: string, lastQuestionId: number, completedCount: number) {
    return this.track('questionnaire_abandon', {
      questionnaire_id: questionnaireId,
      last_question_id: lastQuestionId,
      completed_count: completedCount
    });
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|iphone|android/i.test(ua)) return 'mobile';
    return 'desktop';
  }
}
```

---

## Implementation Phases

### Phase 1: Supabase Setup (Week 1)
- [ ] Create Supabase project
- [ ] Add real credentials to environment.ts
- [ ] Run schema SQL to create tables
- [ ] Set up RLS policies
- [ ] Enable email verification in Supabase Auth settings
- [ ] Test auth flow end-to-end

### Phase 2: Migrate Services (Week 2)
- [ ] Update AuthService to use real Supabase auth
- [ ] Update QuestionnaireService to fetch from database
- [ ] Seed questionnaires table with current 20 questions
- [ ] Update response submission to save to database
- [ ] Add AnalyticsService for event tracking

### Phase 3: Matching Engine (Week 3)
- [ ] Create Edge Function for matching
- [ ] Compile Rust matcher to WASM for Deno
- [ ] Set up scheduled trigger (daily matching run)
- [ ] Build matches display in frontend
- [ ] Add real-time subscription for new matches

### Phase 4: NYC Geofencing (Week 4)
- [ ] Create location verification Edge Function
- [ ] Add location prompt to signup flow
- [ ] Create invite code system (optional path)
- [ ] Handle location denial gracefully

### Phase 5: Analytics Dashboard (Week 5-6)
- [ ] Create admin route (protected by user role)
- [ ] Build question performance charts
- [ ] Build user funnel visualization
- [ ] Set up scheduled analytics aggregation

### Phase 6: Polish & Testing (Week 7-8)
- [ ] End-to-end testing
- [ ] Error handling improvements
- [ ] Performance optimization
- [ ] Mobile testing
- [ ] Soft launch with friends

---

## Environment Configuration

```typescript
// frontend/src/environments/environment.ts
export const environment = {
  production: false,
  supabase: {
    url: 'https://YOUR_PROJECT_ID.supabase.co',
    anonKey: 'YOUR_ANON_KEY'
  },
  features: {
    useRealAuth: true,  // Switch to true!
    enableAnalytics: true,
    requireNYCLocation: true,
    allowInviteCodes: true
  }
};
```

---

## Cost Estimation (Supabase)

| Tier | Users | Cost | Notes |
|------|-------|------|-------|
| Free | < 50K MAU | $0 | 500MB DB, 1GB storage |
| Pro | 100K MAU | $25/mo | 8GB DB, 100GB storage |
| Team | Unlimited | $599/mo | Full features |

**For MVP with < 1000 users: Free tier is more than sufficient**

---

## Migration Checklist

Before going live:
- [ ] Supabase project created and configured
- [ ] Environment variables set (never commit real keys!)
- [ ] Email templates customized in Supabase dashboard
- [ ] RLS policies tested (try accessing other users' data)
- [ ] Edge Functions deployed and tested
- [ ] Error monitoring set up (Sentry or similar)
- [ ] Backup strategy confirmed (Supabase does daily backups)
- [ ] Rate limiting configured for auth endpoints
