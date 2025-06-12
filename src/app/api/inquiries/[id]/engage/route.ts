import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authServer } from '@/lib/auth-server'

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
  try {
    // Authenticate user
    const authResult = await authServer.authenticateUser(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user, profile } = authResult

    // Get inquiry ID from params
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Inquiry ID is required' },
        { status: 400 }
      )
    }

    if (!profile || profile.role !== 'seller') {
      return NextResponse.json(
        { error: 'Only sellers can engage with inquiries' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { response_message } = body

    // Fetch inquiry details with related user and listing data
    const { data: inquiry, error: fetchError } = await supabase
      .from('inquiries')
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        status,
        listings (
          id,
          seller_id,
          status
        ),
        buyer_profile:user_profiles!buyer_id (
          id,
          verification_status
        ),
        seller_profile:user_profiles!seller_id (
          id,
          verification_status
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
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

    // Verify seller owns this inquiry
    if (inquiry.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only engage with inquiries for your own listings' },
        { status: 403 }
      )
    }

    // Check if inquiry is in correct status for engagement
    if (inquiry.status !== 'new_inquiry') {
      return NextResponse.json(
        { error: 'Inquiry has already been processed or is not available for engagement' },
        { status: 400 }
      )
    }

    // Determine next status based on verification states
    let nextStatus: string
    let requiresVerification = false

    const buyerVerified = inquiry.buyer_profile?.verification_status === 'verified'
    const sellerVerified = inquiry.seller_profile?.verification_status === 'verified'

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

    // Update inquiry with engagement details
    const updateData = {
      status: nextStatus,
      engagement_timestamp: new Date().toISOString(),
      seller_response_message: response_message || null,
      updated_at: new Date().toISOString()
    }

    const { data: updatedInquiry, error } = await supabase
      .from('inquiries')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        status,
        engagement_timestamp,
        seller_response_message,
        created_at,
        updated_at,
        listings (
          id,
          listing_title_anonymous,
          asking_price
        ),
        buyer_profile:user_profiles!buyer_id (
          id,
          full_name,
          verification_status
        )
      `)
      .single()

    if (error) {
      console.error('Error updating inquiry engagement:', error)
      return NextResponse.json(
        { error: 'Failed to engage with inquiry' },
        { status: 500 }
      )
    }

    // TODO: Create notifications
    // - Notify buyer of seller engagement
    // - If ready for admin connection, notify admin
    // - If verification needed, notify relevant party

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
    console.error('Inquiry engagement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
