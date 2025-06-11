-- Rollback the problematic changes from today's migrations
-- This will restore auth to its working state

-- 1. Remove any functions that might be causing issues
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS auth.handle_new_user() CASCADE;

-- 2. Remove the trigger that was added
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Check and remove any other potentially problematic triggers
DROP TRIGGER IF EXISTS trigger_sync_email_verification ON auth.users;

-- 4. Since direct auth.users inserts work, the issue must be in the Auth service
-- Let's ensure there are no stale references
DO $$
BEGIN
  -- Clean up any partial user records that might be causing conflicts
  DELETE FROM auth.users WHERE email = 'admin@nobridge.com';

  RAISE NOTICE 'Rollback completed. Auth should now work as before.';
  RAISE NOTICE 'You may need to restart Supabase for changes to take effect.';
END $$;
