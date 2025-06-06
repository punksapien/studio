-- Migration: Enhance verification_requests table for 24-hour cooldown and bump functionality
-- Date: 2025-01-06

-- Add new columns to verification_requests table
ALTER TABLE verification_requests
ADD COLUMN last_request_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN bump_count INTEGER DEFAULT 0,
ADD COLUMN last_bump_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN priority_score INTEGER DEFAULT 0;

-- Create index for performance on time-based queries
CREATE INDEX idx_verification_requests_last_request_time ON verification_requests(last_request_time);
CREATE INDEX idx_verification_requests_priority_score ON verification_requests(priority_score DESC);

-- Update existing records to set last_request_time to created_at
UPDATE verification_requests
SET last_request_time = created_at
WHERE last_request_time IS NULL;

-- Add comment explaining the new columns
COMMENT ON COLUMN verification_requests.last_request_time IS 'Timestamp of the last request submission (used for 24-hour cooldown)';
COMMENT ON COLUMN verification_requests.bump_count IS 'Number of times user has bumped this request to top';
COMMENT ON COLUMN verification_requests.last_bump_time IS 'Timestamp of the last bump action';
COMMENT ON COLUMN verification_requests.priority_score IS 'Priority score for admin queue ordering (higher = more urgent)';
