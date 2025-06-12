-- Fix Authentication System Issues
-- 1. Create universal user profile trigger for ALL users
-- 2. Ensure profiles are created atomically with auth users

-- Drop the admin-only trigger first
DROP TRIGGER IF EXISTS on_auth_admin_user_created ON auth.users;

-- Create a universal trigger for ALL users (buyers, sellers, admins)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Extract role from metadata, default to 'buyer' if not specified
  DECLARE
    user_role text;
    user_full_name text;
    user_phone_number text;
    user_country text;
  BEGIN
    -- Get role from metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer');
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    user_phone_number := COALESCE(NEW.raw_user_meta_data->>'phone_number', '');
    user_country := COALESCE(NEW.raw_user_meta_data->>'country', '');

    -- Create profile for ALL users
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      phone_number,
      country,
      role,
      is_email_verified,
      email_verified_at,
      verification_status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      user_phone_number,
      user_country,
      user_role,
      COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
      NEW.email_confirmed_at,
      CASE
        WHEN user_role = 'admin' THEN 'verified'
        ELSE 'pending_verification'
      END,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      -- Update if profile already exists (edge case)
      email = EXCLUDED.email,
      full_name = CASE WHEN EXCLUDED.full_name != '' THEN EXCLUDED.full_name ELSE user_profiles.full_name END,
      phone_number = CASE WHEN EXCLUDED.phone_number != '' THEN EXCLUDED.phone_number ELSE user_profiles.phone_number END,
      country = CASE WHEN EXCLUDED.country != '' THEN EXCLUDED.country ELSE user_profiles.country END,
      is_email_verified = EXCLUDED.is_email_verified,
      email_verified_at = EXCLUDED.email_verified_at,
      updated_at = NOW();

    -- Log profile creation for debugging
    RAISE NOTICE 'Created/Updated profile for user % with role %', NEW.email, user_role;

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail auth creation
      RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
      RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ALL new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also handle email confirmation updates
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Update profile when email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.user_profiles
    SET
      is_email_verified = true,
      email_verified_at = NEW.email_confirmed_at,
      updated_at = NOW()
    WHERE id = NEW.id;

    RAISE NOTICE 'Updated email verification status for user %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email confirmation
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_user_email_confirmed();

-- Fix any existing users who don't have profiles
DO $$
DECLARE
  user_record RECORD;
  created_count INTEGER := 0;
BEGIN
  FOR user_record IN
    SELECT u.*
    FROM auth.users u
    LEFT JOIN public.user_profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      role,
      is_email_verified,
      email_verified_at,
      verification_status,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', ''),
      COALESCE(user_record.raw_user_meta_data->>'role', 'buyer'),
      COALESCE(user_record.email_confirmed_at IS NOT NULL, false),
      user_record.email_confirmed_at,
      'pending_verification',
      user_record.created_at,
      NOW()
    ) ON CONFLICT (id) DO NOTHING;

    created_count := created_count + 1;
  END LOOP;

  IF created_count > 0 THEN
    RAISE NOTICE 'Created % missing user profiles', created_count;
  END IF;
END $$;

-- Verify the fix
DO $$
DECLARE
  trigger_count INTEGER;
  profile_count INTEGER;
  user_count INTEGER;
BEGIN
  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname = 'on_auth_user_created';

  -- Count users and profiles
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.user_profiles;

  RAISE NOTICE 'Auth system check: % users, % profiles, % trigger(s)',
    user_count, profile_count, trigger_count;

  IF user_count != profile_count THEN
    RAISE WARNING 'User count (%) does not match profile count (%)', user_count, profile_count;
  END IF;
END $$;
