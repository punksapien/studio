-- Add contact preference fields to verification_requests table
-- These fields allow users to specify how and when they prefer to be contacted
-- for verification calls

ALTER TABLE verification_requests
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS best_time_to_call VARCHAR(255);

-- Add comment to explain the fields
COMMENT ON COLUMN verification_requests.phone_number IS 'Contact phone number for verification call (may differ from profile phone)';
COMMENT ON COLUMN verification_requests.best_time_to_call IS 'User-specified best time to receive verification call';

-- The user_notes field should already exist from previous migrations
-- If not, it would be added by the admin enhancement migration
