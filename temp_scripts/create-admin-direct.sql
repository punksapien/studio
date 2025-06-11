-- Direct SQL approach to create admin user
-- This bypasses the API and directly manipulates tables

-- Step 1: Temporarily disable the trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Step 2: Insert the user into auth.users
-- NOTE: Replace hashed_password with proper bcrypt hash or use actual API for password
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  is_sso_user,
  role,
  confirmation_token
) VALUES (
  gen_random_uuid(),  -- generate new UUID
  'admin@nobridge.com',
  now(),  -- email confirmed
  '{"full_name": "Admin User", "role": "admin"}'::jsonb,
  '{"provider": "email"}'::jsonb,
  now(),
  now(),
  false,
  'authenticated',
  ''
) RETURNING id;  -- Return the ID for use in next step

-- Step 3: Create admin profile using the returned ID
-- This needs to be executed as a separate step, with the UUID from step 2
-- INSERT INTO public.user_profiles (
--   id,  -- Use UUID from previous step
--   email,
--   full_name,
--   role,
--   is_email_verified,
--   verification_status,
--   is_onboarding_completed,
--   created_at,
--   updated_at
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000',  -- Replace with UUID from step 2
--   'admin@nobridge.com',
--   'Admin User',
--   'admin',
--   true,
--   'verified',
--   true,
--   now(),
--   now()
-- );

-- Step 4: Re-enable the trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Important: This script doesn't handle passwords properly since that requires
-- proper hashing with bcrypt. To set up a login password, use the real Supabase
-- auth APIs or use the auth.users password reset functionality.
