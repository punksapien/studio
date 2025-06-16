-- Inquiry Status Automation System
-- This migration adds robust automation for inquiry status updates when verification status changes
-- All statements are idempotent and safe to run multiple times

-- ============================================================================
-- 1. INQUIRY STATUS UPDATE FUNCTION
-- ============================================================================

-- Drop and recreate function to ensure we have the latest version
DROP FUNCTION IF EXISTS update_inquiry_statuses_on_verification() CASCADE;

CREATE OR REPLACE FUNCTION update_inquiry_statuses_on_verification()
RETURNS TRIGGER AS $$
DECLARE
    inquiry_record RECORD;
    new_status TEXT;
    notification_count INTEGER := 0;
BEGIN
    -- Only process when verification_status changes to 'verified'
    IF NEW.verification_status = 'verified' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN

        -- Find all inquiries where this user is involved and status depends on their verification
        FOR inquiry_record IN
            SELECT
                i.id,
                i.status,
                i.buyer_id,
                i.seller_id,
                buyer_profile.verification_status as buyer_verified,
                seller_profile.verification_status as seller_verified,
                buyer_profile.full_name as buyer_name,
                seller_profile.full_name as seller_name,
                l.listing_title_anonymous as listing_title
            FROM inquiries i
            LEFT JOIN user_profiles buyer_profile ON i.buyer_id = buyer_profile.id
            LEFT JOIN user_profiles seller_profile ON i.seller_id = seller_profile.id
            LEFT JOIN listings l ON i.listing_id = l.id
            WHERE
                (i.buyer_id = NEW.id OR i.seller_id = NEW.id)
                AND i.status IN (
                    'seller_engaged_buyer_pending_verification',
                    'seller_engaged_seller_pending_verification'
                )
        LOOP
            -- Determine new status based on both parties' verification status
            IF inquiry_record.buyer_verified = 'verified' AND inquiry_record.seller_verified = 'verified' THEN
                new_status := 'ready_for_admin_connection';
            ELSIF inquiry_record.buyer_verified != 'verified' THEN
                new_status := 'seller_engaged_buyer_pending_verification';
            ELSIF inquiry_record.seller_verified != 'verified' THEN
                new_status := 'seller_engaged_seller_pending_verification';
            ELSE
                new_status := inquiry_record.status; -- No change needed
            END IF;

            -- Update inquiry status if it changed
            IF new_status != inquiry_record.status THEN
                UPDATE inquiries
                SET
                    status = new_status,
                    updated_at = NOW()
                WHERE id = inquiry_record.id;

                -- Log the automatic status change (only if admin_actions table exists)
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_actions') THEN
                                    INSERT INTO admin_actions (
                    admin_id, -- NULL for system actions
                    action_type,
                    target_type,
                    target_id,
                    details,
                    timestamp
                ) VALUES (
                    NULL,
                    'inquiry_status_auto_update',
                    'inquiry',
                    inquiry_record.id,  -- Keep as UUID, not converted to text
                    json_build_object(
                        'previous_status', inquiry_record.status,
                        'new_status', new_status,
                        'trigger_user_id', NEW.id,  -- Keep as UUID, not converted to text
                        'trigger_user_role', NEW.role,
                        'reason', 'User verification status changed to verified'
                    ),
                    NOW()
                );
                END IF;

                -- Create notifications for status change
                IF new_status = 'ready_for_admin_connection' THEN
                    -- Notify both parties that they're ready for admin connection
                    INSERT INTO notifications (user_id, type, message, link, created_at) VALUES
                    (inquiry_record.buyer_id, 'inquiry',
                     'Great news! Both you and the seller are now verified. Our admin team will facilitate your connection soon.',
                     '/dashboard/inquiries', NOW()),
                    (inquiry_record.seller_id, 'inquiry',
                     'Both parties are now verified for your inquiry. Our admin team will facilitate the connection soon.',
                     '/seller-dashboard/inquiries', NOW());

                    -- Notify admin team (only if admin users exist)
                    INSERT INTO notifications (user_id, type, message, link, created_at)
                    SELECT
                        up.id,
                        'system',
                        format('New connection ready: %s ↔ %s for "%s"',
                               inquiry_record.buyer_name,
                               inquiry_record.seller_name,
                               COALESCE(inquiry_record.listing_title, 'listing')),
                        '/admin/engagement-queue',
                        NOW()
                    FROM user_profiles up
                    WHERE up.role = 'admin';

                    GET DIAGNOSTICS notification_count = ROW_COUNT;
                END IF;

                -- Log successful status update
                RAISE NOTICE 'Inquiry % status updated from % to % (triggered by user % verification)',
                    inquiry_record.id, inquiry_record.status, new_status, NEW.id;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. VERIFICATION REQUEST COMPLETION FUNCTION
-- ============================================================================

-- Drop and recreate function to ensure we have the latest version
DROP FUNCTION IF EXISTS handle_verification_request_completion() CASCADE;

CREATE OR REPLACE FUNCTION handle_verification_request_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- When a verification request is approved, update the user's verification status
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        UPDATE user_profiles
        SET
            verification_status = 'verified',
            updated_at = NOW()
        WHERE id = NEW.user_id;

        RAISE NOTICE 'User % verification status updated to verified (request % approved)',
            NEW.user_id, NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. CREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_inquiry_statuses_on_verification ON user_profiles;
DROP TRIGGER IF EXISTS trigger_handle_verification_request_completion ON verification_requests;

-- Create trigger on user_profiles table for verification status changes
CREATE TRIGGER trigger_update_inquiry_statuses_on_verification
    AFTER UPDATE OF verification_status ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_inquiry_statuses_on_verification();

-- Create trigger on verification_requests table for request completion
CREATE TRIGGER trigger_handle_verification_request_completion
    AFTER UPDATE OF status ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_verification_request_completion();

-- ============================================================================
-- 4. DOCUMENTATION AND COMMENTS
-- ============================================================================

COMMENT ON FUNCTION update_inquiry_statuses_on_verification() IS
'Automatically updates inquiry statuses when user verification status changes to verified. Handles all verification state combinations and creates appropriate notifications.';

COMMENT ON FUNCTION handle_verification_request_completion() IS
'Updates user verification status when verification request is approved by admin.';

COMMENT ON TRIGGER trigger_update_inquiry_statuses_on_verification ON user_profiles IS
'Triggers automatic inquiry status updates when users get verified, ensuring seamless flow progression.';

COMMENT ON TRIGGER trigger_handle_verification_request_completion ON verification_requests IS
'Automatically updates user verification status when admin approves verification requests.';

-- ============================================================================
-- 5. VERIFICATION AND LOGGING
-- ============================================================================

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Inquiry Status Automation System installed successfully';
    RAISE NOTICE 'Functions created: update_inquiry_statuses_on_verification, handle_verification_request_completion';
    RAISE NOTICE 'Triggers created: trigger_update_inquiry_statuses_on_verification, trigger_handle_verification_request_completion';
    RAISE NOTICE 'System will now automatically update inquiry statuses when users get verified';
END $$;
