import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authServer } from '@/lib/auth-server'

// GET /api/listings - Get all listings with filtering, search, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Max 50 items per page
    const industry = searchParams.get('industry')
    const country = searchParams.get('country')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    const search = searchParams.get('search')
    const status = searchParams.get('status') // Don't default here
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Build the query - using correct field names from schema including new individual fields
    let query = supabase
      .from('listings')
      .select(`
        id,
        listing_title_anonymous,
        anonymous_business_description,
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
        seller_id,
        annual_revenue_range,
        net_profit_margin_range,
        specific_annual_revenue_last_year,
        specific_net_profit_last_year,
        adjusted_cash_flow,
        key_strengths_anonymous,
        key_strength_1,
        key_strength_2,
        key_strength_3,
        growth_opportunity_1,
        growth_opportunity_2,
        growth_opportunity_3,
        specific_growth_opportunities
      `, { count: 'exact' })

    // Apply status filter - if no specific status is requested, show both active and verified_anonymous listings
    if (status) {
      query = query.eq('status', status)
    } else {
      // Show listings that are publicly viewable by default
      query = query.in('status', ['active', 'verified_anonymous', 'verified_public'])
    }

    // Apply industry filter
    if (industry) {
      query = query.eq('industry', industry)
    }

    // Apply country filter
    if (country) {
      query = query.eq('location_country', country)
    }

    // Apply price range filters
    if (minPrice) {
      query = query.gte('asking_price', parseInt(minPrice))
    }
    if (maxPrice) {
      query = query.lte('asking_price', parseInt(maxPrice))
    }

    // Apply text search (searches in title, description, and key strengths/opportunities)
    if (search) {
      query = query.or(`listing_title_anonymous.ilike.%${search}%,anonymous_business_description.ilike.%${search}%,key_strength_1.ilike.%${search}%,key_strength_2.ilike.%${search}%,key_strength_3.ilike.%${search}%,growth_opportunity_1.ilike.%${search}%,growth_opportunity_2.ilike.%${search}%,growth_opportunity_3.ilike.%${search}%`)
    }

    // Apply sorting
    const validSortFields = ['created_at', 'asking_price', 'listing_title_anonymous', 'year_established']
    const validSortOrders = ['asc', 'desc']

    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: listings, error, count } = await query

    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected API format (supporting both new and legacy formats)
    const transformedListings = listings?.map(listing => ({
      id: listing.id,
      title: listing.listing_title_anonymous,
      short_description: listing.anonymous_business_description,
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
      seller_id: listing.seller_id,
      annual_revenue_range: listing.annual_revenue_range,
      net_profit_margin_range: listing.net_profit_margin_range,
      verified_annual_revenue: listing.specific_annual_revenue_last_year,
      verified_net_profit: listing.specific_net_profit_last_year,
      verified_cash_flow: listing.adjusted_cash_flow,

      // NEW: Individual key strength fields (preferred format for enhanced UI)
      key_strength_1: listing.key_strength_1,
      key_strength_2: listing.key_strength_2,
      key_strength_3: listing.key_strength_3,

      // NEW: Individual growth opportunity fields (preferred format for enhanced UI)
      growth_opportunity_1: listing.growth_opportunity_1,
      growth_opportunity_2: listing.growth_opportunity_2,
      growth_opportunity_3: listing.growth_opportunity_3,

      // LEGACY: Support for existing JSONB format (backward compatibility)
      key_strengths_anonymous: listing.key_strengths_anonymous ||
        (listing.key_strength_1 ?
          [listing.key_strength_1, listing.key_strength_2, listing.key_strength_3].filter(Boolean) :
          null),
      specific_growth_opportunities: listing.specific_growth_opportunities ||
        (listing.growth_opportunity_1 ?
          [listing.growth_opportunity_1, listing.growth_opportunity_2, listing.growth_opportunity_3]
            .filter(Boolean)
            .map(opp => `• ${opp}`)
            .join('\n') :
          null)
    }))

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasMore = page < totalPages

    return NextResponse.json({
      listings: transformedListings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore
      }
    })
  } catch (error) {
    console.error('Listings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/listings - Create new listing (sellers only)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user and get profile
    const user = await authServer.getCurrentUser(request)
    if (!user) {
      console.error('[LISTINGS-CREATE] Authentication failed - no user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log(`[LISTINGS-CREATE] Authenticated user: ${user.id}`)

    // Check if user is a seller
    const userProfile = await authServer.getCurrentUserProfile(request)
    if (!userProfile || userProfile.role !== 'seller') {
      console.error(`[LISTINGS-CREATE] Access denied - user ${user.id} is not a seller. Role: ${userProfile?.role || 'none'}`)
      return NextResponse.json(
        { error: 'Only sellers can create listings' },
        { status: 403 }
      )
    }

    console.log(`[LISTINGS-CREATE] Seller verified: ${user.id}, verification status: ${userProfile.verification_status}`)

    // Parse and validate request body
    let body: any
    try {
      body = await request.json()
    } catch (error) {
      console.error('[LISTINGS-CREATE] Invalid JSON in request body:', error)
      return NextResponse.json(
        { error: 'Invalid request body - must be valid JSON' },
        { status: 400 }
      )
    }

    // Define required fields (using API names but mapping to DB names)
    const requiredFields = [
      'listingTitleAnonymous',
      'anonymousBusinessDescription',
      'askingPrice',
      'industry',
      'locationCountry',
      'locationCityRegionGeneral'
    ]

    // Check for required fields
    const missingFields = requiredFields.filter(field => !body[field])
    if (missingFields.length > 0) {
      console.error(`[LISTINGS-CREATE] Missing required fields: ${missingFields.join(', ')}`)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate asking price
    const askingPrice = parseFloat(body.askingPrice)
    if (isNaN(askingPrice) || askingPrice <= 0) {
      console.error(`[LISTINGS-CREATE] Invalid asking price: ${body.askingPrice}`)
      return NextResponse.json(
        { error: 'Asking price must be a positive number' },
        { status: 400 }
      )
    }

    // Prepare listing data - mapping form field names to DB field names
    const listingData = {
      seller_id: user.id,
      listing_title_anonymous: String(body.listingTitleAnonymous).trim(),
      anonymous_business_description: String(body.anonymousBusinessDescription).trim(),
      asking_price: askingPrice,
      industry: String(body.industry).trim(),
      location_country: String(body.locationCountry).trim(),
      location_city_region_general: String(body.locationCityRegionGeneral).trim(),

      // Optional fields with proper validation
      year_established: body.yearEstablished ? parseInt(body.yearEstablished) : null,
      number_of_employees: body.numberOfEmployees || null,
      business_website_url: body.businessWebsiteUrl ? String(body.businessWebsiteUrl).trim() : null,
      image_urls: Array.isArray(body.imageUrls) ? body.imageUrls : [],

      // Business details
      business_model: body.businessModel ? String(body.businessModel).trim() : null,
      annual_revenue_range: body.annualRevenueRange || null,
      net_profit_margin_range: body.netProfitMarginRange || null,
      specific_annual_revenue_last_year: body.specificAnnualRevenueLastYear ? parseFloat(body.specificAnnualRevenueLastYear) : null,
      specific_net_profit_last_year: body.specificNetProfitLastYear ? parseFloat(body.specificNetProfitLastYear) : null,
      adjusted_cash_flow: body.adjustedCashFlow ? parseFloat(body.adjustedCashFlow) : null,

      // Individual key strength fields (enhanced form structure)
      key_strength_1: body.keyStrength1 ? String(body.keyStrength1).substring(0, 200) : null,
      key_strength_2: body.keyStrength2 ? String(body.keyStrength2).substring(0, 200) : null,
      key_strength_3: body.keyStrength3 ? String(body.keyStrength3).substring(0, 200) : null,

      // Individual growth opportunity fields (enhanced form structure)
      growth_opportunity_1: body.growthOpportunity1 ? String(body.growthOpportunity1).substring(0, 200) : null,
      growth_opportunity_2: body.growthOpportunity2 ? String(body.growthOpportunity2).substring(0, 200) : null,
      growth_opportunity_3: body.growthOpportunity3 ? String(body.growthOpportunity3).substring(0, 200) : null,

      // Additional details
      reason_for_selling_anonymous: body.reasonForSellingAnonymous ? String(body.reasonForSellingAnonymous).trim() : null,
      detailed_reason_for_selling: body.detailedReasonForSelling ? String(body.detailedReasonForSelling).trim() : null,

      // NEW: Additional business details
      technology_stack: body.technologyStack ? String(body.technologyStack).trim() : null,
      actual_company_name: body.actualCompanyName ? String(body.actualCompanyName).trim() : null,
      full_business_address: body.fullBusinessAddress ? String(body.fullBusinessAddress).trim() : null,
      adjusted_cash_flow_explanation: body.adjustedCashFlowExplanation ? String(body.adjustedCashFlowExplanation).trim() : null,
      seller_role_and_time_commitment: body.sellerRoleAndTimeCommitment ? String(body.sellerRoleAndTimeCommitment).trim() : null,
      post_sale_transition_support: body.postSaleTransitionSupport ? String(body.postSaleTransitionSupport).trim() : null,

      // NEW: Document URLs (these will be populated via file upload endpoint)
      financial_documents_url: body.financialDocumentsUrl || null,
      key_metrics_report_url: body.keyMetricsReportUrl || null,
      ownership_documents_url: body.ownershipDocumentsUrl || null,
      financial_snapshot_url: body.financialSnapshotUrl || null,
      ownership_details_url: body.ownershipDetailsUrl || null,
      location_real_estate_info_url: body.locationRealEstateInfoUrl || null,
      web_presence_info_url: body.webPresenceInfoUrl || null,
      secure_data_room_link: body.secureDataRoomLink ? String(body.secureDataRoomLink).trim() : null,

      // Set initial status based on seller verification
      status: userProfile.verification_status === 'verified' ? 'verified_anonymous' : 'active',
      is_seller_verified: userProfile.verification_status === 'verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log(`[LISTINGS-CREATE] Prepared listing data for user ${user.id}:`, {
      title: listingData.listing_title_anonymous,
      industry: listingData.industry,
      asking_price: listingData.asking_price,
      status: listingData.status
    })

    // Use authenticated Supabase client to respect RLS policies
    const { supabase: authenticatedSupabase } = authServer.createServerClient(request)

    const { data: newListing, error } = await authenticatedSupabase
      .from('listings')
      .insert(listingData)
      .select('*')
      .single()

    if (error) {
      console.error(`[LISTINGS-CREATE] Database error for user ${user.id}:`, error)

      // Provide specific error messages for common issues
      if (error.code === '42501') {
        return NextResponse.json(
          { error: 'Permission denied. Please ensure you are logged in as a seller.' },
          { status: 403 }
        )
      } else if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A listing with this information already exists.' },
          { status: 409 }
        )
      } else if (error.code === '23514') {
        return NextResponse.json(
          { error: 'Invalid data provided. Please check all fields and try again.' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'Failed to create listing. Please try again.' },
          { status: 500 }
        )
      }
    }

    console.log(`[LISTINGS-CREATE] Successfully created listing ${newListing.id} for user ${user.id}`)

    return NextResponse.json({
      message: 'Listing created successfully',
      listing: {
        id: newListing.id,
        title: newListing.listing_title_anonymous,
        status: newListing.status,
        created_at: newListing.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[LISTINGS-CREATE] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
