-- Safety improvements for zombie account management
-- This adds safety checks to prevent accidental deletion of valid accounts

-- Add safety check to the cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_accounts()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
  user_record RECORD;
BEGIN
  affected_count := 0;

  -- Get accounts ready for deletion with additional safety checks
  FOR user_record IN
    SELECT id, email
    FROM user_profiles
    WHERE account_status = 'pending_deletion'
      AND deletion_scheduled_at < NOW()
      -- Additional safety checks:
      AND is_email_verified = FALSE  -- Never delete verified accounts
      AND listing_count = 0           -- Never delete users with listings
      AND inquiry_count = 0           -- Never delete users with inquiries
      AND NOT EXISTS (                -- Never delete users with conversations
        SELECT 1 FROM conversations
        WHERE buyer_id = user_profiles.id OR seller_id = user_profiles.id
      )
      AND NOT EXISTS (                -- Never delete users with messages
        SELECT 1 FROM messages
        WHERE sender_id = user_profiles.id
      )
  LOOP
    -- Log before deletion with more context
    INSERT INTO account_cleanup_audit (user_id, user_email, action, reason, metadata)
    VALUES (
      user_record.id,
      user_record.email,
      'deleted',
      'Account cleanup after grace period - all safety checks passed',
      jsonb_build_object(
        'deleted_at', NOW(),
        'automated', true,
        'safety_checks', jsonb_build_object(
          'email_verified', false,
          'listing_count', 0,
          'inquiry_count', 0,
          'has_conversations', false,
          'has_messages', false
        )
      )
    );

    -- Delete from user_profiles (this will cascade)
    DELETE FROM user_profiles WHERE id = user_record.id;

    affected_count := affected_count + 1;
  END LOOP;

  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Add a manual review function for accounts marked for deletion
CREATE OR REPLACE FUNCTION review_pending_deletions()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  account_status TEXT,
  deletion_scheduled_at TIMESTAMPTZ,
  days_until_deletion INTERVAL,
  has_activity BOOLEAN,
  safety_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.email,
    up.account_status,
    up.deletion_scheduled_at,
    up.deletion_scheduled_at - NOW() as days_until_deletion,
    (up.listing_count > 0 OR up.inquiry_count > 0 OR
     EXISTS(SELECT 1 FROM conversations c WHERE c.buyer_id = up.id OR c.seller_id = up.id) OR
     EXISTS(SELECT 1 FROM messages m WHERE m.sender_id = up.id)) as has_activity,
    CASE
      WHEN up.is_email_verified THEN 'WARNING: Email is verified!'
      WHEN up.listing_count > 0 THEN 'WARNING: User has listings!'
      WHEN up.inquiry_count > 0 THEN 'WARNING: User has inquiries!'
      WHEN EXISTS(SELECT 1 FROM conversations c WHERE c.buyer_id = up.id OR c.seller_id = up.id) THEN 'WARNING: User has conversations!'
      WHEN EXISTS(SELECT 1 FROM messages m WHERE m.sender_id = up.id) THEN 'WARNING: User has sent messages!'
      ELSE 'Safe to delete'
    END as safety_notes
  FROM user_profiles up
  WHERE up.account_status = 'pending_deletion'
  ORDER BY up.deletion_scheduled_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION review_pending_deletions() TO authenticated;

-- Add comment
COMMENT ON FUNCTION review_pending_deletions() IS 'Review accounts pending deletion with safety warnings';
