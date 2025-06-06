import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationService } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { request_type, listing_id, reason } = body;

    // Validate required fields
    if (!request_type || !reason) {
      return NextResponse.json(
        { error: 'request_type and reason are required' },
        { status: 400 }
      );
    }

    // Validate request_type
    if (!['user_verification', 'listing_verification'].includes(request_type)) {
      return NextResponse.json(
        { error: 'Invalid request_type. Must be user_verification or listing_verification' },
        { status: 400 }
      );
    }

    // Validate listing_id for listing verification
    if (request_type === 'listing_verification' && !listing_id) {
      return NextResponse.json(
        { error: 'listing_id is required for listing_verification requests' },
        { status: 400 }
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

    // Check if user already has a pending verification request of this type
    let existingRequestQuery = supabase
      .from('verification_requests')
      .select('id, status')
      .eq('user_id', authResult.user.id)
      .eq('request_type', request_type)
      .in('status', ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested']);

    if (listing_id) {
      existingRequestQuery = existingRequestQuery.eq('listing_id', listing_id);
    } else {
      existingRequestQuery = existingRequestQuery.is('listing_id', null);
    }

    const { data: existingRequest, error: checkError } = await existingRequestQuery.single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing verification request:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing verification requests' },
        { status: 500 }
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'You already have a pending verification request of this type',
          existing_request: existingRequest
        },
        { status: 409 }
      );
    }

    // Create new verification request
    const newRequest = {
      user_id: authResult.user.id,
      listing_id: listing_id || null,
      request_type,
      status: 'New Request',
      reason,
      admin_notes: null,
      documents_submitted: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdRequest, error: createError } = await supabase
      .from('verification_requests')
      .insert(newRequest)
      .select()
      .single();

    if (createError) {
      console.error('Error creating verification request:', createError);
      return NextResponse.json(
        { error: 'Failed to create verification request' },
        { status: 500 }
      );
    }

    // Create notification for user
    await supabase
      .from('notifications')
      .insert({
        user_id: authResult.user.id,
        type: 'verification',
        message: `Your ${request_type.replace('_', ' ')} request has been submitted and is under review.`,
        link: `/seller-dashboard/verification`,
        is_read: false
      });

    const responseTime = Date.now() - startTime;

    console.log(`[VERIFICATION-REQUEST] New ${request_type} request created for user ${authResult.user.id} in ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      request: createdRequest,
      message: `Your ${request_type.replace('_', ' ')} request has been submitted successfully. Our team will review it and contact you soon.`,
      responseTime
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', responseTime },
      { status: 500 }
    );
  }
}

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

    // Get user's verification requests
    const { data: requests, error } = await supabase
      .from('verification_requests')
      .select(`
        id,
        listing_id,
        request_type,
        status,
        reason,
        admin_notes,
        documents_submitted,
        created_at,
        updated_at,
        listings (
          listing_title_anonymous,
          status
        )
      `)
      .eq('user_id', authResult.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching verification requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch verification requests' },
        { status: 500 }
      );
    }

    const responseTime = Date.now() - startTime;

    console.log(`[VERIFICATION-STATUS] Fetched ${requests?.length || 0} verification requests for user ${authResult.user.id} in ${responseTime}ms`);

    return NextResponse.json({
      requests: requests || [],
      current_status: authResult.profile.verification_status,
      responseTime
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', responseTime },
      { status: 500 }
    );
  }
}
