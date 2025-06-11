-- Direct SQL Admin User Creation
-- This bypasses the Supabase Auth API and creates the user directly

DO $$
DECLARE
  admin_id UUID;
  admin_email TEXT := 'admin@nobridge.com';
  admin_password TEXT := 'Test123!@#';
BEGIN
  -- Generate a new UUID for the admin user
  admin_id := gen_random_uuid();

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    RAISE NOTICE 'Admin user already exists. Deleting old user...';
    DELETE FROM auth.users WHERE email = admin_email;
  END IF;

  -- Insert into auth.users
  -- Note: We're using a placeholder encrypted password here
  -- In production, you'd need to properly hash the password with bcrypt
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    last_sign_in_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    admin_id,
    admin_email,
    crypt(admin_password, gen_salt('bf')), -- Generate bcrypt hash
    NOW(), -- Email confirmed
    '{"full_name": "Admin User", "role": "admin"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    'authenticated',
    'authenticated',
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    NULL,
    false,
    NULL
  );

  -- Insert into user_profiles
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    is_email_verified,
    email_verified_at,
    verification_status,
    account_status
  ) VALUES (
    admin_id,
    admin_email,
    'Admin User',
    'admin',
    true,
    NOW(),
    'verified',
    'active'
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

  RAISE NOTICE 'Admin user created successfully!';
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'Password: %', admin_password;
  RAISE NOTICE 'User ID: %', admin_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create admin user: %', SQLERRM;
END $$;
