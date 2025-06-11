-- Remove the broken trigger that was added in today's migration
-- This will restore auth functionality to how it was working before

-- Drop the trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verify removal
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    RAISE NOTICE 'Trigger successfully removed!';
    RAISE NOTICE 'Auth should now work as it did before today''s migration.';
  ELSE
    RAISE WARNING 'Trigger still exists - removal may have failed!';
  END IF;
END $$;
