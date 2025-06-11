-- Simple Admin User Creation
-- Just create the user directly in the user_profiles table
-- For local development only!

-- Step 1: Create a user profile with admin role
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    password_hash,
    role,
    is_email_verified,
    email_verified_at,
    verification_status
) VALUES (
    '00000000-0000-0000-0000-000000000001', -- Fixed UUID for easy reference
    'admin@nobridge.com',
    'Admin User',
    'dummy_hash_for_local_dev', -- Not used for auth, just satisfies NOT NULL
    'admin',
    true,
    NOW(),
    'verified'
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Admin User';

-- That's it! You now have an admin user in your profiles table.
-- You can check for role = 'admin' in your app logic.
-- No auth user needed for local development!
