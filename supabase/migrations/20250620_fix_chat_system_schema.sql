-- Fix Chat System Schema Mismatches
-- Migration: 20250620_fix_chat_system_schema.sql
--
-- This migration fixes column mismatches between the database schema and API expectations
-- to ensure the chat system works properly across all user types (buyer, seller, admin)

-- ============================================================================
-- 1. FIX MESSAGES TABLE - Add missing columns for chat functionality
-- ============================================================================

-- Add message_status column to replace is_read for more granular status tracking
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS message_status VARCHAR(20) DEFAULT 'sent'
CHECK (message_status IN ('sent', 'delivered', 'read'));

-- Add is_system_message column for system-generated messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT false;

-- Add created_at column for consistent timestamp tracking
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Migrate existing is_read data to message_status
UPDATE messages
SET message_status = CASE
    WHEN is_read = true THEN 'read'
    ELSE 'delivered'
END
WHERE message_status IS NULL;

-- Create index for message_status for performance
CREATE INDEX IF NOT EXISTS idx_messages_message_status
ON messages(message_status);

-- Create index for system messages
CREATE INDEX IF NOT EXISTS idx_messages_is_system_message
ON messages(is_system_message)
WHERE is_system_message = true;

-- ============================================================================
-- 2. FIX INQUIRIES TABLE - Add message column as alias for initial_message
-- ============================================================================

-- Add message column that mirrors initial_message for backward compatibility
-- This ensures both column names work in queries
ALTER TABLE inquiries
ADD COLUMN IF NOT EXISTS message TEXT;

-- Copy existing initial_message data to message column
UPDATE inquiries
SET message = initial_message
WHERE message IS NULL AND initial_message IS NOT NULL;

-- Create a trigger to keep message and initial_message in sync
CREATE OR REPLACE FUNCTION sync_inquiry_message_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- When initial_message is updated, update message
    IF NEW.initial_message IS DISTINCT FROM OLD.initial_message THEN
        NEW.message := NEW.initial_message;
    END IF;

    -- When message is updated, update initial_message
    IF NEW.message IS DISTINCT FROM OLD.message THEN
        NEW.initial_message := NEW.message;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_inquiry_message_columns ON inquiries;

-- Create trigger for updates
CREATE TRIGGER trigger_sync_inquiry_message_columns
BEFORE UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION sync_inquiry_message_columns();

-- Create trigger for inserts to ensure both columns are populated
CREATE OR REPLACE FUNCTION ensure_inquiry_message_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- If only initial_message is provided, copy to message
    IF NEW.initial_message IS NOT NULL AND NEW.message IS NULL THEN
        NEW.message := NEW.initial_message;
    END IF;

    -- If only message is provided, copy to initial_message
    IF NEW.message IS NOT NULL AND NEW.initial_message IS NULL THEN
        NEW.initial_message := NEW.message;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_ensure_inquiry_message_columns ON inquiries;

-- Create trigger for inserts
CREATE TRIGGER trigger_ensure_inquiry_message_columns
BEFORE INSERT ON inquiries
FOR EACH ROW
EXECUTE FUNCTION ensure_inquiry_message_columns();

-- ============================================================================
-- 3. ADD MISSING COLUMNS TO CONVERSATIONS TABLE
-- ============================================================================

-- Add last_message_at column for better sorting and tracking
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;

-- Update last_message_at based on existing messages
UPDATE conversations c
SET last_message_at = (
    SELECT MAX(timestamp)
    FROM messages m
    WHERE m.conversation_id = c.id
)
WHERE last_message_at IS NULL;

-- Create index for last_message_at
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
ON conversations(last_message_at DESC NULLS LAST);

-- ============================================================================
-- 4. CREATE INITIAL SYSTEM MESSAGE WHEN CONVERSATION IS CREATED
-- ============================================================================

-- Function to create initial system message from inquiry
CREATE OR REPLACE FUNCTION create_initial_conversation_message()
RETURNS TRIGGER AS $$
DECLARE
    inquiry_record RECORD;
    buyer_name TEXT;
    seller_name TEXT;
BEGIN
    -- Only proceed for new conversations
    IF TG_OP = 'INSERT' AND NEW.inquiry_id IS NOT NULL THEN
        -- Get inquiry details
        SELECT i.*,
               b.full_name as buyer_name,
               s.full_name as seller_name
        INTO inquiry_record
        FROM inquiries i
        JOIN user_profiles b ON b.id = i.buyer_id
        JOIN user_profiles s ON s.id = i.seller_id
        WHERE i.id = NEW.inquiry_id;

        IF FOUND AND inquiry_record.initial_message IS NOT NULL THEN
            -- Insert the buyer's initial message as the first message
            INSERT INTO messages (
                conversation_id,
                sender_id,
                receiver_id,
                content_text,
                message_status,
                is_system_message,
                timestamp,
                created_at
            ) VALUES (
                NEW.id,
                inquiry_record.buyer_id,
                inquiry_record.seller_id,
                inquiry_record.initial_message,
                'delivered',
                false, -- This is the actual buyer's message, not a system message
                NOW(),
                NOW()
            );

            -- Update conversation's last_message_at
            NEW.last_message_at := NOW();

            -- Optionally, add a system message about the conversation being facilitated
            INSERT INTO messages (
                conversation_id,
                sender_id,
                receiver_id,
                content_text,
                message_status,
                is_system_message,
                timestamp,
                created_at
            ) VALUES (
                NEW.id,
                NEW.buyer_id, -- System message appears to come from buyer
                NEW.seller_id,
                format('Chat connection facilitated by admin. %s is interested in your listing.', inquiry_record.buyer_name),
                'delivered',
                true, -- This is a system message
                NOW() + INTERVAL '1 second', -- Slightly after the initial message
                NOW() + INTERVAL '1 second'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_initial_conversation_message ON conversations;

-- Create trigger for new conversations
CREATE TRIGGER trigger_create_initial_conversation_message
BEFORE INSERT ON conversations
FOR EACH ROW
EXECUTE FUNCTION create_initial_conversation_message();

-- ============================================================================
-- 5. UPDATE EXISTING CONVERSATIONS TO HAVE INITIAL MESSAGES
-- ============================================================================

-- For existing conversations without messages, create initial messages from inquiries
INSERT INTO messages (
    conversation_id,
    sender_id,
    receiver_id,
    content_text,
    message_status,
    is_system_message,
    timestamp,
    created_at
)
SELECT
    c.id,
    i.buyer_id,
    i.seller_id,
    COALESCE(i.initial_message, 'Hi, I am interested in your listing.'),
    'delivered',
    false,
    c.created_at,
    c.created_at
FROM conversations c
JOIN inquiries i ON i.id = c.inquiry_id
WHERE NOT EXISTS (
    SELECT 1 FROM messages m WHERE m.conversation_id = c.id
)
AND i.initial_message IS NOT NULL;

-- ============================================================================
-- 6. ADD HELPFUL COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN messages.message_status IS 'Message delivery status: sent (just created), delivered (received by server), read (viewed by recipient)';
COMMENT ON COLUMN messages.is_system_message IS 'Whether this is a system-generated message (e.g., "Chat facilitated by admin")';
COMMENT ON COLUMN inquiries.message IS 'Alias for initial_message - both columns are kept in sync for backward compatibility';
COMMENT ON COLUMN conversations.last_message_at IS 'Timestamp of the most recent message in this conversation';

-- ============================================================================
-- 7. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Ensure authenticated users can read the new columns
GRANT SELECT ON messages TO authenticated;
GRANT SELECT ON inquiries TO authenticated;
GRANT SELECT ON conversations TO authenticated;

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Log migration results
DO $$
DECLARE
    message_count INTEGER;
    inquiry_count INTEGER;
    conversation_count INTEGER;
BEGIN
    -- Count records updated
    SELECT COUNT(*) INTO message_count FROM messages WHERE message_status IS NOT NULL;
    SELECT COUNT(*) INTO inquiry_count FROM inquiries WHERE message IS NOT NULL;
    SELECT COUNT(*) INTO conversation_count FROM conversations WHERE last_message_at IS NOT NULL;

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'CHAT SYSTEM SCHEMA FIX MIGRATION COMPLETED!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Messages updated with status: %', message_count;
    RAISE NOTICE 'Inquiries with message column: %', inquiry_count;
    RAISE NOTICE 'Conversations with last_message_at: %', conversation_count;
    RAISE NOTICE '';
    RAISE NOTICE 'The chat system should now work properly!';
    RAISE NOTICE '===========================================';
END $$;
