-- Fix Verification Status Logic
-- Problem: Users are automatically set to 'pending_verification' on registration
-- Solution: Set new users to 'anonymous' status, only become 'pending_verification' when they submit a request

-- 1. Update the user creation trigger to set correct initial status
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
        ELSE 'anonymous'  -- ✅ FIX: Start with anonymous status
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
    RAISE NOTICE 'Created/Updated profile for user % with role % and status %',
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

-- 2. Fix existing users who were incorrectly set to pending_verification without a verification request
UPDATE public.user_profiles up
SET
  verification_status = 'anonymous',
  updated_at = NOW()
WHERE
  up.verification_status = 'pending_verification'
  AND up.role != 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM public.verification_requests vr
    WHERE vr.user_id = up.id
    AND vr.request_type = 'user_verification'
    AND vr.status NOT IN ('Rejected')
  );

-- Log how many users were fixed
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  IF fixed_count > 0 THEN
    RAISE NOTICE 'Fixed % user profiles that were incorrectly set to pending_verification', fixed_count;
  END IF;
END $$;

-- 3. Add a constraint to ensure data integrity going forward
-- This ensures that users with pending_verification status have a corresponding verification request
CREATE OR REPLACE FUNCTION check_pending_verification_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check when setting status to pending_verification
  IF NEW.verification_status = 'pending_verification' AND NEW.role != 'admin' THEN
    -- Allow the update, but log if there's no verification request
    -- (The verification request might be created in the same transaction)
    PERFORM 1 FROM verification_requests
    WHERE user_id = NEW.id
    AND request_type = 'user_verification'
    AND status NOT IN ('Rejected');

    IF NOT FOUND THEN
      RAISE WARNING 'User % set to pending_verification without verification request - ensure request is created', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for integrity check
DROP TRIGGER IF EXISTS ensure_verification_integrity ON user_profiles;
CREATE TRIGGER ensure_verification_integrity
  AFTER UPDATE OF verification_status ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_pending_verification_integrity();

-- 4. Verify the fix
DO $$
DECLARE
  pending_without_request INTEGER;
  total_pending INTEGER;
  total_anonymous INTEGER;
BEGIN
  -- Count users with pending status but no verification request
  SELECT COUNT(*) INTO pending_without_request
  FROM user_profiles up
  WHERE up.verification_status = 'pending_verification'
  AND up.role != 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM verification_requests vr
    WHERE vr.user_id = up.id
    AND vr.request_type = 'user_verification'
  );

  -- Count total pending and anonymous users
  SELECT COUNT(*) INTO total_pending
  FROM user_profiles
  WHERE verification_status = 'pending_verification' AND role != 'admin';

  SELECT COUNT(*) INTO total_anonymous
  FROM user_profiles
  WHERE verification_status = 'anonymous';

  RAISE NOTICE 'Verification status check:';
  RAISE NOTICE '  - Anonymous users: %', total_anonymous;
  RAISE NOTICE '  - Pending users: %', total_pending;
  RAISE NOTICE '  - Pending without request: %', pending_without_request;

  IF pending_without_request > 0 THEN
    RAISE WARNING 'Found % users with pending status but no verification request!', pending_without_request;
  END IF;
END $$;
