import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize admin user
    const currentUser = await auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const requestId = params.id;

    // Fetch comprehensive verification request details
    const { data: requestDetail, error: requestError } = await supabaseAdmin
      .from('admin_verification_queue')
      .select(`
        *,
        user_profiles!verification_requests_user_id_fkey (
          id,
          email,
          full_name,
          first_name,
          last_name,
          initial_company_name,
          role,
          verification_status,
          phone_number,
          country,
          created_at,
          last_login
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError) {
      console.error('Error fetching verification request:', requestError);
      return NextResponse.json(
        { error: 'Failed to fetch verification request details' },
        { status: 500 }
      );
    }

    if (!requestDetail) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    // Fetch activity history
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from('verification_request_activities')
      .select(`
        *,
        admin:admin_id (
          full_name,
          first_name,
          last_name
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return NextResponse.json(
        { error: 'Failed to fetch request activities' },
        { status: 500 }
      );
    }

    // Fetch potential duplicates
    const { data: duplicates, error: duplicatesError } = await supabaseAdmin
      .from('verification_requests')
      .select(`
        id,
        created_at,
        status,
        user_notes,
        bump_count,
        priority_score,
        request_type
      `)
      .eq('user_id', requestDetail.user_id)
      .eq('request_type', requestDetail.request_type)
      .neq('id', requestId)
      .order('created_at', { ascending: false });

    if (duplicatesError) {
      console.error('Error fetching duplicates:', duplicatesError);
    }

    // Fetch associated listing if this is a listing verification
    let associatedListing = null;
    if (requestDetail.listing_id) {
      const { data: listing, error: listingError } = await supabaseAdmin
        .from('listings')
        .select(`
          id,
          listing_title_anonymous,
          industry,
          asking_price,
          status,
          created_at,
          location_country
        `)
        .eq('id', requestDetail.listing_id)
        .single();

      if (!listingError && listing) {
        associatedListing = listing;
      }
    }

    // Parse admin notes (if stored as JSONB array)
    let adminNotes = [];
    if (requestDetail.admin_notes) {
      try {
        adminNotes = Array.isArray(requestDetail.admin_notes)
          ? requestDetail.admin_notes
          : JSON.parse(requestDetail.admin_notes);
      } catch (e) {
        console.warn('Failed to parse admin_notes:', e);
        adminNotes = [];
      }
    }

    // Construct comprehensive response
    const response = {
      // Core request details
      request: {
        ...requestDetail,
        admin_notes: adminNotes,
        user_profile: requestDetail.user_profiles,
      },

      // Activity timeline
      activities: activities || [],

      // Potential duplicates
      duplicates: duplicates || [],

      // Associated listing (if applicable)
      associatedListing,

      // Summary statistics
      summary: {
        totalActivities: activities?.length || 0,
        totalDuplicates: duplicates?.length || 0,
        daysOld: requestDetail.days_old,
        priorityLevel: requestDetail.priority_level,
        priorityScore: requestDetail.priority_score,
        bumpCount: requestDetail.bump_count,
        hasNotes: (requestDetail.user_notes && requestDetail.user_notes.length > 0) || adminNotes.length > 0,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin verification detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
