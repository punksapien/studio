import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/listings/[id] - Get single listing details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Get the current user (if any) to determine what data to show
    const user = await auth.getCurrentUser()
    const userProfile = user ? await auth.getCurrentUserProfile() : null

    // Build query based on user permissions
    let query = supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)  // Filter out soft deleted listings

    const { data: listing, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching listing:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listing' },
        { status: 500 }
      )
    }

    // Determine what data to show based on user role and listing ownership
    let responseData = { ...listing }

    // If user is not the seller and doesn't have admin privileges
    if (!user || (userProfile?.role !== 'admin' && listing.seller_id !== user.id)) {
      // Remove sensitive financial information for non-verified listings
      if (listing.status === 'verified_anonymous') {
        // Keep anonymous data but hide detailed financials
        delete responseData.verified_annual_revenue
        delete responseData.verified_net_profit
        delete responseData.verified_cash_flow
        delete responseData.seller_id
      } else if (listing.status === 'draft' || listing.status === 'pending_approval') {
        // These shouldn't be visible to non-owners
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({ listing: responseData })
  } catch (error) {
    console.error('Listing fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/listings/[id] - Update listing (seller only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Check if listing exists and user owns it
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id, status')
      .eq('id', id)
      .is('deleted_at', null)  // Filter out soft deleted listings
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

    const body = await request.json()

    // Define updatable fields (excluding system fields)
    const updatableFields = [
      'title',
      'short_description',
      'business_overview',
      'asking_price',
      'business_type',
      'industry',
      'location_country',
      'location_city',
      'established_year',
      'number_of_employees',
      'website_url',
      'images',
      'annual_revenue',
      'net_profit',
      'monthly_cash_flow',
      'growth_rate',
      'key_assets',
      'liabilities_debt',
      'reason_for_selling',
      'ideal_buyer_profile',
      'transition_timeline',
      'support_training_offered'
    ]

    // Filter body to only include updatable fields
    const updateData: Record<string, any> = {}
    for (const field of updatableFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // If listing was verified and we're updating financial data, reset verification
    if (existingListing.status === 'verified_with_financials' &&
        ['annual_revenue', 'net_profit', 'monthly_cash_flow'].some(field => field in updateData)) {
      updateData.verification_status = 'pending_verification'
    }

    if (Object.keys(updateData).length === 1) { // Only updated_at
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      )
    }

    const { data: updatedListing, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating listing:', error)
      return NextResponse.json(
        { error: 'Failed to update listing' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Listing updated successfully',
      listing: updatedListing
    })
  } catch (error) {
    console.error('Listing update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/listings/[id] - Soft delete listing (seller only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Check if listing exists and user owns it
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .is('deleted_at', null)  // Only check non-deleted listings
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
        { error: 'You can only delete your own listings' },
        { status: 403 }
      )
    }

    // Use the soft delete function
    const { data, error } = await supabase
      .rpc('soft_delete_listing', {
        listing_id: id,
        deleter_id: user.id
      })

    if (error) {
      console.error('Error soft deleting listing:', error)
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to delete listing - permission denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      message: 'Listing deleted successfully'
    })
  } catch (error) {
    console.error('Listing deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
