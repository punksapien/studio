-- Zombie Account Management System
-- Professional cleanup system for unverified accounts

-- Add account status and cleanup tracking to user_profiles
ALTER TABLE user_profiles
ADD COLUMN account_status TEXT DEFAULT 'active'
CHECK (account_status IN ('active', 'unverified', 'pending_deletion', 'suspended')),
ADD COLUMN deletion_scheduled_at TIMESTAMPTZ,
ADD COLUMN verification_deadline TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours');

-- Create account cleanup audit table for compliance and tracking
CREATE TABLE account_cleanup_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL, -- Store email for audit even after user deletion
  action TEXT NOT NULL CHECK (action IN ('marked_for_deletion', 'deleted', 'grace_extended', 'manually_verified', 'account_suspended')),
  reason TEXT,
  admin_user_id UUID REFERENCES user_profiles(id), -- NULL for automated actions
  metadata JSONB, -- Additional context (IP, user agent, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient cleanup queries
CREATE INDEX idx_user_profiles_account_status ON user_profiles(account_status);
CREATE INDEX idx_user_profiles_verification_deadline ON user_profiles(verification_deadline);
CREATE INDEX idx_user_profiles_deletion_scheduled ON user_profiles(deletion_scheduled_at);
CREATE INDEX idx_cleanup_audit_user_id ON account_cleanup_audit(user_id);
CREATE INDEX idx_cleanup_audit_created_at ON account_cleanup_audit(created_at);

-- Update existing profiles to set proper account_status based on email verification
UPDATE user_profiles
SET account_status = CASE
  WHEN is_email_verified = true THEN 'active'
  ELSE 'unverified'
END;

-- Set verification deadlines for existing unverified accounts (24 hours from now)
UPDATE user_profiles
SET verification_deadline = NOW() + INTERVAL '24 hours'
WHERE account_status = 'unverified' AND verification_deadline IS NULL;

-- Function to automatically mark accounts for deletion
CREATE OR REPLACE FUNCTION mark_expired_accounts_for_deletion()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Mark unverified accounts past deadline for deletion
  UPDATE user_profiles
  SET
    account_status = 'pending_deletion',
    deletion_scheduled_at = NOW() + INTERVAL '24 hours' -- 24 hour grace period
  WHERE
    account_status = 'unverified'
    AND verification_deadline < NOW()
    AND deletion_scheduled_at IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;

  -- Log the automated action
  INSERT INTO account_cleanup_audit (user_id, user_email, action, reason, metadata)
  SELECT
    id,
    email,
    'marked_for_deletion',
    'Verification deadline expired',
    jsonb_build_object(
      'verification_deadline', verification_deadline,
      'marked_at', NOW(),
      'automated', true
    )
  FROM user_profiles
  WHERE account_status = 'pending_deletion'
    AND deletion_scheduled_at > NOW() - INTERVAL '1 minute'; -- Recently marked

  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up accounts scheduled for deletion
CREATE OR REPLACE FUNCTION cleanup_expired_accounts()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
  user_record RECORD;
BEGIN
  affected_count := 0;

  -- Get accounts ready for deletion
  FOR user_record IN
    SELECT id, email
    FROM user_profiles
    WHERE account_status = 'pending_deletion'
      AND deletion_scheduled_at < NOW()
  LOOP
    -- Log before deletion
    INSERT INTO account_cleanup_audit (user_id, user_email, action, reason, metadata)
    VALUES (
      user_record.id,
      user_record.email,
      'deleted',
      'Account cleanup after grace period',
      jsonb_build_object(
        'deleted_at', NOW(),
        'automated', true
      )
    );

    -- Delete from user_profiles (this will cascade)
    DELETE FROM user_profiles WHERE id = user_record.id;

    -- Delete from Supabase Auth (note: this requires service role in application)
    -- Will be handled by the cleanup service API endpoint

    affected_count := affected_count + 1;
  END LOOP;

  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for audit table
ALTER TABLE account_cleanup_audit ENABLE ROW LEVEL SECURITY;

-- Admin users can view all audit records
CREATE POLICY "Admins can view all cleanup audit records"
  ON account_cleanup_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Users can view their own audit records
CREATE POLICY "Users can view their own cleanup audit records"
  ON account_cleanup_audit
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only system/admin can insert audit records
CREATE POLICY "System can insert cleanup audit records"
  ON account_cleanup_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Add helpful comments
COMMENT ON TABLE account_cleanup_audit IS 'Audit trail for account cleanup actions - maintains history even after account deletion for compliance';
COMMENT ON COLUMN user_profiles.account_status IS 'Account lifecycle status: active (verified), unverified (needs verification), pending_deletion (marked for cleanup), suspended (admin action)';
COMMENT ON COLUMN user_profiles.verification_deadline IS 'When unverified account will be marked for deletion (24 hours from registration)';
COMMENT ON COLUMN user_profiles.deletion_scheduled_at IS 'When pending_deletion account will be permanently deleted (24 hour grace period)';
