-- Remove platform monetization scaffolding.
-- The platform is free: there are no subscriptions, payments, or paid tiers.
-- 1. The listing-documents storage policy required is_paid = true, which nothing
--    ever set, so verified buyers were silently blocked from documents. Recreate
--    the policy gated on verification status only.
-- 2. Drop the unused user_profiles.is_paid column. The active_user_profiles
--    view (SELECT * over user_profiles, from 20250128_implement_soft_deletes)
--    depends on the column, so it is dropped and recreated around the change.

DROP POLICY IF EXISTS "Verified buyers can view listing documents" ON storage.objects;

CREATE POLICY "Verified buyers can view listing documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'listing-documents'
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'buyer'
    AND verification_status = 'verified'
  )
);

DROP VIEW IF EXISTS active_user_profiles;

ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_paid;

CREATE VIEW active_user_profiles AS
SELECT * FROM user_profiles WHERE deleted_at IS NULL;
