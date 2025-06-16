-- Add triggers for automatic inquiry status updates when verification status changes
-- This migration ensures inquiries automatically transition to the correct status when users get verified

-- Function to update inquiry statuses when user verification status changes
CREATE OR REPLACE FUNCTION update_inquiry_statuses_on_verification()
RETURNS TRIGGER AS $$
DECLARE
    inquiry_record RECORD;
    new_status TEXT;
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
                seller_profile.verification_status as seller_verified
            FROM inquiries i
            LEFT JOIN user_profiles buyer_profile ON i.buyer_id = buyer_profile.id
            LEFT JOIN user_profiles seller_profile ON i.seller_id = seller_profile.id
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

                -- Log the automatic status change
                INSERT INTO admin_actions (
                    admin_id, -- Will be NULL for automatic system actions
                    action_type,
                    target_type,
                    target_id,
                    details,
                    timestamp
                ) VALUES (
                    NULL, -- System action
                    'inquiry_status_auto_update',
                    'inquiry',
                    inquiry_record.id::text,
                    json_build_object(
                        'previous_status', inquiry_record.status,
                        'new_status', new_status,
                        'trigger_user_id', NEW.id::text,
                        'trigger_user_role', NEW.role,
                        'reason', 'User verification status changed to verified'
                    ),
                    NOW()
                );

                -- Create notifications for status change
                IF new_status = 'ready_for_admin_connection' THEN
                    -- Notify both parties that they're ready for admin connection
                    INSERT INTO notifications (user_id, type, message, link, created_at) VALUES
                    (inquiry_record.buyer_id, 'inquiry_update',
                     'Great news! Both you and the seller are now verified. Our admin team will facilitate your connection soon.',
                     '/dashboard/inquiries', NOW()),
                    (inquiry_record.seller_id, 'inquiry_update',
                     'Both parties are now verified for your inquiry. Our admin team will facilitate the connection soon.',
                     '/seller-dashboard/inquiries', NOW());

                    -- Notify admin team
                    INSERT INTO notifications (
                        user_id, type, message, link, created_at
                    )
                    SELECT
                        up.id,
                        'admin_action_required',
                        'New connection ready for facilitation due to verification completion',
                        '/admin/engagement-queue',
                        NOW()
                    FROM user_profiles up
                    WHERE up.role = 'admin';
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_profiles table
DROP TRIGGER IF EXISTS trigger_update_inquiry_statuses_on_verification ON user_profiles;
CREATE TRIGGER trigger_update_inquiry_statuses_on_verification
    AFTER UPDATE OF verification_status ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_inquiry_statuses_on_verification();

-- Add comments for documentation
COMMENT ON FUNCTION update_inquiry_statuses_on_verification() IS 'Automatically updates inquiry statuses when user verification status changes to verified';
COMMENT ON TRIGGER trigger_update_inquiry_statuses_on_verification ON user_profiles IS 'Triggers automatic inquiry status updates when users get verified';

-- Create function to handle verification request completion
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
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on verification_requests table
DROP TRIGGER IF EXISTS trigger_handle_verification_request_completion ON verification_requests;
CREATE TRIGGER trigger_handle_verification_request_completion
    AFTER UPDATE OF status ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_verification_request_completion();

COMMENT ON FUNCTION handle_verification_request_completion() IS 'Updates user verification status when verification request is approved';
COMMENT ON TRIGGER trigger_handle_verification_request_completion ON verification_requests IS 'Automatically updates user verification status when request is approved';
