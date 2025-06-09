-- Universal Sync Trigger System - Phase 2: Real-time WebSocket Integration
-- Migration: 20250115000008_realtime_sync_integration.sql

-- =============================================================================
-- 1. REAL-TIME SYNC NOTIFICATIONS
-- =============================================================================

-- Enable Realtime for sync_events table (for live monitoring dashboards)
ALTER PUBLICATION supabase_realtime ADD TABLE sync_events;
ALTER PUBLICATION supabase_realtime ADD TABLE sync_rules;

-- Create real-time notification channels table
CREATE TABLE sync_notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name VARCHAR(50) NOT NULL,
  event_types VARCHAR(200)[], -- Array of event types to subscribe to
  filter_conditions JSONB, -- Optional filtering conditions
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient channel lookups
CREATE INDEX idx_sync_channels_user_table ON sync_notification_channels(user_id, table_name);
CREATE INDEX idx_sync_channels_active ON sync_notification_channels(is_active, channel_name);

-- Enable RLS for sync_notification_channels
ALTER TABLE sync_notification_channels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own notification channels
CREATE POLICY "Users can manage their own sync notification channels" ON sync_notification_channels
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 2. REAL-TIME BROADCAST FUNCTIONS
-- =============================================================================

-- Function to broadcast sync events in real-time
CREATE OR REPLACE FUNCTION broadcast_sync_event(
  p_event_type VARCHAR(50),
  p_source_table VARCHAR(50),
  p_target_table VARCHAR(50),
  p_source_id UUID,
  p_target_id UUID,
  p_operation VARCHAR(20),
  p_new_values JSONB,
  p_old_values JSONB,
  p_processing_time_ms INTEGER
)
RETURNS VOID AS $$
DECLARE
  notification_payload JSONB;
  channel_rec RECORD;
BEGIN
  -- Create notification payload
  notification_payload := jsonb_build_object(
    'event_type', p_event_type,
    'source_table', p_source_table,
    'target_table', p_target_table,
    'source_id', p_source_id,
    'target_id', p_target_id,
    'operation', p_operation,
    'new_values', p_new_values,
    'old_values', p_old_values,
    'processing_time_ms', p_processing_time_ms,
    'timestamp', NOW()
  );

  -- Broadcast to general sync events channel
  PERFORM pg_notify(
    'sync_events',
    notification_payload::text
  );

  -- Broadcast to table-specific channels
  PERFORM pg_notify(
    'sync_' || p_source_table,
    notification_payload::text
  );

  IF p_target_table IS NOT NULL AND p_target_table != p_source_table THEN
    PERFORM pg_notify(
      'sync_' || p_target_table,
      notification_payload::text
    );
  END IF;

  -- Broadcast to user-specific channels (for personalized notifications)
  FOR channel_rec IN
    SELECT nc.channel_name, nc.user_id, nc.filter_conditions
    FROM sync_notification_channels nc
    WHERE nc.is_active = true
      AND (nc.table_name = p_source_table OR nc.table_name = p_target_table OR nc.table_name = 'all')
      AND (nc.event_types IS NULL OR p_event_type = ANY(nc.event_types))
  LOOP
    -- Apply filter conditions if specified
    IF channel_rec.filter_conditions IS NULL OR
       sync_record_meets_condition(p_new_values, channel_rec.filter_conditions->>'condition') THEN

      PERFORM pg_notify(
        channel_rec.channel_name,
        (notification_payload || jsonb_build_object('user_id', channel_rec.user_id))::text
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast count updates specifically (for real-time UI updates)
CREATE OR REPLACE FUNCTION broadcast_count_update(
  p_table_name VARCHAR(50),
  p_record_id UUID,
  p_count_field VARCHAR(50),
  p_old_count INTEGER,
  p_new_count INTEGER,
  p_delta INTEGER
)
RETURNS VOID AS $$
DECLARE
  count_payload JSONB;
BEGIN
  count_payload := jsonb_build_object(
    'type', 'count_update',
    'table_name', p_table_name,
    'record_id', p_record_id,
    'count_field', p_count_field,
    'old_count', p_old_count,
    'new_count', p_new_count,
    'delta', p_delta,
    'timestamp', NOW()
  );

  -- Broadcast to general count updates channel
  PERFORM pg_notify('count_updates', count_payload::text);

  -- Broadcast to table-specific count channel
  PERFORM pg_notify('count_' || p_table_name, count_payload::text);

  -- Broadcast to record-specific channel (for individual record UI updates)
  PERFORM pg_notify('count_' || p_table_name || '_' || p_record_id, count_payload::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. ENHANCED SYNC FUNCTIONS WITH REAL-TIME BROADCASTING
-- =============================================================================

-- Update sync_count_fields to include real-time broadcasting
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
  old_count INTEGER;
  new_count INTEGER;
  delta INTEGER := 0;
  source_record JSONB;
  start_time TIMESTAMP;
  processing_time INTEGER;
BEGIN
  start_time := clock_timestamp();

  -- Extract configuration
  count_field := p_rule_config->>'count_field';
  condition_sql := p_rule_config->>'condition';

  -- Use NEW record for INSERT/UPDATE, OLD record for DELETE operations
  source_record := COALESCE(p_new_record, p_old_record);

  -- Determine target ID based on source->target relationship
  IF p_target_table = 'user_profiles' THEN
    target_id := COALESCE(
      (source_record->>'seller_id')::UUID,
      (source_record->>'buyer_id')::UUID,
      (source_record->>'user_id')::UUID
    );
  ELSIF p_target_table = 'listings' THEN
    target_id := COALESCE(
      (source_record->>'listing_id')::UUID
    );
  ELSE
    target_id := (source_record->>'id')::UUID;
  END IF;

  IF target_id IS NULL THEN
    RAISE NOTICE 'Cannot determine target_id for count sync: source_table=%, target_table=%, available_fields=%',
      'unknown', p_target_table, (SELECT string_agg(key, ', ') FROM jsonb_object_keys(source_record) AS key);
    RETURN;
  END IF;

  -- Get current count before changes
  EXECUTE format('SELECT COALESCE(%I, 0) FROM %I WHERE id = $1', count_field, p_target_table)
  INTO old_count USING target_id;

  -- Calculate delta based on operation
  CASE p_operation
    WHEN 'INSERT' THEN
      IF condition_sql IS NULL OR sync_record_meets_condition(p_new_record, condition_sql) THEN
        delta := 1;
      END IF;
    WHEN 'DELETE' THEN
      IF condition_sql IS NULL OR sync_record_meets_condition(p_old_record, condition_sql) THEN
        delta := -1;
      END IF;
    WHEN 'UPDATE' THEN
      DECLARE
        old_meets_condition BOOLEAN := condition_sql IS NULL OR sync_record_meets_condition(p_old_record, condition_sql);
        new_meets_condition BOOLEAN := condition_sql IS NULL OR sync_record_meets_condition(p_new_record, condition_sql);
      BEGIN
        IF NOT old_meets_condition AND new_meets_condition THEN
          delta := 1;
        ELSIF old_meets_condition AND NOT new_meets_condition THEN
          delta := -1;
        END IF;
      END;
  END CASE;

  -- Apply the count change if there's a delta
  IF delta != 0 THEN
    new_count := GREATEST(0, old_count + delta);

    EXECUTE format(
      'UPDATE %I SET %I = $1, sync_version = sync_version + 1, updated_at = NOW() WHERE id = $2',
      p_target_table, count_field
    ) USING new_count, target_id;

    processing_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time));

    -- Broadcast real-time count update
    PERFORM broadcast_count_update(
      p_target_table, target_id, count_field, old_count, new_count, delta
    );

    RAISE NOTICE 'Count sync applied: % records %s in %.% for target_id % (old: %, new: %, time: %ms)',
      abs(delta),
      CASE WHEN delta > 0 THEN 'added' ELSE 'removed' END,
      p_target_table,
      count_field,
      target_id,
      old_count,
      new_count,
      processing_time;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. ENHANCED SYNC EVENT TRACKING WITH REAL-TIME BROADCASTING
-- =============================================================================

-- Update execute_sync_rules to broadcast real-time events
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
  sync_event_id UUID;
  rule_rec RECORD;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  processing_time INTEGER;
  error_count INTEGER := 0;
  success_count INTEGER := 0;
  target_tables TEXT[] := '{}';
  target_ids UUID[] := '{}';
BEGIN
  start_time := clock_timestamp();

  -- Create a sync event to track this execution
  INSERT INTO sync_events (
    event_type, source_table, source_id, operation,
    new_values, old_values, sync_status, created_at
  ) VALUES (
    p_event_type, p_source_table, p_source_id, p_operation,
    p_new_record, p_old_record, 'pending', NOW()
  ) RETURNING id INTO sync_event_id;

  -- Find and execute matching sync rules
  FOR rule_rec IN
    SELECT * FROM sync_rules
    WHERE event_type = p_event_type
      AND source_table = p_source_table
      AND is_active = true
    ORDER BY priority ASC
  LOOP
    BEGIN
      -- Update sync event with target table
      UPDATE sync_events
      SET target_table = rule_rec.target_table
      WHERE id = sync_event_id;

      -- Execute the specific sync rule
      PERFORM execute_specific_sync_rule(
        rule_rec.rule_config,
        p_new_record,
        p_old_record,
        rule_rec.target_table,
        p_operation
      );

      -- Track target tables for broadcasting
      target_tables := array_append(target_tables, rule_rec.target_table);
      success_count := success_count + 1;

    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE NOTICE 'Sync rule execution failed: %', SQLERRM;
    END;
  END LOOP;

  end_time := clock_timestamp();
  processing_time := EXTRACT(MILLISECONDS FROM (end_time - start_time));

  -- Update sync event with final status
  UPDATE sync_events
  SET
    sync_status = CASE
      WHEN error_count = 0 THEN 'completed'
      WHEN success_count > 0 THEN 'completed'
      ELSE 'failed'
    END,
    processed_at = end_time,
    processing_time_ms = processing_time
  WHERE id = sync_event_id;

  -- Broadcast real-time sync event (only for successful operations)
  IF error_count = 0 THEN
    PERFORM broadcast_sync_event(
      p_event_type,
      p_source_table,
      CASE WHEN array_length(target_tables, 1) = 1 THEN target_tables[1] ELSE NULL END,
      p_source_id,
      NULL, -- target_id will be determined per rule
      p_operation,
      p_new_record,
      p_old_record,
      processing_time
    );
  END IF;

  RETURN error_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. WEBHOOK INTEGRATION FRAMEWORK
-- =============================================================================

-- Create webhook endpoints table for external integrations
CREATE TABLE sync_webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  http_method VARCHAR(10) DEFAULT 'POST',
  headers JSONB DEFAULT '{}',
  event_types VARCHAR(50)[] NOT NULL,
  table_filters VARCHAR(50)[], -- Which tables to listen to
  is_active BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook delivery log
CREATE TABLE sync_webhook_deliveries (
  id BIGSERIAL PRIMARY KEY,
  webhook_endpoint_id UUID REFERENCES sync_webhook_endpoints(id) ON DELETE CASCADE,
  sync_event_id BIGINT REFERENCES sync_events(id) ON DELETE CASCADE, -- Fixed: BIGINT to match sync_events.id
  payload JSONB NOT NULL,
  http_status_code INTEGER,
  response_body TEXT,
  delivery_status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed, retrying
  retry_count INTEGER DEFAULT 0,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for webhook performance
CREATE INDEX idx_webhook_deliveries_status ON sync_webhook_deliveries(delivery_status, created_at);
CREATE INDEX idx_webhook_deliveries_endpoint ON sync_webhook_deliveries(webhook_endpoint_id, created_at);

-- Function to trigger webhook deliveries
CREATE OR REPLACE FUNCTION trigger_webhook_deliveries(
  p_event_type VARCHAR(50),
  p_source_table VARCHAR(50),
  p_target_table VARCHAR(50),
  p_sync_event_id UUID,
  p_payload JSONB
)
RETURNS VOID AS $$
DECLARE
  webhook_rec RECORD;
BEGIN
  -- Find matching webhook endpoints
  FOR webhook_rec IN
    SELECT *
    FROM sync_webhook_endpoints
    WHERE is_active = true
      AND p_event_type = ANY(event_types)
      AND (table_filters IS NULL OR p_source_table = ANY(table_filters) OR p_target_table = ANY(table_filters))
  LOOP
    -- Queue webhook delivery
    INSERT INTO sync_webhook_deliveries (
      webhook_endpoint_id,
      sync_event_id,
      payload,
      delivery_status,
      created_at
    ) VALUES (
      webhook_rec.id,
      p_sync_event_id,
      p_payload,
      'pending',
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. REAL-TIME UI HELPER FUNCTIONS
-- =============================================================================

-- Function to subscribe to user-specific sync notifications
CREATE OR REPLACE FUNCTION create_user_sync_subscription(
  p_user_id UUID,
  p_channel_name VARCHAR(100),
  p_table_name VARCHAR(50),
  p_event_types VARCHAR(50)[],
  p_filter_conditions JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  subscription_id UUID;
BEGIN
  INSERT INTO sync_notification_channels (
    channel_name, user_id, table_name, event_types, filter_conditions, is_active
  ) VALUES (
    p_channel_name, p_user_id, p_table_name, p_event_types, p_filter_conditions, true
  ) RETURNING id INTO subscription_id;

  RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get real-time sync statistics for dashboards
CREATE OR REPLACE FUNCTION get_realtime_sync_stats()
RETURNS TABLE(
  total_events_last_hour INTEGER,
  avg_processing_time_ms NUMERIC,
  active_subscriptions INTEGER,
  pending_webhooks INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM sync_events WHERE created_at > NOW() - INTERVAL '1 hour'),
    (SELECT ROUND(AVG(processing_time_ms)::NUMERIC, 2) FROM sync_events WHERE created_at > NOW() - INTERVAL '1 hour'),
    (SELECT COUNT(*)::INTEGER FROM sync_notification_channels WHERE is_active = true),
    (SELECT COUNT(*)::INTEGER FROM sync_webhook_deliveries WHERE delivery_status = 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. PERMISSIONS & SECURITY
-- =============================================================================

-- Grant permissions for real-time features
GRANT SELECT, INSERT, UPDATE, DELETE ON sync_notification_channels TO authenticated;
GRANT SELECT ON sync_webhook_endpoints TO authenticated;
GRANT SELECT ON sync_webhook_deliveries TO authenticated;

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE sync_notification_channels;

-- =============================================================================
-- 8. INITIALIZE REAL-TIME SYSTEM
-- =============================================================================

-- Enable real-time for existing sync tables
DO $$
BEGIN
  -- Add sync_events to realtime publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'sync_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sync_events;
  END IF;

  RAISE NOTICE 'Real-time sync integration initialized successfully!';
END $$;

-- Migration complete message
DO $$
BEGIN
  RAISE NOTICE '🚀 Universal Sync Trigger System - Phase 2 (Real-time Integration) completed!';
  RAISE NOTICE '';
  RAISE NOTICE 'NEW FEATURES AVAILABLE:';
  RAISE NOTICE '• Real-time sync event broadcasting via PostgreSQL NOTIFY/LISTEN';
  RAISE NOTICE '• Supabase Realtime subscriptions for live UI updates';
  RAISE NOTICE '• User-specific notification channels with filtering';
  RAISE NOTICE '• Real-time count updates for instant UI feedback';
  RAISE NOTICE '• Webhook integration framework for external services';
  RAISE NOTICE '• Performance monitoring with sub-100ms target latency';
  RAISE NOTICE '';
  RAISE NOTICE 'USAGE EXAMPLES:';
  RAISE NOTICE '• Subscribe to sync events: LISTEN sync_events;';
  RAISE NOTICE '• Monitor count updates: LISTEN count_updates;';
  RAISE NOTICE '• Table-specific events: LISTEN sync_user_profiles;';
  RAISE NOTICE '• Create user subscriptions: SELECT create_user_sync_subscription(...);';
  RAISE NOTICE '';
  RAISE NOTICE '✅ System ready for real-time UI integration!';
END $$;
