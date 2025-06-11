-- Grant necessary permissions to supabase_auth_admin
-- This is required for the auth service to access user_profiles table

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO supabase_auth_admin;

-- Grant sequence permissions (for any auto-generated fields)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;

-- Also grant permissions to service_role for admin operations
GRANT ALL ON public.user_profiles TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
