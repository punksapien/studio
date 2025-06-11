-- Universal Sync Trigger System - Phase 4: Safe Deployment & Rollout
-- Migration: 20250115000012_phase4_safe_deployment_and_rollout.sql
--
-- This migration implements the infrastructure for Phase 4, focusing on
-- safe, zero-downtime deployments, gradual rollouts, and performance validation,
-- inspired by best practices from large-scale systems at Meta and Shopify.

-- =============================================================================
-- 1. FEATURE FLAG SYSTEM - Gradual Rollout Control
-- =============================================================================

-- Table to manage feature flags for the entire application
CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,
  flag_name VARCHAR(100) UNIQUE NOT NULL,
  is_enabled_globally BOOLEAN DEFAULT false, -- Master switch for the feature
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  enabled_for_user_ids UUID[], -- Specific users to enable the feature for (testing/canary)
  enabled_for_roles VARCHAR(50)[], -- Specific user roles to enable for
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to check if a feature is enabled for a specific user
CREATE OR REPLACE FUNCTION is_feature_enabled(p_flag_name VARCHAR(100), p_user_id UUID, p_user_role VARCHAR(50) DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  flag RECORD;
BEGIN
  SELECT * INTO flag FROM feature_flags WHERE flag_name = p_flag_name;

  IF NOT FOUND THEN
    RETURN false; -- Feature does not exist, so it's disabled
  END IF;

  -- 1. Check if globally enabled
  IF flag.is_enabled_globally THEN
    RETURN true;
  END IF;

  -- 2. Check if user is in the specific list
  IF p_user_id = ANY(flag.enabled_for_user_ids) THEN
    RETURN true;
  END IF;

  -- 3. Check if user role is in the specific list
  IF p_user_role IS NOT NULL AND p_user_role = ANY(flag.enabled_for_roles) THEN
    RETURN true;
  END IF;

  -- 4. Check percentage-based rollout
  IF flag.rollout_percentage > 0 THEN
    -- Use a stable hash of user_id to ensure consistent rollout
    IF (abs(hashtext(p_user_id::TEXT)) % 100) < flag.rollout_percentage THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- Example: Create a feature flag for the "new_dashboard_ui"
INSERT INTO feature_flags (flag_name, description, rollout_percentage)
VALUES ('new_dashboard_ui', 'Enables the new redesigned user dashboard', 10);


-- =============================================================================
-- 2. A/B TESTING FRAMEWORK - Performance & UX Validation
-- =============================================================================

-- Table to define A/B testing experiments
CREATE TABLE ab_experiments (
  id SERIAL PRIMARY KEY,
  experiment_name VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  variants VARCHAR(50)[], -- e.g., {'control', 'variation_a', 'variation_b'}
  traffic_allocation JSONB, -- e.g., {'control': 80, 'variation_a': 10, 'variation_b': 10}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track user assignments to experiments
CREATE TABLE ab_user_assignments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  experiment_name VARCHAR(100) NOT NULL,
  variant_assigned VARCHAR(50) NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, experiment_name)
);

-- Function to assign a user to an experiment and get their variant
CREATE OR REPLACE FUNCTION get_user_experiment_variant(p_experiment_name VARCHAR(100), p_user_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  experiment RECORD;
  assignment RECORD;
  total_weight INTEGER := 0;
  rand_val INTEGER;
  cumulative_weight INTEGER := 0;
  selected_variant VARCHAR(50);
  variant_key TEXT;
  variant_weight INTEGER;
BEGIN
  -- 1. Check if user is already assigned
  SELECT * INTO assignment FROM ab_user_assignments
  WHERE experiment_name = p_experiment_name AND user_id = p_user_id;

  IF FOUND THEN
    RETURN assignment.variant_assigned;
  END IF;

  -- 2. Get experiment details
  SELECT * INTO experiment FROM ab_experiments
  WHERE experiment_name = p_experiment_name AND is_active = true;

  IF NOT FOUND THEN
    RETURN 'control'; -- Default to control if experiment is inactive or non-existent
  END IF;

  -- 3. Assign a variant based on traffic allocation
  FOR variant_key, variant_weight IN SELECT * FROM jsonb_each_text(experiment.traffic_allocation)
  LOOP
    total_weight := total_weight + variant_weight;
  END LOOP;

  rand_val := (abs(hashtext(p_user_id::TEXT || p_experiment_name)) % total_weight);

  FOR variant_key, variant_weight IN SELECT * FROM jsonb_each_text(experiment.traffic_allocation)
  LOOP
    cumulative_weight := cumulative_weight + variant_weight;
    IF rand_val < cumulative_weight THEN
      selected_variant := variant_key;
      EXIT;
    END IF;
  END LOOP;

  -- 4. Store the assignment
  INSERT INTO ab_user_assignments (user_id, experiment_name, variant_assigned)
  VALUES (p_user_id, p_experiment_name, selected_variant);

  RETURN selected_variant;
END;
$$ LANGUAGE plpgsql;

-- Example: Create an A/B test for a new checkout button color
INSERT INTO ab_experiments (experiment_name, description, variants, traffic_allocation)
VALUES (
  'checkout_button_color_v2',
  'Tests a new green button color against the original blue to see impact on conversion.',
  ARRAY['control_blue', 'variation_green'],
  '{"control_blue": 50, "variation_green": 50}'
);

-- =============================================================================
-- 3. AUTOMATED ROLLBACK TRIGGERS (Conceptual Framework)
-- =============================================================================
-- NOTE: True automated rollback requires external monitoring systems (e.g., Prometheus, Datadog)
-- that can call a database function to disable a feature flag if performance degrades.
-- This section provides the database-side function that such a system would call.

-- Function to disable a feature flag, effectively rolling it back
CREATE OR REPLACE FUNCTION rollback_feature_flag(p_flag_name VARCHAR(100), p_reason TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE feature_flags
  SET
    is_enabled_globally = false,
    rollout_percentage = 0,
    description = description || '\n[ROLLBACK]: ' || p_reason || ' at ' || NOW()
  WHERE flag_name = p_flag_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MIGRATION METADATA
-- =============================================================================
SELECT '🚀 Universal Sync Trigger System - Phase 4 (Safe Deployment) completed!' AS status;
SELECT 'Feature flags, A/B testing, and rollback functions are now available.' AS notes;
