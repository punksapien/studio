-- Auto-sync email verification status between auth.users and user_profiles
-- This ensures production-grade real-time data consistency

-- Function to sync email verification status
CREATE OR REPLACE FUNCTION sync_email_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles when auth.users email confirmation changes
  UPDATE user_profiles
  SET
    is_email_verified = (NEW.email_confirmed_at IS NOT NULL),
    updated_at = NOW()
  WHERE email = NEW.email;

  -- Log the sync for debugging
  INSERT INTO auth_sync_logs (
    user_id,
    action,
    details,
    created_at
  ) VALUES (
    NEW.id,
    'email_verification_sync',
    jsonb_build_object(
      'email', NEW.email,
      'confirmed_at', NEW.email_confirmed_at,
      'is_verified', (NEW.email_confirmed_at IS NOT NULL)
    ),
    NOW()
  ) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sync logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth_sync_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger on auth.users for email confirmation changes
DROP TRIGGER IF EXISTS trigger_sync_email_verification ON auth.users;
CREATE TRIGGER trigger_sync_email_verification
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION sync_email_verification_status();

-- One-time sync for existing users to fix current state
UPDATE user_profiles
SET is_email_verified = (
  SELECT (auth_users.email_confirmed_at IS NOT NULL)
  FROM auth.users auth_users
  WHERE auth_users.email = user_profiles.email
)
WHERE EXISTS (
  SELECT 1 FROM auth.users auth_users
  WHERE auth_users.email = user_profiles.email
);

-- Grant necessary permissions
GRANT SELECT ON auth.users TO authenticated;
GRANT INSERT ON auth_sync_logs TO authenticated;
