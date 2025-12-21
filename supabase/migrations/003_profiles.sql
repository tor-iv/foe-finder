-- Migration: 003_profiles
-- Description: Create profiles table with auto-creation trigger
-- Date: 2024-12-20
-- Note: Run this AFTER 001 and 002

-- =============================================
-- PROFILES TABLE
-- =============================================
-- Extends auth.users with app-specific fields
-- Auto-created when a new user signs up

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User display name
  display_name TEXT NOT NULL,

  -- Status flags
  has_completed_questionnaire BOOLEAN DEFAULT FALSE,

  -- Marketing consent (opted in to receive marketing emails)
  marketing_consent BOOLEAN DEFAULT FALSE,

  -- Reference to user's match (populated after batch matching)
  match_id UUID REFERENCES matches(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- System trigger can insert profiles (SECURITY DEFINER bypasses RLS, but this is a safety net)
CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, marketing_consent)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, false)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block user signup
  RAISE LOG 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- AUTO-UPDATE QUESTIONNAIRE STATUS
-- =============================================

CREATE OR REPLACE FUNCTION handle_questionnaire_submitted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET has_completed_questionnaire = TRUE,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_questionnaire_submitted
  AFTER INSERT ON questionnaire_responses
  FOR EACH ROW EXECUTE FUNCTION handle_questionnaire_submitted();
