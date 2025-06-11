-- Fix for "relation does not exist" error
-- Based on official Supabase documentation for schema visibility issues

-- SOLUTION 1: Update the function to explicitly set search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' -- Set search path to empty to force explicit schema references
AS $function$
BEGIN
  -- Explicitly reference the schema in the INSERT
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN NEW;
END;
$function$;

-- Alternative SOLUTION 2: Create the function in the auth schema (as suggested by RilDev)
-- This approach is also recommended in the Supabase documentation
DROP FUNCTION IF EXISTS auth.handle_new_user CASCADE;

CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN NEW;
END;
$function$;

-- Drop existing trigger and recreate with auth schema function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user();

-- Verify the fix
SELECT
    n.nspname AS function_schema,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';
