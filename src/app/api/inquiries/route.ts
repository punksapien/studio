import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthenticationService } from '@/lib/auth-service'

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/inquiries - Fetch inquiries for the current user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await AuthenticationService.getInstance().authenticateUser(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user, profile } = authResult
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || profile?.role || 'buyer'
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('inquiries')
      .select(`
        *,
        listing:listing_id (
          id,
          listing_title_anonymous,
          industry,
          asking_price,
          location_city_region_general,
          location_country,
          is_seller_verified
        ),
        buyer:buyer_id (
          id,
          full_name,
          email,
          verification_status
        ),
        seller:seller_id (
          id,
          full_name,
          email,
          verification_status
        )
      `)
      .limit(limit)
      .order('created_at', { ascending: false })

    // Filter based on user role
    if (role === 'buyer') {
      query = query.eq('buyer_id', user.id)
    } else if (role === 'seller') {
      query = query.eq('seller_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching inquiries:', error)
      return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 })
    }

    return NextResponse.json({ inquiries: data || [] })

  } catch (error) {
    console.error('Unexpected error in inquiries API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/inquiries - Create a new inquiry
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await AuthenticationService.getInstance().authenticateUser(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user, profile } = authResult

    // Only buyers can create inquiries
    if (profile?.role !== 'buyer') {
      return NextResponse.json({ error: 'Only buyers can create inquiries' }, { status: 403 })
    }

    const body = await request.json()
    const { listing_id, message } = body

    if (!listing_id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    // Get the listing to find the seller
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, seller_id, listing_title_anonymous, status')
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check if buyer already has an inquiry for this listing
    const { data: existingInquiry } = await supabase
      .from('inquiries')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('listing_id', listing_id)
      .single()

    if (existingInquiry) {
      return NextResponse.json({
        error: 'You have already submitted an inquiry for this listing',
        inquiry_id: existingInquiry.id
      }, { status: 409 })
    }

    // Create the inquiry
    const inquiryData = {
      buyer_id: user.id,
      seller_id: listing.seller_id,
      listing_id: listing_id,
      status: 'pending',
      initial_message: message || 'I am interested in learning more about this business opportunity.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .insert([inquiryData])
      .select()
      .single()

    if (inquiryError) {
      console.error('Error creating inquiry:', inquiryError)
      return NextResponse.json({ error: 'Failed to create inquiry' }, { status: 500 })
    }

    // Log the successful inquiry creation
    console.log(`[INQUIRY-CREATED] Buyer ${user.id} created inquiry for listing ${listing_id}`)

    return NextResponse.json({
      inquiry,
      message: 'Inquiry created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in inquiry creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
