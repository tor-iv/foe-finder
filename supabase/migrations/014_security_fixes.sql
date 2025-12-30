-- Migration: 014_security_fixes
-- Description: Fix security linter warnings
-- Date: 2024-12-30

-- =============================================
-- FIX 1: Recreate view with SECURITY INVOKER
-- =============================================
-- The suggestions_with_user view was using SECURITY DEFINER,
-- which runs with the view creator's permissions instead of
-- the querying user's permissions.

DROP VIEW IF EXISTS suggestions_with_user;

CREATE VIEW suggestions_with_user
WITH (security_invoker = true)
AS
SELECT
  s.*,
  p.display_name as user_display_name
FROM suggestions s
LEFT JOIN profiles p ON s.user_id = p.id;

-- =============================================
-- FIX 2: Enable RLS on question_analytics
-- =============================================
-- If the table exists, enable RLS and add appropriate policies.
-- If it doesn't exist, this will be a no-op.

DO $$
BEGIN
  -- Check if the table exists before trying to alter it
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'question_analytics'
  ) THEN
    -- Enable RLS
    ALTER TABLE question_analytics ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Admins can view question_analytics" ON question_analytics;
    DROP POLICY IF EXISTS "Admins can insert question_analytics" ON question_analytics;
    DROP POLICY IF EXISTS "Admins can update question_analytics" ON question_analytics;

    -- Create admin-only policies (analytics should only be viewable by admins)
    CREATE POLICY "Admins can view question_analytics"
      ON question_analytics FOR SELECT
      USING (is_admin());

    CREATE POLICY "Admins can insert question_analytics"
      ON question_analytics FOR INSERT
      WITH CHECK (is_admin());

    CREATE POLICY "Admins can update question_analytics"
      ON question_analytics FOR UPDATE
      USING (is_admin());

    RAISE NOTICE 'question_analytics: RLS enabled with admin policies';
  ELSE
    RAISE NOTICE 'question_analytics table does not exist, skipping';
  END IF;
END;
$$;
