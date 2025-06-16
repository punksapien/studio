-- Fix all schema mismatches for chat system
-- This migration addresses:
-- 1. Missing avatar_url column in user_profiles
-- 2. API querying non-existent columns
-- 3. Ensure all necessary columns exist

-- Add avatar_url column to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to user_profiles table';
    ELSE
        RAISE NOTICE 'avatar_url column already exists in user_profiles table';
    END IF;
END $$;

-- Add initial_message column to inquiries if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inquiries'
        AND column_name = 'initial_message'
    ) THEN
        ALTER TABLE inquiries ADD COLUMN initial_message TEXT;
        RAISE NOTICE 'Added initial_message column to inquiries table';
    ELSE
        RAISE NOTICE 'initial_message column already exists in inquiries table';
    END IF;
END $$;

-- Add admin_notes column to inquiries if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inquiries'
        AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE inquiries ADD COLUMN admin_notes TEXT;
        RAISE NOTICE 'Added admin_notes column to inquiries table';
    ELSE
        RAISE NOTICE 'admin_notes column already exists in inquiries table';
    END IF;
END $$;

-- Add message_status column to messages if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name = 'message_status'
    ) THEN
        ALTER TABLE messages ADD COLUMN message_status VARCHAR(20) DEFAULT 'sent'
            CHECK (message_status IN ('sent', 'delivered', 'read'));

        -- Migrate existing is_read data to message_status
        UPDATE messages
        SET message_status = CASE
            WHEN is_read = true THEN 'read'
            ELSE 'sent'
        END;

        RAISE NOTICE 'Added message_status column to messages table';
    ELSE
        RAISE NOTICE 'message_status column already exists in messages table';
    END IF;
END $$;

-- Add is_system_message column to messages if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name = 'is_system_message'
    ) THEN
        ALTER TABLE messages ADD COLUMN is_system_message BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_system_message column to messages table';
    ELSE
        RAISE NOTICE 'is_system_message column already exists in messages table';
    END IF;
END $$;

-- Add last_message_at column to conversations if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversations'
        AND column_name = 'last_message_at'
    ) THEN
        ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE;

        -- Update existing conversations with their last message timestamp
        UPDATE conversations c
        SET last_message_at = (
            SELECT MAX(timestamp)
            FROM messages m
            WHERE m.conversation_id = c.id
        );

        RAISE NOTICE 'Added last_message_at column to conversations table';
    ELSE
        RAISE NOTICE 'last_message_at column already exists in conversations table';
    END IF;
END $$;

-- Create or replace the update_conversation_on_message function to handle last_message_at
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET
        updated_at = NOW(),
        last_message_at = NEW.timestamp,
        last_message_snippet = LEFT(NEW.content_text, 100),
        buyer_unread_count = CASE
            WHEN NEW.receiver_id = buyer_id THEN buyer_unread_count + 1
            ELSE buyer_unread_count
        END,
        seller_unread_count = CASE
            WHEN NEW.receiver_id = seller_id THEN seller_unread_count + 1
            ELSE seller_unread_count
        END
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_avatar_url ON user_profiles(avatar_url) WHERE avatar_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_message_status ON messages(message_status);
CREATE INDEX IF NOT EXISTS idx_messages_is_system_message ON messages(is_system_message);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Final status report
DO $$
DECLARE
    profile_count INTEGER;
    inquiry_count INTEGER;
    conversation_count INTEGER;
    message_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM user_profiles WHERE avatar_url IS NOT NULL;
    SELECT COUNT(*) INTO inquiry_count FROM inquiries WHERE initial_message IS NOT NULL;
    SELECT COUNT(*) INTO conversation_count FROM conversations WHERE last_message_at IS NOT NULL;
    SELECT COUNT(*) INTO message_count FROM messages WHERE message_status IS NOT NULL;

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'SCHEMA MISMATCH FIX MIGRATION COMPLETED!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'User profiles with avatar_url: %', profile_count;
    RAISE NOTICE 'Inquiries with initial_message: %', inquiry_count;
    RAISE NOTICE 'Conversations with last_message_at: %', conversation_count;
    RAISE NOTICE 'Messages with message_status: %', message_count;
    RAISE NOTICE '';
    RAISE NOTICE 'All schema mismatches have been resolved!';
    RAISE NOTICE '===========================================';
END $$;
