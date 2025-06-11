-- Simple count update functions to replace complex sync system
-- These are called explicitly from application code when needed

-- Function to update listing count for a user
CREATE OR REPLACE FUNCTION update_user_listing_count(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles
    SET listing_count = (
        SELECT COUNT(*)
        FROM listings
        WHERE seller_id = user_id
        AND status IN ('active', 'verified_anonymous', 'verified_public')
    )
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update inquiry count for a listing
CREATE OR REPLACE FUNCTION update_listing_inquiry_count(listing_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE listings
    SET inquiry_count = (
        SELECT COUNT(*)
        FROM inquiries
        WHERE inquiries.listing_id = update_listing_inquiry_count.listing_id
    )
    WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update inquiry count for a user (as buyer)
CREATE OR REPLACE FUNCTION update_user_inquiry_count(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles
    SET inquiry_count = (
        SELECT COUNT(*)
        FROM inquiries
        WHERE buyer_id = user_id
    )
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to recalculate all counts (for maintenance/fixes)
CREATE OR REPLACE FUNCTION recalculate_all_counts()
RETURNS TABLE(entity_type TEXT, records_updated INTEGER) AS $$
DECLARE
  update_count INTEGER;
BEGIN
  -- Update all user listing counts
  UPDATE user_profiles SET
    listing_count = (
      SELECT COUNT(*)
      FROM listings
      WHERE seller_id = user_profiles.id
        AND status IN ('active', 'verified_anonymous', 'verified_public')
    );
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RETURN QUERY SELECT 'user_listing_counts'::TEXT, update_count;

  -- Update all listing inquiry counts
  UPDATE listings SET
    inquiry_count = (
      SELECT COUNT(*)
      FROM inquiries
      WHERE listing_id = listings.id
    );
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RETURN QUERY SELECT 'listing_inquiry_counts'::TEXT, update_count;

  -- Update all user inquiry counts (as buyers)
  UPDATE user_profiles SET
    inquiry_count = (
      SELECT COUNT(*)
      FROM inquiries
      WHERE buyer_id = user_profiles.id
    );
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RETURN QUERY SELECT 'user_inquiry_counts'::TEXT, update_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_user_listing_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_listing_inquiry_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_inquiry_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_counts() TO authenticated;
