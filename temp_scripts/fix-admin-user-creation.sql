-- Comprehensive fix for admin user creation issues
-- This script:
-- 1. Updates the handle_new_user trigger to respect role from metadata
-- 2. Creates an admin user directly in both tables

-- PART 1: Fix the trigger function for future use
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

-- PART 2: Check if admin user already exists
DO $$
DECLARE
  admin_user_id UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Check auth.users table
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@nobridge.com';

  IF admin_user_id IS NOT NULL THEN
    -- Admin exists in auth.users, check user_profiles
    SELECT EXISTS(
      SELECT 1 FROM public.user_profiles
      WHERE id = admin_user_id AND role = 'admin'
    ) INTO admin_exists;

    IF admin_exists THEN
      RAISE NOTICE 'Admin user already exists with ID %', admin_user_id;
    ELSE
      -- Update the profile to admin if it exists but isn't admin
      UPDATE public.user_profiles
      SET
        role = 'admin',
        is_email_verified = true,
        verification_status = 'verified',
        is_onboarding_completed = true,
        updated_at = NOW()
      WHERE id = admin_user_id;

      RAISE NOTICE 'Existing user updated to admin role: %', admin_user_id;
    END IF;
  ELSE
    -- No existing admin, create one

    -- Disable trigger temporarily to avoid any issues
    ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

    -- Insert into auth.users
    -- Note: This doesn't set a password - would need to use API for that
    INSERT INTO auth.users (
      id,
      email,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at,
      is_sso_user,
      role
    ) VALUES (
      gen_random_uuid(),
      'admin@nobridge.com',
      NOW(),
      '{"full_name": "Admin User", "role": "admin"}'::jsonb,
      '{"provider": "email"}'::jsonb,
      NOW(),
      NOW(),
      false,
      'authenticated'
    ) RETURNING id INTO admin_user_id;

    -- Manually insert profile
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      role,
      is_email_verified,
      verification_status,
      is_onboarding_completed,
      created_at,
      updated_at
    ) VALUES (
      admin_user_id,
      'admin@nobridge.com',
      'Admin User',
      'admin',
      true,
      'verified',
      true,
      NOW(),
      NOW()
    );

    -- Re-enable trigger
    ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

    RAISE NOTICE 'Created new admin user with ID %', admin_user_id;
    RAISE NOTICE 'NOTE: You will need to set a password using the reset password functionality';
  END IF;
END $$;
