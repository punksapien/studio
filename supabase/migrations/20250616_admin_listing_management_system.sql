-- Admin Listing Management System Migration
-- Migration: 20250615_admin_listing_management_system.sql
-- Purpose: Extend existing listing system with admin management, audit trail, and appeal foundation

-- ============================================================================
-- PHASE 1: Extend Listing Status Enum (Graceful Extension)
-- ============================================================================

-- First, add new status values to the existing enum
-- This extends the current enum: 'active', 'inactive', 'pending_verification', 'verified_anonymous', 'verified_public', 'rejected_by_admin', 'closed_deal'
-- Adding: 'draft', 'pending_approval', 'under_review', 'appealing_rejection'

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;

ALTER TABLE listings ADD CONSTRAINT listings_status_check
    CHECK (status IN (
        'active',
        'inactive',
        'pending_verification',
        'verified_anonymous',
        'verified_public',
        'rejected_by_admin',
        'closed_deal',
        -- New workflow states
        'draft',                -- Seller is still editing, not submitted
        'pending_approval',     -- Submitted and waiting for admin review
        'under_review',         -- Admin is actively reviewing
        'appealing_rejection'   -- Seller has appealed a rejection
    ));

-- Add admin-specific fields to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS admin_action_by UUID REFERENCES user_profiles(id);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS admin_action_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rejection_category VARCHAR(50);

-- Add index for admin queries
CREATE INDEX IF NOT EXISTS idx_listings_admin_action_by ON listings(admin_action_by);
CREATE INDEX IF NOT EXISTS idx_listings_rejection_category ON listings(rejection_category);

-- ============================================================================
-- PHASE 2: Admin Actions Audit Table (Comprehensive Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_listing_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Action details
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'approved',
        'rejected',
        'status_changed',
        'appeal_reviewed',
        'notes_updated',
        'bulk_action'
    )),

    -- Status tracking
    previous_status VARCHAR(30),
    new_status VARCHAR(30),

    -- Categorized reasons for better UX
    reason_category VARCHAR(50) CHECK (reason_category IN (
        'quality',          -- Poor quality content/images
        'compliance',       -- Doesn't meet platform standards
        'incomplete',       -- Missing required information
        'fraud',           -- Suspected fraudulent listing
        'duplicate',       -- Duplicate of existing listing
        'inappropriate',   -- Inappropriate content
        'other'           -- Other reason (requires admin_notes)
    )),

    -- Detailed notes
    admin_notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure we have either a category or notes for rejections
    CONSTRAINT rejection_requires_reason CHECK (
        action_type != 'rejected' OR
        (reason_category IS NOT NULL OR admin_notes IS NOT NULL)
    )
);

-- Indexes for admin actions audit
CREATE INDEX idx_admin_listing_actions_listing_id ON admin_listing_actions(listing_id);
CREATE INDEX idx_admin_listing_actions_admin_user_id ON admin_listing_actions(admin_user_id);
CREATE INDEX idx_admin_listing_actions_action_type ON admin_listing_actions(action_type);
CREATE INDEX idx_admin_listing_actions_created_at ON admin_listing_actions(created_at DESC);
CREATE INDEX idx_admin_listing_actions_reason_category ON admin_listing_actions(reason_category);

-- ============================================================================
-- PHASE 3: Appeal System Foundation (Future-Proof Design)
-- ============================================================================

CREATE TABLE IF NOT EXISTS listing_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Appeal details
    original_rejection_reason TEXT,
    original_rejection_category VARCHAR(50),
    appeal_message TEXT NOT NULL,

    -- Appeal status
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending',          -- Submitted, waiting for admin review
        'under_review',     -- Admin is reviewing the appeal
        'approved',         -- Appeal approved, listing reinstated
        'denied',          -- Appeal denied, listing remains rejected
        'withdrawn'        -- Seller withdrew the appeal
    )),

    -- Admin response
    admin_response TEXT,
    reviewed_by UUID REFERENCES user_profiles(id),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,

    -- Business rules
    UNIQUE(listing_id, seller_id), -- One appeal per listing per seller

    -- Ensure admin response exists for completed appeals
    CONSTRAINT completed_appeal_has_response CHECK (
        status IN ('pending', 'under_review', 'withdrawn') OR
        (admin_response IS NOT NULL AND reviewed_by IS NOT NULL)
    )
);

-- Indexes for appeals
CREATE INDEX idx_listing_appeals_listing_id ON listing_appeals(listing_id);
CREATE INDEX idx_listing_appeals_seller_id ON listing_appeals(seller_id);
CREATE INDEX idx_listing_appeals_status ON listing_appeals(status);
CREATE INDEX idx_listing_appeals_reviewed_by ON listing_appeals(reviewed_by);
CREATE INDEX idx_listing_appeals_created_at ON listing_appeals(created_at DESC);

-- ============================================================================
-- PHASE 4: Automated Audit Trail Trigger (Graceful Tracking)
-- ============================================================================

-- Function to automatically log admin actions when listing status changes
CREATE OR REPLACE FUNCTION log_admin_listing_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed and it's an admin action
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.admin_action_by IS NOT NULL THEN
        INSERT INTO admin_listing_actions (
            listing_id,
            admin_user_id,
            action_type,
            previous_status,
            new_status,
            reason_category,
            admin_notes
        ) VALUES (
            NEW.id,
            NEW.admin_action_by,
            CASE
                WHEN NEW.status = 'verified_anonymous' OR NEW.status = 'verified_public' OR NEW.status = 'active' THEN 'approved'
                WHEN NEW.status = 'rejected_by_admin' THEN 'rejected'
                ELSE 'status_changed'
            END,
            OLD.status,
            NEW.status,
            NEW.rejection_category,
            NEW.admin_notes
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic audit logging
DROP TRIGGER IF EXISTS trigger_log_admin_listing_action ON listings;
CREATE TRIGGER trigger_log_admin_listing_action
    AFTER UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_listing_action();

-- ============================================================================
-- PHASE 5: Helper Functions for Admin Operations (Clean API)
-- ============================================================================

-- Function to get listing with admin context
CREATE OR REPLACE FUNCTION get_listing_with_admin_context(listing_uuid UUID)
RETURNS TABLE (
    listing_data JSONB,
    seller_info JSONB,
    admin_history JSONB,
    appeal_info JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Listing data
        to_jsonb(l.*) as listing_data,

        -- Seller info
        jsonb_build_object(
            'id', up.id,
            'full_name', up.full_name,
            'email', up.email,
            'verification_status', up.verification_status,
            'is_paid', up.is_paid,
            'created_at', up.created_at
        ) as seller_info,

        -- Admin action history
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', ala.id,
                    'action_type', ala.action_type,
                    'previous_status', ala.previous_status,
                    'new_status', ala.new_status,
                    'reason_category', ala.reason_category,
                    'admin_notes', ala.admin_notes,
                    'admin_name', admin_up.full_name,
                    'created_at', ala.created_at
                ) ORDER BY ala.created_at DESC
            )
            FROM admin_listing_actions ala
            LEFT JOIN user_profiles admin_up ON ala.admin_user_id = admin_up.id
            WHERE ala.listing_id = listing_uuid),
            '[]'::jsonb
        ) as admin_history,

        -- Appeal info
        COALESCE(
            (SELECT to_jsonb(la.*)
            FROM listing_appeals la
            WHERE la.listing_id = listing_uuid),
            '{}'::jsonb
        ) as appeal_info

    FROM listings l
    LEFT JOIN user_profiles up ON l.seller_id = up.id
    WHERE l.id = listing_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 6: Data Migration (Graceful Defaults)
-- ============================================================================

-- Set default status for existing listings that might be NULL
UPDATE listings
SET status = 'active'
WHERE status IS NULL;

-- Add helpful comments for future developers
COMMENT ON TABLE admin_listing_actions IS 'Comprehensive audit trail for all admin actions on listings';
COMMENT ON TABLE listing_appeals IS 'Appeal system for rejected listings - enables seller advocacy';
COMMENT ON COLUMN listings.rejection_category IS 'Categorized rejection reason for better seller UX';
COMMENT ON COLUMN listings.admin_notes IS 'Admin notes for internal tracking and seller communication';

-- ============================================================================
-- PHASE 7: Performance Optimization
-- ============================================================================

-- Composite indexes for common admin queries
CREATE INDEX IF NOT EXISTS idx_listings_status_created_at ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_admin_review ON listings(status, admin_action_at DESC)
    WHERE status IN ('pending_approval', 'under_review', 'appealing_rejection');

-- Index for appeal dashboard queries
CREATE INDEX IF NOT EXISTS idx_appeals_pending_review ON listing_appeals(status, created_at DESC)
    WHERE status IN ('pending', 'under_review');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log successful migration
INSERT INTO user_events (user_id, event_type, event_data, created_at)
SELECT
    (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    'system_migration',
    jsonb_build_object(
        'migration', '20250615_admin_listing_management_system',
        'description', 'Admin listing management system with audit trail and appeal foundation',
        'tables_created', ARRAY['admin_listing_actions', 'listing_appeals'],
        'status_enum_extended', true,
        'triggers_created', ARRAY['trigger_log_admin_listing_action'],
        'functions_created', ARRAY['log_admin_listing_action', 'get_listing_with_admin_context']
    ),
    NOW()
WHERE EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin');
