import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationService } from '@/lib/auth-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const startTime = Date.now();

  try {
    const authService = new AuthenticationService();
    const authResult = await authService.authenticateUser(request);

    if (!authResult.success || !authResult.user || !authResult.profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Ensure admin role
    if (authResult.profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Create Supabase service client
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

    // Next.js 15 requires awaiting params
    const { requestId } = await params;

    // Robust JSON body parsing with fallback
    let body = {};
    let admin_note = '';

    try {
      const requestText = await request.text();
      if (requestText.trim()) {
        body = JSON.parse(requestText);
        admin_note = body.admin_note || '';
      }
    } catch (parseError) {
      console.warn('[ADMIN-FACILITATE] Failed to parse request body, using defaults:', parseError);
      // Continue with empty body/defaults
    }

    // Fetch the inquiry details
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        status,
        initial_message,
        listing:listing_id (
          listing_title_anonymous
        ),
        buyer:buyer_id (
          full_name,
          verification_status
        ),
        seller:seller_id (
          full_name,
          verification_status
        )
      `)
      .eq('id', requestId)
      .single();

    if (inquiryError || !inquiry) {
      console.error('[ADMIN-FACILITATE] Error fetching inquiry:', inquiryError);
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Verify inquiry is ready for facilitation
    if (inquiry.status !== 'ready_for_admin_connection') {
      return NextResponse.json(
        { error: `Inquiry status is ${inquiry.status}, not ready for facilitation` },
        { status: 400 }
      );
    }

    // Verify both parties are verified
    if (inquiry.buyer?.verification_status !== 'verified' || inquiry.seller?.verification_status !== 'verified') {
      return NextResponse.json(
        { error: 'Both buyer and seller must be verified before chat can be facilitated' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
      .eq('inquiry_id', requestId)
        .single();

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        message: 'Conversation already exists',
        conversation_id: existingConversation.id,
        inquiry_id: requestId,
        responseTime: Date.now() - startTime
      });
    }

    console.log(`[ADMIN-FACILITATE] Creating conversation for inquiry ${requestId}. Admin: ${authResult.user.id}`);

    // Use Supabase RPC function for atomic transaction
    const { data: facilitationResult, error: facilitationError } = await supabase
      .rpc('facilitate_chat_connection', {
        p_inquiry_id: requestId,
        p_admin_id: authResult.user.id,
        p_admin_note: admin_note
      });

    if (facilitationError) {
      console.error('[ADMIN-FACILITATE] Error facilitating chat:', facilitationError);
      return NextResponse.json(
        { error: facilitationError.message || 'Failed to facilitate chat connection' },
        { status: 500 }
      );
    }

    const response = {
      success: true,
      message: `Chat connection facilitated between ${inquiry.buyer?.full_name} and ${inquiry.seller?.full_name}`,
      conversation_id: facilitationResult.conversation_id,
      inquiry_id: requestId,
      responseTime: Date.now() - startTime
    };

    console.log(`[ADMIN-FACILITATE] Chat facilitated successfully for inquiry ${requestId} (conversation: ${facilitationResult.conversation_id}) in ${response.responseTime}ms`);

    return NextResponse.json(response);

  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Safely get inquiry ID for error logging
    let inquiryId = 'unknown';
    try {
      const { requestId } = await params;
      inquiryId = requestId;
    } catch (e) {
      // Ignore params error in error handler
    }

    console.error('[ADMIN-FACILITATE] Server error:', {
      inquiryId,
      adminId: authResult?.user?.id || 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      responseTime
    });

    return NextResponse.json(
      { error: 'Internal server error', responseTime },
      { status: 500 }
    );
  }
}
