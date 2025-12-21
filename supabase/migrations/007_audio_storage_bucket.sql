-- Migration: 007_audio_storage_bucket
-- Description: Create storage bucket for audio intros with RLS policies
-- Date: 2024-12-21

-- =============================================
-- CREATE STORAGE BUCKET
-- =============================================
-- Note: This creates a private bucket for audio intro recordings
-- Files are organized by user_id: audio-intros/{user_id}/{timestamp}.webm

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-intros',
  'audio-intros',
  false,  -- Private bucket
  5242880,  -- 5MB limit
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE RLS POLICIES
-- =============================================

-- Users can upload to their own folder (folder name = user_id)
CREATE POLICY "Users can upload own audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-intros'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own audio
CREATE POLICY "Users can read own audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-intros'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own audio
CREATE POLICY "Users can update own audio"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'audio-intros'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own audio
CREATE POLICY "Users can delete own audio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio-intros'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their matched opponent's audio
CREATE POLICY "Users can read matched user audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-intros'
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE (m.user1_id = auth.uid() AND m.user2_id::text = (storage.foldername(name))[1])
         OR (m.user2_id = auth.uid() AND m.user1_id::text = (storage.foldername(name))[1])
    )
  );
