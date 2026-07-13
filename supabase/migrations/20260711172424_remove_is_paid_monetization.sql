-- Remove platform monetization scaffolding.
-- The platform is free: there are no subscriptions, payments, or paid tiers.
-- 1. The listing-documents storage policy required is_paid = true, which nothing
--    ever set, so verified buyers were silently blocked from documents. Recreate
--    the policy gated on verification status only.
-- 2. Drop the unused user_profiles.is_paid column.

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

ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_paid;
