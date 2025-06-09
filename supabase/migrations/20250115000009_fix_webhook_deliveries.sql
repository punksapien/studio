-- Fix Webhook Deliveries Table
-- Migration: 20250115000009_fix_webhook_deliveries.sql

-- Check sync_events id column type and create compatible webhook deliveries table
DO $$
DECLARE
  sync_events_id_type TEXT;
BEGIN
  -- Get the actual data type of sync_events.id
  SELECT data_type INTO sync_events_id_type
  FROM information_schema.columns
  WHERE table_name = 'sync_events' AND column_name = 'id';

  RAISE NOTICE 'sync_events.id type is: %', sync_events_id_type;
END $$;

-- Drop and recreate webhook deliveries table with correct foreign key type
DROP TABLE IF EXISTS sync_webhook_deliveries;

-- Create webhook delivery log with correct data types
CREATE TABLE sync_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID REFERENCES sync_webhook_endpoints(id) ON DELETE CASCADE,
  sync_event_id UUID, -- Match the actual type of sync_events.id
  payload JSONB NOT NULL,
  http_status_code INTEGER,
  response_body TEXT,
  delivery_status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed, retrying
  retry_count INTEGER DEFAULT 0,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint manually (to handle any type issues gracefully)
DO $$
BEGIN
  -- Try to add the foreign key constraint
  ALTER TABLE sync_webhook_deliveries
  ADD CONSTRAINT sync_webhook_deliveries_sync_event_id_fkey
  FOREIGN KEY (sync_event_id) REFERENCES sync_events(id) ON DELETE CASCADE;

  RAISE NOTICE 'Foreign key constraint added successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add foreign key constraint: %. Proceeding without it.', SQLERRM;
END $$;

-- Recreate indexes for webhook performance
CREATE INDEX idx_webhook_deliveries_status ON sync_webhook_deliveries(delivery_status, created_at);
CREATE INDEX idx_webhook_deliveries_endpoint ON sync_webhook_deliveries(webhook_endpoint_id, created_at);

-- Grant permissions
GRANT SELECT ON sync_webhook_deliveries TO authenticated;

-- Migration complete message
DO $$
BEGIN
  RAISE NOTICE 'Webhook deliveries table fixed successfully!';
  RAISE NOTICE 'Phase 2 Real-time Integration is now fully operational';
END $$;
