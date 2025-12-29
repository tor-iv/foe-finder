-- Migration: Question Statistics and Outlier Detection
-- This migration creates infrastructure to calculate statistical outliers
-- for user responses compared to the overall population.

-- ============================================================================
-- 1. Create materialized view for question statistics
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS question_statistics AS
WITH response_values AS (
  -- Extract individual responses from JSONB array
  SELECT
    user_id,
    (jsonb_array_elements(responses)->>'questionId')::int AS question_id,
    (jsonb_array_elements(responses)->>'value')::int AS value
  FROM questionnaire_responses
  WHERE submitted_at IS NOT NULL
),
aggregated_stats AS (
  -- Calculate statistics for each question
  SELECT
    question_id,
    COUNT(*) AS response_count,
    AVG(value) AS mean_value,
    STDDEV(value) AS std_dev,
    PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY value) AS percentile_10,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY value) AS percentile_25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY value) AS percentile_50,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value) AS percentile_75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY value) AS percentile_90,
    MIN(value) AS min_value,
    MAX(value) AS max_value
  FROM response_values
  GROUP BY question_id
)
SELECT * FROM aggregated_stats;

-- Create index on question_id for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_question_stats_question_id
ON question_statistics (question_id);

-- ============================================================================
-- 2. Function to refresh the materialized view
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_question_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY question_statistics;
END;
$$;

-- ============================================================================
-- 3. Function to calculate percentile rank for a user's answer
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_percentile_rank(
  p_question_id INT,
  p_user_value INT
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_percentile NUMERIC;
  v_total_count BIGINT;
  v_count_below BIGINT;
BEGIN
  -- Get total number of responses for this question
  WITH response_values AS (
    SELECT (jsonb_array_elements(responses)->>'value')::int AS value
    FROM questionnaire_responses
    WHERE submitted_at IS NOT NULL
      AND responses @> jsonb_build_array(jsonb_build_object('questionId', p_question_id))
  )
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE value < p_user_value)
  INTO v_total_count, v_count_below
  FROM response_values;

  -- Calculate percentile (0-100)
  IF v_total_count = 0 THEN
    RETURN NULL;
  END IF;

  v_percentile := (v_count_below::NUMERIC / v_total_count::NUMERIC) * 100;

  RETURN ROUND(v_percentile, 1);
END;
$$;

-- ============================================================================
-- 4. Function to get statistical outliers for a user
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_outliers(p_user_id UUID)
RETURNS TABLE (
  question_id INT,
  user_value INT,
  population_mean NUMERIC,
  std_dev NUMERIC,
  percentile_rank NUMERIC,
  is_top_outlier BOOLEAN,
  is_bottom_outlier BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH user_responses AS (
    SELECT
      (jsonb_array_elements(responses)->>'questionId')::int AS question_id,
      (jsonb_array_elements(responses)->>'value')::int AS value
    FROM questionnaire_responses
    WHERE user_id = p_user_id
      AND submitted_at IS NOT NULL
  )
  SELECT
    ur.question_id,
    ur.value AS user_value,
    ROUND(qs.mean_value, 2) AS population_mean,
    ROUND(qs.std_dev, 2) AS std_dev,
    calculate_percentile_rank(ur.question_id, ur.value) AS percentile_rank,
    (ur.value >= qs.percentile_90) AS is_top_outlier,
    (ur.value <= qs.percentile_10) AS is_bottom_outlier
  FROM user_responses ur
  JOIN question_statistics qs ON ur.question_id = qs.question_id
  WHERE qs.response_count >= 10 -- Only show stats when we have enough data
    AND (ur.value >= qs.percentile_90 OR ur.value <= qs.percentile_10)
  ORDER BY
    CASE
      WHEN ur.value >= qs.percentile_90 THEN (100 - calculate_percentile_rank(ur.question_id, ur.value))
      ELSE calculate_percentile_rank(ur.question_id, ur.value)
    END DESC;
END;
$$;

-- ============================================================================
-- 5. Enable Row Level Security (RLS)
-- ============================================================================

-- Note: Materialized views don't support RLS directly, but we control access
-- through functions. The functions are STABLE and only read data, so they're safe.

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION refresh_question_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_percentile_rank(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_outliers(UUID) TO authenticated;

-- Grant select on the materialized view to authenticated users
GRANT SELECT ON question_statistics TO authenticated;

-- ============================================================================
-- 6. Create trigger to auto-refresh stats when responses are submitted
-- ============================================================================

-- Function to refresh stats after new response
CREATE OR REPLACE FUNCTION trigger_refresh_question_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh the materialized view in the background
  -- Note: In production, you might want to use pg_cron or external scheduler
  -- to avoid blocking on every insert
  PERFORM refresh_question_statistics();
  RETURN NEW;
END;
$$;

-- Create trigger (fires after insert or update)
DROP TRIGGER IF EXISTS after_response_submit ON questionnaire_responses;
CREATE TRIGGER after_response_submit
  AFTER INSERT OR UPDATE OF responses, submitted_at
  ON questionnaire_responses
  FOR EACH ROW
  WHEN (NEW.submitted_at IS NOT NULL)
  EXECUTE FUNCTION trigger_refresh_question_stats();

-- ============================================================================
-- 7. Initial data population
-- ============================================================================

-- Refresh the view with existing data
SELECT refresh_question_statistics();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON MATERIALIZED VIEW question_statistics IS
'Stores aggregated statistics for each question including mean, standard deviation, and percentiles.
Refreshed automatically when new responses are submitted.';

COMMENT ON FUNCTION calculate_percentile_rank(INT, INT) IS
'Calculates where a user''s answer falls in the distribution (0-100 percentile).';

COMMENT ON FUNCTION get_user_outliers(UUID) IS
'Returns all responses where the user is in the top 10% or bottom 10% compared to all users.';

COMMENT ON FUNCTION refresh_question_statistics() IS
'Refreshes the question_statistics materialized view with latest data.';
