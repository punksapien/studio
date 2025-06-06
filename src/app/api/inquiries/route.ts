import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AuthenticationService } from '@/lib/auth-service'

// GET /api/inquiries - Get user's inquiries (buyer or seller perspective)
export async function GET(request: NextRequest) {
  try {
    const authService = AuthenticationService.getInstance()
    const result = await authService.authenticateUser(request)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = result.user!
    const userProfile = result.profile!

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const status = searchParams.get('status') // Optional status filter
    const role = searchParams.get('role') || userProfile.role // buyer or seller

    let query = supabase
      .from('inquiries')
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        status,
        conversation_id,
        inquiry_timestamp,
        engagement_timestamp,
        created_at,
        updated_at,
        listings (
          id,
          listing_title_anonymous,
          asking_price,
          industry,
          location_country
        ),
        buyer_profile:user_profiles!buyer_id (
          id,
          full_name,
          verification_status
        ),
        seller_profile:user_profiles!seller_id (
          id,
          full_name,
          verification_status
        )
      `, { count: 'exact' })

    // Filter based on user role
    if (role === 'buyer') {
      query = query.eq('buyer_id', user.id)
    } else if (role === 'seller') {
      query = query.eq('seller_id', user.id)
    } else {
      // Admin can see all inquiries
      if (userProfile.role !== 'admin') {
        return NextResponse.json(
          { error: 'Invalid role specified' },
          { status: 400 }
        )
      }
    }

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination and ordering
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query
      .order('updated_at', { ascending: false })
      .range(from, to)

    const { data: inquiries, error, count } = await query

    if (error) {
      console.error('Error fetching inquiries:', error)
      return NextResponse.json(
        { error: 'Failed to fetch inquiries' },
        { status: 500 }
      )
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasMore = page < totalPages

    return NextResponse.json({
      inquiries: inquiries || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore
      }
    })
  } catch (error) {
    console.error('Inquiries fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/inquiries - Create new inquiry (buyers only)
export async function POST(request: NextRequest) {
  try {
    const authService = AuthenticationService.getInstance()
    const result = await authService.authenticateUser(request)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = result.user!
    const userProfile = result.profile!

    if (userProfile.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyers can create inquiries' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { listing_id, message } = body

    // Validate required fields
    if (!listing_id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message must be 1000 characters or less' },
        { status: 400 }
      )
    }

    // Check if listing exists and get seller info
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, seller_id, status, listing_title_anonymous')
      .eq('id', listing_id)
      .single()

    if (listingError) {
      if (listingError.code === 'PGRST116') {
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

    // Check if listing is available for inquiries
    if (!['verified_anonymous', 'verified_with_financials'].includes(listing.status)) {
      return NextResponse.json(
        { error: 'This listing is not available for inquiries' },
        { status: 400 }
      )
    }

    // Check if buyer is trying to inquire about their own listing
    if (listing.seller_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot inquire about your own listing' },
        { status: 400 }
      )
    }

    // Check if buyer already has an active inquiry for this listing
    const { data: existingInquiry, error: existingError } = await supabase
      .from('inquiries')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('buyer_id', user.id)
      .not('status', 'eq', 'archived')
      .single()

    if (existingInquiry) {
      return NextResponse.json(
        { error: 'You already have an active inquiry for this listing' },
        { status: 400 }
      )
    }

    // Create the inquiry (without message field since it doesn't exist in the table)
    const inquiryData = {
      listing_id: listing_id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      status: 'new_inquiry',
      inquiry_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newInquiry, error } = await supabase
      .from('inquiries')
      .insert(inquiryData)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating inquiry:', error)
      return NextResponse.json(
        { error: 'Failed to create inquiry' },
        { status: 500 }
      )
    }

    // Note: Message handling would need to be implemented separately
    // when the conversation/messaging system is built
    // For now, we just create the inquiry without the initial message

    return NextResponse.json({
      message: 'Inquiry created successfully',
      inquiry: newInquiry,
      note: 'Initial message will be handled when conversation system is implemented'
    }, { status: 201 })
  } catch (error) {
    console.error('Inquiry creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
