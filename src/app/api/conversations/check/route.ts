import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationService } from '@/lib/auth-service';

interface ConversationCheckRequest {
  listing_id: string;
  buyer_id: string;
  // seller_id: string; // Removed - will be looked up from listing
}

interface ConversationCheckResponse {
  exists: boolean;
  conversationId?: string;
  status?: 'pending_approval' | 'approved' | 'rejected';
  facilitated?: boolean;
  canSendMessages?: boolean;
  inquiry_id?: string;
  created_at?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[CONVERSATION-CHECK] Starting conversation status check...');

    // Authentication using the standard AuthenticationService pattern
    const authService = AuthenticationService.getInstance();
    const authResult = await authService.authenticateUser(request);

    if (!authResult.success || !authResult.user || !authResult.profile) {
      console.log('[CONVERSATION-CHECK] Authentication failed:', authResult.error);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: ConversationCheckRequest = await request.json();
    console.log('[CONVERSATION-CHECK] Received request body:', JSON.stringify(body, null, 2));

    const { listing_id, buyer_id } = body;
    console.log('[CONVERSATION-CHECK] Extracted fields:', { listing_id, buyer_id });

    // Input validation
    if (!listing_id || !buyer_id) {
      console.log('[CONVERSATION-CHECK] Validation failed - missing fields:', {
        listing_id: !!listing_id,
        buyer_id: !!buyer_id
      });
      return NextResponse.json(
        { error: 'Missing required fields: listing_id, buyer_id' },
        { status: 400 }
      );
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(listing_id) || !uuidRegex.test(buyer_id)) {
      console.log('[CONVERSATION-CHECK] UUID validation failed:', {
        listing_id: uuidRegex.test(listing_id),
        buyer_id: uuidRegex.test(buyer_id)
      });
      return NextResponse.json(
        { error: 'Invalid UUID format' },
        { status: 400 }
      );
    }

    // Authorization: Only the buyer involved can check this conversation
    if (authResult.user.id !== buyer_id) {
      console.log(`[CONVERSATION-CHECK] Authorization failed: User ${authResult.user.id} trying to check conversation for buyer ${buyer_id}`);
      return NextResponse.json(
        { error: 'Unauthorized: You can only check your own conversations' },
        { status: 403 }
      );
    }

    // Create Supabase service client with admin privileges
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Step 1: Get seller_id from listing (SECURITY: Don't trust client-provided seller_id)
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select('seller_id, listing_title_anonymous, status')
      .eq('id', listing_id)
      .single();

    if (listingError) {
      console.error('[CONVERSATION-CHECK] Error fetching listing:', listingError);
      return NextResponse.json(
        { error: 'Listing not found or database error' },
        { status: 404 }
      );
    }

    if (!listingData) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    const seller_id = listingData.seller_id;
    console.log(`[CONVERSATION-CHECK] Found listing ${listing_id} with seller ${seller_id}`);

    // Prevent self-conversation
    if (buyer_id === seller_id) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      );
    }

    console.log(`[CONVERSATION-CHECK] Checking conversation for listing ${listing_id}, buyer ${buyer_id}, seller ${seller_id}`);

    // Step 2: Check for existing inquiry first (this is the starting point)
    const { data: existingInquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('id, status, created_at, conversation_id')
      .eq('listing_id', listing_id)
      .eq('buyer_id', buyer_id)
      .eq('seller_id', seller_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (inquiryError) {
      console.error('[CONVERSATION-CHECK] Database error checking inquiries:', inquiryError);
      return NextResponse.json(
        { error: 'Database error while checking inquiries' },
        { status: 500 }
      );
    }

    // If no inquiry exists, no conversation can exist
    if (!existingInquiry || existingInquiry.length === 0) {
      console.log(`[CONVERSATION-CHECK] No existing inquiry found`);
      const response: ConversationCheckResponse = {
        exists: false,
      };
      return NextResponse.json(response);
    }

    const inquiry = existingInquiry[0];
    console.log(`[CONVERSATION-CHECK] Found existing inquiry: ${inquiry.id}, status: ${inquiry.status}, conversation_id: ${inquiry.conversation_id}`);

    // Step 3: Check if inquiry has been facilitated into a conversation
    if (inquiry.conversation_id) {
      // Inquiry has been facilitated - get conversation details
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('id, status, facilitated, can_send_messages, created_at')
        .eq('id', inquiry.conversation_id)
        .single();

      if (conversationError) {
        console.error('[CONVERSATION-CHECK] Database error fetching conversation:', conversationError);
        return NextResponse.json(
          { error: 'Database error while checking conversation' },
          { status: 500 }
        );
      }

      if (conversation) {
        console.log(`[CONVERSATION-CHECK] Found facilitated conversation: ${conversation.id}, status: ${conversation.status}`);

        const response: ConversationCheckResponse = {
          exists: true,
          conversationId: conversation.id,
          status: conversation.status as 'pending_approval' | 'approved' | 'rejected',
          facilitated: conversation.facilitated || true, // If conversation exists, it's facilitated
          canSendMessages: conversation.can_send_messages || true,
          inquiry_id: inquiry.id,
          created_at: conversation.created_at,
        };

        return NextResponse.json(response);
      }
    }

    // Step 4: Inquiry exists but not yet facilitated into conversation
    // Map inquiry status to conversation status for UI purposes
    let conversationStatus: 'pending_approval' | 'approved' | 'rejected';
    switch (inquiry.status) {
      case 'new_inquiry':
      case 'seller_engaged_buyer_pending_verification':
      case 'seller_engaged_seller_pending_verification':
      case 'ready_for_admin_connection':
        conversationStatus = 'pending_approval';
        break;
      case 'connection_facilitated_in_app_chat_opened':
        conversationStatus = 'approved';
        break;
      case 'archived':
        conversationStatus = 'rejected';
        break;
      default:
        conversationStatus = 'pending_approval';
    }

    console.log(`[CONVERSATION-CHECK] Inquiry exists but not facilitated. Status: ${inquiry.status} -> ${conversationStatus}`);

    const response: ConversationCheckResponse = {
      exists: true,
      conversationId: inquiry.id, // Use inquiry ID as reference until facilitated
      status: conversationStatus,
      facilitated: false, // Not yet facilitated
      canSendMessages: false, // Can't send messages until facilitated
      inquiry_id: inquiry.id,
      created_at: inquiry.created_at,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[CONVERSATION-CHECK] Unexpected error:', error);

    let errorMessage = 'Internal server error while checking conversation status';
    let statusCode = 500;

    if (error instanceof SyntaxError) {
      errorMessage = 'Invalid JSON in request body';
      statusCode = 400;
    } else if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Database connection error';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: statusCode }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to check conversation status.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to check conversation status.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to check conversation status.' },
    { status: 405 }
  );
}
