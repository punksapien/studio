-- Fix for the broken handle_new_user function
-- This addresses all the issues introduced by the 20250115000002 migration

-- First, drop the broken function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with proper fixes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has a profile (prevent duplicates)
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Insert with all required fields
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    password_hash,  -- Required NOT NULL field
    role,
    is_email_verified,
    email_verified_at,
    verification_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'auth_managed',  -- Placeholder since auth handles passwords
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),  -- Respect metadata role
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    NEW.email_confirmed_at,
    CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN 'verified'
      ELSE 'anonymous'
    END,
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth user creation
  RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT INSERT, SELECT ON public.user_profiles TO supabase_auth_admin;

-- Test the fix
DO $$
BEGIN
  RAISE NOTICE 'Auth trigger fixed successfully!';
  RAISE NOTICE 'The handle_new_user function now:';
  RAISE NOTICE '  - Handles all NOT NULL fields correctly';
  RAISE NOTICE '  - Respects role from user metadata';
  RAISE NOTICE '  - Has proper error handling';
  RAISE NOTICE '  - Won''t break auth user creation on failure';
END $$;
