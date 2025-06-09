-- Fix Sync Count Fields for Correct Schema
-- Migration: 20250115000004_fix_sync_count_fields.sql

-- Update sync_count_fields function with correct column names
CREATE OR REPLACE FUNCTION sync_count_fields(
  p_rule_config JSONB,
  p_new_record JSONB,
  p_old_record JSONB,
  p_target_table VARCHAR(50),
  p_operation VARCHAR(20)
)
RETURNS VOID AS $$
DECLARE
  count_field VARCHAR(50);
  condition_sql TEXT;
  target_id UUID;
  target_id_field VARCHAR(50);
  new_count INTEGER;
  delta INTEGER := 0;
BEGIN
  -- Extract configuration
  count_field := p_rule_config->>'count_field';
  condition_sql := p_rule_config->>'condition';
  target_id_field := COALESCE(p_rule_config->>'target_id_field', 'id');

  -- Determine target ID for the count update
  IF p_target_table = 'user_profiles' THEN
    target_id := COALESCE(
      (p_new_record->>'seller_id')::UUID,  -- For listings -> user_profiles
      (p_old_record->>'seller_id')::UUID,
      (p_new_record->>'buyer_id')::UUID,   -- For inquiries -> user_profiles
      (p_old_record->>'buyer_id')::UUID,
      (p_new_record->>'user_id')::UUID,    -- Generic fallback
      (p_old_record->>'user_id')::UUID,
      (p_new_record->>'id')::UUID,
      (p_old_record->>'id')::UUID
    );
  ELSIF p_target_table = 'listings' THEN
    target_id := COALESCE(
      (p_new_record->>'listing_id')::UUID,
      (p_old_record->>'listing_id')::UUID
    );
  ELSE
    target_id := COALESCE(
      (p_new_record->>target_id_field)::UUID,
      (p_old_record->>target_id_field)::UUID
    );
  END IF;

  IF target_id IS NULL THEN
    RAISE NOTICE 'Cannot determine target_id for count sync on table %', p_target_table;
    RETURN;
  END IF;

  -- Calculate delta based on operation
  CASE p_operation
    WHEN 'INSERT' THEN
      -- Check if new record meets condition
      IF condition_sql IS NULL OR sync_record_meets_condition(p_new_record, condition_sql) THEN
        delta := 1;
      END IF;

    WHEN 'DELETE' THEN
      -- Check if old record met condition
      IF condition_sql IS NULL OR sync_record_meets_condition(p_old_record, condition_sql) THEN
        delta := -1;
      END IF;

    WHEN 'UPDATE' THEN
      -- Check both old and new records
      DECLARE
        old_meets_condition BOOLEAN := condition_sql IS NULL OR sync_record_meets_condition(p_old_record, condition_sql);
        new_meets_condition BOOLEAN := condition_sql IS NULL OR sync_record_meets_condition(p_new_record, condition_sql);
      BEGIN
        IF NOT old_meets_condition AND new_meets_condition THEN
          delta := 1;  -- Now qualifies
        ELSIF old_meets_condition AND NOT new_meets_condition THEN
          delta := -1; -- No longer qualifies
        END IF;
        -- If both true or both false, delta remains 0
      END;
  END CASE;

  -- Apply the count change if there's a delta
  IF delta != 0 THEN
    EXECUTE format(
      'UPDATE %I SET %I = GREATEST(0, COALESCE(%I, 0) + $1), sync_version = sync_version + 1, updated_at = NOW() WHERE id = $2',
      p_target_table, count_field, count_field
    ) USING delta, target_id;

    -- Log the count sync for monitoring
    INSERT INTO sync_events (
      event_type, source_table, target_table, target_id,
      operation, new_values, sync_status, created_at
    ) VALUES (
      'count_delta_applied',
      'sync_count_fields',
      p_target_table,
      target_id,
      'UPDATE',
      jsonb_build_object(
        'count_field', count_field,
        'delta', delta,
        'condition', condition_sql
      ),
      'completed',
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update recalculate_all_counts function with correct column names
CREATE OR REPLACE FUNCTION recalculate_all_counts()
RETURNS TABLE(table_name TEXT, field_name TEXT, records_updated INTEGER) AS $$
DECLARE
  rec RECORD;
  update_count INTEGER;
BEGIN
  -- Recalculate listing_count in user_profiles
  UPDATE user_profiles SET
    listing_count = (
      SELECT COUNT(*)
      FROM listings
      WHERE seller_id = user_profiles.id
        AND status IN ('active', 'verified_anonymous', 'verified_public')
    ),
    sync_version = sync_version + 1,
    updated_at = NOW();

  GET DIAGNOSTICS update_count = ROW_COUNT;
  RETURN QUERY SELECT 'user_profiles'::TEXT, 'listing_count'::TEXT, update_count;

  -- Recalculate inquiry_count in listings
  UPDATE listings SET
    inquiry_count = (
      SELECT COUNT(*)
      FROM inquiries
      WHERE listing_id = listings.id
    ),
    sync_version = sync_version + 1,
    updated_at = NOW();

  GET DIAGNOSTICS update_count = ROW_COUNT;
  RETURN QUERY SELECT 'listings'::TEXT, 'inquiry_count'::TEXT, update_count;

  -- Recalculate inquiry_count in user_profiles (as buyers)
  UPDATE user_profiles SET
    inquiry_count = (
      SELECT COUNT(*)
      FROM inquiries
      WHERE buyer_id = user_profiles.id
    ),
    sync_version = sync_version + 1,
    updated_at = NOW();

  GET DIAGNOSTICS update_count = ROW_COUNT;
  RETURN QUERY SELECT 'user_profiles'::TEXT, 'inquiry_count'::TEXT, update_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration complete notification
DO $$
BEGIN
  RAISE NOTICE 'Sync count fields function updated with correct column names';
END $$;
