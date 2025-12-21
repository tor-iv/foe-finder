-- Migration: 001_questionnaire_responses
-- Description: Create table for storing user questionnaire responses
-- Date: 2024-12-20

-- =============================================
-- QUESTIONNAIRE RESPONSES TABLE
-- =============================================
-- Stores user questionnaire responses for matching algorithm
-- Each user can only have one set of responses (UNIQUE constraint)

CREATE TABLE questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Responses stored as JSONB array: [{questionId: 1, value: 5}, ...]
  responses JSONB NOT NULL,

  -- Timestamp when questionnaire was submitted
  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent multiple submissions per user (can update existing)
  UNIQUE(user_id)
);

-- Index for fast user lookup
CREATE INDEX idx_questionnaire_responses_user ON questionnaire_responses(user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own responses
CREATE POLICY "Users can view own responses"
  ON questionnaire_responses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can submit responses"
  ON questionnaire_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses (for retaking quiz)
CREATE POLICY "Users can update own responses"
  ON questionnaire_responses FOR UPDATE
  USING (auth.uid() = user_id);
