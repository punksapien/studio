import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

// PUT /api/listings/[id]/status - Update listing status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await auth.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status } = body

    // Validate status value
    const validStatuses = ['draft', 'verified_anonymous', 'verified_with_financials', 'sold', 'withdrawn']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if listing exists and user owns it
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id, status, verification_status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch listing' },
        { status: 500 }
      )
    }

    // Check ownership (unless user is admin)
    const userProfile = await auth.getCurrentUserProfile()
    if (userProfile?.role !== 'admin' && existingListing.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only update your own listings' },
        { status: 403 }
      )
    }

    // Business logic for status transitions
    let updateData: Record<string, any> = {
      status: status,
      updated_at: new Date().toISOString()
    }

    // Handle specific status changes
    switch (status) {
      case 'sold':
        // When marking as sold, record the sale date
        updateData.sold_date = new Date().toISOString()
        break

      case 'withdrawn':
        // When withdrawing, record the withdrawal date
        updateData.withdrawn_date = new Date().toISOString()
        break

      case 'verified_with_financials':
        // Only admins can mark as verified with financials
        if (userProfile?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only admins can verify listings with financials' },
            { status: 403 }
          )
        }
        updateData.verification_status = 'verified'
        break

      case 'verified_anonymous':
        // Sellers can activate to anonymous, admins can verify
        if (userProfile?.role === 'admin') {
          updateData.verification_status = 'verified'
        } else if (existingListing.verification_status === 'pending_verification') {
          // Keep verification status as pending for seller actions
          updateData.verification_status = existingListing.verification_status
        }
        break

      case 'draft':
        // Moving back to draft for editing
        updateData.verification_status = 'pending_verification'
        break
    }

    const { data: updatedListing, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating listing status:', error)
      return NextResponse.json(
        { error: 'Failed to update listing status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Listing status updated to ${status}`,
      listing: updatedListing
    })
  } catch (error) {
    console.error('Listing status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
