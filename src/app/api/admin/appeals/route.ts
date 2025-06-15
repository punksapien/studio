import { NextRequest, NextResponse } from 'next/server';
import { authServer } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get current user and verify admin access
    const user = await authServer.getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const profile = await authServer.getCurrentUserProfile(request);
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status'); // pending, under_review, approved, denied
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const search = searchParams.get('search');

    // Build query for appeals with listing and seller information
    let query = supabaseAdmin
      .from('listing_appeals')
      .select(`
        id,
        listing_id,
        seller_id,
        appeal_message,
        original_rejection_reason,
        original_rejection_category,
        status,
        admin_response,
        reviewed_by,
        created_at,
        reviewed_at,
        listings (
          id,
          listing_title_anonymous,
          industry,
          asking_price,
          status,
          admin_notes,
          rejection_category,
          admin_action_at
        ),
        seller:user_profiles!seller_id (
          id,
          first_name,
          last_name,
          email,
          verification_status
        ),
        reviewer:user_profiles!reviewed_by (
          id,
          first_name,
          last_name
        )
      `);

    // Apply status filter
    if (status && ['pending', 'under_review', 'approved', 'denied'].includes(status)) {
      query = query.eq('status', status);
    }

    // Apply search filter (search in listing title, seller name, or appeal message)
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.or(`
        appeal_message.ilike.${searchTerm},
        listings.listing_title_anonymous.ilike.${searchTerm},
        seller.first_name.ilike.${searchTerm},
        seller.last_name.ilike.${searchTerm}
      `);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'reviewed_at', 'status'];
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: appeals, error: appealsError, count } = await query;

    if (appealsError) {
      console.error('[ADMIN_APPEALS] Query error:', appealsError);
      return NextResponse.json(
        { error: 'Failed to fetch appeals' },
        { status: 500 }
      );
    }

    // Get summary statistics
    const { data: summaryData, error: summaryError } = await supabaseAdmin
      .from('listing_appeals')
      .select('status');

    const summary = {
      total: summaryData?.length || 0,
      pending: summaryData?.filter(a => a.status === 'pending').length || 0,
      under_review: summaryData?.filter(a => a.status === 'under_review').length || 0,
      approved: summaryData?.filter(a => a.status === 'approved').length || 0,
      denied: summaryData?.filter(a => a.status === 'denied').length || 0,
    };

    // Transform appeals data for frontend
    const transformedAppeals = appeals?.map(appeal => ({
      id: appeal.id,
      listing_id: appeal.listing_id,
      seller_id: appeal.seller_id,
      appeal_message: appeal.appeal_message,
      original_rejection_reason: appeal.original_rejection_reason,
      original_rejection_category: appeal.original_rejection_category,
      status: appeal.status,
      admin_response: appeal.admin_response,
      reviewed_by: appeal.reviewed_by,
      created_at: appeal.created_at,
      reviewed_at: appeal.reviewed_at,
      listing: appeal.listings ? {
        id: appeal.listings.id,
        title: appeal.listings.listing_title_anonymous,
        industry: appeal.listings.industry,
        asking_price: appeal.listings.asking_price,
        status: appeal.listings.status,
        admin_notes: appeal.listings.admin_notes,
        rejection_category: appeal.listings.rejection_category,
        admin_action_at: appeal.listings.admin_action_at
      } : null,
      seller: appeal.seller ? {
        id: appeal.seller.id,
        first_name: appeal.seller.first_name,
        last_name: appeal.seller.last_name,
        email: appeal.seller.email,
        verification_status: appeal.seller.verification_status
      } : null,
      reviewer: appeal.reviewer ? {
        id: appeal.reviewer.id,
        first_name: appeal.reviewer.first_name,
        last_name: appeal.reviewer.last_name
      } : null
    })) || [];

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0;
    const hasMore = page < totalPages;

    console.log(`[ADMIN_APPEALS] Retrieved ${appeals?.length || 0} appeals for admin ${user.id}`);

    return NextResponse.json({
      appeals: transformedAppeals,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore
      },
      summary
    });

  } catch (error) {
    console.error('[ADMIN_APPEALS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
