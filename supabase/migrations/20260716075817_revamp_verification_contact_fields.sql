-- Revamp verification "request" contact fields
-- The buyer/seller request-verification flow no longer collects
-- "best time to call" / "user notes". Instead a request can optionally carry
-- an extra contact email and phone. Legacy columns are KEPT (non-destructive)
-- so historical requests still render, and the RPC keeps the legacy params so
-- the currently-deployed app keeps working during the deploy window.

-- 1. Add the new optional contact columns (legacy columns intentionally kept)
ALTER TABLE verification_requests
  ADD COLUMN IF NOT EXISTS additional_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS additional_phone VARCHAR(50);

COMMENT ON COLUMN verification_requests.additional_email IS 'Optional extra contact email supplied with this request';
COMMENT ON COLUMN verification_requests.additional_phone IS 'Optional extra contact phone supplied with this request';

-- 2. Drop BOTH existing overloads of the RPC.
--    A signature change forbids CREATE OR REPLACE, and leaving two overloads
--    breaks PostgREST function resolution.
DROP FUNCTION IF EXISTS public.create_verification_request(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_verification_request(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 3. Create ONE canonical function, merged from the two previous versions:
--    - pending-request guard, p_listing_id handling, and the full INSERT
--      (last_request_time / bump_count / priority_score) come from the
--      7-param atomic version (20250130000500).
--    - user role lookup, admin short-circuit, role-aware notification link, and
--      the conditional user_profiles.verification_status update come from the
--      6-param version (20250201).
CREATE FUNCTION public.create_verification_request(
  p_user_id UUID,
  p_listing_id UUID DEFAULT NULL,
  p_request_type TEXT DEFAULT 'user_verification',
  p_reason TEXT DEFAULT '',
  p_phone_number TEXT DEFAULT NULL,
  p_additional_email TEXT DEFAULT NULL,
  p_additional_phone TEXT DEFAULT NULL,
  p_best_time_to_call TEXT DEFAULT NULL,  -- legacy, kept so the currently-deployed app keeps working during the deploy window
  p_user_notes TEXT DEFAULT NULL          -- legacy, same reason
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
  v_user_role TEXT;
  v_current_status TEXT;
BEGIN
  -- Look up the user's role and current verification status
  SELECT role, verification_status
  INTO v_user_role, v_current_status
  FROM user_profiles
  WHERE id = p_user_id;

  -- Check if user exists
  IF v_user_role IS NULL THEN
    RETURN QUERY
    SELECT
      false AS success,
      NULL::UUID AS request_id,
      'User not found' AS message;
    RETURN;
  END IF;

  -- Admins don't need identity verification
  IF v_user_role = 'admin' THEN
    RETURN QUERY
    SELECT
      false AS success,
      NULL::UUID AS request_id,
      'Admins are automatically verified' AS message;
    RETURN;
  END IF;

  -- Check for existing pending requests (scoped to request_type + listing)
  SELECT COUNT(*) INTO v_existing_pending_count
  FROM verification_requests
  WHERE user_id = p_user_id
    AND request_type = p_request_type
    AND (p_listing_id IS NULL OR listing_id = p_listing_id)
    AND status IN ('New Request', 'Contacted', 'Docs Under Review', 'More Info Requested');

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
      additional_email,
      additional_phone,
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
      p_additional_email,
      p_additional_phone,
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

    -- Create notification with a role-aware link
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
      CASE
        WHEN v_user_role = 'seller' THEN '/seller-dashboard/verification'
        ELSE '/dashboard/verification'
      END,
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

COMMENT ON FUNCTION public.create_verification_request IS
'Atomically creates a verification request (with optional additional_email / additional_phone contact fields) and updates the user profile status to pending_verification in a single transaction. Legacy best_time_to_call / user_notes params are retained for backward compatibility.';

-- 4. Recreate the admin_verification_queue view to expose the new contact
--    columns. The admin detail route selects * from this view, so without this
--    the new fields would silently be missing from the admin detail endpoint.
--    Definition copied verbatim from the latest source (20250131_fix_admin_notes_complete.sql,
--    lines 31-55), adding vr.additional_email / vr.additional_phone after vr.phone_number.
DROP VIEW IF EXISTS admin_verification_queue;

CREATE OR REPLACE VIEW admin_verification_queue AS
SELECT
  vr.id,
  vr.user_id,
  vr.request_type,
  vr.status,
  vr.reason,
  vr.phone_number,
  vr.additional_email,
  vr.additional_phone,
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

-- Replicate the grants from 20250131 (lines 197-198)
GRANT SELECT ON admin_verification_queue TO authenticated;
GRANT SELECT ON admin_verification_queue TO anon;
