import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authServer } from '@/lib/auth-server'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/inquiries/[id] - Get specific inquiry details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth
    const authResult = await authServer.authenticateUser(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Inquiry ID is required' },
        { status: 400 }
      )
    }

    const userProfile = await authServer.getCurrentUserProfile(request)
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Fetch inquiry with related data
    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        message,
        status,
        conversation_id,
        engagement_timestamp,
        admin_notes,
        created_at,
        updated_at,
        listings (
          id,
          listing_title_anonymous,
          anonymous_business_description,
          asking_price,
          industry,
          location_country,
          status
        ),
        buyer_profile:user_profiles!buyer_id (
          id,
          full_name,
          verification_status,
          role
        ),
        seller_profile:user_profiles!seller_id (
          id,
          full_name,
          verification_status,
          role
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
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

    // Check if user has permission to view this inquiry
    const isAuthorized =
      inquiry.buyer_id === authResult.user.id ||
      inquiry.seller_id === authResult.user.id ||
      userProfile.role === 'admin'

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You do not have permission to view this inquiry' },
        { status: 403 }
      )
    }

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Inquiry fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/inquiries/[id] - Update inquiry status or add admin notes
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authServer.authenticateUser(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Inquiry ID is required' },
        { status: 400 }
      )
    }

    const userProfile = await authServer.getCurrentUserProfile(request)
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { status, admin_notes } = body

    // Fetch existing inquiry
    const { data: existingInquiry, error: fetchError } = await supabase
      .from('inquiries')
      .select('*')
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

    // Check permissions and validate status transitions
    let updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    // Admin can update admin notes and any status
    if (userProfile.role === 'admin') {
      if (admin_notes !== undefined) {
        updateData.admin_notes = admin_notes
      }
      if (status) {
        updateData.status = status
      }
    }
    // Seller can engage with inquiry
    else if (existingInquiry.seller_id === authResult.user.id) {
      if (status === 'seller_engaged') {
        // Seller engagement logic
        updateData.status = 'seller_engaged'
        updateData.engagement_timestamp = new Date().toISOString()

        // Determine next status based on verification states
        // This would require checking buyer/seller verification status
        // For now, simple transition
        updateData.status = 'seller_engaged_buyer_pending_verification'
      } else if (status === 'rejected_by_seller') {
        updateData.status = 'rejected_by_seller'
      } else if (status) {
        return NextResponse.json(
          { error: 'Invalid status transition for seller' },
          { status: 400 }
        )
      }
    }
    // Buyer can withdraw inquiry
    else if (existingInquiry.buyer_id === authResult.user.id) {
      if (status === 'withdrawn') {
        updateData.status = 'withdrawn'
      } else if (status) {
        return NextResponse.json(
          { error: 'Buyers can only withdraw inquiries' },
          { status: 400 }
        )
      }
    }
    else {
      return NextResponse.json(
        { error: 'You do not have permission to update this inquiry' },
        { status: 403 }
      )
    }

    // Ensure we have something to update
    if (Object.keys(updateData).length === 1) { // Only updated_at
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      )
    }

    const { data: updatedInquiry, error } = await supabase
      .from('inquiries')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating inquiry:', error)
      return NextResponse.json(
        { error: 'Failed to update inquiry' },
        { status: 500 }
      )
    }

    // TODO: Create notifications based on status change

    return NextResponse.json({
      message: 'Inquiry updated successfully',
      inquiry: updatedInquiry
    })
  } catch (error) {
    console.error('Inquiry update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
