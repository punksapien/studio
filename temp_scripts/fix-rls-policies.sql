-- Fix RLS policies for user_profiles to allow profile creation during signup

-- Drop the problematic policy
DROP POLICY IF EXISTS "Allow user profile creation" ON user_profiles;

-- Create a new policy that allows profile creation for any authenticated user or during signup
CREATE POLICY "Allow profile creation during signup" ON user_profiles
FOR INSERT
WITH CHECK (
  -- Allow if user is authenticated AND the profile being created matches their auth ID
  (auth.uid() IS NOT NULL AND auth.uid() = id)
  OR
  -- Allow if the profile ID exists in auth.users (for signup process)
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = user_profiles.id)
);

-- Also add a policy to allow profile creation using service role during signup
CREATE POLICY "Allow service role profile creation" ON user_profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Verify the policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';
