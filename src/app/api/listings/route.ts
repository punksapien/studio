import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authServer } from '@/lib/auth-server'
import { normalizeIndustryValue, normalizeCountryValue } from '@/lib/marketplace-utils'
import { sampleListings, transformSampleForList } from '@/lib/sample-listings'

// GET /api/listings - Get all listings with filtering, search, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Max 50 items per page
    const industry = searchParams.get('industry')
    const country = searchParams.get('country')
    const listingType = searchParams.get('listingType')
    const minRevenue = searchParams.get('min_revenue')
    const maxRevenue = searchParams.get('max_revenue')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    const keywordsParam = searchParams.get('keywords')
    const predefinedKeywords = keywordsParam ? keywordsParam.split(',').map(k => k.trim()).filter(Boolean) : []

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
        ebitda,
        key_strengths_anonymous,
        key_strength_1,
        key_strength_2,
        key_strength_3,
        growth_opportunity_1,
        growth_opportunity_2,
        growth_opportunity_3,
        specific_growth_opportunities,
        listing_type
      `, { count: 'exact' })

    // Handle status filtering — only public statuses may be requested here.
    // Sellers see their own listings via /api/user/listings, admins via /api/admin/listings.
    const publicStatuses = ['active', 'verified_anonymous', 'verified_public']
    if (status && publicStatuses.includes(status)) {
      query = query.eq('status', status)
    } else {
      query = query.in('status', publicStatuses)
    }
    query = query.is('deleted_at', null)

    // Apply listing type filter if specified
    if (listingType) {
      const validTypes = ['full_acquisition', 'partial_acquisition', 'open_to_talks', 'external_full_acquisition']
      if (validTypes.includes(listingType)) {
        query = query.eq('listing_type', listingType)
        console.log(`[LISTINGS-API] Listing type filter: ${listingType}`)
      } else {
        console.log(`[LISTINGS-API] Unknown listing type filter: "${listingType}", showing all listings`)
      }
    }

    // Normalize filter values to match database format
    const normalizedIndustry = normalizeIndustryValue(industry)
    const normalizedCountry = normalizeCountryValue(country)

    if (normalizedIndustry) {
      console.log(`[LISTINGS-API] Industry filter: "${industry}" normalized to "${normalizedIndustry}"`)
      query = query.ilike('industry', normalizedIndustry)
    }
    if (normalizedCountry) {
      console.log(`[LISTINGS-API] Country filter: "${country}" normalized to "${normalizedCountry}"`)
      query = query.ilike('location_country', normalizedCountry)
    }
    if (minRevenue) query = query.gte('specific_annual_revenue_last_year', parseInt(minRevenue))
    if (maxRevenue) query = query.lte('specific_annual_revenue_last_year', parseInt(maxRevenue))

    // Note: General text search is now handled entirely through the keywords system

    // Handle keyword filtering with exact matching approach
    if (predefinedKeywords.length > 0) {
      console.log(`[LISTINGS-API] Applying exact keyword search for: ${predefinedKeywords.join(', ')}`);

      // Search fields for keyword matching
      const keywordSearchFields = [
        'listing_title_anonymous', 'anonymous_business_description',
        'key_strength_1', 'key_strength_2', 'key_strength_3',
        'growth_opportunity_1', 'growth_opportunity_2', 'growth_opportunity_3',
        'industry', 'location_country', 'location_city_region_general'
      ];

      // Build exact keyword search conditions
      const keywordConditions: string[] = [];
      for (const keyword of predefinedKeywords) {
        // For each keyword, search across all relevant fields
        const fieldConditions = keywordSearchFields.map(field =>
          `${field}.ilike.%${keyword}%`
        ).join(',');
        keywordConditions.push(fieldConditions);
      }

      if (keywordConditions.length > 0) {
        // Combine all keyword conditions with OR logic
        // This means: (keyword1 in any field) OR (keyword2 in any field) OR ...
        const combinedConditions = keywordConditions.join(',');
        query = query.or(combinedConditions);
        console.log(`[LISTINGS-API] Exact keyword filtering applied for: ${predefinedKeywords.join(', ')}`);
      }
    }

    // General text search is now handled through the keywords system above


    const validSortFields = ['created_at', 'asking_price', 'listing_title_anonymous', 'year_established', 'specific_annual_revenue_last_year', 'adjusted_cash_flow'];
    const validSortOrders = ['asc', 'desc'];
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: listings, error, count } = await query

    if (error) {
      console.error('Error fetching listings:', error)
      // Fallback to sample listings when database is unavailable (local dev)
      console.log('[LISTINGS-API] Database unavailable, returning sample listings')
      let fallbackSamples = sampleListings.map(transformSampleForList)
      if (normalizedCountry) {
        fallbackSamples = fallbackSamples.filter(s => s.location_country.toLowerCase() === normalizedCountry.toLowerCase())
      }
      if (sortBy === 'specific_annual_revenue_last_year') {
        fallbackSamples.sort((a, b) => sortOrder === 'desc' ? (b.verified_annual_revenue || 0) - (a.verified_annual_revenue || 0) : (a.verified_annual_revenue || 0) - (b.verified_annual_revenue || 0))
      }
      const fallbackTotal = fallbackSamples.length
      const samples = fallbackSamples.slice(from, from + limit)
      return NextResponse.json({
        listings: samples,
        pagination: { page, limit, total: fallbackTotal, totalPages: Math.ceil(fallbackTotal / limit), hasMore: from + limit < fallbackTotal }
      })
    }

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
      listing_type: listing.listing_type || 'full_acquisition',
      created_at: listing.created_at,
      updated_at: listing.updated_at,
      seller_id: listing.seller_id,
      annual_revenue_range: listing.annual_revenue_range,
      net_profit_margin_range: listing.net_profit_margin_range,
      verified_annual_revenue: listing.specific_annual_revenue_last_year,
      verified_net_profit: listing.specific_net_profit_last_year,
      verified_cash_flow: listing.adjusted_cash_flow,
      key_strength_1: listing.key_strength_1,
      key_strength_2: listing.key_strength_2,
      key_strength_3: listing.key_strength_3,
      growth_opportunity_1: listing.growth_opportunity_1,
      growth_opportunity_2: listing.growth_opportunity_2,
      growth_opportunity_3: listing.growth_opportunity_3,
      key_strengths_anonymous: listing.key_strengths_anonymous || (listing.key_strength_1 ? [listing.key_strength_1, listing.key_strength_2, listing.key_strength_3].filter(Boolean) : null),
      specific_growth_opportunities: listing.specific_growth_opportunities || (listing.growth_opportunity_1 ? [listing.growth_opportunity_1, listing.growth_opportunity_2, listing.growth_opportunity_3].filter(Boolean).map(opp => `• ${opp}`).join('\n') : null)
    }))

    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasMore = page < totalPages

    return NextResponse.json({
      listings: transformedListings || [],
      pagination: { page, limit, total: count || 0, totalPages, hasMore }
    })
  } catch (error) {
    console.error('Listings fetch error:', error)
    // Fallback to sample listings when database is completely unavailable
    console.log('[LISTINGS-API] Database unavailable (catch), returning sample listings')
    const fallbackLimit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '10'), 50)
    const fallbackPage = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const fallbackFrom = (fallbackPage - 1) * fallbackLimit
    const fallbackCountry = request.nextUrl.searchParams.get('country')
    const fallbackSortBy = request.nextUrl.searchParams.get('sort_by') || 'created_at'
    const fallbackSortOrder = request.nextUrl.searchParams.get('sort_order') || 'desc'
    let catchSamples = sampleListings.map(transformSampleForList)
    if (fallbackCountry) {
      catchSamples = catchSamples.filter(s => s.location_country.toLowerCase() === fallbackCountry.toLowerCase())
    }
    if (fallbackSortBy === 'specific_annual_revenue_last_year') {
      catchSamples.sort((a, b) => fallbackSortOrder === 'desc' ? (b.verified_annual_revenue || 0) - (a.verified_annual_revenue || 0) : (a.verified_annual_revenue || 0) - (b.verified_annual_revenue || 0))
    }
    const catchTotal = catchSamples.length
    const samples = catchSamples.slice(fallbackFrom, fallbackFrom + fallbackLimit)
    return NextResponse.json({
      listings: samples,
      pagination: { page: fallbackPage, limit: fallbackLimit, total: catchTotal, totalPages: Math.ceil(catchTotal / fallbackLimit), hasMore: fallbackFrom + fallbackLimit < catchTotal }
    })
  }
}

// POST /api/listings - Listing creation is admin-managed; sellers are read-only.
export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Listings are created on behalf of sellers by the Nobridge team via the
    // admin API. Self-serve creation is disabled.
    return NextResponse.json(
      { error: 'Listing creation is managed by the Nobridge team.' },
      { status: 403 }
    )
  } catch (error) {
    console.error('[LISTINGS-CREATE] Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
  }
}
