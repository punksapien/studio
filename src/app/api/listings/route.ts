import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { authServer } from '@/lib/auth-server'
import { normalizeIndustryValue, normalizeCountryValue } from '@/lib/marketplace-utils'
import { sampleListings, transformSampleForList } from '@/lib/sample-listings'
import { sendEmailWithResend } from '@/lib/resend-service'

// Notify all admins (in-app + optional email) that a new listing awaits review
async function notifyAdminsOfPendingListing(listingId: string, listingTitle: string) {
  const { data: admins, error: adminsError } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('role', 'admin')

  if (adminsError) {
    console.error('[LISTINGS-CREATE] Failed to fetch admins for notification:', adminsError)
  } else if (admins && admins.length > 0) {
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert(admins.map((admin) => ({
        user_id: admin.id,
        type: 'listing_update',
        message: `New listing "${listingTitle}" is awaiting approval.`,
        link: '/admin/listings?status=pending_approval',
        is_read: false,
      })))
    if (notificationError) {
      console.error('[LISTINGS-CREATE] Failed to create admin notifications:', notificationError)
    }
  }

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
  if (adminEmail) {
    await sendEmailWithResend({
      to: adminEmail,
      from: process.env.NODE_ENV === 'production' ? 'noreply@nobridge.co' : 'onboarding@resend.dev',
      subject: `New listing pending approval: ${listingTitle}`,
      html: `<p>A new listing has been submitted and is awaiting review:</p>
             <p><strong>${listingTitle}</strong></p>
             <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nobridge.co'}/admin/listings/${listingId}">Review this listing</a></p>`,
    })
  }
}

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

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser(request)
    if (!user) {
      console.error('[LISTINGS-CREATE] Authentication failed - no user found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.log(`[LISTINGS-CREATE] Authenticated user: ${user.id}`)
    const userProfile = await authServer.getCurrentUserProfile(request)
    if (!userProfile || userProfile.role !== 'seller') {
      console.error(`[LISTINGS-CREATE] Access denied - user ${user.id} is not a seller. Role: ${userProfile?.role || 'none'}`)
      return NextResponse.json({ error: 'Only sellers can create listings' }, { status: 403 })
    }
    console.log(`[LISTINGS-CREATE] Seller verified: ${user.id}, verification status: ${userProfile.verification_status}`)
    let body: any
    try {
      body = await request.json()
    } catch (error) {
      console.error('[LISTINGS-CREATE] Invalid JSON in request body:', error)
      return NextResponse.json({ error: 'Invalid request body - must be valid JSON' }, { status: 400 })
    }
    const requiredFields = ['listingTitleAnonymous', 'anonymousBusinessDescription', 'askingPrice', 'industry', 'locationCountry', 'locationCityRegionGeneral', 'annualRevenueRange']
    const missingFields = requiredFields.filter(field => !body[field])
    if (missingFields.length > 0) {
      console.error(`[LISTINGS-CREATE] Missing required fields: ${missingFields.join(', ')}`)
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 })
    }
    const askingPrice = parseFloat(body.askingPrice)
    if (isNaN(askingPrice) || askingPrice <= 0) {
      console.error(`[LISTINGS-CREATE] Invalid asking price: ${body.askingPrice}`)
      return NextResponse.json({ error: 'Asking price must be a positive number' }, { status: 400 })
    }
    const listingData = {
      seller_id: user.id,
      listing_title_anonymous: String(body.listingTitleAnonymous).trim(),
      anonymous_business_description: String(body.anonymousBusinessDescription).trim(),
      asking_price: askingPrice,
      industry: String(body.industry).trim(),
      location_country: String(body.locationCountry).trim(),
      location_city_region_general: String(body.locationCityRegionGeneral).trim(),
      year_established: body.yearEstablished ? parseInt(body.yearEstablished) : null,
      number_of_employees: body.numberOfEmployees || null,
      business_website_url: body.businessWebsiteUrl ? String(body.businessWebsiteUrl).trim() : null,
      image_urls: Array.isArray(body.image_urls) ? body.image_urls : (body.image_urls ? [body.image_urls] : []),
      business_model: body.businessModel ? String(body.businessModel).trim() : null,
      annual_revenue_range: body.annualRevenueRange || null,
      net_profit_margin_range: body.netProfitMarginRange || null,
      specific_annual_revenue_last_year: body.specificAnnualRevenueLastYear ? parseFloat(body.specificAnnualRevenueLastYear) : null,
      specific_net_profit_last_year: body.specificNetProfitLastYear ? parseFloat(body.specificNetProfitLastYear) : null,
      adjusted_cash_flow: body.adjustedCashFlow ? parseFloat(body.adjustedCashFlow) : null,
      key_strength_1: body.keyStrength1 ? String(body.keyStrength1).substring(0, 200) : null,
      key_strength_2: body.keyStrength2 ? String(body.keyStrength2).substring(0, 200) : null,
      key_strength_3: body.keyStrength3 ? String(body.keyStrength3).substring(0, 200) : null,
      growth_opportunity_1: body.growthOpportunity1 ? String(body.growthOpportunity1).substring(0, 200) : null,
      growth_opportunity_2: body.growthOpportunity2 ? String(body.growthOpportunity2).substring(0, 200) : null,
      growth_opportunity_3: body.growthOpportunity3 ? String(body.growthOpportunity3).substring(0, 200) : null,
      deal_structure_looking_for: Array.isArray(body.dealStructureLookingFor) ? body.dealStructureLookingFor : [],
      reason_for_selling_anonymous: body.reasonForSellingAnonymous ? String(body.reasonForSellingAnonymous).trim() : null,
      detailed_reason_for_selling: body.detailedReasonForSelling ? String(body.detailedReasonForSelling).trim() : null,
      technology_stack: body.technologyStack ? String(body.technologyStack).trim() : null,
      actual_company_name: body.actualCompanyName ? String(body.actualCompanyName).trim() : null,
      full_business_address: body.fullBusinessAddress ? String(body.fullBusinessAddress).trim() : null,
      adjusted_cash_flow_explanation: body.adjustedCashFlowExplanation ? String(body.adjustedCashFlowExplanation).trim() : null,
      seller_role_and_time_commitment: body.sellerRoleAndTimeCommitment ? String(body.sellerRoleAndTimeCommitment).trim() : null,
      post_sale_transition_support: body.postSaleTransitionSupport ? String(body.postSaleTransitionSupport).trim() : null,
      financial_documents_url: body.financial_documents_url || null,
      key_metrics_report_url: body.key_metrics_report_url || null,
      ownership_documents_url: body.ownership_documents_url || null,
      financial_snapshot_url: body.financial_snapshot_url || null,
      ownership_details_url: body.ownership_details_url || null,
      location_real_estate_info_url: body.location_real_estate_info_url || null,
      web_presence_info_url: body.web_presence_info_url || null,
      secure_data_room_link: body.secureDataRoomLink ? String(body.secureDataRoomLink).trim() : null,
      // All new listings require admin approval before becoming publicly visible
      status: 'pending_approval',
      is_seller_verified: userProfile.verification_status === 'verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    console.log(`[LISTINGS-CREATE] Prepared listing data for user ${user.id}:`, { title: listingData.listing_title_anonymous, industry: listingData.industry, asking_price: listingData.asking_price, status: listingData.status })
    const { supabase: authenticatedSupabase } = authServer.createServerClient(request)
    const { data: newListing, error } = await authenticatedSupabase.from('listings').insert(listingData).select('*').single()
    if (error) {
      console.error(`[LISTINGS-CREATE] Database error for user ${user.id}:`, error)
      if (error.code === '42501') return NextResponse.json({ error: 'Permission denied. Please ensure you are logged in as a seller.' }, { status: 403 })
      else if (error.code === '23505') return NextResponse.json({ error: 'A listing with this information already exists.' }, { status: 409 })
      else if (error.code === '23514') return NextResponse.json({ error: 'Invalid data provided. Please check all fields and try again.' }, { status: 400 })
      else return NextResponse.json({ error: 'Failed to create listing. Please try again.' }, { status: 500 })
    }
    console.log(`[LISTINGS-CREATE] Successfully created listing ${newListing.id} for user ${user.id}`)

    // Notify admins of the new pending listing (fire-and-forget; never block the response)
    notifyAdminsOfPendingListing(newListing.id, newListing.listing_title_anonymous).catch((notifyError) => {
      console.error('[LISTINGS-CREATE] Failed to notify admins of pending listing:', notifyError)
    })

    return NextResponse.json({ message: 'Listing submitted for review. It will become publicly visible once approved by our team.', listing: { id: newListing.id, title: newListing.listing_title_anonymous, status: newListing.status, created_at: newListing.created_at } }, { status: 201 })
  } catch (error) {
    console.error('[LISTINGS-CREATE] Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
  }
}
