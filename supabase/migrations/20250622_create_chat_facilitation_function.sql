-- Migration: Create atomic chat facilitation function
-- This function handles the complete chat facilitation process in a single atomic transaction
-- to prevent foreign key constraint violations and ensure data consistency

-- Drop function if it exists
DROP FUNCTION IF EXISTS facilitate_chat_connection(UUID, UUID, TEXT);

-- Create the atomic chat facilitation function
CREATE OR REPLACE FUNCTION facilitate_chat_connection(
    p_inquiry_id UUID,
    p_admin_id UUID,
    p_admin_note TEXT DEFAULT ''
)
RETURNS TABLE(
    conversation_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_inquiry_record RECORD;
    v_conversation_id UUID;
    v_message_id UUID;
BEGIN
    -- Start transaction (implicit in function)

    -- 1. Fetch and validate inquiry
    SELECT i.*,
           b.full_name as buyer_name,
           s.full_name as seller_name,
           b.verification_status as buyer_verification,
           s.verification_status as seller_verification
    INTO v_inquiry_record
    FROM inquiries i
    JOIN user_profiles b ON b.id = i.buyer_id
    JOIN user_profiles s ON s.id = i.seller_id
    WHERE i.id = p_inquiry_id;

    -- Check if inquiry exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Inquiry not found'::TEXT;
        RETURN;
    END IF;

    -- Check if inquiry is ready for facilitation
    IF v_inquiry_record.status != 'ready_for_admin_connection' THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, format('Inquiry status is %s, not ready for facilitation', v_inquiry_record.status)::TEXT;
        RETURN;
    END IF;

    -- Check if both parties are verified
    IF v_inquiry_record.buyer_verification != 'verified' OR v_inquiry_record.seller_verification != 'verified' THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Both buyer and seller must be verified'::TEXT;
        RETURN;
    END IF;

    -- Check if conversation already exists
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE inquiry_id = p_inquiry_id;

    IF FOUND THEN
        RETURN QUERY SELECT v_conversation_id, TRUE, 'Conversation already exists'::TEXT;
        RETURN;
    END IF;

    -- 2. Create conversation record
    INSERT INTO conversations (
        inquiry_id,
        listing_id,
        buyer_id,
        seller_id,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_inquiry_record.id,
        v_inquiry_record.listing_id,
        v_inquiry_record.buyer_id,
        v_inquiry_record.seller_id,
        'ACTIVE',
        NOW(),
        NOW()
    ) RETURNING id INTO v_conversation_id;

    -- 3. Update inquiry status and link to conversation
    UPDATE inquiries
    SET
        status = 'connection_facilitated_in_app_chat_opened',
        conversation_id = v_conversation_id,
        updated_at = NOW()
    WHERE id = p_inquiry_id;

    -- 4. Create initial message if buyer provided one
    IF v_inquiry_record.initial_message IS NOT NULL AND v_inquiry_record.initial_message != '' THEN
        INSERT INTO messages (
            conversation_id,
            sender_id,
            receiver_id,
            content_text,
            message_status,
            is_system_message,
            timestamp
        ) VALUES (
            v_conversation_id,
            v_inquiry_record.buyer_id,
            v_inquiry_record.seller_id,
            v_inquiry_record.initial_message,
            'delivered',
            false,
            NOW()
        ) RETURNING id INTO v_message_id;
    END IF;

    -- 5. Create system message about facilitation
    INSERT INTO messages (
        conversation_id,
        sender_id,
        receiver_id,
        content_text,
        message_status,
        is_system_message,
        timestamp
    ) VALUES (
        v_conversation_id,
        v_inquiry_record.buyer_id, -- System message appears to come from buyer
        v_inquiry_record.seller_id,
        format('Chat connection facilitated by admin. %s is interested in your listing.', v_inquiry_record.buyer_name),
        'delivered',
        true,
        NOW() + INTERVAL '1 second' -- Slightly after initial message
    );

    -- 6. Create admin action log
    INSERT INTO admin_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        details,
        timestamp
    ) VALUES (
        p_admin_id,
        'chat_facilitation',
        'inquiry',
        p_inquiry_id,
        jsonb_build_object(
            'conversation_id', v_conversation_id,
            'buyer_id', v_inquiry_record.buyer_id,
            'seller_id', v_inquiry_record.seller_id,
            'listing_id', v_inquiry_record.listing_id,
            'admin_note', p_admin_note,
            'buyer_name', v_inquiry_record.buyer_name,
            'seller_name', v_inquiry_record.seller_name
        ),
        NOW()
    );

    -- 7. Create notifications for both parties
    INSERT INTO notifications (user_id, type, message, link, created_at) VALUES
    (v_inquiry_record.buyer_id, 'system',
     format('Great news! Our admin team has facilitated your connection with %s. You can now chat directly.', v_inquiry_record.seller_name),
     format('/dashboard/messages/%s', v_conversation_id), NOW()),
    (v_inquiry_record.seller_id, 'system',
     format('A buyer (%s) is interested in your listing. Chat connection has been facilitated by our admin team.', v_inquiry_record.buyer_name),
     format('/seller-dashboard/messages/%s', v_conversation_id), NOW());

    -- Return success result
    RETURN QUERY SELECT v_conversation_id, TRUE, format('Chat facilitated between %s and %s', v_inquiry_record.buyer_name, v_inquiry_record.seller_name)::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and return failure
        RAISE NOTICE 'Error in facilitate_chat_connection: %', SQLERRM;
        RETURN QUERY SELECT NULL::UUID, FALSE, format('Error: %s', SQLERRM)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admin check is done in API)
GRANT EXECUTE ON FUNCTION facilitate_chat_connection(UUID, UUID, TEXT) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION facilitate_chat_connection(UUID, UUID, TEXT) IS
'Atomically facilitates chat connection between buyer and seller. Creates conversation, updates inquiry status, creates initial messages, logs admin action, and sends notifications. Used by admin chat facilitation API.';

-- Create index for better performance on conversations.inquiry_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_conversations_inquiry_id_unique ON conversations(inquiry_id);

-- Ensure admin_actions table exists (it might not in all environments)
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE, -- Allow NULL for system actions
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for admin_actions if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_timestamp ON admin_actions(timestamp DESC);

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Created facilitate_chat_connection function with atomic transaction handling';
END $$;
