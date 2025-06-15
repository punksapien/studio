import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'

// GET /api/user/listings - Get current user's listings
export async function GET(request: NextRequest) {
  try {
    // Use the reliable authServer instead of problematic AuthenticationService
    const user = await authServer.getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const profile = await authServer.getCurrentUserProfile(request)
    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Create authenticated Supabase client
    const { supabase } = authServer.createServerClient(request)

    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Max 50 items per page
    const status = searchParams.get('status') // Optional status filter
    const sortBy = searchParams.get('sort_by') || 'updated_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Build the query for user's listings using ACTUAL database column names
    let query = supabase
      .from('listings')
      .select(`
        id,
        listing_title_anonymous,
        anonymous_business_description,
        business_model,
        asking_price,
        industry,
        location_country,
        location_city_region_general,
        year_established,
        number_of_employees,
        business_website_url,
        image_urls,
        status,
        is_seller_verified,
        created_at,
        updated_at,
        specific_annual_revenue_last_year,
        specific_net_profit_last_year,
        adjusted_cash_flow,
        annual_revenue_range,
        net_profit_margin_range,
        admin_notes,
        rejection_category,
        admin_action_at,
        listing_appeals (
          id,
          status,
          appeal_message,
          created_at,
          admin_response
        )
      `)
      .eq('seller_id', user.id)
      .is('deleted_at', null)  // Exclude soft-deleted listings

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Apply sorting - fix valid sort fields to match actual database columns
    const validSortFields = ['created_at', 'updated_at', 'asking_price', 'listing_title_anonymous', 'status']
    const validSortOrders = ['asc', 'desc']

    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: listings, error, count } = await query

    // Debug logging
    console.log(`[USER-LISTINGS] User ${user.id} fetching listings:`)
    console.log(`[USER-LISTINGS] Query result: ${listings?.length || 0} listings found`)
    console.log(`[USER-LISTINGS] Listings data:`, listings?.map(l => ({ id: l.id, title: l.listing_title_anonymous, status: l.status })))

    if (error) {
      console.error('Error fetching user listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch your listings' },
        { status: 500 }
      )
    }

    // Transform data to match expected API format (map database columns to frontend expectations)
    const transformedListings = listings?.map(listing => {
      // Get the first (most recent) appeal if any
      const latestAppeal = listing.listing_appeals?.[0];

      return {
        id: listing.id,
        title: listing.listing_title_anonymous, // Map database column to frontend expectation
        short_description: listing.anonymous_business_description,
        business_overview: listing.business_model,
        asking_price: listing.asking_price,
        industry: listing.industry,
        location_country: listing.location_country,
        location_city: listing.location_city_region_general,
        established_year: listing.year_established,
        number_of_employees: listing.number_of_employees,
        website_url: listing.business_website_url,
        images: listing.image_urls,
        status: listing.status,
        verification_status: listing.is_seller_verified ? 'verified' : 'pending',
        created_at: listing.created_at,
        updated_at: listing.updated_at,
        annual_revenue: listing.specific_annual_revenue_last_year,
        net_profit: listing.specific_net_profit_last_year,
        monthly_cash_flow: listing.adjusted_cash_flow,
        verified_annual_revenue: listing.specific_annual_revenue_last_year,
        verified_net_profit: listing.specific_net_profit_last_year,
        verified_cash_flow: listing.adjusted_cash_flow,
        annual_revenue_range: listing.annual_revenue_range,
        net_profit_margin_range: listing.net_profit_margin_range,
        // Admin rejection fields
        admin_notes: listing.admin_notes,
        rejection_category: listing.rejection_category,
        admin_action_at: listing.admin_action_at,
        // Appeal fields
        appeal_status: latestAppeal?.status,
        appeal_message: latestAppeal?.appeal_message,
        appeal_created_at: latestAppeal?.created_at,
        admin_response: latestAppeal?.admin_response
      };
    })

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasMore = page < totalPages

    // Add summary statistics for user's listings
    const { data: summaryData, error: summaryError } = await supabase
      .from('listings')
      .select('status')
      .eq('seller_id', user.id)
      .is('deleted_at', null)  // Exclude soft-deleted listings

    const summary = {
      total: summaryData?.length || 0,
      active: summaryData?.filter(l => l.status === 'active').length || 0,
      verified_anonymous: summaryData?.filter(l => l.status === 'verified_anonymous').length || 0,
      verified_public: summaryData?.filter(l => l.status === 'verified_public').length || 0,
      pending_verification: summaryData?.filter(l => l.status === 'pending_verification').length || 0,
      rejected_by_admin: summaryData?.filter(l => l.status === 'rejected_by_admin').length || 0,
      closed_deal: summaryData?.filter(l => l.status === 'closed_deal').length || 0
    }

    return NextResponse.json({
      listings: transformedListings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore
      },
      summary
    })
  } catch (error) {
    console.error('User listings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
