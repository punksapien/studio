-- Fix Email Verification Sync for Universal Sync System
-- Migration: 20250115000003_fix_email_verification_sync.sql
--
-- This migration updates the existing email verification sync function
-- to work with the new universal sync trigger system schema.

-- Update the email verification sync function to use new audit schema
CREATE OR REPLACE FUNCTION sync_email_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles when auth.users email confirmation changes
  UPDATE user_profiles
  SET
    is_email_verified = (NEW.email_confirmed_at IS NOT NULL),
    updated_at = NOW()
  WHERE email = NEW.email;

  -- Log using the new audit trail schema
  INSERT INTO auth_sync_logs (
    user_id,
    table_name,
    record_id,
    operation,
    field_name,
    old_value,
    new_value,
    changed_at
  ) VALUES (
    NEW.id,
    'auth.users',
    NEW.id,
    'UPDATE',
    'email_confirmed_at',
    COALESCE(OLD.email_confirmed_at::TEXT, 'null'),
    COALESCE(NEW.email_confirmed_at::TEXT, 'null'),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration complete notification
DO $$
BEGIN
  RAISE NOTICE 'Email verification sync function updated for universal sync system';
END $$;
