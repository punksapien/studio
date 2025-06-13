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
    const status = searchParams.get('status') || 'verified_anonymous'
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

    // Apply status filter (default to verified_anonymous for public access)
    if (status) {
      query = query.eq('status', status)
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
    const user = await authServer.getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is a seller
    const userProfile = await authServer.getCurrentUserProfile(request)
    if (!userProfile || userProfile.role !== 'seller') {
      return NextResponse.json(
        { error: 'Only sellers can create listings' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Define required fields (using API names but mapping to DB names)
    const requiredFields = [
      'title',
      'short_description',
      'asking_price',
      'industry',
      'location_country',
      'location_city'
    ]

    // Check for required fields
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Field '${field}' is required` },
          { status: 400 }
        )
      }
    }

    // Prepare listing data - mapping API fields to DB fields
    const listingData = {
      seller_id: user.id,
      listing_title_anonymous: body.title || body.listingTitleAnonymous,
      anonymous_business_description: body.short_description || body.anonymousBusinessDescription,
      asking_price: body.asking_price ? parseFloat(body.asking_price) : (body.askingPrice ? parseFloat(body.askingPrice) : null),
      industry: body.industry,
      location_country: body.location_country || body.locationCountry,
      location_city_region_general: body.location_city || body.locationCityRegionGeneral,

      // Optional fields
      year_established: body.established_year ? parseInt(body.established_year) : (body.yearEstablished ? parseInt(body.yearEstablished) : null),
      number_of_employees: body.number_of_employees || body.numberOfEmployees || null,
      business_website_url: body.website_url || body.businessWebsiteUrl || null,
      image_urls: body.images || body.imageUrls || [],

      // Business details
      business_model: body.business_overview || body.businessModel || null,
      annual_revenue_range: body.annual_revenue_range || body.annualRevenueRange || null,
      net_profit_margin_range: body.net_profit_margin_range || body.netProfitMarginRange || null,
      specific_annual_revenue_last_year: body.annual_revenue ? parseFloat(body.annual_revenue) : (body.specificAnnualRevenueLastYear ? parseFloat(body.specificAnnualRevenueLastYear) : null),
      specific_net_profit_last_year: body.net_profit ? parseFloat(body.net_profit) : (body.specificNetProfitLastYear ? parseFloat(body.specificNetProfitLastYear) : null),
      adjusted_cash_flow: body.monthly_cash_flow ? parseFloat(body.monthly_cash_flow) : (body.adjustedCashFlow ? parseFloat(body.adjustedCashFlow) : null),

      // NEW: Individual key strength fields (enhanced form structure)
      key_strength_1: body.keyStrength1 ? String(body.keyStrength1).substring(0, 200) : null,
      key_strength_2: body.keyStrength2 ? String(body.keyStrength2).substring(0, 200) : null,
      key_strength_3: body.keyStrength3 ? String(body.keyStrength3).substring(0, 200) : null,

      // NEW: Individual growth opportunity fields (enhanced form structure)
      growth_opportunity_1: body.growthOpportunity1 ? String(body.growthOpportunity1).substring(0, 200) : null,
      growth_opportunity_2: body.growthOpportunity2 ? String(body.growthOpportunity2).substring(0, 200) : null,
      growth_opportunity_3: body.growthOpportunity3 ? String(body.growthOpportunity3).substring(0, 200) : null,

      // BACKWARD COMPATIBILITY: Support legacy JSONB format if individual fields not provided
      key_strengths_anonymous: body.keyStrengthsAnonymous ||
        (body.keyStrength1 ?
          [body.keyStrength1, body.keyStrength2, body.keyStrength3].filter(Boolean) :
          null),

      // Additional details
      reason_for_selling_anonymous: body.reason_for_selling || body.reasonForSellingAnonymous || null,
      detailed_reason_for_selling: body.detailed_reason_for_selling || body.detailedReasonForSelling || null,

      // REMOVED FIELDS (per client requirements):
      // - technology_stack (client said "rarely relevant to real SMBs")
      // - seller_role_and_time_commitment (client said "no need")
      // - post_sale_transition_support (client said "no need")

      // Set initial status based on seller verification
      status: userProfile.verification_status === 'verified' ? 'verified_anonymous' : 'active',
      is_seller_verified: userProfile.verification_status === 'verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newListing, error } = await supabase
      .from('listings')
      .insert(listingData)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating listing:', error)
      return NextResponse.json(
        { error: 'Failed to create listing' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Listing created successfully',
      listing: newListing
    }, { status: 201 })
  } catch (error) {
    console.error('Listing creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
