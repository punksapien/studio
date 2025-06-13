-- Separate Email Verification from Identity Verification
-- This migration creates a clean separation of concerns and fixes all verification issues

-- Step 1: Add new column for identity verification (separate from email verification)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_identity_verified BOOLEAN DEFAULT false;

-- Step 2: Migrate existing verification_status to the new column
UPDATE user_profiles
SET is_identity_verified = CASE
  WHEN verification_status = 'verified' THEN true
  ELSE false
END;

-- Step 2.5: CRITICAL - Ensure ALL admins have email verified status
-- This fixes any existing admins who might have been created before this fix
UPDATE user_profiles
SET
  is_email_verified = true,
  email_verified_at = COALESCE(email_verified_at, NOW()),
  verification_status = 'verified',
  is_identity_verified = true,
  updated_at = NOW()
WHERE role = 'admin'
  AND (is_email_verified = false OR is_email_verified IS NULL);

-- Log how many admins were fixed
DO $$
DECLARE
  admin_fixed_count INTEGER;
BEGIN
  GET DIAGNOSTICS admin_fixed_count = ROW_COUNT;
  IF admin_fixed_count > 0 THEN
    RAISE NOTICE 'Fixed % admin user(s) to have verified email status', admin_fixed_count;
  END IF;
END $$;

-- Step 3: Fix the user creation trigger to handle email verification properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DECLARE
    user_role text;
    user_full_name text;
    user_phone_number text;
    user_country text;
  BEGIN
    -- Get role from metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer');
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    user_phone_number := COALESCE(NEW.raw_user_meta_data->>'phone_number', '');
    user_country := COALESCE(NEW.raw_user_meta_data->>'country', '');

    -- Create profile for ALL users
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      phone_number,
      country,
      role,
      is_email_verified,
      email_verified_at,
      is_identity_verified,
      verification_status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      user_phone_number,
      user_country,
      user_role,
      -- CRITICAL: Admins ALWAYS have verified email, others check Supabase auth
      CASE
        WHEN user_role = 'admin' THEN true
        ELSE COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
      END,
      CASE
        WHEN user_role = 'admin' THEN COALESCE(NEW.email_confirmed_at, NOW())
        ELSE NEW.email_confirmed_at
      END,
      -- Identity verification: Only admins start verified
      CASE
        WHEN user_role = 'admin' THEN true
        ELSE false
      END,
      -- Legacy verification_status for backward compatibility
      CASE
        WHEN user_role = 'admin' THEN 'verified'
        ELSE 'anonymous'
      END,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = CASE WHEN EXCLUDED.full_name != '' THEN EXCLUDED.full_name ELSE user_profiles.full_name END,
      phone_number = CASE WHEN EXCLUDED.phone_number != '' THEN EXCLUDED.phone_number ELSE user_profiles.phone_number END,
      country = CASE WHEN EXCLUDED.country != '' THEN EXCLUDED.country ELSE user_profiles.country END,
      is_email_verified = EXCLUDED.is_email_verified,
      email_verified_at = EXCLUDED.email_verified_at,
      updated_at = NOW();

    RAISE NOTICE 'Created/Updated profile for user % with role % (email verified: %, identity verified: %)',
      NEW.email,
      user_role,
      CASE WHEN user_role = 'admin' THEN true ELSE COALESCE(NEW.email_confirmed_at IS NOT NULL, false) END,
      CASE WHEN user_role = 'admin' THEN true ELSE false END;

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
      RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update email confirmation handler to NOT touch identity verification
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Update ONLY email verification status when email is confirmed
  -- Do NOT touch identity verification or verification_status
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.user_profiles
    SET
      is_email_verified = true,
      email_verified_at = NEW.email_confirmed_at,
      updated_at = NOW()
    WHERE id = NEW.id;

    RAISE NOTICE 'Updated email verification status for user % (email now verified)', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update the verification request functions to work with identity verification
DROP FUNCTION IF EXISTS public.create_verification_request(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_verification_request(
  p_user_id UUID,
  p_request_type TEXT,
  p_reason TEXT,
  p_phone_number TEXT DEFAULT NULL,
  p_best_time_to_call TEXT DEFAULT NULL,
  p_user_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  request_id UUID
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
  v_user_role TEXT;
BEGIN
  -- Get user role
  SELECT role INTO v_user_role
  FROM user_profiles
  WHERE id = p_user_id;

  -- Check if user exists
  IF v_user_role IS NULL THEN
    RETURN QUERY
    SELECT
      false AS success,
      'User not found' AS message,
      NULL::UUID AS request_id;
    RETURN;
  END IF;

  -- Admins don't need identity verification
  IF v_user_role = 'admin' THEN
    RETURN QUERY
    SELECT
      false AS success,
      'Admins are automatically verified' AS message,
      NULL::UUID AS request_id;
    RETURN;
  END IF;

  -- Start transaction
  BEGIN
    -- Create verification request
    INSERT INTO verification_requests (
      user_id,
      request_type,
      status,
      reason,
      phone_number,
      best_time_to_call,
      user_notes,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_request_type,
      'New Request',
      p_reason,
      p_phone_number,
      p_best_time_to_call,
      p_user_notes,
      NOW(),
      NOW()
    ) RETURNING id INTO v_request_id;

    -- Update user profile verification_status (for backward compatibility)
    UPDATE user_profiles
    SET
      verification_status = 'pending_verification',
      updated_at = NOW()
    WHERE id = p_user_id;

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
      'Your ' || p_request_type || ' request has been submitted and is under review.',
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
      'Verification request created successfully' AS message,
      v_request_id AS request_id;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create verification request: %', SQLERRM;
      RETURN QUERY
      SELECT
        false AS success,
        'Failed to create verification request: ' || SQLERRM AS message,
        NULL::UUID AS request_id;
  END;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Update verification status update function
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

  BEGIN
    -- Update verification request if operational status provided
    IF p_new_operational_status IS NOT NULL THEN
      -- Handle admin notes if provided
      IF p_admin_note IS NOT NULL THEN
        SELECT COALESCE(admin_notes, '[]'::JSONB) INTO v_current_notes
        FROM verification_requests
        WHERE id = p_request_id;

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
      -- Update both legacy verification_status and new is_identity_verified
      UPDATE user_profiles
      SET
        verification_status = p_new_profile_status,
        is_identity_verified = CASE
          WHEN p_new_profile_status = 'verified' THEN true
          ELSE false
        END,
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
          ELSE 'Your identity verification status has been updated to: ' || p_new_profile_status
        END,
        '/seller-dashboard/verification',
        false,
        NOW()
      );
    END IF;

    RETURN QUERY
    SELECT
      true AS success,
      'Verification status updated successfully' AS message;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to update verification status: %', SQLERRM;
      RETURN QUERY
      SELECT
        false AS success,
        'Failed to update verification status: ' || SQLERRM AS message;
  END;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_email_verified ON user_profiles(is_email_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_identity_verified ON user_profiles(is_identity_verified);

-- Step 8: Add comments explaining the new architecture
COMMENT ON COLUMN user_profiles.is_email_verified IS
'Email verification status from Supabase Auth. Admins always true. Required for login.';

COMMENT ON COLUMN user_profiles.is_identity_verified IS
'Identity/business verification status. Admins always true. Shows marketplace trust level.';

COMMENT ON COLUMN user_profiles.verification_status IS
'Legacy column for backward compatibility. Use is_identity_verified for new code.';

-- Step 9: Create helper view for easy querying
CREATE OR REPLACE VIEW user_verification_status AS
SELECT
  up.id,
  up.email,
  up.role,
  up.is_email_verified,
  up.email_verified_at,
  up.is_identity_verified,
  up.verification_status,
  vr.id as active_request_id,
  vr.status as request_status,
  vr.created_at as request_created_at
FROM user_profiles up
LEFT JOIN verification_requests vr ON up.id = vr.user_id
  AND vr.status NOT IN ('Rejected', 'Expired', 'Approved');

-- Grant permissions
GRANT SELECT ON user_verification_status TO authenticated;

-- Step 10: Verification summary
DO $$
DECLARE
  email_verified_count INTEGER;
  identity_verified_count INTEGER;
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO email_verified_count
  FROM user_profiles WHERE is_email_verified = true;

  SELECT COUNT(*) INTO identity_verified_count
  FROM user_profiles WHERE is_identity_verified = true;

  SELECT COUNT(*) INTO admin_count
  FROM user_profiles WHERE role = 'admin';

  RAISE NOTICE '';
  RAISE NOTICE '=== Verification System Separation Complete ===';
  RAISE NOTICE 'Email verified users: %', email_verified_count;
  RAISE NOTICE 'Identity verified users: %', identity_verified_count;
  RAISE NOTICE 'Admin users (always verified): %', admin_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Email verification: Handled by Supabase Auth + is_email_verified column';
  RAISE NOTICE 'Identity verification: Handled by verification_requests + is_identity_verified column';
  RAISE NOTICE 'Admins: Always bypass both email and identity verification';
  RAISE NOTICE '==============================================';
END $$;
