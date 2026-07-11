import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'

interface RouteParams {
  params: {
    id: string
  }
}

// PUT /api/listings/[id]/status - Update listing status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user using the correct auth service
    const user = await authServer.getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await authServer.getCurrentUserProfile(request)

    // Create authenticated Supabase client
    const { supabase: authenticatedSupabase } = authServer.createServerClient(request)

    // Get listing ID from params
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status } = body

    // Define valid statuses (must match the listings_status_check DB constraint)
    const validStatuses = [
      'draft',              // Seller is still editing, not submitted
      'pending_approval',   // Submitted and waiting for admin review
      'under_review',       // Admin is actively reviewing
      'active',             // Approved by admin - publicly visible
      'verified_anonymous', // Admin verified, anonymous view
      'verified_public',    // Admin verified, full details visible
      'inactive',           // Soft deleted - hidden from marketplace
      'withdrawn',          // Seller withdrew from market
      'sold',               // Completed transaction
      'closed_deal',        // Deal completed
      'rejected_by_admin',  // Admin rejected
      'appealing_rejection',// Seller has appealed a rejection
      'pending_verification' // Awaiting admin verification
    ]

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if listing exists and user owns it
    const { data: existingListing, error: fetchError } = await authenticatedSupabase
      .from('listings')
      .select('seller_id, status, approved_at, listing_title_anonymous')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching listing:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch listing' },
        { status: 500 }
      )
    }

    // Check ownership (unless user is admin)
    if (profile?.role !== 'admin' && existingListing.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only update your own listings' },
        { status: 403 }
      )
    }

    // Status transition rules — explicit allowlist for sellers, anything for admins.
    // Sellers may take a listing DOWN at any time, but may only bring one back to a
    // public status if it was previously approved by an admin (approved_at is set).
    // A DB trigger (enforce_listing_approval_gate) backstops these rules.
    if (profile?.role !== 'admin') {
      const sellerTakedownStatuses = ['inactive', 'withdrawn', 'sold', 'closed_deal']
      const sellerNonPublicStatuses = ['draft', 'pending_approval']

      if (status === 'active') {
        const reactivatableFrom = ['inactive', 'withdrawn', 'sold', 'closed_deal']
        if (!existingListing.approved_at || !reactivatableFrom.includes(existingListing.status)) {
          return NextResponse.json(
            { error: 'This listing has not been approved yet. It will become visible once an admin approves it.' },
            { status: 403 }
          )
        }
        console.log(`[LISTING-REACTIVATE] Previously-approved listing ${id} reactivated by user ${user.id}`)
      } else if (sellerTakedownStatuses.includes(status)) {
        console.log(`[LISTING-TAKEDOWN] Listing ${id} set to ${status} by user ${user.id}`)
      } else if (sellerNonPublicStatuses.includes(status)) {
        console.log(`[LISTING-${status.toUpperCase()}] Listing ${id} set to ${status} by user ${user.id}`)
      } else {
        return NextResponse.json(
          { error: `Only admins can set a listing to '${status}'` },
          { status: 403 }
        )
      }
    } else {
      console.log(`[LISTING-STATUS] Admin ${user.id} setting listing ${id} to ${status}`)
    }

    const updateData: Record<string, any> = {
      status: status,
      updated_at: new Date().toISOString()
    }

    // Update the listing with comprehensive audit trail
    const { data: updatedListing, error } = await authenticatedSupabase
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

    // Return success with helpful message
    const statusMessages = {
      'inactive': `Listing '${existingListing.listing_title_anonymous}' has been deactivated and is now hidden from the marketplace`,
      'active': `Listing '${existingListing.listing_title_anonymous}' has been reactivated and is now visible to buyers`,
      'sold': `Listing '${existingListing.listing_title_anonymous}' has been marked as sold`,
      'withdrawn': `Listing '${existingListing.listing_title_anonymous}' has been withdrawn from the marketplace`,
      'verified_public': `Listing '${existingListing.listing_title_anonymous}' has been verified for public view`,
      'verified_anonymous': `Listing '${existingListing.listing_title_anonymous}' has been verified for anonymous view`,
      'draft': `Listing '${existingListing.listing_title_anonymous}' has been moved to draft status`,
      'rejected_by_admin': `Listing '${existingListing.listing_title_anonymous}' has been rejected`
    }

    return NextResponse.json({
      success: true,
      message: statusMessages[status as keyof typeof statusMessages] || `Listing status updated to ${status}`,
      listing: updatedListing,
      previousStatus: existingListing.status,
      newStatus: status
    })

  } catch (error) {
    console.error('Listing status update error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}
