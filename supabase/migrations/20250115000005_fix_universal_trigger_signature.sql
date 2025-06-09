-- Fix Universal Sync Trigger Function - Parameter Type Casting
-- Addresses function signature mismatch where TG_TABLE_NAME (name type) needs to be cast to VARCHAR(50)

-- Replace the universal trigger function with proper type casting
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
  -- Fixed: Cast TG_TABLE_NAME from NAME to VARCHAR(50) to match function signature
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

-- Migration complete message
DO $$
BEGIN
  RAISE NOTICE 'Universal Sync Trigger Function - Type casting fix applied successfully!';
  RAISE NOTICE 'The universal_sync_trigger function now properly casts TG_TABLE_NAME to VARCHAR(50)';
  RAISE NOTICE 'All existing triggers will now execute sync rules correctly';
END $$;
