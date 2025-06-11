-- Grant necessary permissions to supabase_auth_admin for user_profiles table
-- This is required for the trigger to work when auth creates users

-- Grant INSERT permission so the trigger can create profiles
GRANT INSERT ON public.user_profiles TO supabase_auth_admin;

-- Grant USAGE on any sequences (if ID uses sequences)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;

-- Also grant SELECT so it can read if needed
GRANT SELECT ON public.user_profiles TO supabase_auth_admin;

-- Grant UPDATE for potential future updates
GRANT UPDATE ON public.user_profiles TO supabase_auth_admin;

-- Test the permissions
SELECT
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'supabase_auth_admin'
AND table_schema = 'public'
AND table_name = 'user_profiles';
