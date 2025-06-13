-- Comprehensive fix for admin_notes column type and function
-- This handles view dependencies properly

-- Step 1: Drop the view that depends on admin_notes
DROP VIEW IF EXISTS admin_verification_queue;

-- Step 2: Update any existing text values to be valid JSON arrays
UPDATE verification_requests
SET admin_notes = CASE
  WHEN admin_notes IS NULL THEN NULL
  WHEN admin_notes = '' THEN '[]'::TEXT
  WHEN admin_notes::TEXT LIKE '[%' THEN admin_notes  -- Already looks like JSON
  ELSE '[]'::TEXT  -- Reset invalid data to empty array
END
WHERE admin_notes IS NOT NULL AND admin_notes != '';

-- Step 3: Alter the column type to JSONB
ALTER TABLE verification_requests
ALTER COLUMN admin_notes TYPE JSONB USING
  CASE
    WHEN admin_notes IS NULL THEN NULL
    WHEN admin_notes = '' THEN '[]'::JSONB
    ELSE admin_notes::JSONB
  END;

-- Step 4: Set a default value for the column
ALTER TABLE verification_requests
ALTER COLUMN admin_notes SET DEFAULT '[]'::JSONB;

-- Step 5: Recreate the admin_verification_queue view
CREATE OR REPLACE VIEW admin_verification_queue AS
SELECT
  vr.id,
  vr.user_id,
  vr.request_type,
  vr.status,
  vr.reason,
  vr.phone_number,
  vr.best_time_to_call,
  vr.user_notes,
  vr.admin_notes,
  vr.created_at,
  vr.updated_at,
  up.email,
  up.full_name,
  up.role,
  up.verification_status,
  up.country,
  up.initial_company_name as company_name,
  up.listing_count,
  up.created_at as user_created_at
FROM verification_requests vr
JOIN user_profiles up ON vr.user_id = up.id
WHERE vr.request_type = 'user_verification'
ORDER BY vr.created_at DESC;

-- Step 6: Update the function to work with JSONB type properly
DROP FUNCTION IF EXISTS public.update_verification_status(UUID, TEXT, TEXT, TEXT, TEXT);

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
      -- Handle admin notes if provided
      IF p_admin_note IS NOT NULL THEN
        -- Get current admin notes with proper default
        SELECT COALESCE(admin_notes, '[]'::JSONB) INTO v_current_notes
        FROM verification_requests
        WHERE id = p_request_id;

        -- Create new note
        v_new_note := jsonb_build_object(
          'id', extract(epoch from NOW())::TEXT,
          'note', p_admin_note,
          'timestamp', NOW(),
          'createdBy', p_admin_name,
          'adminName', p_admin_name,
          'operationalStatusAtTimeOfNote', COALESCE(p_new_operational_status,
            (SELECT status FROM verification_requests WHERE id = p_request_id)),
          'profileStatusAtTimeOfNote', COALESCE(p_new_profile_status,
            (SELECT verification_status FROM user_profiles WHERE id = v_user_id)),
          'adminId', p_admin_name
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

COMMENT ON FUNCTION public.update_verification_status IS
'Atomically updates both verification request and user profile status. Works with JSONB admin_notes column.';

-- Grant appropriate permissions
GRANT SELECT ON admin_verification_queue TO authenticated;
GRANT SELECT ON admin_verification_queue TO anon;
