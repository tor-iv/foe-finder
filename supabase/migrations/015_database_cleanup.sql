-- Migration: 015_database_cleanup
-- Description: Sync profiles with auth.users, fix security issues, and general cleanup
-- Date: 2025-01-05

-- =============================================
-- 1. SYNC MISSING PROFILES
-- =============================================
-- Create profiles for any auth.users that don't have one
-- This can happen if the handle_new_user() trigger failed

INSERT INTO profiles (id, display_name, marketing_consent, created_at)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
  COALESCE((au.raw_user_meta_data->>'marketing_consent')::boolean, false),
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- =============================================
-- 2. SYNC has_completed_questionnaire FLAG
-- =============================================
-- Update profiles for users who have questionnaire responses
-- but whose has_completed_questionnaire flag is false

UPDATE profiles p
SET
  has_completed_questionnaire = true,
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM questionnaire_responses qr
  WHERE qr.user_id = p.id
  AND qr.submitted_at IS NOT NULL
)
AND has_completed_questionnaire = false;

-- =============================================
-- 3. SYNC has_audio_intro FLAG
-- =============================================
-- Update profiles for users who have active audio intros
-- but whose has_audio_intro flag is false

UPDATE profiles p
SET
  has_audio_intro = true,
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM audio_intros ai
  WHERE ai.user_id = p.id
  AND ai.is_active = true
)
AND has_audio_intro = false;

-- =============================================
-- 4. FIX site_stats SECURITY ISSUE
-- =============================================
-- Remove the overly permissive UPDATE policy
-- The increment_visitor_count() function uses SECURITY DEFINER
-- so it can update without needing a public UPDATE policy

DROP POLICY IF EXISTS "Anyone can update site stats" ON site_stats;

-- =============================================
-- 5. ENSURE site_stats HAS DATA
-- =============================================
-- Make sure the global stats row exists

INSERT INTO site_stats (id, visitor_count)
VALUES ('global', 12847)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 6. IMPROVED handle_new_user() TRIGGER
-- =============================================
-- Update the trigger to be more robust and log errors properly

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, marketing_consent, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, false),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate key errors

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block user signup
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. GRANT EXECUTE ON increment_visitor_count
-- =============================================
-- Ensure anonymous users can call the increment function

GRANT EXECUTE ON FUNCTION increment_visitor_count() TO anon;
GRANT EXECUTE ON FUNCTION increment_visitor_count() TO authenticated;

-- =============================================
-- VERIFICATION QUERIES (for manual checking)
-- =============================================
-- Run these after migration to verify:
--
-- Check for any remaining orphaned users:
-- SELECT au.id, au.email FROM auth.users au
-- LEFT JOIN profiles p ON au.id = p.id WHERE p.id IS NULL;
--
-- Check profile sync status:
-- SELECT
--   (SELECT COUNT(*) FROM auth.users) as auth_users,
--   (SELECT COUNT(*) FROM profiles) as profiles,
--   (SELECT COUNT(*) FROM profiles WHERE has_completed_questionnaire = true) as completed_quiz;
--
-- Check visitor count:
-- SELECT * FROM site_stats;
