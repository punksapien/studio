-- Universal Sync Trigger System - Phase 2: Specific Implementations
-- Migration: 20250115000002_universal_sync_implementations.sql
--
-- This migration implements the specific sync rule functions that were referenced
-- in Phase 1. These handle count synchronization, status cascading, and audit trails.

-- =============================================================================
-- 1. COUNT SYNC IMPLEMENTATION - Real-time Aggregation
-- =============================================================================

-- Function to sync count fields across tables
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
      'UPDATE public.%I SET %I = GREATEST(0, COALESCE(%I, 0) + $1), sync_version = sync_version + 1, updated_at = NOW() WHERE id = $2',
      p_target_table, count_field, count_field
    ) USING delta, target_id;

    -- Log the count sync for monitoring
    INSERT INTO public.sync_events (
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

-- Helper function to check if a record meets a condition
CREATE OR REPLACE FUNCTION sync_record_meets_condition(
  p_record JSONB,
  p_condition TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  -- Simple condition parser for common patterns
  -- This handles basic cases like: status IN ('active', 'verified')
  -- For more complex conditions, this could be extended

  IF p_condition ILIKE '%status IN%' THEN
    -- Extract status values from condition
    DECLARE
      status_value TEXT := p_record->>'status';
      allowed_statuses TEXT[];
    BEGIN
      -- Parse the IN clause (basic implementation)
      allowed_statuses := regexp_split_to_array(
        regexp_replace(p_condition, '.*IN\s*\(\s*''([^'']+)''(?:\s*,\s*''([^'']+)'')*\s*\).*', '\1,\2'),
        ','
      );

      RETURN status_value = ANY(allowed_statuses);
    END;
  END IF;

  -- For other conditions, assume true (can be extended)
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 2. STATUS CASCADE IMPLEMENTATION - Cross-table Status Sync
-- =============================================================================

-- Function to cascade status changes across related tables
CREATE OR REPLACE FUNCTION sync_status_cascade(
  p_rule_config JSONB,
  p_new_record JSONB,
  p_old_record JSONB,
  p_target_table VARCHAR(50),
  p_operation VARCHAR(20)
)
RETURNS VOID AS $$
DECLARE
  field_mapping JSONB;
  source_field TEXT;
  target_field TEXT;
  source_value TEXT;
  target_condition TEXT;
  update_sql TEXT;
  relation_field TEXT;
  relation_id UUID;
BEGIN
  -- Extract configuration
  field_mapping := p_rule_config->'field_mapping';
  relation_field := COALESCE(p_rule_config->>'relation_field', 'user_id');

  -- Only process UPDATE operations for status cascades
  IF p_operation != 'UPDATE' THEN
    RETURN;
  END IF;

  -- Get the relation ID (usually user_id)
  relation_id := (p_new_record->>relation_field)::UUID;

  IF relation_id IS NULL THEN
    RETURN;
  END IF;

  -- Process each field mapping
  FOR source_field, target_field IN
    SELECT key, value FROM jsonb_each_text(field_mapping)
  LOOP
    -- Check if the source field changed
    IF (p_old_record->>source_field) IS DISTINCT FROM (p_new_record->>source_field) THEN
      source_value := p_new_record->>source_field;

      -- Determine target value based on mapping rules
      CASE
        WHEN source_field = 'verification_status' AND target_field = 'is_seller_verified' THEN
          -- Map verification status to boolean
          CASE source_value
            WHEN 'verified' THEN
              update_sql := format(
                'UPDATE public.%I SET %I = true, sync_version = sync_version + 1, updated_at = NOW() WHERE %I = $1',
                p_target_table, target_field, relation_field
              );
            ELSE
              update_sql := format(
                'UPDATE public.%I SET %I = false, sync_version = sync_version + 1, updated_at = NOW() WHERE %I = $1',
                p_target_table, target_field, relation_field
              );
          END CASE;

        WHEN source_field = 'is_email_verified' AND target_field = 'email_verification_status' THEN
          -- Map boolean to status string
          IF source_value::BOOLEAN THEN
            update_sql := format(
              'UPDATE public.%I SET %I = ''verified'', sync_version = sync_version + 1, updated_at = NOW() WHERE %I = $1',
              p_target_table, target_field, relation_field
            );
          ELSE
            update_sql := format(
              'UPDATE public.%I SET %I = ''unverified'', sync_version = sync_version + 1, updated_at = NOW() WHERE %I = $1',
              p_target_table, target_field, relation_field
            );
          END IF;

        ELSE
          -- Direct field mapping
          update_sql := format(
            'UPDATE public.%I SET %I = $2, sync_version = sync_version + 1, updated_at = NOW() WHERE %I = $1',
            p_target_table, target_field, relation_field
          );
      END CASE;

      -- Execute the update
      IF update_sql IS NOT NULL THEN
        IF source_field IN ('verification_status', 'is_email_verified') THEN
          EXECUTE update_sql USING relation_id;
        ELSE
          EXECUTE update_sql USING relation_id, source_value;
        END IF;

        -- Log the cascade for monitoring
        INSERT INTO public.sync_events (
          event_type, source_table, target_table, target_id,
          operation, new_values, sync_status, created_at
        ) VALUES (
          'status_cascade_applied',
          'sync_status_cascade',
          p_target_table,
          relation_id,
          'UPDATE',
          jsonb_build_object(
            'source_field', source_field,
            'target_field', target_field,
            'source_value', source_value,
            'relation_field', relation_field
          ),
          'completed',
          NOW()
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. AUDIT TRAIL IMPLEMENTATION - Change Tracking
-- =============================================================================

-- Drop and recreate audit trail table to ensure correct schema
DROP TABLE IF EXISTS auth_sync_logs;

CREATE TABLE auth_sync_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(20) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_version BIGINT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_auth_sync_logs_user_time ON auth_sync_logs(user_id, changed_at DESC);
CREATE INDEX idx_auth_sync_logs_table_record ON auth_sync_logs(table_name, record_id, changed_at DESC);

-- Function to create audit trail entries
CREATE OR REPLACE FUNCTION sync_audit_trail(
  p_rule_config JSONB,
  p_new_record JSONB,
  p_old_record JSONB,
  p_target_table VARCHAR(50), -- This is the source table name, passed as target
  p_operation VARCHAR(20)
)
RETURNS VOID AS $$
DECLARE
  record_id UUID;
  changed_by_id UUID;
  changed_fields JSONB;
BEGIN
  -- Determine record ID and user responsible for the change
  record_id := COALESCE((p_new_record->>'id')::UUID, (p_old_record->>'id')::UUID);
  changed_by_id := COALESCE(
    (p_new_record->>'updated_by')::UUID,
    (p_new_record->>'created_by')::UUID,
    (p_new_record->>'user_id')::UUID,
    '00000000-0000-0000-0000-000000000000' -- System user
  );

  -- Calculate changed fields for UPDATE operations
  IF p_operation = 'UPDATE' THEN
    changed_fields := jsonb_diff_val(to_jsonb(p_old_record), to_jsonb(p_new_record));
  ELSE
    changed_fields := to_jsonb(p_new_record);
  END IF;

  -- Insert into the audit trail log
  INSERT INTO public.audit_trail (
    table_name,
    record_id,
    operation,
    changed_by_id,
    old_values,
    new_values,
    changed_fields,
    changed_at
  ) VALUES (
    p_target_table,
    record_id,
    p_operation,
    changed_by_id,
    p_old_record,
    p_new_record,
    changed_fields,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. APPLY UNIVERSAL TRIGGERS TO EXISTING TABLES
-- =============================================================================

-- Apply count sync triggers to critical tables
CREATE TRIGGER trigger_listings_count_sync
  AFTER INSERT OR UPDATE OR DELETE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION universal_sync_trigger('count_sync');

CREATE TRIGGER trigger_inquiries_count_sync
  AFTER INSERT OR UPDATE OR DELETE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION universal_sync_trigger('count_sync');

-- Apply status cascade triggers
CREATE TRIGGER trigger_user_profiles_status_cascade
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION universal_sync_trigger('status_cascade');

-- Apply audit trail triggers
CREATE TRIGGER trigger_user_profiles_audit_trail
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION universal_sync_trigger('audit_trail');

CREATE TRIGGER trigger_verification_requests_audit_trail
  AFTER INSERT OR UPDATE OR DELETE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION universal_sync_trigger('audit_trail');

-- =============================================================================
-- 5. PERFORMANCE OPTIMIZATIONS & MAINTENANCE
-- =============================================================================

-- Optimized count recalculation function for batch fixes
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

-- =============================================================================
-- 6. SYNC SYSTEM UTILITIES
-- =============================================================================

-- Function to disable/enable specific sync rules
CREATE OR REPLACE FUNCTION toggle_sync_rule(
  p_event_type VARCHAR(50),
  p_source_table VARCHAR(50),
  p_target_table VARCHAR(50),
  p_enabled BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE sync_rules
  SET is_enabled = p_enabled, updated_at = NOW()
  WHERE event_type = p_event_type
    AND source_table = p_source_table
    AND target_table = p_target_table;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retry failed sync events
CREATE OR REPLACE FUNCTION retry_failed_sync_events(p_max_retries INTEGER DEFAULT 3)
RETURNS INTEGER AS $$
DECLARE
  retry_count INTEGER := 0;
  event_record RECORD;
BEGIN
  FOR event_record IN
    SELECT id, event_type, source_table, source_id, target_table, operation, old_values, new_values
    FROM sync_events
    WHERE sync_status = 'failed'
      AND retry_count < p_max_retries
      AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at ASC
    LIMIT 100
  LOOP
    BEGIN
      -- Mark as retrying
      UPDATE sync_events
      SET sync_status = 'retrying', retry_count = retry_count + 1
      WHERE id = event_record.id;

      -- Retry the sync operation
      PERFORM execute_sync_rules(
        event_record.event_type,
        event_record.new_values,
        event_record.old_values,
        event_record.source_table,
        event_record.source_id,
        event_record.operation
      );

      retry_count := retry_count + 1;

    EXCEPTION WHEN OTHERS THEN
      -- Log the retry failure
      UPDATE sync_events
      SET
        sync_status = 'failed',
        error_details = jsonb_build_object(
          'retry_error', SQLERRM,
          'retry_state', SQLSTATE,
          'retry_attempt', retry_count + 1
        )
      WHERE id = event_record.id;
    END;
  END LOOP;

  RETURN retry_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. PERMISSIONS & FINAL SETUP
-- =============================================================================

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION recalculate_all_counts() TO service_role;
GRANT EXECUTE ON FUNCTION toggle_sync_rule(VARCHAR, VARCHAR, VARCHAR, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION retry_failed_sync_events(INTEGER) TO service_role;

-- Grant SELECT permissions on audit table
GRANT SELECT ON auth_sync_logs TO authenticated;

-- Enable RLS on audit table
ALTER TABLE auth_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy for audit logs (users can only see their own)
CREATE POLICY "Users can view their own audit logs" ON auth_sync_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Migration complete notification
DO $$
BEGIN
  RAISE NOTICE 'Universal Sync Trigger System - Phase 2 (Implementations) completed successfully!';
  RAISE NOTICE 'Count sync, status cascade, and audit trail systems are now active';
  RAISE NOTICE 'Use recalculate_all_counts() to fix any existing inconsistencies';
  RAISE NOTICE 'Monitor system health with sync_health_dashboard view';
END $$;

-- Function to compare two jsonb objects and return the differences
CREATE OR REPLACE FUNCTION jsonb_diff_val(val1 JSONB, val2 JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  v RECORD;
BEGIN
  result = val2;
  FOR v IN SELECT * FROM jsonb_each(val1)
  LOOP
    IF result @> jsonb_build_object(v.key, v.value) THEN
      result = result - v.key;
    ELSIF NOT result ? v.key THEN
      result = result || jsonb_build_object(v.key, null);
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to auth.users to sync to user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'buyer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop existing triggers to avoid conflicts before recreating them
DROP TRIGGER IF EXISTS trigger_listings_count_sync ON public.listings;
DROP TRIGGER IF EXISTS trigger_inquiries_count_sync ON public.inquiries;
DROP TRIGGER IF EXISTS trigger_user_profiles_status_cascade ON public.user_profiles;
DROP TRIGGER IF EXISTS trigger_user_profiles_audit_trail ON public.user_profiles;
DROP TRIGGER IF EXISTS trigger_verification_requests_audit_trail ON public.verification_requests;

-- Define triggers to call the universal sync function

-- Trigger for listings count changes
CREATE TRIGGER trigger_listings_count_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION universal_sync_trigger('count_sync');

-- Trigger for inquiries count changes
CREATE TRIGGER trigger_inquiries_count_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION universal_sync_trigger('count_sync');

-- Trigger for status changes on user_profiles
CREATE TRIGGER trigger_user_profiles_status_cascade
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION universal_sync_trigger('status_cascade');

-- Trigger for audit trail on user_profiles
CREATE TRIGGER trigger_user_profiles_audit_trail
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION universal_sync_trigger('audit_trail');

-- Trigger for audit trail on verification_requests
CREATE TRIGGER trigger_verification_requests_audit_trail
  AFTER INSERT OR UPDATE OR DELETE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION universal_sync_trigger('audit_trail');
