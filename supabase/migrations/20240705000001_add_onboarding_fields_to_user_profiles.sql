
-- Add onboarding related fields to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS onboarding_step_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS submitted_documents JSONB;

-- Add comments for clarity
COMMENT ON COLUMN public.user_profiles.is_onboarding_completed IS 'Flag indicating if the user has completed all onboarding steps.';
COMMENT ON COLUMN public.user_profiles.onboarding_completed_at IS 'Timestamp when onboarding was completed.';
COMMENT ON COLUMN public.user_profiles.onboarding_step_completed IS 'The last onboarding step the user successfully completed (e.g., 0 for none, 1 for step 1, etc.).';
COMMENT ON COLUMN public.user_profiles.submitted_documents IS 'JSONB field to store metadata about documents submitted during onboarding, e.g., {"identity_proof_path": "user_id/identity.pdf"}. Actual files in Storage.';

-- Example: Update existing users if needed based on some logic (highly context-specific)
-- For instance, if all currently 'verified' users should be considered as having completed onboarding:
-- UPDATE public.user_profiles
-- SET is_onboarding_completed = true, onboarding_completed_at = NOW(), onboarding_step_completed = 5 -- (or max step for their role)
-- WHERE verification_status = 'verified' AND is_onboarding_completed = false;

-- RLS policies should already allow users to update their own profile.
-- If specific fields need to be restricted during onboarding updates via API,
-- those policies might need refinement on the 'user_profiles' table.
-- For now, assume the user_can_update_own_profile policy is sufficient.
-- For the API endpoints that update these, we will use service_role key to bypass RLS for these specific updates.
