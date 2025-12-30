-- Migration: Add admin role support
-- This migration adds admin functionality to FoeFinder

-- =============================================
-- 1. Add is_admin column to profiles
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- =============================================
-- 2. Admin check function for RLS policies
-- =============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$;

-- =============================================
-- 3. RLS Policies for admin access
-- =============================================

-- Admins can view all suggestions
DROP POLICY IF EXISTS "Admins can view all suggestions" ON suggestions;
CREATE POLICY "Admins can view all suggestions"
  ON suggestions FOR SELECT
  USING (is_admin());

-- Admins can update suggestions (approve/reject with notes)
DROP POLICY IF EXISTS "Admins can update suggestions" ON suggestions;
CREATE POLICY "Admins can update suggestions"
  ON suggestions FOR UPDATE
  USING (is_admin());

-- Admins can view all profiles (users can still see their own)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin() OR auth.uid() = id);

-- Admins can view all questionnaire responses
DROP POLICY IF EXISTS "Admins can view all responses" ON questionnaire_responses;
CREATE POLICY "Admins can view all responses"
  ON questionnaire_responses FOR SELECT
  USING (is_admin() OR auth.uid() = user_id);

-- =============================================
-- 4. Helper function: get response distribution for a question
-- Returns value distribution (1-7) with counts and percentages
-- =============================================
CREATE OR REPLACE FUNCTION get_response_distribution(p_question_id INT)
RETURNS TABLE (value INT, count BIGINT, percentage NUMERIC)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH extracted AS (
    SELECT (elem->>'value')::int AS val
    FROM questionnaire_responses, jsonb_array_elements(responses) AS elem
    WHERE (elem->>'questionId')::int = p_question_id
  ),
  total AS (
    SELECT COUNT(*) AS cnt FROM extracted
  )
  SELECT
    e.val AS value,
    COUNT(*)::bigint AS count,
    ROUND(COUNT(*)::numeric / NULLIF(t.cnt, 0) * 100, 1) AS percentage
  FROM extracted e, total t
  GROUP BY e.val, t.cnt
  ORDER BY e.val;
END;
$$;

-- =============================================
-- 5. Helper function: get user statistics
-- Returns total users, completed questionnaires, matched users
-- =============================================
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'total', (SELECT COUNT(*) FROM profiles),
    'completed', (SELECT COUNT(*) FROM profiles WHERE has_completed_questionnaire = true),
    'matched', (SELECT COUNT(*) FROM profiles WHERE match_id IS NOT NULL)
  );
END;
$$;

-- =============================================
-- 6. Grant execute permissions to authenticated users
-- =============================================
GRANT EXECUTE ON FUNCTION get_response_distribution(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats() TO authenticated;

-- =============================================
-- MANUAL STEP AFTER MIGRATION:
-- Set yourself as admin via Supabase dashboard SQL editor:
-- UPDATE profiles SET is_admin = true WHERE id = '<your-user-id>';
-- =============================================
