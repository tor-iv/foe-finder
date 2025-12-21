-- Migration: 006_profiles_has_audio_intro
-- Description: Add has_audio_intro flag to profiles with auto-update trigger
-- Date: 2024-12-21

-- =============================================
-- ADD HAS_AUDIO_INTRO COLUMN
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_audio_intro BOOLEAN DEFAULT FALSE;

-- =============================================
-- AUTO-UPDATE WHEN AUDIO INTRO CREATED
-- =============================================
CREATE OR REPLACE FUNCTION handle_audio_intro_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if this is an active audio intro
  IF NEW.is_active = TRUE THEN
    UPDATE profiles
    SET has_audio_intro = TRUE,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_audio_intro_created
  AFTER INSERT ON audio_intros
  FOR EACH ROW
  EXECUTE FUNCTION handle_audio_intro_created();

-- =============================================
-- AUTO-UPDATE WHEN AUDIO INTRO DEACTIVATED
-- =============================================
CREATE OR REPLACE FUNCTION handle_audio_intro_deactivated()
RETURNS TRIGGER AS $$
BEGIN
  -- If audio intro was deactivated, check if user has any other active intros
  IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
    UPDATE profiles
    SET has_audio_intro = EXISTS(
          SELECT 1 FROM audio_intros
          WHERE user_id = NEW.user_id AND is_active = TRUE AND id != NEW.id
        ),
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_audio_intro_deactivated
  AFTER UPDATE ON audio_intros
  FOR EACH ROW
  WHEN (OLD.is_active = TRUE AND NEW.is_active = FALSE)
  EXECUTE FUNCTION handle_audio_intro_deactivated();

-- =============================================
-- AUTO-UPDATE WHEN AUDIO INTRO DELETED
-- =============================================
CREATE OR REPLACE FUNCTION handle_audio_intro_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has any remaining active intros
  UPDATE profiles
  SET has_audio_intro = EXISTS(
        SELECT 1 FROM audio_intros
        WHERE user_id = OLD.user_id AND is_active = TRUE
      ),
      updated_at = NOW()
  WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_audio_intro_deleted
  AFTER DELETE ON audio_intros
  FOR EACH ROW
  WHEN (OLD.is_active = TRUE)
  EXECUTE FUNCTION handle_audio_intro_deleted();
