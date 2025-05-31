import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@/lib/auth'

// GET /api/user/listings - Get current user's listings
export async function GET(request: NextRequest) {
  try {
    const user = await auth.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Max 50 items per page
    const status = searchParams.get('status') // Optional status filter
    const sortBy = searchParams.get('sort_by') || 'updated_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Build the query for user's listings
    let query = supabase
      .from('listings')
      .select(`
        id,
        title,
        short_description,
        business_overview,
        asking_price,
        business_type,
        industry,
        location_country,
        location_city,
        established_year,
        number_of_employees,
        website_url,
        images,
        status,
        verification_status,
        created_at,
        updated_at,
        annual_revenue,
        net_profit,
        monthly_cash_flow,
        verified_annual_revenue,
        verified_net_profit,
        verified_cash_flow,
        sold_date,
        withdrawn_date
      `)
      .eq('seller_id', user.id)

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'asking_price', 'title', 'status']
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
      console.error('Error fetching user listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch your listings' },
        { status: 500 }
      )
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasMore = page < totalPages

    // Add summary statistics for user's listings
    const { data: summaryData, error: summaryError } = await supabase
      .from('listings')
      .select('status')
      .eq('seller_id', user.id)

    const summary = {
      total: summaryData?.length || 0,
      draft: summaryData?.filter(l => l.status === 'draft').length || 0,
      verified_anonymous: summaryData?.filter(l => l.status === 'verified_anonymous').length || 0,
      verified_with_financials: summaryData?.filter(l => l.status === 'verified_with_financials').length || 0,
      sold: summaryData?.filter(l => l.status === 'sold').length || 0,
      withdrawn: summaryData?.filter(l => l.status === 'withdrawn').length || 0
    }

    return NextResponse.json({
      listings: listings || [],
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
