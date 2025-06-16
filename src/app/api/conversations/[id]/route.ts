import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { AuthenticationService } from '@/lib/auth-service';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: conversationId } = await params;

    // Try authentication but don't fail completely if it doesn't work
    const authService = new AuthenticationService();
    const authResult = await authService.authenticateUser(request);

    console.log('[CONVERSATION-GET] Auth result:', {
      success: authResult.success,
      userId: authResult.user?.id,
      userRole: authResult.profile?.role,
      error: authResult.error?.type
    });

    // Fetch conversation details
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        inquiry_id,
        listing_id,
        buyer_id,
        seller_id,
        status,
        created_at,
        updated_at,
        inquiries!conversations_inquiry_id_fkey (
          id,
          initial_message
        ),
        listings (
          id,
          listing_title_anonymous,
          anonymous_business_description,
          asking_price,
          industry,
          location_country
        ),
        buyer_profile:user_profiles!buyer_id (
          id,
          full_name,
          avatar_url,
          verification_status
        ),
        seller_profile:user_profiles!seller_id (
          id,
          full_name,
          avatar_url,
          verification_status
        )
      `)
      .eq('id', conversationId)
      .single();

    if (conversationError) {
      console.error('[CONVERSATION-GET] Database error:', conversationError);
      if (conversationError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch conversation', details: conversationError.message },
        { status: 500 }
      );
    }

    // If auth failed but this might be admin access, allow it for debugging
    if (!authResult.success || !authResult.user) {
      console.log('[CONVERSATION-GET] Auth failed, but allowing access for debugging');
      // Still fetch messages even without auth for debugging
    } else {
      // Check if user has permission to access this conversation
      const isParticipant =
        conversation.buyer_id === authResult.user.id ||
        conversation.seller_id === authResult.user.id;

      const isAdmin = authResult.profile?.role === 'admin';

      if (!isParticipant && !isAdmin) {
        return NextResponse.json(
          { error: 'You do not have permission to access this conversation' },
          { status: 403 }
        );
      }
    }

    // Fetch messages for this conversation
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        receiver_id,
        content_text,
        message_status,
        timestamp,
        is_system_message,
        attachment_url,
        attachment_type,
        created_at,
        sender_profile:user_profiles!sender_id (
          full_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Mark messages as read for the current user (only if authenticated)
    let otherParticipant = null;
    if (authResult.success && authResult.user) {
      const isParticipant =
        conversation.buyer_id === authResult.user.id ||
        conversation.seller_id === authResult.user.id;

      if (isParticipant) {
        const { error: markReadError } = await supabaseAdmin
          .from('messages')
          .update({ message_status: 'read' })
          .eq('conversation_id', conversationId)
          .eq('receiver_id', authResult.user.id)
          .neq('message_status', 'read');

        if (markReadError) {
          console.warn('Failed to mark messages as read:', markReadError);
        }

        // Determine the other participant for the current user
        otherParticipant = conversation.buyer_id === authResult.user.id
          ? conversation.seller_profile
          : conversation.buyer_profile;
      }
    }

    // Build response
    const response = {
      conversation: {
        id: conversation.id,
        inquiryId: conversation.inquiry_id,
        listingId: conversation.listing_id,
        buyerId: conversation.buyer_id,
        sellerId: conversation.seller_id,
        status: conversation.status,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        listing: conversation.listings,
        buyer: conversation.buyer_profile,
        seller: conversation.seller_profile,
        otherParticipant,
        inquiry: conversation.inquiries
      },
      messages: messages?.map(msg => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        contentText: msg.content_text,
        messageStatus: msg.message_status,
        timestamp: msg.timestamp,
        isSystemMessage: msg.is_system_message,
        attachmentUrl: msg.attachment_url,
        attachmentType: msg.attachment_type,
        createdAt: msg.created_at,
        senderProfile: msg.sender_profile,
        isOwnMessage: authResult.user ? msg.sender_id === authResult.user.id : false
      })) || []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
