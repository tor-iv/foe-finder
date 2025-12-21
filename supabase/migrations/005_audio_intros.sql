-- Migration: 005_audio_intros
-- Description: Create audio_intros table for user voice recordings
-- Date: 2024-12-21

-- =============================================
-- AUDIO INTROS TABLE
-- =============================================
-- Stores metadata for user audio introductions
-- Audio files stored in Supabase Storage bucket

CREATE TABLE audio_intros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Audio file reference (stored in Supabase Storage)
  storage_path TEXT NOT NULL,

  -- File metadata
  duration_seconds DECIMAL(4,1) NOT NULL CHECK (duration_seconds <= 20.0),
  file_size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'audio/webm',

  -- Transcription (populated by client-side Whisper)
  transcription TEXT,
  transcription_status TEXT DEFAULT 'pending'
    CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Only one active intro per user (previous intros are deactivated)
  is_active BOOLEAN DEFAULT TRUE
);

-- Partial unique index: only one active audio intro per user
CREATE UNIQUE INDEX idx_audio_intros_user_active
  ON audio_intros(user_id)
  WHERE is_active = TRUE;

-- Index for finding pending transcriptions (if we add server-side later)
CREATE INDEX idx_audio_intros_pending
  ON audio_intros(transcription_status)
  WHERE transcription_status = 'pending';

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE audio_intros ENABLE ROW LEVEL SECURITY;

-- Users can view their own audio intro
CREATE POLICY "Users can view own audio intro"
  ON audio_intros FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own audio intro
CREATE POLICY "Users can create own audio intro"
  ON audio_intros FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own audio intro
CREATE POLICY "Users can update own audio intro"
  ON audio_intros FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own audio intro
CREATE POLICY "Users can delete own audio intro"
  ON audio_intros FOR DELETE
  USING (auth.uid() = user_id);

-- Users can view their match's audio intro
CREATE POLICY "Users can view matched user audio intro"
  ON audio_intros FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE (m.user1_id = auth.uid() AND m.user2_id = audio_intros.user_id)
         OR (m.user2_id = auth.uid() AND m.user1_id = audio_intros.user_id)
    )
  );
