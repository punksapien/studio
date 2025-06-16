-- Fix admin_actions table to allow NULL admin_id for system actions
-- This resolves the constraint violation when inquiry automation triggers create admin action logs

-- Drop the NOT NULL constraint on admin_id to allow system actions
ALTER TABLE admin_actions
ALTER COLUMN admin_id DROP NOT NULL;

-- Add a helpful comment
COMMENT ON COLUMN admin_actions.admin_id IS 'Admin user who performed the action. NULL for system-triggered actions.';

-- Add constraint to ensure we have proper action tracking
ALTER TABLE admin_actions
ADD CONSTRAINT valid_action_source CHECK (
    -- Either we have an admin_id (manual action) or action_type indicates system action
    admin_id IS NOT NULL OR action_type IN (
        'inquiry_status_auto_update',
        'system_verification_trigger',
        'automated_status_change'
    )
);

-- Log the fix
DO $$
BEGIN
    RAISE NOTICE 'Fixed admin_actions table: admin_id can now be NULL for system actions';
    RAISE NOTICE 'Added constraint to ensure proper action source tracking';
END $$;
