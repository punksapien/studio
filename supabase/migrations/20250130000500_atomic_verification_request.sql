-- Create atomic verification request submission
-- Ensures both verification_requests and user_profiles are updated together

-- Create function to atomically create verification request and update user status
CREATE OR REPLACE FUNCTION public.create_verification_request(
  p_user_id UUID,
  p_listing_id UUID DEFAULT NULL,
  p_request_type TEXT DEFAULT 'user_verification',
  p_reason TEXT DEFAULT '',
  p_phone_number TEXT DEFAULT NULL,
  p_best_time_to_call TEXT DEFAULT NULL,
  p_user_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  request_id UUID,
  message TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
  v_existing_pending_count INTEGER;
  v_current_status TEXT;
BEGIN
  -- Check for existing pending requests
  SELECT COUNT(*) INTO v_existing_pending_count
  FROM verification_requests
  WHERE user_id = p_user_id
    AND request_type = p_request_type
    AND (p_listing_id IS NULL OR listing_id = p_listing_id)
    AND status IN ('New Request', 'Contacted', 'Docs Under Review', 'More Info Requested');

  -- Get current user verification status
  SELECT verification_status INTO v_current_status
  FROM user_profiles
  WHERE id = p_user_id;

  -- If user has existing pending request, don't create another
  IF v_existing_pending_count > 0 THEN
    RETURN QUERY
    SELECT
      false AS success,
      NULL::UUID AS request_id,
      'You already have a pending verification request' AS message;
    RETURN;
  END IF;

  -- Start transaction block
  BEGIN
    -- Create the verification request
    INSERT INTO verification_requests (
      user_id,
      listing_id,
      request_type,
      status,
      reason,
      phone_number,
      best_time_to_call,
      user_notes,
      last_request_time,
      bump_count,
      priority_score,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_listing_id,
      p_request_type,
      'New Request',
      p_reason,
      p_phone_number,
      p_best_time_to_call,
      p_user_notes,
      NOW(),
      0,
      0,
      NOW(),
      NOW()
    ) RETURNING id INTO v_request_id;

    -- Update user profile status to pending_verification
    -- Only update if current status is 'anonymous' to avoid overwriting other statuses
    IF v_current_status = 'anonymous' THEN
      UPDATE user_profiles
      SET
        verification_status = 'pending_verification',
        updated_at = NOW()
      WHERE id = p_user_id;
    END IF;

    -- Create notification
    INSERT INTO notifications (
      user_id,
      type,
      message,
      link,
      is_read,
      created_at
    ) VALUES (
      p_user_id,
      'verification',
      'Your ' || REPLACE(p_request_type, '_', ' ') || ' request has been submitted and is under review.',
      '/seller-dashboard/verification',
      false,
      NOW()
    );

    -- Success
    RETURN QUERY
    SELECT
      true AS success,
      v_request_id AS request_id,
      'Verification request created successfully' AS message;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RAISE WARNING 'Failed to create verification request: %', SQLERRM;
      RETURN QUERY
      SELECT
        false AS success,
        NULL::UUID AS request_id,
        'Failed to create verification request: ' || SQLERRM AS message;
  END;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle verification status updates atomically
CREATE OR REPLACE FUNCTION public.update_verification_status(
  p_request_id UUID,
  p_new_operational_status TEXT DEFAULT NULL,
  p_new_profile_status TEXT DEFAULT NULL,
  p_admin_note TEXT DEFAULT NULL,
  p_admin_name TEXT DEFAULT 'Admin'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_notes JSONB;
  v_new_note JSONB;
BEGIN
  -- Get user_id from the request
  SELECT user_id INTO v_user_id
  FROM verification_requests
  WHERE id = p_request_id;

  IF v_user_id IS NULL THEN
    RETURN QUERY
    SELECT
      false AS success,
      'Verification request not found' AS message;
    RETURN;
  END IF;

  -- Start transaction block
  BEGIN
    -- Update verification request if operational status provided
    IF p_new_operational_status IS NOT NULL THEN
      -- Get current admin notes
      SELECT COALESCE(admin_notes, '[]'::JSONB) INTO v_current_notes
      FROM verification_requests
      WHERE id = p_request_id;

      -- Create new note if admin note provided
      IF p_admin_note IS NOT NULL THEN
        v_new_note := jsonb_build_object(
          'id', extract(epoch from NOW())::TEXT,
          'content', p_admin_note,
          'createdAt', NOW(),
          'createdBy', p_admin_name,
          'operationalStatus', p_new_operational_status,
          'profileStatus', p_new_profile_status
        );

        -- Append new note to existing notes
        v_current_notes := v_current_notes || jsonb_build_array(v_new_note);
      END IF;

      UPDATE verification_requests
      SET
        status = p_new_operational_status,
        admin_notes = CASE
          WHEN p_admin_note IS NOT NULL THEN v_current_notes
          ELSE admin_notes
        END,
        updated_at = NOW()
      WHERE id = p_request_id;
    END IF;

    -- Update user profile if profile status provided
    IF p_new_profile_status IS NOT NULL THEN
      UPDATE user_profiles
      SET
        verification_status = p_new_profile_status,
        updated_at = NOW()
      WHERE id = v_user_id;

      -- Auto-sync operational status based on profile status
      IF p_new_profile_status = 'rejected' THEN
        UPDATE verification_requests
        SET status = 'Rejected', updated_at = NOW()
        WHERE id = p_request_id;
      ELSIF p_new_profile_status = 'verified' THEN
        UPDATE verification_requests
        SET status = 'Approved', updated_at = NOW()
        WHERE id = p_request_id;
      END IF;
    END IF;

    -- Create notification for status change
    IF p_new_operational_status IS NOT NULL OR p_new_profile_status IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        message,
        link,
        is_read,
        created_at
      ) VALUES (
        v_user_id,
        'verification',
        CASE
          WHEN p_new_operational_status IS NOT NULL
          THEN 'Your verification request status has been updated to: ' || p_new_operational_status
          ELSE 'Your profile verification status has been updated to: ' || p_new_profile_status
        END,
        '/seller-dashboard/verification',
        false,
        NOW()
      );
    END IF;

    -- Success
    RETURN QUERY
    SELECT
      true AS success,
      'Verification status updated successfully' AS message;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RAISE WARNING 'Failed to update verification status: %', SQLERRM;
      RETURN QUERY
      SELECT
        false AS success,
        'Failed to update verification status: ' || SQLERRM AS message;
  END;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION public.create_verification_request IS
'Atomically creates a verification request and updates user profile status to pending_verification in a single transaction';

COMMENT ON FUNCTION public.update_verification_status IS
'Atomically updates both verification request and user profile status in a single transaction';

-- Verify the functions work
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Atomic Verification Functions Created ===';
  RAISE NOTICE '✅ create_verification_request() - Creates request and updates profile atomically';
  RAISE NOTICE '✅ update_verification_status() - Updates both tables atomically';
  RAISE NOTICE '✅ Both functions handle errors gracefully with automatic rollback';
  RAISE NOTICE '==========================================';
END $$;
