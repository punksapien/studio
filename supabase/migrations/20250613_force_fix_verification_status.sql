-- Force Fix Verification Status for ALL Users
-- This migration ensures ALL users without active verification requests have 'anonymous' status
-- This is a more aggressive fix to handle any edge cases missed by previous migrations

-- 1. First, let's see the current state
DO $$
DECLARE
  total_users INTEGER;
  pending_users INTEGER;
  pending_without_request INTEGER;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO total_users FROM public.user_profiles WHERE role != 'admin';

  -- Count pending users
  SELECT COUNT(*) INTO pending_users
  FROM public.user_profiles
  WHERE verification_status = 'pending_verification' AND role != 'admin';

  -- Count pending users without verification requests
  SELECT COUNT(*) INTO pending_without_request
  FROM public.user_profiles up
  WHERE up.verification_status = 'pending_verification'
  AND up.role != 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM public.verification_requests vr
    WHERE vr.user_id = up.id
    AND vr.request_type = 'user_verification'
    AND vr.status NOT IN ('Rejected')
  );

  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICATION STATUS CHECK BEFORE FIX ===';
  RAISE NOTICE 'Total non-admin users: %', total_users;
  RAISE NOTICE 'Users with pending status: %', pending_users;
  RAISE NOTICE 'Pending users WITHOUT verification request: %', pending_without_request;
  RAISE NOTICE '';
END $$;

-- 2. Fix ALL users who have pending_verification but no request
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

-- 3. Log the results
DO $$
DECLARE
  rows_updated INTEGER;
BEGIN
  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated > 0 THEN
    RAISE NOTICE '✅ FIXED % users who had pending_verification without a request', rows_updated;
  ELSE
    RAISE NOTICE '✅ No users needed fixing - all pending users have valid requests';
  END IF;
END $$;

-- 4. Now let's also check if the trigger is correctly set
DO $$
DECLARE
  trigger_exists BOOLEAN;
  function_body TEXT;
BEGIN
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) INTO trigger_exists;

  IF NOT trigger_exists THEN
    RAISE WARNING '❌ Trigger on_auth_user_created does NOT exist!';
  ELSE
    -- Get the function body to check what it's doing
    SELECT pg_get_functiondef(p.oid) INTO function_body
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';

    -- Check if it's setting anonymous status
    IF function_body LIKE '%anonymous%' THEN
      RAISE NOTICE '✅ Trigger function correctly sets anonymous status for new users';
    ELSE
      RAISE WARNING '❌ Trigger function may not be setting anonymous status correctly';
      RAISE NOTICE 'Function body preview: %', LEFT(function_body, 200);
    END IF;
  END IF;
END $$;

-- 5. Final verification
DO $$
DECLARE
  total_users INTEGER;
  anonymous_users INTEGER;
  pending_users INTEGER;
  verified_users INTEGER;
  pending_without_request INTEGER;
BEGIN
  -- Count users by status
  SELECT COUNT(*) INTO total_users FROM public.user_profiles WHERE role != 'admin';
  SELECT COUNT(*) INTO anonymous_users FROM public.user_profiles WHERE verification_status = 'anonymous' AND role != 'admin';
  SELECT COUNT(*) INTO pending_users FROM public.user_profiles WHERE verification_status = 'pending_verification' AND role != 'admin';
  SELECT COUNT(*) INTO verified_users FROM public.user_profiles WHERE verification_status = 'verified' AND role != 'admin';

  -- Count pending users without verification requests (should be 0)
  SELECT COUNT(*) INTO pending_without_request
  FROM public.user_profiles up
  WHERE up.verification_status = 'pending_verification'
  AND up.role != 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM public.verification_requests vr
    WHERE vr.user_id = up.id
    AND vr.request_type = 'user_verification'
    AND vr.status NOT IN ('Rejected')
  );

  RAISE NOTICE '';
  RAISE NOTICE '=== FINAL VERIFICATION STATUS SUMMARY ===';
  RAISE NOTICE 'Total non-admin users: %', total_users;
  RAISE NOTICE '  - Anonymous: % users', anonymous_users;
  RAISE NOTICE '  - Pending: % users', pending_users;
  RAISE NOTICE '  - Verified: % users', verified_users;
  RAISE NOTICE '';

  IF pending_without_request > 0 THEN
    RAISE WARNING '❌ STILL HAVE % pending users without verification requests!', pending_without_request;
  ELSE
    RAISE NOTICE '✅ All pending users have valid verification requests';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🎯 VERIFICATION STATUS FIX COMPLETE';
END $$;
