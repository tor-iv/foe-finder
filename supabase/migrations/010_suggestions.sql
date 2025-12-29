-- Migration: 010_suggestions
-- Description: Create suggestions table for user feedback (questions, features, general)
-- Date: 2024-12-29

-- =============================================
-- SUGGESTIONS TABLE
-- =============================================
-- Stores user-submitted suggestions for new questions,
-- feature requests, and general feedback

CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Optional user reference (allows anonymous suggestions)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Suggestion category
  category TEXT NOT NULL CHECK (category IN ('question', 'feature', 'feedback')),

  -- The suggestion content
  title TEXT NOT NULL,
  description TEXT,

  -- Admin fields
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  admin_notes TEXT,

  -- Contact email for anonymous users (optional)
  contact_email TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for filtering by category and status
CREATE INDEX idx_suggestions_category ON suggestions(category);
CREATE INDEX idx_suggestions_status ON suggestions(status);
CREATE INDEX idx_suggestions_created_at ON suggestions(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert suggestions (including anonymous users)
CREATE POLICY "Anyone can submit suggestions"
  ON suggestions FOR INSERT
  WITH CHECK (true);

-- Users can view their own suggestions
CREATE POLICY "Users can view own suggestions"
  ON suggestions FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- ADMIN ACCESS (via service role)
-- =============================================
-- Note: Admin access is handled via Supabase dashboard or
-- a backend service using the service_role key.
-- For a future admin page, you would:
-- 1. Create an admins table or use user metadata
-- 2. Add a policy like:
--    CREATE POLICY "Admins can view all suggestions"
--      ON suggestions FOR SELECT
--      USING (is_admin(auth.uid()));

-- =============================================
-- HELPER VIEW FOR ADMIN DASHBOARD
-- =============================================
-- This view joins suggestions with profile data for context

CREATE OR REPLACE VIEW suggestions_with_user AS
SELECT
  s.*,
  p.display_name as user_display_name
FROM suggestions s
LEFT JOIN profiles p ON s.user_id = p.id;

-- Grant select on view (admin access via service role)
-- GRANT SELECT ON suggestions_with_user TO authenticated;
