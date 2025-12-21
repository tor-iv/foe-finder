-- Migration: 002_matches
-- Description: Create table for storing matched user pairs
-- Date: 2024-12-20

-- =============================================
-- MATCHES TABLE
-- =============================================
-- Stores matched pairs after batch matching runs on Valentine's Day 2026
-- user1_id < user2_id constraint prevents duplicate pairs

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The two matched users (user1_id < user2_id to prevent duplicates)
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Opposition score (higher = more opposite opinions)
  opposition_score DECIMAL(6,2) NOT NULL,

  -- Top 3 questions where they differed most
  -- Format: [{questionId: 1, user1Value: 7, user2Value: 1, questionText: "..."}, ...]
  top_differences JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate matches and enforce ordering
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

-- Indexes for finding a user's matches quickly
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Users can view matches they're part of
CREATE POLICY "Users can view their matches"
  ON matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- =============================================
-- HELPER TRIGGER
-- =============================================
-- Automatically order user IDs so user1_id < user2_id

CREATE OR REPLACE FUNCTION order_match_users()
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
  BEFORE INSERT ON matches
  FOR EACH ROW EXECUTE FUNCTION order_match_users();
