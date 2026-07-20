-- Admin-managed listings: sellers become read-only, the Nobridge team owns the
-- listing lifecycle. Drop the seller INSERT/UPDATE RLS policies so writes are
-- admin/service-role only. Keep: seller SELECT own, public SELECT, admin
-- policies, enforce_listing_approval_gate, trigger_sync_listing_verification.
DROP POLICY IF EXISTS "Sellers can insert own listings" ON listings;
DROP POLICY IF EXISTS "Sellers can update own listings" ON listings;

-- Widen the admin_listing_actions action_type CHECK to cover admin
-- create-on-behalf ('created') and admin edit ('edited') audit rows.
ALTER TABLE admin_listing_actions
  DROP CONSTRAINT IF EXISTS admin_listing_actions_action_type_check;
ALTER TABLE admin_listing_actions
  ADD CONSTRAINT admin_listing_actions_action_type_check
  CHECK (action_type IN (
    'approved','rejected','status_changed','appeal_reviewed','notes_updated',
    'bulk_action','listing_verified','listing_unverified',
    'listing_verification_deactivated','created','edited'
  ));
