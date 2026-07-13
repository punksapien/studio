-- Block list for permanently banned emails ("Delete & Block" admin action).
-- Emails are stored lowercase; registration API rejects any email present here.

CREATE TABLE IF NOT EXISTS blocked_emails (
    email TEXT PRIMARY KEY,
    reason TEXT,
    -- Plain UUIDs (no FK) so records survive deletion of the admin or the user
    blocked_by UUID,
    original_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE blocked_emails IS 'Emails permanently blocked from registering. Managed by admins via Delete & Block.';
COMMENT ON COLUMN blocked_emails.email IS 'Lowercase email address that is blocked from signing up.';
COMMENT ON COLUMN blocked_emails.blocked_by IS 'Admin user id who issued the block (not a FK; survives admin deletion).';
COMMENT ON COLUMN blocked_emails.original_user_id IS 'The deleted user''s id at the time of blocking (not a FK).';

-- Service-role access only: RLS enabled with no policies.
ALTER TABLE blocked_emails ENABLE ROW LEVEL SECURITY;
