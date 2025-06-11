-- Create a trigger to automatically create user_profiles for admin users
-- This is only for admin users created via supabase.auth.admin.createUser()
-- Regular users go through the app's two-step process

CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Only create profile for admin users (check metadata)
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      role,
      is_email_verified,
      email_verified_at,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin User'),
      'admin',
      COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
      NEW.email_confirmed_at,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING; -- Ignore if profile already exists
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new admin users
DROP TRIGGER IF EXISTS on_auth_admin_user_created ON auth.users;
CREATE TRIGGER on_auth_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin_user();
