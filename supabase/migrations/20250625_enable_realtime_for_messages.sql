-- Enable real-time for messages table
-- Migration: 20250625_enable_realtime_for_messages.sql

-- Enable real-time replication for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Ensure the messages table can be subscribed to for real-time
-- This is important for Supabase real-time subscriptions to work properly

-- Grant real-time permissions
GRANT SELECT ON messages TO authenticated;
GRANT SELECT ON messages TO anon;

-- Create a real-time policy that allows users to see messages in their conversations
-- This is specifically for real-time subscriptions
CREATE POLICY "Real-time messages for conversation participants" ON messages
    FOR SELECT USING (
        auth.uid() IN (
            SELECT UNNEST(ARRAY[buyer_id, seller_id])
            FROM conversations
            WHERE conversations.id = messages.conversation_id
        )
    );

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Real-time enabled for messages table with proper RLS policies';
END $$;
