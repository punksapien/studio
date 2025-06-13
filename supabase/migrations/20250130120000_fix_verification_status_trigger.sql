-- Fix Verification Status Trigger
-- Stop automatically setting new users to 'pending_verification'
-- Users should start as 'anonymous' and only become 'pending_verification' when they submit a request

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the corrected user profile creation function
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
      -- CRITICAL FIX: Set new users to 'anonymous' not 'pending_verification'
      -- Only admins start as 'verified', everyone else starts as 'anonymous'
      CASE
        WHEN user_role = 'admin' THEN 'verified'
        ELSE 'anonymous'  -- Changed from 'pending_verification' to 'anonymous'
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
    RAISE NOTICE 'Created/Updated profile for user % with role % and verification status %',
      NEW.email,
      user_role,
      CASE WHEN user_role = 'admin' THEN 'verified' ELSE 'anonymous' END;

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail auth creation
      RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
      RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix existing orphaned users (those marked as pending without verification requests)
DO $$
DECLARE
  orphaned_count INTEGER;
  legit_pending_count INTEGER;
BEGIN
  -- Count orphaned users (pending status but no verification request)
  SELECT COUNT(*) INTO orphaned_count
  FROM public.user_profiles p
  WHERE p.verification_status = 'pending_verification'
    AND p.role != 'admin'
    AND NOT EXISTS (
      SELECT 1
      FROM public.verification_requests vr
      WHERE vr.user_id = p.id
        AND vr.status IN ('New Request', 'Contacted', 'Docs Under Review', 'More Info Requested')
    );

  -- Count legitimate pending users (those with actual verification requests)
  SELECT COUNT(*) INTO legit_pending_count
  FROM public.user_profiles p
  WHERE p.verification_status = 'pending_verification'
    AND EXISTS (
      SELECT 1
      FROM public.verification_requests vr
      WHERE vr.user_id = p.id
        AND vr.status IN ('New Request', 'Contacted', 'Docs Under Review', 'More Info Requested')
    );

  RAISE NOTICE 'Found % orphaned users with pending status (no verification request)', orphaned_count;
  RAISE NOTICE 'Found % legitimate users with pending verification requests', legit_pending_count;

  -- Reset orphaned users to anonymous
  UPDATE public.user_profiles
  SET
    verification_status = 'anonymous',
    updated_at = NOW()
  WHERE verification_status = 'pending_verification'
    AND role != 'admin'
    AND NOT EXISTS (
      SELECT 1
      FROM public.verification_requests vr
      WHERE vr.user_id = user_profiles.id
        AND vr.status IN ('New Request', 'Contacted', 'Docs Under Review', 'More Info Requested')
    );

  RAISE NOTICE 'Reset % orphaned users from pending_verification to anonymous', orphaned_count;
END $$;

-- Verify the fix
DO $$
DECLARE
  anon_count INTEGER;
  pending_count INTEGER;
  orphaned_count INTEGER;
BEGIN
  -- Count users by status
  SELECT COUNT(*) INTO anon_count
  FROM public.user_profiles
  WHERE verification_status = 'anonymous';

  SELECT COUNT(*) INTO pending_count
  FROM public.user_profiles
  WHERE verification_status = 'pending_verification';

  -- Check for any remaining orphaned users
  SELECT COUNT(*) INTO orphaned_count
  FROM public.user_profiles p
  WHERE p.verification_status = 'pending_verification'
    AND NOT EXISTS (
      SELECT 1
      FROM public.verification_requests vr
      WHERE vr.user_id = p.id
        AND vr.status IN ('New Request', 'Contacted', 'Docs Under Review', 'More Info Requested')
    );

  RAISE NOTICE '';
  RAISE NOTICE '=== Verification Status Summary ===';
  RAISE NOTICE 'Anonymous users: %', anon_count;
  RAISE NOTICE 'Pending verification users: %', pending_count;
  RAISE NOTICE 'Orphaned pending users (should be 0): %', orphaned_count;
  RAISE NOTICE '==================================';
END $$;

-- Add comment explaining the fix
COMMENT ON FUNCTION public.handle_new_user IS
'Creates user profile after auth user creation. Sets verification_status to anonymous for all non-admin users. Users must explicitly request verification to become pending_verification.';
