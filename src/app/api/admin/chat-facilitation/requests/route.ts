import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationService } from '@/lib/auth-service';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authService = new AuthenticationService();
    const authResult = await authService.authenticateUser(request);

    if (!authResult.success || !authResult.user || !authResult.profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Ensure admin role
    if (authResult.profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Create Supabase service client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get search and filter parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Build query for inquiries ready for facilitation or with specific statuses
    let query = supabase
      .from('inquiries')
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        status,
        initial_message,
        inquiry_timestamp,
        engagement_timestamp,
        listing:listing_id (
          id,
          listing_title_anonymous,
          asking_price,
          industry,
          location_city_region_general,
          location_country
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
      .order('inquiry_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    } else {
      // Default: show inquiries that need admin attention
      query = query.in('status', [
        'ready_for_admin_connection',
        'connection_facilitated_in_app_chat_opened',
        'seller_engaged_buyer_pending_verification',
        'seller_engaged_seller_pending_verification'
      ]);
    }

    const { data: inquiries, error: inquiriesError } = await query;

    if (inquiriesError) {
      console.error('[ADMIN-CHAT-FACILITATION] Error fetching inquiries:', inquiriesError);
      return NextResponse.json(
        { error: 'Failed to fetch facilitation requests' },
        { status: 500 }
      );
    }

    // Count total matching records for pagination
    let countQuery = supabase
      .from('inquiries')
      .select('id', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    } else {
      countQuery = countQuery.in('status', [
        'ready_for_admin_connection',
        'connection_facilitated_in_app_chat_opened',
        'seller_engaged_buyer_pending_verification',
        'seller_engaged_seller_pending_verification'
      ]);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('[ADMIN-CHAT-FACILITATION] Error counting inquiries:', countError);
    }

    // Transform the data to match expected interface
    const formattedRequests = inquiries?.map(inquiry => ({
      id: inquiry.id,
      listing_id: inquiry.listing_id,
      buyer_id: inquiry.buyer_id,
      seller_id: inquiry.seller_id,
      status: inquiry.status,
      initial_message: inquiry.initial_message,
      inquiry_timestamp: inquiry.inquiry_timestamp,
      engagement_timestamp: inquiry.engagement_timestamp,
      listing: inquiry.listing,
      buyer: inquiry.buyer,
      seller: inquiry.seller
    })) || [];

    const response = {
      success: true,
      requests: formattedRequests,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      responseTime: Date.now() - startTime
    };

    console.log(`[ADMIN-CHAT-FACILITATION] Requests fetched: ${formattedRequests.length} requests (offset ${offset}, total: ${count}) in ${response.responseTime}ms`);

    return NextResponse.json(response);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('[ADMIN-CHAT-FACILITATION] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', responseTime },
      { status: 500 }
    );
  }
}
