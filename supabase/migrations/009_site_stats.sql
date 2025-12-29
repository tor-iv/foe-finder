-- Migration: 009_site_stats
-- Description: Add site statistics table for accurate visitor counter
-- Date: 2024-12-22

-- =============================================
-- SITE STATS TABLE
-- =============================================
-- Stores global site statistics like visitor count

CREATE TABLE site_stats (
    id TEXT PRIMARY KEY DEFAULT 'global',
    visitor_count BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize with a starting count
INSERT INTO site_stats (id, visitor_count) VALUES ('global', 12847);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can read site stats
CREATE POLICY "Anyone can read site stats"
    ON site_stats FOR SELECT
    USING (true);

-- Anyone can update site stats (for incrementing counter)
CREATE POLICY "Anyone can update site stats"
    ON site_stats FOR UPDATE
    USING (true);

-- =============================================
-- INCREMENT FUNCTION
-- =============================================
-- Atomic function to increment visitor count and return new value
CREATE OR REPLACE FUNCTION increment_visitor_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_count BIGINT;
BEGIN
    UPDATE site_stats
    SET visitor_count = visitor_count + 1,
        updated_at = NOW()
    WHERE id = 'global'
    RETURNING visitor_count INTO new_count;

    RETURN new_count;
END;
$$;
