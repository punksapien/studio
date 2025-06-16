-- Migration: Fix conversation trigger conflicts
-- This migration disables the problematic trigger that creates messages automatically
-- and conflicts with our new atomic chat facilitation function

-- Disable the trigger that automatically creates initial messages
-- This trigger was causing foreign key constraint violations
DROP TRIGGER IF EXISTS trigger_create_initial_conversation_message ON conversations;

-- Also drop the function since we're handling message creation in our RPC function
DROP FUNCTION IF EXISTS create_initial_conversation_message();

-- Update the conversation message update trigger to handle the new schema properly
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET
        updated_at = NOW(),
        last_message_at = NEW.timestamp,
        last_message_snippet = LEFT(NEW.content_text, 100),
        buyer_unread_count = CASE
            WHEN NEW.receiver_id = buyer_id AND NEW.sender_id != buyer_id THEN buyer_unread_count + 1
            ELSE buyer_unread_count
        END,
        seller_unread_count = CASE
            WHEN NEW.receiver_id = seller_id AND NEW.sender_id != seller_id THEN seller_unread_count + 1
            ELSE seller_unread_count
        END
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the message update trigger exists and works correctly
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Add function to mark messages as read when accessed
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update unread messages to read status
    UPDATE messages
    SET message_status = 'read'
    WHERE conversation_id = p_conversation_id
      AND receiver_id = p_user_id
      AND message_status != 'read';

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    -- Reset unread count for this user in the conversation
    UPDATE conversations
    SET
        buyer_unread_count = CASE
            WHEN buyer_id = p_user_id THEN 0
            ELSE buyer_unread_count
        END,
        seller_unread_count = CASE
            WHEN seller_id = p_user_id THEN 0
            ELSE seller_unread_count
        END,
        updated_at = NOW()
    WHERE id = p_conversation_id;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Disabled conflicting conversation trigger and updated message handling functions';
END $$;
