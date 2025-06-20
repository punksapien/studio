-- Create admin_impersonation_tokens table for secure admin impersonation
CREATE TABLE IF NOT EXISTS admin_impersonation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_tokens_token ON admin_impersonation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_tokens_admin_user ON admin_impersonation_tokens(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_tokens_target_user ON admin_impersonation_tokens(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_tokens_expires_at ON admin_impersonation_tokens(expires_at);

-- Add RLS (Row Level Security)
ALTER TABLE admin_impersonation_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin impersonation tokens are viewable by admins only" ON admin_impersonation_tokens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin impersonation tokens are insertable by admins only" ON admin_impersonation_tokens
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin impersonation tokens are updatable by admins only" ON admin_impersonation_tokens
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Function to automatically clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_impersonation_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_impersonation_tokens
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_expired_impersonation_tokens() TO authenticated;

-- Create audit log for admin impersonation
CREATE TABLE IF NOT EXISTS admin_impersonation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('token_generated', 'token_used', 'impersonation_started', 'impersonation_ended')),
  token_id UUID REFERENCES admin_impersonation_tokens(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for audit table
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_audit_admin_user ON admin_impersonation_audit(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_audit_target_user ON admin_impersonation_audit(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_audit_created_at ON admin_impersonation_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_audit_action ON admin_impersonation_audit(action);

-- Add RLS for audit table
ALTER TABLE admin_impersonation_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin impersonation audit is viewable by admins only" ON admin_impersonation_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin impersonation audit is insertable by admins only" ON admin_impersonation_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Comment on tables
COMMENT ON TABLE admin_impersonation_tokens IS 'Secure tokens for admin user impersonation with expiration and single-use enforcement';
COMMENT ON TABLE admin_impersonation_audit IS 'Audit trail for all admin impersonation activities';
