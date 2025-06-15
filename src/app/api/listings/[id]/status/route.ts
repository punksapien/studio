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

    // Define valid statuses for comprehensive soft delete system
    const validStatuses = [
      'active',           // Publicly visible and available
      'inactive',         // Soft deleted - hidden from marketplace
      'draft',           // Not yet published
      'verified_anonymous', // Admin verified, anonymous view
      'verified_public',  // Admin verified, full details visible
      'sold',            // Completed transaction
      'withdrawn',       // Seller withdrew from market
      'pending_verification', // Awaiting admin approval
      'rejected_by_admin'     // Admin rejected
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
      .select('seller_id, status, listing_title_anonymous')
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

    // Business logic for status transitions with soft delete patterns
    let updateData: Record<string, any> = {
      status: status,
      updated_at: new Date().toISOString()
    }

    // Handle specific status changes - ONLY update columns that exist
    switch (status) {
      case 'inactive':
        // Soft delete - hide from marketplace but preserve data
        console.log(`[LISTING-DEACTIVATE] Listing ${id} deactivated by user ${user.id}`)
        // Status change is sufficient - no audit columns needed
        break

      case 'active':
        // Reactivation - make visible again
        console.log(`[LISTING-REACTIVATE] Listing ${id} reactivated by user ${user.id}`)
        // Status change is sufficient - no audit columns needed
        break

      case 'sold':
        // Mark as sold - status change only
        console.log(`[LISTING-SOLD] Listing ${id} marked as sold by user ${user.id}`)
        break

      case 'withdrawn':
        // Seller withdrawal - status change only
        console.log(`[LISTING-WITHDRAWN] Listing ${id} withdrawn by user ${user.id}`)
        break

      case 'verified_public':
        // Only admins can mark as verified with full details
        if (profile?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only admins can verify listings with full details' },
            { status: 403 }
          )
        }
        // Note: is_seller_verified reflects USER verification, not listing verification
        // For listing-specific verification, we use the status field
        console.log(`[LISTING-VERIFIED-PUBLIC] Listing ${id} verified public by admin ${user.id}`)
        break

      case 'verified_anonymous':
        // Admin verification for anonymous view
        if (profile?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only admins can verify listings' },
            { status: 403 }
          )
        }
        console.log(`[LISTING-VERIFIED-ANON] Listing ${id} verified anonymous by admin ${user.id}`)
        break

      case 'draft':
        // Moving back to draft for editing
        console.log(`[LISTING-DRAFT] Listing ${id} moved to draft by user ${user.id}`)
        break

      case 'rejected_by_admin':
        // Admin rejection - can override even verified seller's listing
        if (profile?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only admins can reject listings' },
            { status: 403 }
          )
        }
        console.log(`[LISTING-REJECTED] Listing ${id} rejected by admin ${user.id}`)
        break
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
