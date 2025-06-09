-- Production-Grade Bump/Admin Workflow Enhancement Migration
-- Resolves UX conflicts between seller bump actions and admin processing workflow
-- Date: 2025-01-06

-- 1. Add admin lock and bump state tracking fields
ALTER TABLE verification_requests
ADD COLUMN IF NOT EXISTS admin_locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_lock_reason VARCHAR(100),
ADD COLUMN IF NOT EXISTS bump_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS bump_disabled_reason VARCHAR(200);

-- 2. Create comprehensive function to manage bump eligibility based on admin status
CREATE OR REPLACE FUNCTION update_bump_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset bump eligibility when request is newly created
  IF TG_OP = 'INSERT' THEN
    NEW.bump_enabled = TRUE;
    NEW.bump_disabled_reason = NULL;
    NEW.admin_locked_at = NULL;
    NEW.admin_lock_reason = NULL;
    RETURN NEW;
  END IF;

  -- Handle status changes that affect bump eligibility
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      -- States where bumping should be DISABLED
      WHEN 'Docs Under Review' THEN
        NEW.bump_enabled = FALSE;
        NEW.bump_disabled_reason = 'Admin is currently reviewing your documents';
        NEW.admin_locked_at = NOW();
        NEW.admin_lock_reason = 'Document review in progress';

      -- States where seller is verified - no need for bumping
      WHEN 'Approved' THEN
        NEW.bump_enabled = FALSE;
        NEW.bump_disabled_reason = 'Verification completed successfully';
        NEW.admin_locked_at = NULL;
        NEW.admin_lock_reason = NULL;

      -- States where bumping should be ENABLED
      WHEN 'New Request', 'Contacted', 'More Info Requested', 'Rejected' THEN
        NEW.bump_enabled = TRUE;
        NEW.bump_disabled_reason = NULL;
        NEW.admin_locked_at = NULL;
        NEW.admin_lock_reason = NULL;

      ELSE
        -- For any other status, maintain current state
        NULL;
    END CASE;
  END IF;

  -- Log admin lock/unlock actions
  IF TG_OP = 'UPDATE' AND OLD.admin_locked_at IS DISTINCT FROM NEW.admin_locked_at THEN
    INSERT INTO verification_request_activities (
      request_id, admin_id, activity_type, old_value, new_value, notes
    ) VALUES (
      NEW.id,
      NEW.processing_admin_id,
      CASE
        WHEN NEW.admin_locked_at IS NOT NULL THEN 'admin_locked'
        ELSE 'admin_unlocked'
      END,
      CASE WHEN OLD.admin_locked_at IS NOT NULL THEN 'locked' ELSE 'unlocked' END,
      CASE WHEN NEW.admin_locked_at IS NOT NULL THEN 'locked' ELSE 'unlocked' END,
      COALESCE(NEW.admin_lock_reason, 'Lock status changed')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to automatically manage bump eligibility
DROP TRIGGER IF EXISTS bump_eligibility_manager ON verification_requests;
CREATE TRIGGER bump_eligibility_manager
  BEFORE INSERT OR UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_bump_eligibility();

-- 4. Create function to validate bump requests with business logic
CREATE OR REPLACE FUNCTION validate_bump_request(request_id UUID, user_id UUID)
RETURNS TABLE(
  can_bump BOOLEAN,
  reason TEXT,
  hours_until_eligible NUMERIC
) AS $$
DECLARE
  req_record verification_requests;
  last_bump_hours NUMERIC;
  request_age_hours NUMERIC;
BEGIN
  -- Get the verification request
  SELECT * INTO req_record
  FROM verification_requests vr
  WHERE vr.id = request_id AND vr.user_id = user_id;

  -- Check if request exists and belongs to user
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Verification request not found', 0::NUMERIC;
    RETURN;
  END IF;

  -- Check if bumping is administratively disabled
  IF NOT req_record.bump_enabled THEN
    RETURN QUERY SELECT FALSE, COALESCE(req_record.bump_disabled_reason, 'Bumping temporarily disabled'), 0::NUMERIC;
    RETURN;
  END IF;

  -- Check if request is in a final state
  IF req_record.status IN ('Approved') THEN
    RETURN QUERY SELECT FALSE, 'Request already approved - no bumping needed', 0::NUMERIC;
    RETURN;
  END IF;

  -- Check admin lock
  IF req_record.admin_locked_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Request locked by admin - please wait for review to complete', 0::NUMERIC;
    RETURN;
  END IF;

  -- Check bump cooldown (24 hours between bumps)
  IF req_record.last_bump_time IS NOT NULL THEN
    last_bump_hours = EXTRACT(EPOCH FROM (NOW() - req_record.last_bump_time)) / 3600;
    IF last_bump_hours < 24 THEN
      RETURN QUERY SELECT FALSE, 'Must wait 24 hours between bumps', (24 - last_bump_hours);
      RETURN;
    END IF;
  END IF;

  -- Check if request is recent (no bumping within first 24 hours)
  request_age_hours = EXTRACT(EPOCH FROM (NOW() - req_record.created_at)) / 3600;
  IF request_age_hours < 24 AND req_record.bump_count = 0 THEN
    RETURN QUERY SELECT FALSE, 'New requests cannot be bumped for first 24 hours', (24 - request_age_hours);
    RETURN;
  END IF;

  -- All checks passed - bumping is allowed
  RETURN QUERY SELECT TRUE, 'Request can be bumped to top of queue', 0::NUMERIC;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to execute bump with proper validation and logging
CREATE OR REPLACE FUNCTION execute_bump_request(request_id UUID, user_id UUID, bump_reason TEXT DEFAULT NULL)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  new_bump_count INTEGER,
  new_priority_score INTEGER
) AS $$
DECLARE
  bump_validation RECORD;
  updated_request verification_requests;
BEGIN
  -- Validate bump request
  SELECT * INTO bump_validation
  FROM validate_bump_request(request_id, user_id);

  IF NOT bump_validation.can_bump THEN
    RETURN QUERY SELECT FALSE, bump_validation.reason, 0, 0;
    RETURN;
  END IF;

  -- Execute the bump
  UPDATE verification_requests
  SET
    bump_count = bump_count + 1,
    last_bump_time = NOW(),
    priority_score = GREATEST(priority_score, ((bump_count + 1) * 10) + EXTRACT(DAYS FROM (NOW() - created_at))::INTEGER),
    last_activity_at = NOW()
  WHERE id = request_id AND user_id = user_id
  RETURNING * INTO updated_request;

  -- Log the bump action with user-provided reason
  INSERT INTO verification_request_activities (
    request_id, admin_id, activity_type, old_value, new_value, notes, metadata
  ) VALUES (
    request_id,
    NULL, -- User action, not admin
    'user_bump',
    (updated_request.bump_count - 1)::TEXT,
    updated_request.bump_count::TEXT,
    COALESCE(bump_reason, 'Request bumped by user to increase priority'),
    jsonb_build_object(
      'user_id', user_id,
      'bump_count', updated_request.bump_count,
      'priority_score', updated_request.priority_score
    )
  );

  RETURN QUERY SELECT
    TRUE,
    'Request successfully bumped to top of queue',
    updated_request.bump_count,
    updated_request.priority_score;
END;
$$ LANGUAGE plpgsql;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_bump_enabled
  ON verification_requests(bump_enabled, status)
  WHERE bump_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_verification_requests_admin_locked
  ON verification_requests(admin_locked_at, processing_admin_id)
  WHERE admin_locked_at IS NOT NULL;

-- 7. Update existing requests to set appropriate bump eligibility
UPDATE verification_requests
SET
  bump_enabled = CASE
    WHEN status = 'Docs Under Review' THEN FALSE
    WHEN status = 'Approved' THEN FALSE
    ELSE TRUE
  END,
  bump_disabled_reason = CASE
    WHEN status = 'Docs Under Review' THEN 'Admin is currently reviewing your documents'
    WHEN status = 'Approved' THEN 'Verification completed successfully'
    ELSE NULL
  END,
  admin_locked_at = CASE
    WHEN status = 'Docs Under Review' THEN NOW()
    ELSE NULL
  END,
  admin_lock_reason = CASE
    WHEN status = 'Docs Under Review' THEN 'Document review in progress'
    ELSE NULL
  END
WHERE bump_enabled IS NULL; -- Only update new fields

-- 8. Update the admin queue view to include bump status and admin lock info
DROP VIEW IF EXISTS admin_verification_queue;
CREATE VIEW admin_verification_queue AS
SELECT
  vr.*,
  up.full_name,
  up.email,
  up.initial_company_name as company_name,
  CASE
    WHEN vr.priority_level = 'high' THEN '🔥 High Priority'
    WHEN vr.priority_level = 'medium' THEN '⚠️ Medium Priority'
    ELSE '📋 Normal'
  END as priority_display,
  CASE
    WHEN vr.bump_count > 0 THEN vr.bump_count || ' bump' || CASE WHEN vr.bump_count > 1 THEN 's' ELSE '' END
    ELSE 'No bumps'
  END as bump_display,
  CASE
    WHEN NOT vr.bump_enabled THEN '🔒 Bump Disabled'
    WHEN vr.admin_locked_at IS NOT NULL THEN '🔒 Admin Locked'
    ELSE '✅ Bump Available'
  END as bump_status,
  EXTRACT(DAYS FROM (NOW() - vr.created_at))::INTEGER as days_old,
  EXTRACT(HOURS FROM (NOW() - vr.last_bump_time))::INTEGER as hours_since_last_bump,
  (
    SELECT COUNT(*)
    FROM verification_request_activities vra
    WHERE vra.request_id = vr.id
  ) as activity_count,
  (
    SELECT vra.created_at
    FROM verification_request_activities vra
    WHERE vra.request_id = vr.id
    ORDER BY vra.created_at DESC
    LIMIT 1
  ) as last_activity,
  -- Check for potential duplicates
  (
    SELECT COUNT(*) - 1
    FROM verification_requests vr2
    WHERE vr2.user_id = vr.user_id
    AND vr2.request_type = vr.request_type
    AND vr2.id != vr.id
  ) as duplicate_count
FROM verification_requests vr
LEFT JOIN user_profiles up ON vr.user_id = up.id
WHERE vr.is_duplicate_of IS NULL -- Hide duplicate requests
ORDER BY
  vr.priority_score DESC,
  vr.created_at ASC;

-- 9. Add RLS policies for new fields
-- (Inherits from main table policies)

-- 10. Grant permissions for new functions
GRANT EXECUTE ON FUNCTION validate_bump_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_bump_request(UUID, UUID, TEXT) TO authenticated;

-- 11. Add comprehensive comments for documentation
COMMENT ON COLUMN verification_requests.admin_locked_at IS 'Timestamp when admin locked this request for processing (prevents user bumps)';
COMMENT ON COLUMN verification_requests.admin_lock_reason IS 'Reason why admin locked this request';
COMMENT ON COLUMN verification_requests.bump_enabled IS 'Whether user is allowed to bump this request';
COMMENT ON COLUMN verification_requests.bump_disabled_reason IS 'User-friendly explanation of why bumping is disabled';

COMMENT ON FUNCTION validate_bump_request(UUID, UUID) IS 'Validates if a user can bump their verification request based on business rules';
COMMENT ON FUNCTION execute_bump_request(UUID, UUID, TEXT) IS 'Safely executes a bump request with proper validation and logging';
COMMENT ON FUNCTION update_bump_eligibility() IS 'Automatically manages bump eligibility based on admin status changes';

-- Migration complete
SELECT 'Bump/Admin workflow enhancement migration completed successfully' as result;
