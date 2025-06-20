import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { AuthenticationService } from '@/lib/auth-service';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { contentText, attachmentUrl, attachmentType } = body;

    if (!contentText?.trim() && !attachmentUrl) {
      return NextResponse.json(
        { error: 'Message content or attachment is required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authService = new AuthenticationService();
    const authResult = await authService.authenticateUser(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required', type: 'unauthorized' },
        { status: 401 }
      );
    }

    // Verify conversation exists and user has permission
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select('id, buyer_id, seller_id, status')
      .eq('id', conversationId)
      .single();

    if (conversationError) {
      if (conversationError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to verify conversation' },
        { status: 500 }
      );
    }

    // Check if user is a participant or admin
    const isParticipant =
      conversation.buyer_id === authResult.user.id ||
      conversation.seller_id === authResult.user.id;

    const isAdmin = authResult.profile?.role === 'admin';

    if (!isParticipant && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to send messages in this conversation' },
        { status: 403 }
      );
    }

    // Determine receiver - for admins, we'll set both buyer and seller as potential receivers
    let receiverId;
    if (isAdmin) {
      // For admin messages, we'll use a special receiver_id that indicates it's an admin message
      // We'll use the buyer_id as the primary receiver, but the message will be visible to both
      receiverId = conversation.buyer_id;
    } else {
      receiverId = conversation.buyer_id === authResult.user.id
      ? conversation.seller_id
      : conversation.buyer_id;
    }

    // Create the message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: authResult.user.id,
        receiver_id: receiverId,
        content_text: contentText?.trim(),
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        message_status: 'delivered',
        timestamp: new Date().toISOString(),
        is_system_message: false
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        receiver_id,
        content_text,
        attachment_url,
        attachment_type,
        message_status,
        timestamp,
        is_system_message,
        created_at,
        sender_profile:user_profiles!sender_id (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Update conversation's updated_at timestamp
    await supabaseAdmin
      .from('conversations')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    // Format response
    const response = {
      message: {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        contentText: message.content_text,
        attachmentUrl: message.attachment_url,
        attachmentType: message.attachment_type,
        messageStatus: message.message_status,
        timestamp: message.timestamp,
        isSystemMessage: message.is_system_message,
        createdAt: message.created_at,
        senderProfile: message.sender_profile,
        isOwnMessage: true
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Send message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
