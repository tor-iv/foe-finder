-- ============================================
-- FOEFINDER COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. USERS TABLE (Extensible Profile)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  photo_url TEXT,

  -- ===========================================
  -- PROFILE: Demographics & Identity
  -- ===========================================
  birth_date DATE,
  gender TEXT,
  gender_other TEXT,
  sexuality TEXT[],
  pronouns TEXT,

  -- ===========================================
  -- PROFILE: Matching Preferences
  -- ===========================================
  preferred_genders TEXT[],
  preferred_age_min INTEGER DEFAULT 18,
  preferred_age_max INTEGER DEFAULT 99,
  match_intent TEXT DEFAULT 'any',

  -- ===========================================
  -- PROFILE: Extended Info (JSONB for flexibility)
  -- ===========================================
  profile_extended JSONB DEFAULT '{}'::jsonb,

  -- ===========================================
  -- Verification & Location
  -- ===========================================
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  location_verified BOOLEAN DEFAULT FALSE,
  signup_location JSONB,

  -- ===========================================
  -- Status & Progress
  -- ===========================================
  has_completed_profile BOOLEAN DEFAULT FALSE,
  has_completed_questionnaire BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE,

  -- ===========================================
  -- App Preferences
  -- ===========================================
  preferences JSONB DEFAULT '{"notifications": true, "emailUpdates": true, "showAge": true, "showPronouns": true}'::jsonb,

  -- ===========================================
  -- Personality Results (from questionnaire)
  -- ===========================================
  personality_result JSONB,

  -- ===========================================
  -- Timestamps
  -- ===========================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  profile_completed_at TIMESTAMPTZ
);

-- Helper function to calculate age from birth_date
CREATE OR REPLACE FUNCTION public.calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Index for matching queries
CREATE INDEX idx_users_matching ON public.users (gender, is_active, is_visible, has_completed_questionnaire)
  WHERE is_active = TRUE AND is_visible = TRUE AND has_completed_questionnaire = TRUE;

-- ============================================
-- 2. QUESTIONNAIRES TABLE
-- ============================================
CREATE TABLE public.questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT FALSE,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 3. RESPONSES TABLE
-- ============================================
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id),
  questionnaire_version INTEGER NOT NULL,
  answers JSONB NOT NULL,
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'web',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, questionnaire_id, questionnaire_version)
);

-- ============================================
-- 4. MATCHES TABLE
-- ============================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(5,2) NOT NULL,
  scoring_strategy TEXT DEFAULT 'simple_difference',
  top_differences JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'revealed', 'connected', 'declined')),
  user1_viewed_at TIMESTAMPTZ,
  user2_viewed_at TIMESTAMPTZ,
  user1_action TEXT CHECK (user1_action IN ('accepted', 'declined')),
  user2_action TEXT CHECK (user2_action IN ('accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revealed_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

-- ============================================
-- 5. USER EVENTS TABLE (Analytics)
-- ============================================
CREATE TABLE public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  device_type TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. QUESTION ANALYTICS TABLE
-- ============================================
CREATE TABLE public.question_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id),
  question_id INTEGER NOT NULL,
  total_answers INTEGER DEFAULT 0,
  avg_value DECIMAL(3,2),
  std_deviation DECIMAL(3,2),
  value_distribution JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0}'::jsonb,
  avg_time_to_answer_ms INTEGER,
  skip_count INTEGER DEFAULT 0,
  change_count INTEGER DEFAULT 0,
  polarization_score DECIMAL(3,2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(questionnaire_id, question_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_active ON public.users(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_responses_user ON public.responses(user_id);
CREATE INDEX idx_responses_unprocessed ON public.responses(is_processed) WHERE is_processed = FALSE;
CREATE INDEX idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX idx_matches_user2 ON public.matches(user2_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_events_user ON public.user_events(user_id);
CREATE INDEX idx_events_type ON public.user_events(event_type);
CREATE INDEX idx_events_created ON public.user_events(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Responses policies
CREATE POLICY "Users can view own responses"
  ON public.responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit responses"
  ON public.responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Users can view their matches"
  ON public.matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their match actions"
  ON public.matches FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Questionnaires policies
CREATE POLICY "Anyone can view active questionnaires"
  ON public.questionnaires FOR SELECT
  USING (is_active = TRUE);

-- User events policies
CREATE POLICY "Users can log events"
  ON public.user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own events"
  ON public.user_events FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, email_verified)
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
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Mark user as completed questionnaire
CREATE OR REPLACE FUNCTION public.handle_response_submitted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET has_completed_questionnaire = TRUE,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_response_submitted
  AFTER INSERT ON public.responses
  FOR EACH ROW EXECUTE FUNCTION public.handle_response_submitted();

-- Enforce match ordering (user1_id < user2_id)
CREATE OR REPLACE FUNCTION public.order_match_users()
RETURNS TRIGGER AS $$
DECLARE
  temp UUID;
BEGIN
  IF NEW.user1_id > NEW.user2_id THEN
    temp := NEW.user1_id;
    NEW.user1_id := NEW.user2_id;
    NEW.user2_id := temp;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_match_users_trigger
  BEFORE INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.order_match_users();

-- ============================================
-- SEED DATA: Initial Questionnaire
-- ============================================
INSERT INTO public.questionnaires (title, description, version, is_active, questions)
VALUES (
  'FoeFinder Hot Takes',
  'Fun, niche takes for 20-somethings. Answer honestly!',
  1,
  TRUE,
  '[
    {"id": 1, "text": "Typing \"...\" is more threatening than a period", "category": "social", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 1},
    {"id": 2, "text": "I''ve screenshot texts to send to the group chat", "category": "social", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 2},
    {"id": 3, "text": "Couples who share a social media account are hiding something", "category": "opinions", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 3},
    {"id": 4, "text": "People who back into parking spots are trying too hard", "category": "opinions", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 4},
    {"id": 5, "text": "I''ve rewatched the same show 5+ times instead of starting something new", "category": "lifestyle", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 5},
    {"id": 6, "text": "Watching someone''s story without following them is research, not stalking", "category": "social", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 6},
    {"id": 7, "text": "I''ve rehearsed a conversation in the shower", "category": "lifestyle", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 7},
    {"id": 8, "text": "Leaving someone on ''delivered'' is a power move", "category": "social", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 8},
    {"id": 9, "text": "I''ve judged someone''s bookshelf", "category": "opinions", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 9},
    {"id": 10, "text": "People who say ''let''s hang soon!'' never mean it", "category": "social", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 10},
    {"id": 11, "text": "I''ve pretended my phone died to avoid a situation", "category": "lifestyle", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 11},
    {"id": 12, "text": "Eating alone in public is underrated", "category": "opinions", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 12},
    {"id": 13, "text": "I''ve bought something just because the packaging was cute", "category": "lifestyle", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 13},
    {"id": 14, "text": "Main character syndrome is fine actually", "category": "opinions", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 14},
    {"id": 15, "text": "Read receipts should be illegal", "category": "social", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 15},
    {"id": 16, "text": "I think about texts I sent 3 years ago", "category": "lifestyle", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 16},
    {"id": 17, "text": "I''ve deleted an app just to avoid someone", "category": "social", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 17},
    {"id": 18, "text": "Watching TV on 1.5x speed is valid", "category": "opinions", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 18},
    {"id": 19, "text": "I''ve said ''let''s do this again'' knowing I never would", "category": "lifestyle", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 19},
    {"id": 20, "text": "Standing at concerts is overrated", "category": "opinions", "scaleMinLabel": "Strongly Disagree", "scaleMaxLabel": "Strongly Agree", "order": 20}
  ]'::jsonb
);
