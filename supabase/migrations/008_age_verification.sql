-- Migration: 008_age_verification
-- Description: Add age verification columns to profiles table
-- Date: 2024-12-21
-- Note: Stores age verification status with user profile for cross-device persistence

-- =============================================
-- ADD AGE VERIFICATION COLUMNS
-- =============================================
-- age_verified: Boolean flag indicating user has passed age verification
-- age_verified_date: Timestamp for audit trail

ALTER TABLE profiles ADD COLUMN age_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN age_verified_date TIMESTAMPTZ;

-- No additional RLS needed - existing policies allow users to update own profile
