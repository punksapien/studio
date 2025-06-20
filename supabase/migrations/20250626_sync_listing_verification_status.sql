-- Migration: Sync listing verification status with seller verification status
-- Purpose: Automatically update listings.is_seller_verified when user_profiles.verification_status changes
-- Author: System Architecture Team
-- Date: 2025-06-20

-- =============================================================================
-- Step 1: Create function to sync listing verification status
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_listing_verification_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_listings_updated INTEGER;
BEGIN
  -- Only process if verification_status changed and user is a seller
  IF (TG_OP = 'UPDATE' AND OLD.verification_status = NEW.verification_status) OR NEW.role != 'seller' THEN
    RETURN NEW;
  END IF;

  -- Update all listings for this seller
  UPDATE listings
  SET
    is_seller_verified = (NEW.verification_status = 'verified'),
    updated_at = NOW()
  WHERE seller_id = NEW.id;

  -- Get count of affected listings
  GET DIAGNOSTICS v_listings_updated = ROW_COUNT;

  -- Log the result
  RAISE NOTICE 'Updated % listings for seller % (verification: %)',
    v_listings_updated,
    NEW.id,
    NEW.verification_status;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the profile update
    RAISE WARNING 'Error syncing listings for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- =============================================================================
-- Step 2: Create trigger on user_profiles table
-- =============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_listing_verification ON user_profiles;

-- Create trigger for INSERT and UPDATE operations
CREATE TRIGGER trigger_sync_listing_verification
  AFTER INSERT OR UPDATE OF verification_status ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_listing_verification_status();

-- =============================================================================
-- Step 3: Backfill existing data to fix current inconsistencies
-- =============================================================================

DO $$
BEGIN
  -- Update all listings to match seller verification status
  UPDATE listings l
  SET
    is_seller_verified = (up.verification_status = 'verified'),
    updated_at = NOW()
  FROM user_profiles up
  WHERE l.seller_id = up.id
  AND ((up.verification_status = 'verified' AND l.is_seller_verified = false)
       OR (up.verification_status != 'verified' AND l.is_seller_verified = true));

  RAISE NOTICE 'Listing verification sync migration complete';
END $$;

-- =============================================================================
-- Step 4: Create validation function to check sync status
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_listing_verification_sync()
RETURNS TABLE (
  user_id UUID,
  user_name VARCHAR(255),
  user_verification_status VARCHAR(30),
  listing_count INTEGER,
  mismatched_listings INTEGER,
  sync_status TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id as user_id,
    up.full_name as user_name,
    up.verification_status as user_verification_status,
    COUNT(l.id)::INTEGER as listing_count,
    SUM(CASE
      WHEN (up.verification_status = 'verified' AND l.is_seller_verified = false)
        OR (up.verification_status != 'verified' AND l.is_seller_verified = true)
      THEN 1
      ELSE 0
    END)::INTEGER as mismatched_listings,
    CASE
      WHEN SUM(CASE
        WHEN (up.verification_status = 'verified' AND l.is_seller_verified = false)
          OR (up.verification_status != 'verified' AND l.is_seller_verified = true)
        THEN 1
        ELSE 0
      END) = 0 THEN 'SYNCED'
      ELSE 'OUT_OF_SYNC'
    END as sync_status
  FROM user_profiles up
  INNER JOIN listings l ON l.seller_id = up.id
  GROUP BY up.id, up.full_name, up.verification_status
  ORDER BY mismatched_listings DESC, up.full_name;
END;
$$;

-- =============================================================================
-- Step 5: Grant necessary permissions
-- =============================================================================

-- Grant execute permissions to authenticated users for validation function
GRANT EXECUTE ON FUNCTION validate_listing_verification_sync() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION sync_listing_verification_status() IS
'Automatically syncs listings.is_seller_verified when user_profiles.verification_status changes';

COMMENT ON FUNCTION validate_listing_verification_sync() IS
'Validates that all listings have correct is_seller_verified status based on seller verification. Used for monitoring and debugging.';

-- =============================================================================
-- Step 6: Final validation and summary
-- =============================================================================

DO $$
DECLARE
  v_total_users INTEGER;
  v_synced_users INTEGER;
  v_out_of_sync_users INTEGER;
BEGIN
  -- Run validation
  SELECT COUNT(*) INTO v_total_users FROM validate_listing_verification_sync();

  SELECT COUNT(*) INTO v_synced_users
  FROM validate_listing_verification_sync()
  WHERE sync_status = 'SYNCED';

  SELECT COUNT(*) INTO v_out_of_sync_users
  FROM validate_listing_verification_sync()
  WHERE sync_status = 'OUT_OF_SYNC';

  RAISE NOTICE '';
  RAISE NOTICE '=== LISTING VERIFICATION SYNC MIGRATION COMPLETE ===';
  RAISE NOTICE 'Total users with listings: %', v_total_users;
  RAISE NOTICE 'Users with synced listings: %', v_synced_users;
  RAISE NOTICE 'Users with out-of-sync listings: %', v_out_of_sync_users;
  RAISE NOTICE '';
  RAISE NOTICE 'Trigger: trigger_sync_listing_verification ON user_profiles';
  RAISE NOTICE 'Function: sync_listing_verification_status()';
  RAISE NOTICE 'Validation: SELECT * FROM validate_listing_verification_sync();';
  RAISE NOTICE '========================================================';
END $$;
