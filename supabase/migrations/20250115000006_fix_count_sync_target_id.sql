-- Fix Count Sync Target ID Resolution
-- Migration: 20250115000006_fix_count_sync_target_id.sql

-- The issue: Count sync functions need to extract target_id from the SOURCE record's foreign key fields
-- For example: listings -> user_profiles should use listings.seller_id as the target_id

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
  new_count INTEGER;
  delta INTEGER := 0;
  source_record JSONB;
BEGIN
  -- Extract configuration
  count_field := p_rule_config->>'count_field';
  condition_sql := p_rule_config->>'condition';

  -- Use NEW record for INSERT/UPDATE, OLD record for DELETE operations
  source_record := COALESCE(p_new_record, p_old_record);

  -- Determine target ID based on source->target relationship
  -- For count sync, we need to find the foreign key in the source record that points to target table

  IF p_target_table = 'user_profiles' THEN
    -- Source record should have foreign key pointing to user_profiles
    target_id := COALESCE(
      (source_record->>'seller_id')::UUID,   -- listings.seller_id -> user_profiles.id
      (source_record->>'buyer_id')::UUID,    -- inquiries.buyer_id -> user_profiles.id
      (source_record->>'user_id')::UUID      -- generic user_id field
    );
  ELSIF p_target_table = 'listings' THEN
    -- Source record should have foreign key pointing to listings
    target_id := COALESCE(
      (source_record->>'listing_id')::UUID   -- inquiries.listing_id -> listings.id
    );
  ELSE
    -- For other tables, look for id field or target-specific foreign key
    target_id := (source_record->>'id')::UUID;
  END IF;

  IF target_id IS NULL THEN
    RAISE NOTICE 'Cannot determine target_id for count sync: source_table=%, target_table=%, available_fields=%',
      'unknown', p_target_table, (SELECT string_agg(key, ', ') FROM jsonb_object_keys(source_record) AS key);
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
        'target_id', target_id,
        'condition', condition_sql
      ),
      'completed',
      NOW()
    );

    RAISE NOTICE 'Count sync applied: % records %s in %.% for target_id %',
      abs(delta),
      CASE WHEN delta > 0 THEN 'added' ELSE 'removed' END,
      p_target_table,
      count_field,
      target_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration complete notification
DO $$
BEGIN
  RAISE NOTICE 'Count sync target_id resolution fixed!';
  RAISE NOTICE 'Function now properly extracts foreign key from source records';
  RAISE NOTICE 'Count synchronization should work correctly now';
END $$;
