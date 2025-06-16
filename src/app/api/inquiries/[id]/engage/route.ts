import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AuthenticationService } from '@/lib/auth-service'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/inquiries/[id]/engage - Seller engages with inquiry
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let authenticatedUser: any, authenticatedSellerProfile: any;

  try {
    // Next.js 15 requires awaiting params
    const { id } = await params

    // Authenticate user and get their profile
    const authService = new AuthenticationService()
    const authResult = await authService.authenticateUser(request)

    if (!authResult.success || !authResult.user || !authResult.profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    authenticatedUser = authResult.user
    authenticatedSellerProfile = authResult.profile

    if (authenticatedSellerProfile.role !== 'seller') {
      return NextResponse.json(
        { error: 'Only sellers can engage with inquiries' },
        { status: 403 }
      )
    }

    // CRITICAL: Check if seller is verified before allowing engagement
    if (authenticatedSellerProfile.verification_status !== 'verified') {
      return NextResponse.json(
        {
          error: 'Seller verification is required to engage with inquiries.',
          type: 'verification_required',
          link: '/seller-dashboard/verification'
        },
        { status: 403 }
      );
    }

    const startTime = Date.now()

    // Get inquiry ID from params
    if (!id) {
      console.error('[SELLER-ENGAGE] Missing inquiry ID in request')
      return NextResponse.json(
        { error: 'Inquiry ID is required' },
        { status: 400 }
      )
    }

    console.log(`[SELLER-ENGAGE] Seller ${authenticatedUser.id} engaging with inquiry ${id}`)

    // Robust JSON body parsing with fallback
    let body = {};
    let response_message = '';

    try {
      const requestText = await request.text();
      if (requestText.trim()) {
        body = JSON.parse(requestText);
        response_message = body.response_message || '';
      }
      // If empty body, use defaults (this is okay for engagement)
    } catch (parseError) {
      console.warn('[SELLER-ENGAGE] Failed to parse request body, using defaults:', parseError);
      // Continue with empty body/defaults - engagement doesn't require a response message
    }

    // Fetch inquiry details first
    const { data: inquiry, error: fetchError } = await supabaseAdmin
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .single()

        if (fetchError) {
      console.error('[SELLER-ENGAGE] Database error fetching inquiry:', {
        inquiryId: id,
        error: fetchError,
        code: fetchError.code
      })

      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Inquiry not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch inquiry' },
        { status: 500 }
      )
    }

    // Fetch related user profiles for verification status
    const [buyerProfileResult, sellerProfileResult] = await Promise.all([
      supabaseAdmin
        .from('user_profiles')
        .select('id, verification_status')
        .eq('id', inquiry.buyer_id)
        .single(),
      supabaseAdmin
        .from('user_profiles')
        .select('id, verification_status')
        .eq('id', inquiry.seller_id)
        .single()
    ])

    const buyerVerificationProfile = buyerProfileResult.data
    const sellerVerificationProfile = sellerProfileResult.data

    if (buyerProfileResult.error || sellerProfileResult.error) {
      console.error('[SELLER-ENGAGE] Error fetching user profiles:', {
        buyerError: buyerProfileResult.error,
        sellerError: sellerProfileResult.error
      })
      return NextResponse.json(
        { error: 'Failed to fetch user verification status' },
        { status: 500 }
      )
    }

    // Verify seller owns this inquiry
    if (inquiry.seller_id !== authenticatedUser.id) {
      console.error('[SELLER-ENGAGE] Unauthorized engagement attempt:', {
        inquiryId: id,
        inquirySellerId: inquiry.seller_id,
        attemptingUserId: authenticatedUser.id
      })
      return NextResponse.json(
        { error: 'You can only engage with inquiries for your own listings' },
        { status: 403 }
      )
    }

    // Check if inquiry is in correct status for engagement
    if (inquiry.status !== 'new_inquiry') {
      console.warn('[SELLER-ENGAGE] Invalid status for engagement:', {
        inquiryId: id,
        currentStatus: inquiry.status,
        sellerId: authenticatedUser.id
      })
      return NextResponse.json(
        { error: `Inquiry has already been processed (status: ${inquiry.status})` },
        { status: 400 }
      )
    }

    // Determine next status based on verification states
    let nextStatus: string
    let requiresVerification = false

    const buyerVerified = buyerVerificationProfile?.verification_status === 'verified'
    const sellerVerified = sellerVerificationProfile?.verification_status === 'verified'

    if (!buyerVerified) {
      nextStatus = 'seller_engaged_buyer_pending_verification'
      requiresVerification = true
    } else if (!sellerVerified) {
      nextStatus = 'seller_engaged_seller_pending_verification'
      requiresVerification = true
    } else {
      // Both are verified, ready for admin connection
      nextStatus = 'ready_for_admin_connection'
    }

    // Update inquiry with engagement details - only use fields that exist in the schema
    const updateData = {
      status: nextStatus,
      engagement_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString()
      // Note: seller_response_message field doesn't exist in schema, removing it
      // TODO: If seller response messages are needed, add this field to the database schema
    }

    const { data: updatedInquiry, error } = await supabaseAdmin
      .from('inquiries')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating inquiry engagement:', error)
      return NextResponse.json(
        { error: 'Failed to engage with inquiry' },
        { status: 500 }
      )
    }

    // 🚀 COMPREHENSIVE NOTIFICATION SYSTEM INTEGRATION
    let notifications: any[] = [];
    try {

      // 1. Notify buyer of seller engagement
      const buyerNotificationMessage = buyerVerified
        ? (sellerVerified
          ? "Great news! The seller has engaged with your inquiry and both parties are verified. Our admin team will facilitate your connection soon."
          : "The seller has engaged with your inquiry but needs to complete verification. You'll be notified once they're verified and ready to connect.")
        : "The seller has engaged with your inquiry! To proceed, please verify your profile so our team can facilitate the connection.";

      notifications.push({
        user_id: inquiry.buyer_id,
        type: 'engagement',
        message: buyerNotificationMessage,
        link: buyerVerified ? '/dashboard/inquiries' : '/dashboard/verification',
        created_at: new Date().toISOString()
      });

      // 2. Notify seller of engagement confirmation
      const sellerNotificationMessage = sellerVerified
        ? (buyerVerified
          ? "You've successfully engaged with the buyer inquiry. Both parties are verified - our admin team will facilitate your connection soon."
          : "You've engaged with the buyer inquiry. The buyer needs to complete verification before our team can facilitate the connection.")
        : "You've engaged with the buyer inquiry. To proceed, please complete your verification so our team can facilitate the connection.";

      notifications.push({
        user_id: inquiry.seller_id,
        type: 'engagement',
        message: sellerNotificationMessage,
        link: sellerVerified ? '/seller-dashboard/inquiries' : '/seller-dashboard/verification',
        created_at: new Date().toISOString()
      });

      // 3. Notify admin if ready for connection facilitation
      if (nextStatus === 'ready_for_admin_connection') {
        // Get admin users to notify
        const { data: adminUsers } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('role', 'admin');

        if (adminUsers && adminUsers.length > 0) {
          // Get buyer and seller names for admin notification
          const [buyerNameResult, sellerNameResult] = await Promise.all([
            supabaseAdmin.from('user_profiles').select('full_name').eq('id', inquiry.buyer_id).single(),
            supabaseAdmin.from('user_profiles').select('full_name').eq('id', inquiry.seller_id).single()
          ])

          const buyerName = buyerNameResult.data?.full_name || 'Buyer'
          const sellerName = sellerNameResult.data?.full_name || 'Seller'

          adminUsers.forEach(admin => {
            notifications.push({
              user_id: admin.id,
              type: 'system',
              message: `New connection ready for facilitation: ${buyerName} ↔ ${sellerName} for inquiry ${id}`,
              link: '/admin/engagement-queue',
              created_at: new Date().toISOString()
            });
          });
        }
      }

      // Insert all notifications
      if (notifications.length > 0) {
        const { error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          console.warn('Failed to create notifications:', notificationError);
          // Don't fail the main operation for notification issues
        } else {
          console.log(`Created ${notifications.length} notifications for inquiry ${id} engagement`);
        }
      }

    } catch (notificationError) {
      console.warn('Error creating engagement notifications:', notificationError);
      // Don't fail the main operation for notification issues
    }

    let message = 'Successfully engaged with inquiry'
    if (requiresVerification) {
      if (!buyerVerified) {
        message += '. Waiting for buyer verification to proceed.'
      } else {
        message += '. Your verification is required to proceed.'
      }
    } else {
      message += '. Ready for admin to facilitate connection.'
    }

    // Success logging
    console.log(`[SELLER-ENGAGE] SUCCESS: Inquiry ${id} engaged by seller ${authenticatedUser.id}`, {
      inquiryId: id,
      sellerId: authenticatedUser.id,
      buyerId: inquiry.buyer_id,
      newStatus: nextStatus,
      buyerVerified,
      sellerVerified,
      notificationsSent: notifications?.length || 0
    })

    return NextResponse.json({
      message,
      inquiry: updatedInquiry,
      next_steps: {
        buyer_verification_required: !buyerVerified,
        seller_verification_required: !sellerVerified,
        ready_for_admin_connection: nextStatus === 'ready_for_admin_connection'
      }
    })
  } catch (error) {
    // Safely get params for error logging
    let inquiryId = 'unknown';
    try {
      const { id } = await params;
      inquiryId = id;
    } catch (e) {
      // Ignore params error in error handler
    }

    console.error('[SELLER-ENGAGE] CRITICAL ERROR:', {
      inquiryId,
      sellerId: authenticatedUser?.id || 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again later.',
        type: 'server_error'
      },
      { status: 500 }
    )
  }
}
