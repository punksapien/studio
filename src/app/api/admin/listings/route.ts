import { NextRequest, NextResponse } from 'next/server';
import { authServer } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ADMIN_LISTING_UPDATABLE_FIELDS } from '@/lib/admin-listing-fields';
import type { AdminListingWithContext, ListingStatus, RejectionCategory } from '@/lib/types';

// GET /api/admin/listings - Fetch all listings with admin context
export async function GET(request: NextRequest) {
  try {
    // Authenticate and verify admin role
    const user = await authServer.getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await authServer.getCurrentUserProfile(request);
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Filtering parameters
    const statusFilter = searchParams.get('status') as ListingStatus | null;
    const industryFilter = searchParams.get('industry');
    const sellerVerificationFilter = searchParams.get('seller_verification'); // 'verified', 'not_verified', 'all'
    const sellerIdFilter = searchParams.get('seller_id');
    const searchQuery = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    console.log(`[ADMIN-LISTINGS] Fetching listings - Page: ${page}, Limit: ${limit}, Status: ${statusFilter}, Industry: ${industryFilter}`);

    // Build the base query without joins to avoid PostgREST ambiguity
    let query = supabaseAdmin
      .from('listings')
      .select(`
        id,
        seller_id,
        listing_title_anonymous,
        industry,
        location_country,
        location_city_region_general,
        anonymous_business_description,
        annual_revenue_range,
        asking_price,
        status,
        is_seller_verified,
        admin_notes,
        admin_action_by,
        admin_action_at,
        rejection_category,
        listing_verification_status,
        listing_verification_by,
        listing_verification_at,
        listing_verification_notes,
        created_at,
        updated_at,
        inquiry_count
      `);

    // Apply filters
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (industryFilter && industryFilter !== 'all') {
      query = query.eq('industry', industryFilter);
    }

    if (sellerVerificationFilter && sellerVerificationFilter !== 'all') {
      if (sellerVerificationFilter === 'verified') {
        query = query.eq('is_seller_verified', true);
      } else if (sellerVerificationFilter === 'not_verified') {
        query = query.eq('is_seller_verified', false);
      }
    }

    if (sellerIdFilter) {
      query = query.eq('seller_id', sellerIdFilter);
    }

    // Apply search filter
    if (searchQuery) {
      // Search in title and description
      query = query.or(`listing_title_anonymous.ilike.%${searchQuery}%,anonymous_business_description.ilike.%${searchQuery}%`);
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'updated_at', 'asking_price', 'status', 'listing_title_anonymous'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('[ADMIN-LISTINGS] Count query error:', countError);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: listings, error } = await query;

    if (error) {
      console.error('[ADMIN-LISTINGS] Database error:', error);
      console.error('[ADMIN-LISTINGS] Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: error.message },
        { status: 500 }
      );
    }

    // Fetch seller user profiles separately to avoid PostgREST join ambiguity
    const sellerIds = [...new Set((listings || []).map((listing: any) => listing.seller_id))];
    const { data: sellerProfiles } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        full_name,
        email,
        verification_status,
        created_at
      `)
      .in('id', sellerIds);

    // Create a map for quick seller profile lookup
    const sellerProfileMap = new Map(
      (sellerProfiles || []).map((profile: any) => [profile.id, profile])
    );

    // Transform data to match AdminListingWithContext interface
    const transformedListings: AdminListingWithContext[] = await Promise.all(
      (listings || []).map(async (listing: any) => {
        // Fetch admin action history for this listing (without joins)
        const { data: adminHistory } = await supabaseAdmin
          .from('admin_listing_actions')
          .select(`
            id,
            listing_id,
            admin_user_id,
            action_type,
            previous_status,
            new_status,
            admin_notes,
            created_at
          `)
          .eq('listing_id', listing.id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch appeal information if exists (without joins)
        const { data: appeal } = await supabaseAdmin
          .from('listing_appeals')
          .select(`
            id,
            listing_id,
            seller_id,
            original_rejection_reason,
            original_rejection_category,
            appeal_message,
            status,
            admin_response,
            reviewed_by,
            created_at,
            reviewed_at
          `)
          .eq('listing_id', listing.id)
          .single();

        return {
          listing: {
            id: listing.id,
            sellerId: listing.seller_id,
            listingTitleAnonymous: listing.listing_title_anonymous,
            industry: listing.industry,
            locationCountry: listing.location_country,
            locationCityRegionGeneral: listing.location_city_region_general,
            anonymousBusinessDescription: listing.anonymous_business_description,
            annualRevenueRange: listing.annual_revenue_range,
            askingPrice: listing.asking_price,
            status: listing.status,
            isSellerVerified: listing.is_seller_verified,
            adminNotes: listing.admin_notes,
            adminActionBy: listing.admin_action_by,
            adminActionAt: listing.admin_action_at ? new Date(listing.admin_action_at) : undefined,
            rejectionCategory: listing.rejection_category,
            listingVerificationStatus: listing.listing_verification_status,
            listingVerificationBy: listing.listing_verification_by,
            listingVerificationAt: listing.listing_verification_at ? new Date(listing.listing_verification_at) : undefined,
            listingVerificationNotes: listing.listing_verification_notes,
            createdAt: new Date(listing.created_at),
            updatedAt: new Date(listing.updated_at),
            inquiryCount: listing.inquiry_count || 0,
            // Required fields for Listing interface
            keyStrengthsAnonymous: [],
          } as any,
          seller: (() => {
            const sellerProfile = sellerProfileMap.get(listing.seller_id);
            return sellerProfile ? {
              id: sellerProfile.id,
              fullName: sellerProfile.full_name,
              email: sellerProfile.email,
              verificationStatus: sellerProfile.verification_status,
              createdAt: new Date(sellerProfile.created_at),
            } : null;
          })(),
          adminHistory: (adminHistory || []).map((action: any) => ({
            id: action.id,
            listingId: action.listing_id,
            adminUserId: action.admin_user_id,
            adminName: null, // Admin names removed to avoid PostgREST joins
            actionType: action.action_type,
            previousStatus: action.previous_status,
            newStatus: action.new_status,
            reasonCategory: action.reason_category,
            adminNotes: action.admin_notes,
            createdAt: new Date(action.created_at),
          })),
          appeal: appeal ? {
            id: appeal.id,
            listingId: appeal.listing_id,
            sellerId: appeal.seller_id,
            originalRejectionReason: appeal.original_rejection_reason,
            originalRejectionCategory: appeal.original_rejection_category,
            appealMessage: appeal.appeal_message,
            status: appeal.status,
            adminResponse: appeal.admin_response,
            reviewedBy: appeal.reviewed_by,
            reviewedByName: null, // Reviewer names removed to avoid PostgREST joins
            createdAt: new Date(appeal.created_at),
            reviewedAt: appeal.reviewed_at ? new Date(appeal.reviewed_at) : undefined,
          } : undefined,
        };
      })
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil((totalCount || 0) / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get summary statistics
    const { data: statusCounts } = await supabaseAdmin
      .from('listings')
      .select('status')
      .then(({ data }) => {
        const counts = data?.reduce((acc: Record<string, number>, listing: any) => {
          acc[listing.status] = (acc[listing.status] || 0) + 1;
          return acc;
        }, {});
        return { data: counts };
      });

    console.log(`[ADMIN-LISTINGS] Successfully fetched ${transformedListings.length} listings`);

    return NextResponse.json({
      success: true,
      data: {
        listings: transformedListings,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: totalCount || 0,
          hasNext,
          hasPrev,
          limit,
        },
        summary: {
          statusCounts: statusCounts || {},
          totalListings: totalCount || 0,
        },
        filters: {
          appliedFilters: {
            status: statusFilter,
            industry: industryFilter,
            sellerVerification: sellerVerificationFilter,
            search: searchQuery,
          },
        },
      },
    });

  } catch (error) {
    console.error('[ADMIN-LISTINGS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/listings - Create a listing on behalf of a seller (admin-managed)
export async function POST(request: NextRequest) {
  try {
    // Authenticate and verify admin role
    const user = await authServer.getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await authServer.getCurrentUserProfile(request);
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body - must be valid JSON' },
        { status: 400 }
      );
    }

    const { seller_id, status: requestedStatus, adminReason, notifySeller, ...listingFields } = body;

    // Require seller and admin reason
    if (!seller_id || typeof seller_id !== 'string') {
      return NextResponse.json(
        { error: 'A seller (seller_id) is required' },
        { status: 400 }
      );
    }
    if (!adminReason || typeof adminReason !== 'string' || adminReason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Admin reason for creation is required' },
        { status: 400 }
      );
    }

    // Validate status (default pending_approval)
    const validStatuses = ['draft', 'pending_approval', 'active', 'inactive'];
    const status = requestedStatus || 'pending_approval';
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate the target seller: exists, is a seller, not soft-deleted
    const { data: targetSeller, error: sellerError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, email, role, verification_status, deleted_at')
      .eq('id', seller_id)
      .single();

    if (sellerError || !targetSeller) {
      return NextResponse.json(
        { error: 'Target seller not found' },
        { status: 404 }
      );
    }
    if (targetSeller.deleted_at) {
      return NextResponse.json(
        { error: 'Target seller account has been deleted' },
        { status: 400 }
      );
    }
    if (targetSeller.role !== 'seller') {
      return NextResponse.json(
        { error: 'Target user is not a seller' },
        { status: 400 }
      );
    }

    console.log(`[ADMIN-CREATE-LISTING] Admin ${user.id} creating listing for seller ${seller_id} with status ${status}`);

    // Build the insert payload from the shared admin-updatable field whitelist.
    // `status` is handled explicitly below, so it is skipped here.
    const insertData: Record<string, any> = {};
    for (const field of ADMIN_LISTING_UPDATABLE_FIELDS) {
      if (field === 'status') continue;
      if (field in listingFields) {
        insertData[field] = listingFields[field];
      }
    }

    // Derived / admin-controlled fields
    const nowIso = new Date().toISOString();
    insertData.seller_id = seller_id;
    insertData.status = status;
    insertData.is_seller_verified = targetSeller.verification_status === 'verified';
    insertData.admin_action_by = user.id;
    insertData.admin_action_at = nowIso;
    insertData.admin_notes = adminReason;
    insertData.created_at = nowIso;
    insertData.updated_at = nowIso;

    // A publicly visible status implies admin approval
    if (status === 'active') {
      insertData.approved_at = nowIso;
      insertData.approved_by = user.id;
    }

    // Insert via service role (bypasses RLS + approval-gate trigger)
    const { data: listing, error: insertError } = await supabaseAdmin
      .from('listings')
      .insert(insertData)
      .select('*')
      .single();

    if (insertError) {
      console.error('[ADMIN-CREATE-LISTING] Failed to create listing:', insertError);
      if (insertError.code === '23502' || insertError.code === '23514') {
        return NextResponse.json(
          { error: 'Invalid or missing listing data. Please check all required fields.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create listing' },
        { status: 500 }
      );
    }

    console.log(`[ADMIN-CREATE-LISTING] Created listing ${listing.id} for seller ${seller_id}`);

    // Audit trail
    const { error: auditError } = await supabaseAdmin
      .from('admin_listing_actions')
      .insert({
        listing_id: listing.id,
        admin_user_id: user.id,
        action_type: 'created',
        new_status: status,
        admin_notes: adminReason,
      });
    if (auditError) {
      console.warn('[ADMIN-CREATE-LISTING] Failed to log audit trail:', auditError);
      // Non-fatal: the listing was created successfully
    }

    // Notify the seller (unless explicitly suppressed)
    if (notifySeller !== false) {
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: seller_id,
          type: 'listing_update',
          message: `A new listing "${listing.listing_title_anonymous}" has been created for you by the Nobridge team.`,
          link: '/seller-dashboard/listings',
          is_read: false,
        });
      if (notificationError) {
        console.warn('[ADMIN-CREATE-LISTING] Failed to create seller notification:', notificationError);
        // Non-fatal
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: { listing },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[ADMIN-CREATE-LISTING] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
