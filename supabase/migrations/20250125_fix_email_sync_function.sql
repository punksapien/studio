-- Fix the email sync function to work properly
-- The function needs to be able to access user_profiles table

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_sync_email_verification ON auth.users;

-- Drop the existing function
DROP FUNCTION IF EXISTS sync_email_verification_status();

-- Recreate the function with proper schema qualification and security definer
CREATE OR REPLACE FUNCTION public.sync_email_verification_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Update user_profiles when auth.users email confirmation changes
  -- Use ID-based matching instead of email-based for proper foreign key relationship
  UPDATE public.user_profiles
  SET
    is_email_verified = (NEW.email_confirmed_at IS NOT NULL),
    email_verified_at = NEW.email_confirmed_at,
    updated_at = NOW()
  WHERE id = NEW.id;

  -- Only log if the auth_sync_logs table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'auth_sync_logs'
  ) THEN
    INSERT INTO public.auth_sync_logs (
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_sync_email_verification
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION public.sync_email_verification_status();

-- One-time sync for existing users using ID-based matching
UPDATE public.user_profiles up
SET
  is_email_verified = (au.email_confirmed_at IS NOT NULL),
  email_verified_at = au.email_confirmed_at
FROM auth.users au
WHERE up.id = au.id
  AND up.is_email_verified != (au.email_confirmed_at IS NOT NULL);
