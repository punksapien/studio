-- Enhanced fix for the handle_new_user trigger function
-- This version respects the role specified in user_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
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

-- Testing query:
-- Run this to confirm the trigger function was updated
-- SELECT pg_get_functiondef((SELECT oid FROM pg_proc WHERE proname = 'handle_new_user'));
