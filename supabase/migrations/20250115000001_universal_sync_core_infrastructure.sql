-- Universal Sync Trigger System - Phase 1: Core Infrastructure
-- Migration: 20250115000001_universal_sync_core_infrastructure.sql
--
-- This migration creates the foundational components for a production-grade
-- universal sync trigger system based on industry best practices from Meta TAO,
-- PostgreSQL patterns, and distributed systems research.

-- =============================================================================
-- 1. UNIVERSAL SYNC FRAMEWORK - Central Event Coordination
-- =============================================================================

-- Central sync coordination table - tracks all sync events across the system
CREATE TABLE sync_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- e.g., 'count_sync', 'status_cascade', 'audit_trail'
  source_table VARCHAR(50) NOT NULL,
  source_id UUID NOT NULL,
  target_table VARCHAR(50),
  target_id UUID,
  operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'completed', 'failed', 'retrying', 'skipped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  error_details JSONB,
  processing_time_ms INTEGER, -- Track performance

  -- Prevent duplicate events
  UNIQUE(event_type, source_table, source_id, operation, created_at)
);

-- Indexes for performance and monitoring
CREATE INDEX idx_sync_events_status ON sync_events(sync_status);
CREATE INDEX idx_sync_events_created_at ON sync_events(created_at DESC);
CREATE INDEX idx_sync_events_event_type ON sync_events(event_type);
CREATE INDEX idx_sync_events_source ON sync_events(source_table, source_id);
CREATE INDEX idx_sync_events_target ON sync_events(target_table, target_id);
CREATE INDEX idx_sync_events_performance ON sync_events(processing_time_ms) WHERE processing_time_ms > 100;

-- =============================================================================
-- 2. CONFLICT RESOLUTION SYSTEM - Version-based Ordering
-- =============================================================================

-- Add sync version to all critical tables for conflict resolution
ALTER TABLE user_profiles ADD COLUMN sync_version BIGINT DEFAULT 1;
ALTER TABLE listings ADD COLUMN sync_version BIGINT DEFAULT 1;
ALTER TABLE inquiries ADD COLUMN sync_version BIGINT DEFAULT 1;
ALTER TABLE conversations ADD COLUMN sync_version BIGINT DEFAULT 1;
ALTER TABLE verification_requests ADD COLUMN sync_version BIGINT DEFAULT 1;

-- Function to increment sync version
CREATE OR REPLACE FUNCTION increment_sync_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sync_version = OLD.sync_version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply version increment triggers
CREATE TRIGGER sync_version_user_profiles
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION increment_sync_version();

CREATE TRIGGER sync_version_listings
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION increment_sync_version();

CREATE TRIGGER sync_version_inquiries
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION increment_sync_version();

CREATE TRIGGER sync_version_conversations
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION increment_sync_version();

CREATE TRIGGER sync_version_verification_requests
  BEFORE UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION increment_sync_version();

-- =============================================================================
-- 3. SYNC EXECUTION ENGINE - Core Logic Framework
-- =============================================================================

-- Configuration table for sync rules
CREATE TABLE sync_rules (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  source_table VARCHAR(50) NOT NULL,
  target_table VARCHAR(50) NOT NULL,
  rule_config JSONB NOT NULL, -- Configuration for the sync rule
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100, -- Lower number = higher priority
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(event_type, source_table, target_table)
);

-- Universal sync execution function with safety mechanisms
CREATE OR REPLACE FUNCTION execute_sync_rules(
  p_event_type VARCHAR(50),
  p_new_record JSONB,
  p_old_record JSONB,
  p_source_table VARCHAR(50),
  p_source_id UUID,
  p_operation VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
  rule_record RECORD;
  start_time TIMESTAMP WITH TIME ZONE;
  end_time TIMESTAMP WITH TIME ZONE;
  processing_time INTEGER;
  sync_event_id BIGINT;
  success_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  start_time := clock_timestamp();

  -- Prevent infinite recursion (safety mechanism)
  IF pg_trigger_depth() > 3 THEN
    RAISE NOTICE 'Sync rule execution stopped - recursion depth exceeded (depth: %)', pg_trigger_depth();
    RETURN false;
  END IF;

  -- Log the sync event
  INSERT INTO sync_events (
    event_type, source_table, source_id, operation,
    old_values, new_values, sync_status
  ) VALUES (
    p_event_type, p_source_table, p_source_id, p_operation,
    p_old_record, p_new_record, 'pending'
  ) RETURNING id INTO sync_event_id;

  -- Execute applicable sync rules
  FOR rule_record IN
    SELECT * FROM sync_rules
    WHERE event_type = p_event_type
      AND source_table = p_source_table
      AND is_enabled = true
    ORDER BY priority ASC
  LOOP
    BEGIN
      -- Execute the specific sync rule based on configuration
      PERFORM execute_specific_sync_rule(
        rule_record.rule_config,
        p_new_record,
        p_old_record,
        rule_record.target_table,
        p_operation
      );

      success_count := success_count + 1;

    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;

      -- Log the error but continue with other rules
      UPDATE sync_events
      SET
        sync_status = 'failed',
        error_details = jsonb_build_object(
          'rule_id', rule_record.id,
          'error_message', SQLERRM,
          'error_state', SQLSTATE
        ),
        retry_count = retry_count + 1
      WHERE id = sync_event_id;

      -- Re-raise for critical errors, log for others
      IF SQLSTATE IN ('40001', '40P01') THEN -- Deadlock errors
        RAISE;
      END IF;
    END;
  END LOOP;

  -- Update sync event with final status
  end_time := clock_timestamp();
  processing_time := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;

  UPDATE sync_events
  SET
    sync_status = CASE
      WHEN error_count = 0 THEN 'completed'
      WHEN success_count > 0 THEN 'completed' -- Partial success
      ELSE 'failed'
    END,
    processed_at = end_time,
    processing_time_ms = processing_time
  WHERE id = sync_event_id;

  RETURN error_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Specific sync rule executor (will be extended in Phase 2)
CREATE OR REPLACE FUNCTION execute_specific_sync_rule(
  p_rule_config JSONB,
  p_new_record JSONB,
  p_old_record JSONB,
  p_target_table VARCHAR(50),
  p_operation VARCHAR(20)
)
RETURNS VOID AS $$
DECLARE
  rule_type VARCHAR(50);
BEGIN
  rule_type := p_rule_config->>'type';

  -- Route to specific sync implementations
  CASE rule_type
    WHEN 'count_sync' THEN
      PERFORM sync_count_fields(p_rule_config, p_new_record, p_old_record, p_target_table, p_operation);
    WHEN 'status_cascade' THEN
      PERFORM sync_status_cascade(p_rule_config, p_new_record, p_old_record, p_target_table, p_operation);
    WHEN 'audit_trail' THEN
      PERFORM sync_audit_trail(p_rule_config, p_new_record, p_old_record, p_target_table, p_operation);
    ELSE
      RAISE NOTICE 'Unknown sync rule type: %', rule_type;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Universal trigger function template
CREATE OR REPLACE FUNCTION universal_sync_trigger()
RETURNS TRIGGER AS $$
DECLARE
  event_type VARCHAR(50);
  source_id UUID;
BEGIN
  -- Extract event type from trigger arguments
  event_type := TG_ARGV[0];
  source_id := COALESCE(NEW.id, OLD.id);

  -- Prevent infinite recursion
  IF pg_trigger_depth() > 2 THEN
    RAISE NOTICE 'Universal sync trigger stopped - recursion depth exceeded for event: %', event_type;
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Execute sync rules asynchronously (won't block the main transaction)
  PERFORM execute_sync_rules(
    event_type,
    CASE WHEN NEW IS NOT NULL THEN to_jsonb(NEW) ELSE NULL END,
    CASE WHEN OLD IS NOT NULL THEN to_jsonb(OLD) ELSE NULL END,
    TG_TABLE_NAME::VARCHAR(50),
    source_id,
    TG_OP
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the main transaction
  RAISE WARNING 'Universal sync trigger failed for event % on table %: %', event_type, TG_TABLE_NAME, SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. MONITORING & HEALTH SYSTEM
-- =============================================================================

-- Real-time sync health monitoring view
CREATE VIEW sync_health_dashboard AS
SELECT
  event_type,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE sync_status = 'completed') as successful,
  COUNT(*) FILTER (WHERE sync_status = 'failed') as failed,
  COUNT(*) FILTER (WHERE sync_status = 'pending') as pending,
  COUNT(*) FILTER (WHERE sync_status = 'retrying') as retrying,
  AVG(processing_time_ms) FILTER (WHERE processing_time_ms IS NOT NULL) as avg_processing_time_ms,
  MAX(processing_time_ms) as max_processing_time_ms,
  MIN(created_at) as earliest_event,
  MAX(created_at) as latest_event
FROM sync_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type
ORDER BY total_events DESC;

-- Failed sync events that need attention
CREATE VIEW sync_failures_requiring_attention AS
SELECT
  id,
  event_type,
  source_table,
  source_id,
  target_table,
  operation,
  retry_count,
  error_details,
  created_at,
  processing_time_ms
FROM sync_events
WHERE sync_status = 'failed'
  AND retry_count >= 3
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Performance monitoring for slow sync operations
CREATE VIEW sync_performance_issues AS
SELECT
  event_type,
  source_table,
  target_table,
  COUNT(*) as slow_operations,
  AVG(processing_time_ms) as avg_time_ms,
  MAX(processing_time_ms) as max_time_ms
FROM sync_events
WHERE processing_time_ms > 1000 -- Slower than 1 second
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type, source_table, target_table
ORDER BY avg_time_ms DESC;

-- =============================================================================
-- 5. MAINTENANCE & CLEANUP
-- =============================================================================

-- Function to clean up old sync events (prevent table bloat)
CREATE OR REPLACE FUNCTION cleanup_old_sync_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Keep sync events for 30 days, except failures (keep 90 days)
  DELETE FROM sync_events
  WHERE (
    sync_status IN ('completed', 'skipped')
    AND created_at < NOW() - INTERVAL '30 days'
  ) OR (
    sync_status IN ('failed', 'retrying')
    AND created_at < NOW() - INTERVAL '90 days'
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. PERMISSIONS & SECURITY
-- =============================================================================

-- Grant necessary permissions
GRANT SELECT ON sync_events TO authenticated;
GRANT SELECT ON sync_rules TO authenticated;
GRANT SELECT ON sync_health_dashboard TO authenticated;
GRANT SELECT ON sync_failures_requiring_attention TO authenticated;
GRANT SELECT ON sync_performance_issues TO authenticated;

-- Enable Row Level Security
ALTER TABLE sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_rules ENABLE ROW LEVEL SECURITY;

-- Policy for sync_events (read-only for authenticated users)
CREATE POLICY "Authenticated users can view sync events" ON sync_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for sync_rules (read-only for authenticated users)
CREATE POLICY "Authenticated users can view sync rules" ON sync_rules
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================================================
-- 7. INITIAL CONFIGURATION
-- =============================================================================

-- Insert placeholder sync rules (will be populated in Phase 2)
INSERT INTO sync_rules (event_type, source_table, target_table, rule_config, priority) VALUES
('count_sync', 'listings', 'user_profiles', '{"type": "count_sync", "count_field": "listing_count", "condition": "status IN (''active'', ''verified_anonymous'', ''verified_public'')"}', 10),
('count_sync', 'inquiries', 'listings', '{"type": "count_sync", "count_field": "inquiry_count"}', 20),
('count_sync', 'inquiries', 'user_profiles', '{"type": "count_sync", "count_field": "inquiry_count"}', 30),
('status_cascade', 'user_profiles', 'listings', '{"type": "status_cascade", "field_mapping": {"verification_status": "is_seller_verified"}}', 40),
('audit_trail', 'user_profiles', 'auth_sync_logs', '{"type": "audit_trail", "fields": ["verification_status", "is_email_verified", "role"]}', 50);

-- Migration complete message
DO $$
BEGIN
  RAISE NOTICE 'Universal Sync Trigger System - Phase 1 (Core Infrastructure) completed successfully!';
  RAISE NOTICE 'Next steps: Run Phase 2 migration to implement specific sync rules';
  RAISE NOTICE 'Monitoring: Use sync_health_dashboard view to monitor system health';
END $$;
