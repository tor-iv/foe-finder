-- Migration: 012_waitlist
-- Description: Create waitlist table for geo-fence blocked users
-- Date: 2024-12-29

-- =============================================
-- WAITLIST TABLE
-- =============================================
-- Stores emails from users outside the geo-fence

CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User's email address
  email TEXT NOT NULL UNIQUE,

  -- Coordinates (optional, if user grants GPS permission)
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous signup)
CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);

-- No SELECT policy = only accessible via service key (for admin/analytics)
