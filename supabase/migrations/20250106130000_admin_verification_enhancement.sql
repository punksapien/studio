-- Admin Verification UX Enhancement Migration
-- Adds activity logging, enhanced notes, and duplicate tracking

-- 1. Create verification request activities table for complete audit trail
CREATE TABLE IF NOT EXISTS verification_request_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'status_change', 'note_added', 'priority_changed', 'bump', 'created'
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}', -- Additional context data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add enhanced columns to verification_requests table (only new ones)
ALTER TABLE verification_requests
ADD COLUMN IF NOT EXISTS user_notes TEXT, -- Store user's original request notes
ADD COLUMN IF NOT EXISTS is_duplicate_of UUID REFERENCES verification_requests(id),
ADD COLUMN IF NOT EXISTS processing_admin_id UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'normal', -- 'normal', 'medium', 'high'
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_activities_request_id
ON verification_request_activities(request_id);

CREATE INDEX IF NOT EXISTS idx_verification_activities_admin_id
ON verification_request_activities(admin_id);

CREATE INDEX IF NOT EXISTS idx_verification_activities_type
ON verification_request_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_verification_activities_created
ON verification_request_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_requests_duplicate
ON verification_requests(is_duplicate_of)
WHERE is_duplicate_of IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_verification_requests_priority_level
ON verification_requests(priority_level, priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_verification_requests_admin
ON verification_requests(processing_admin_id)
WHERE processing_admin_id IS NOT NULL;

-- 4. Create function to automatically log activities
CREATE OR REPLACE FUNCTION log_verification_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO verification_request_activities (
      request_id, admin_id, activity_type, old_value, new_value, notes
    ) VALUES (
      NEW.id,
      NEW.processing_admin_id,
      'status_change',
      OLD.status,
      NEW.status,
      CASE
        WHEN NEW.status = 'Approved' THEN 'Request approved by admin'
        WHEN NEW.status = 'Rejected' THEN 'Request rejected by admin'
        WHEN NEW.status = 'Contacted' THEN 'Admin contacted user'
        ELSE 'Status updated by admin'
      END
    );
  END IF;

  -- Log priority changes
  IF TG_OP = 'UPDATE' AND OLD.priority_score IS DISTINCT FROM NEW.priority_score THEN
    INSERT INTO verification_request_activities (
      request_id, admin_id, activity_type, old_value, new_value, notes
    ) VALUES (
      NEW.id,
      NEW.processing_admin_id,
      'priority_changed',
      OLD.priority_score::TEXT,
      NEW.priority_score::TEXT,
      'Priority score updated'
    );
  END IF;

  -- Log bump actions
  IF TG_OP = 'UPDATE' AND OLD.bump_count IS DISTINCT FROM NEW.bump_count THEN
    INSERT INTO verification_request_activities (
      request_id, admin_id, activity_type, old_value, new_value, notes
    ) VALUES (
      NEW.id,
      NULL, -- User action, not admin
      'bump',
      OLD.bump_count::TEXT,
      NEW.bump_count::TEXT,
      'Request bumped to top of queue by user'
    );
  END IF;

  -- Update last activity timestamp
  NEW.last_activity_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for automatic activity logging
DROP TRIGGER IF EXISTS verification_activity_logger ON verification_requests;
CREATE TRIGGER verification_activity_logger
  BEFORE UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_verification_activity();

-- 6. Create function to calculate priority level automatically
CREATE OR REPLACE FUNCTION update_priority_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate priority level based on bump count and days since submission
  NEW.priority_level = CASE
    WHEN NEW.bump_count >= 3 OR EXTRACT(DAYS FROM (NOW() - NEW.created_at)) > 7 THEN 'high'
    WHEN NEW.bump_count >= 1 OR EXTRACT(DAYS FROM (NOW() - NEW.created_at)) > 3 THEN 'medium'
    ELSE 'normal'
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for automatic priority level calculation
DROP TRIGGER IF EXISTS priority_level_updater ON verification_requests;
CREATE TRIGGER priority_level_updater
  BEFORE INSERT OR UPDATE OF bump_count ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_priority_level();

-- 8. Populate user_notes for existing requests from reason field
UPDATE verification_requests
SET user_notes = reason
WHERE user_notes IS NULL AND reason IS NOT NULL;

-- 9. Create initial activity records for existing requests
INSERT INTO verification_request_activities (
  request_id, activity_type, notes, created_at
)
SELECT
  id,
  'created',
  'Request initially created',
  created_at
FROM verification_requests
WHERE NOT EXISTS (
  SELECT 1 FROM verification_request_activities
  WHERE request_id = verification_requests.id
);

-- 10. Create view for admin request overview with priority indicators
CREATE OR REPLACE VIEW admin_verification_queue AS
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
  EXTRACT(DAYS FROM (NOW() - vr.created_at))::INTEGER as days_old,
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

-- 11. Add RLS policies for security
ALTER TABLE verification_request_activities ENABLE ROW LEVEL SECURITY;

-- Admin users can see all activity
CREATE POLICY admin_verification_activities_policy ON verification_request_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- 12. Grant permissions
GRANT ALL ON verification_request_activities TO authenticated;
GRANT ALL ON admin_verification_queue TO authenticated;

-- 13. Add comments for documentation
COMMENT ON TABLE verification_request_activities IS 'Complete audit trail of all verification request activities';
COMMENT ON COLUMN verification_requests.user_notes IS 'Original notes submitted by user with their request';
COMMENT ON COLUMN verification_requests.is_duplicate_of IS 'References original request if this is a duplicate';
COMMENT ON COLUMN verification_requests.priority_level IS 'Auto-calculated priority level: normal, medium, high';
COMMENT ON VIEW admin_verification_queue IS 'Enhanced admin view with priority indicators and duplicate detection';
