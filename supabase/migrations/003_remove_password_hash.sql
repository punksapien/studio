-- Remove password_hash column from user_profiles
-- Since we're using Supabase Auth, we don't need to store password hashes ourselves

ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS password_hash;

-- Also ensure user_profiles.id properly references auth.users.id
-- First, let's add the foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_profiles_id_fkey'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD CONSTRAINT user_profiles_id_fkey
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;
