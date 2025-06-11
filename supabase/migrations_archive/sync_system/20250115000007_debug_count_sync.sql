-- Debug Count Sync Issue
-- Migration: 20250115000007_debug_count_sync.sql

-- Add debug logging to execute_sync_rules function
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
BEGIN
  start_time := clock_timestamp();

  -- Debug logging
  RAISE NOTICE 'execute_sync_rules called: event_type=%, source_table=%, operation=%, new_record_keys=%, old_record_keys=%',
    p_event_type, p_source_table, p_operation,
    CASE WHEN p_new_record IS NOT NULL THEN array_to_string(ARRAY(SELECT jsonb_object_keys(p_new_record)), ', ') ELSE 'NULL' END,
    CASE WHEN p_old_record IS NOT NULL THEN array_to_string(ARRAY(SELECT jsonb_object_keys(p_old_record)), ', ') ELSE 'NULL' END;

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
      -- Debug logging for each rule
      RAISE NOTICE 'Executing sync rule: event_type=%, source_table=%, target_table=%, rule_config=%',
        rule_rec.event_type, rule_rec.source_table, rule_rec.target_table, rule_rec.rule_config;

      -- Update sync event with target table
      UPDATE sync_events
      SET target_table = rule_rec.target_table, target_id = NULL
      WHERE id = sync_event_id;

      -- Execute the specific sync rule
      PERFORM execute_specific_sync_rule(
        rule_rec.rule_config,
        p_new_record,
        p_old_record,
        rule_rec.target_table,
        p_operation
      );

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
      WHEN success_count > 0 THEN 'completed' -- Partial success
      ELSE 'failed'
    END,
    processed_at = end_time,
    processing_time_ms = processing_time
  WHERE id = sync_event_id;

  RETURN error_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also add debug logging to execute_specific_sync_rule
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

  -- Debug logging
  RAISE NOTICE 'execute_specific_sync_rule: rule_type=%, target_table=%, operation=%, new_record_present=%, old_record_present=%',
    rule_type, p_target_table, p_operation,
    (p_new_record IS NOT NULL), (p_old_record IS NOT NULL);

  -- Route to specific sync implementations
  CASE rule_type
    WHEN 'count_sync' THEN
      RAISE NOTICE 'Calling sync_count_fields with config: %', p_rule_config;
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

-- Migration complete notification
DO $$
BEGIN
  RAISE NOTICE 'Debug logging added to sync rule execution functions';
  RAISE NOTICE 'Next test run will show detailed execution trace';
END $$;
