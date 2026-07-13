-- Rework sign-up flow: seller company size/revenue on profile + onboarding backfill
--
-- 1. New seller profile fields collected in the post-signup onboarding wizard.
--    Values are validated in the app against employeeCountRanges / revenueRanges
--    (src/lib/types.ts), matching the no-CHECK pattern of buyer_persona_type.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS company_size_range TEXT,
  ADD COLUMN IF NOT EXISTS annual_revenue_range TEXT;

COMMENT ON COLUMN public.user_profiles.company_size_range IS 'Seller company size (employee count range, values from employeeCountRanges)';
COMMENT ON COLUMN public.user_profiles.annual_revenue_range IS 'Seller annual revenue range (values from revenueRanges)';

-- 2. Backfill: mark all existing accounts as onboarding-complete so re-enabling
--    middleware onboarding enforcement never funnels pre-existing users into the
--    new wizard.
UPDATE public.user_profiles
SET is_onboarding_completed = true,
    onboarding_completed_at = COALESCE(onboarding_completed_at, NOW())
WHERE is_onboarding_completed = false;
