-- Require Admin Approval for Listings
-- Purpose: Close the hole where listings became publicly visible without admin review.
--   1. Widen the status CHECK constraint to every status the application actually uses
--      (the old constraint was missing pending_approval, draft, sold, withdrawn,
--      under_review and appealing_rejection, silently breaking the appeal flow).
--   2. Default new listings to 'pending_approval' instead of 'active'.
--   3. Add approved_at/approved_by audit columns (admin_action_* is set on reject too,
--      so it cannot be used to tell whether a listing was ever approved).
--   4. Grandfather existing public listings as approved.
--   5. Enforce, at the database level, that only admins (or the service role) can move
--      a listing into a public status or touch the approval columns.
-- Date: 2026-07-11

-- =============================================================================
-- PHASE 1: Widen the status CHECK constraint
-- =============================================================================

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE listings ADD CONSTRAINT listings_status_check CHECK (status IN (
    'draft',                -- Seller is still editing, not submitted
    'pending_approval',     -- Submitted and waiting for admin review
    'under_review',         -- Admin is actively reviewing
    'active',               -- Approved by admin - publicly visible
    'verified_anonymous',   -- Admin verified, anonymous view - publicly visible
    'verified_public',      -- Admin verified, full details - publicly visible
    'inactive',             -- Hidden from marketplace (soft delete)
    'withdrawn',            -- Seller withdrew from market
    'sold',                 -- Completed transaction
    'closed_deal',          -- Deal completed
    'rejected_by_admin',    -- Admin rejected
    'appealing_rejection',  -- Seller has appealed a rejection
    'pending_verification'  -- Awaiting admin verification (legacy)
));

-- =============================================================================
-- PHASE 2: Safe default for new listings
-- =============================================================================

ALTER TABLE listings ALTER COLUMN status SET DEFAULT 'pending_approval';

-- =============================================================================
-- PHASE 3: Approval audit columns
-- =============================================================================

ALTER TABLE listings ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(id);

COMMENT ON COLUMN listings.approved_at IS 'When an admin approved this listing for public visibility. NULL means never approved.';
COMMENT ON COLUMN listings.approved_by IS 'Admin who approved this listing.';

-- =============================================================================
-- PHASE 4: Grandfather existing public listings as approved (idempotent)
-- =============================================================================

UPDATE listings
SET approved_at = COALESCE(admin_action_at, created_at)
WHERE status IN ('active', 'verified_anonymous', 'verified_public')
  AND approved_at IS NULL;

-- =============================================================================
-- PHASE 5: Database-level enforcement trigger (defense in depth)
-- =============================================================================
-- Rules for non-admin authenticated users (sellers):
--   * May never set approved_at / approved_by.
--   * May never INSERT a listing directly into a public status.
--   * May only UPDATE a listing into a public status when reactivating ('active')
--     a listing that was previously admin-approved (approved_at set) from a
--     non-public seller-controlled status.
-- Service-role connections (auth.uid() IS NULL) and admins are unrestricted.
-- Unauthenticated PostgREST writes are already blocked by RLS, so the NULL
-- auth.uid() escape hatch is only reachable by the service role.

CREATE OR REPLACE FUNCTION enforce_listing_approval_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Service role (no JWT user) and admins bypass the gate
    IF auth.uid() IS NULL OR is_admin_user() THEN
        RETURN NEW;
    END IF;

    -- Non-admins may never touch the approval audit columns
    IF TG_OP = 'INSERT' THEN
        IF NEW.approved_at IS NOT NULL OR NEW.approved_by IS NOT NULL THEN
            RAISE EXCEPTION 'Approval fields are managed by admins only';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.approved_at IS DISTINCT FROM OLD.approved_at
           OR NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN
            RAISE EXCEPTION 'Approval fields are managed by admins only';
        END IF;
    END IF;

    -- Gate transitions into publicly-visible statuses
    IF NEW.status IN ('active', 'verified_anonymous', 'verified_public') THEN
        IF TG_OP = 'INSERT' THEN
            RAISE EXCEPTION 'Listings must be approved by an admin before becoming publicly visible';
        END IF;
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            -- Only allowed: reactivating a previously-approved listing back to 'active'
            IF NOT (NEW.status = 'active'
                    AND OLD.approved_at IS NOT NULL
                    AND OLD.status IN ('inactive', 'withdrawn', 'sold', 'closed_deal')) THEN
                RAISE EXCEPTION 'Listings must be approved by an admin before becoming publicly visible';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_listing_approval_gate ON listings;
CREATE TRIGGER trg_enforce_listing_approval_gate
    BEFORE INSERT OR UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION enforce_listing_approval_gate();

COMMENT ON FUNCTION enforce_listing_approval_gate IS
'Prevents non-admin users from publishing listings: no direct inserts into public statuses, no transitions into public statuses (except reactivating a previously-approved listing), and no tampering with approved_at/approved_by. Service role and admins are exempt.';

-- =============================================================================
-- MIGRATION COMPLETION LOG
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== REQUIRE ADMIN APPROVAL FOR LISTINGS COMPLETED ===';
    RAISE NOTICE 'Status CHECK widened to all 13 application statuses';
    RAISE NOTICE 'Default status is now pending_approval';
    RAISE NOTICE 'Added approved_at / approved_by columns';
    RAISE NOTICE 'Grandfathered existing public listings as approved';
    RAISE NOTICE 'Created trigger: trg_enforce_listing_approval_gate';
    RAISE NOTICE '======================================================';
END $$;
