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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status') || 'all';

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

    // Build query for seller verification requests using same schema as buyer API
    let query = supabase
      .from('verification_requests')
      .select(`
        id,
        user_id,
        request_type,
        status,
        reason,
        admin_notes,
        documents_submitted,
        created_at,
        updated_at,
        bump_count,
        last_bump_time,
        priority_score,
        bump_enabled,
        bump_disabled_reason,
        admin_locked_at,
        admin_lock_reason,
        user_notes,
        phone_number,
        best_time_to_call,
        user_profiles!verification_requests_user_id_fkey!inner (
          id,
          full_name,
          email,
          role,
          verification_status,
          phone_number,
          country,
          created_at,
          is_email_verified
        )
      `)
      .eq('user_profiles.role', 'seller')
      .eq('request_type', 'user_verification')
      .order('created_at', { ascending: false });

    // Apply status filter if not 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('verification_requests')
      .select('*, user_profiles!verification_requests_user_id_fkey!inner(*)', { count: 'exact', head: true })
      .eq('user_profiles.role', 'seller')
      .eq('request_type', 'user_verification');

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Get paginated results
    const { data: requests, error } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    // Transform the data to match frontend interface
    const transformedRequests = (requests || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      userName: item.user_profiles.full_name || 'Unknown User',
      userEmail: item.user_profiles.email,
      userPhone: item.phone_number || item.user_profiles.phone_number, // Use request phone first, fallback to profile
      userCountry: item.user_profiles.country,
      userRole: 'seller' as const,
      operationalStatus: item.status, // Use 'status' field to match buyer API
      profileStatus: item.user_profiles.verification_status,
      timestamp: item.created_at,
      listingId: null, // Will be null for user verification requests
      listingTitle: null, // Will be null for user verification requests
      reason: item.reason,
      documentsUrls: item.documents_submitted || [],
      adminNotes: item.admin_notes ? (typeof item.admin_notes === 'string' ?
        [{ id: '1', content: item.admin_notes, createdAt: new Date(), createdBy: 'System' }] :
        (Array.isArray(item.admin_notes) ? item.admin_notes : [])) : [],
      // New bump state tracking fields
      bumpCount: item.bump_count || 0,
      lastBumpTime: item.last_bump_time,
      priorityScore: item.priority_score || 0,
      bumpEnabled: item.bump_enabled !== false, // Default to true if null
      bumpDisabledReason: item.bump_disabled_reason,
      adminLockedAt: item.admin_locked_at,
      adminLockReason: item.admin_lock_reason,
      userNotes: item.user_notes,
      phoneNumber: item.phone_number, // Add phone number from request
      bestTimeToCall: item.best_time_to_call, // Add best time to call
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    const response = {
      requests: transformedRequests,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      },
      responseTime: Date.now() - startTime
    };

    console.log(`[ADMIN-VERIFICATION-QUEUE] Seller queue fetched: ${transformedRequests.length} requests (page ${page}, total: ${totalCount}) in ${response.responseTime}ms`);

    return NextResponse.json(response);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', responseTime },
      { status: 500 }
    );
  }
}
