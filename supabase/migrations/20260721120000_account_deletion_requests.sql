-- Account Deletion Requests
-- Users can request permanent deletion of their account; admins review and
-- either process (soft-delete) or dismiss the request. A dedicated table is
-- used (instead of account_status = 'pending_deletion') so automated cleanup
-- crons never auto-purge user-requested deletions.

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  email text,
  role text,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','dismissed')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES user_profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only one pending request per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pending_deletion_request
  ON account_deletion_requests(user_id) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status
  ON account_deletion_requests(status);

ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own deletion request
CREATE POLICY "Users can insert their own deletion request"
  ON account_deletion_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can view their own deletion requests
CREATE POLICY "Users can view their own deletion requests"
  ON account_deletion_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all deletion requests
CREATE POLICY "Admins can view all deletion requests"
  ON account_deletion_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admins can update all deletion requests (process / dismiss)
CREATE POLICY "Admins can update all deletion requests"
  ON account_deletion_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

COMMENT ON TABLE account_deletion_requests IS 'User-requested account deletions awaiting admin review. Processed via soft_delete_user_account; never auto-purged by cleanup crons.';
