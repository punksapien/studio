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
    const { request_type, listing_id, reason, action } = body;

    // Handle different actions: 'submit' (new request) or 'bump' (bump existing)
    const requestAction = action || 'submit';

    // Validate required fields for submission
    if (requestAction === 'submit' && (!request_type || !reason)) {
      return NextResponse.json(
        { error: 'request_type and reason are required for new requests' },
        { status: 400 }
      );
    }

    // Validate request_type
    if (requestAction === 'submit' && !['user_verification', 'listing_verification'].includes(request_type)) {
      return NextResponse.json(
        { error: 'Invalid request_type. Must be user_verification or listing_verification' },
        { status: 400 }
      );
    }

    // Validate listing_id for listing verification
    if (requestAction === 'submit' && request_type === 'listing_verification' && !listing_id) {
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

    // Check for existing requests
    let existingRequestQuery = supabase
      .from('verification_requests')
      .select('id, status, last_request_time, bump_count, last_bump_time, request_type')
      .eq('user_id', authResult.user.id);

    if (requestAction === 'submit') {
      existingRequestQuery = existingRequestQuery.eq('request_type', request_type);
      if (listing_id) {
        existingRequestQuery = existingRequestQuery.eq('listing_id', listing_id);
      } else {
        existingRequestQuery = existingRequestQuery.is('listing_id', null);
      }
    }

    const { data: existingRequests, error: checkError } = await existingRequestQuery;

    if (checkError) {
      console.error('Error checking existing verification request:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing verification requests' },
        { status: 500 }
      );
    }

    // Find pending requests
    const pendingStatuses = ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'];
    const pendingRequest = existingRequests?.find(req => pendingStatuses.includes(req.status));

    if (requestAction === 'submit') {
      // Check for 24-hour cooldown
      if (pendingRequest) {
        const lastRequestTime = new Date(pendingRequest.last_request_time);
        const now = new Date();
        const timeDiff = now.getTime() - lastRequestTime.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          const hoursRemaining = Math.ceil(24 - hoursDiff);
          return NextResponse.json(
            {
              error: 'Request cooldown active',
              message: `You can submit a new verification request in ${hoursRemaining} hours. After the cooldown, you can bump your existing request to the top of the queue.`,
              cooldown_hours_remaining: hoursRemaining,
              can_bump: false,
              existing_request: pendingRequest
            },
            { status: 429 }
          );
        }
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
        last_request_time: new Date().toISOString(),
        bump_count: 0,
        priority_score: 0,
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

    } else if (requestAction === 'bump') {
      // Handle bump request
      if (!pendingRequest) {
        return NextResponse.json(
          { error: 'No pending verification request found to bump' },
          { status: 404 }
        );
      }

      // Check if user can bump (24-hour cooldown from last bump or last request)
      const lastBumpTime = pendingRequest.last_bump_time ? new Date(pendingRequest.last_bump_time) : null;
      const lastRequestTime = new Date(pendingRequest.last_request_time);
      const now = new Date();

      const lastActionTime = lastBumpTime && lastBumpTime > lastRequestTime ? lastBumpTime : lastRequestTime;
      const timeDiff = now.getTime() - lastActionTime.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        const hoursRemaining = Math.ceil(24 - hoursDiff);
        return NextResponse.json(
          {
            error: 'Bump cooldown active',
            message: `You can bump your request in ${hoursRemaining} hours.`,
            cooldown_hours_remaining: hoursRemaining,
            can_bump: false
          },
          { status: 429 }
        );
      }

      // Update request with bump
      const newPriorityScore = Math.max(1, (pendingRequest.bump_count || 0) + 1) * 10;

      const { data: bumpedRequest, error: bumpError } = await supabase
        .from('verification_requests')
        .update({
          last_bump_time: new Date().toISOString(),
          bump_count: (pendingRequest.bump_count || 0) + 1,
          priority_score: newPriorityScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingRequest.id)
        .select()
        .single();

      if (bumpError) {
        console.error('Error bumping verification request:', bumpError);
        return NextResponse.json(
          { error: 'Failed to bump verification request' },
          { status: 500 }
        );
      }

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: authResult.user.id,
          type: 'verification',
          message: `Your verification request has been bumped to the top of the queue. Our team will prioritize your review.`,
          link: `/seller-dashboard/verification`,
          is_read: false
        });

      const responseTime = Date.now() - startTime;

      console.log(`[VERIFICATION-BUMP] Request ${pendingRequest.id} bumped for user ${authResult.user.id} (bump #${bumpedRequest.bump_count}) in ${responseTime}ms`);

      return NextResponse.json({
        success: true,
        request: bumpedRequest,
        message: `Your verification request has been bumped to the top of the queue. This is bump #${bumpedRequest.bump_count}.`,
        responseTime
      });
    }

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
        last_request_time,
        bump_count,
        last_bump_time,
        priority_score,
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

    // Calculate cooldown status for each request
    const requestsWithCooldown = requests?.map(request => {
      const lastBumpTime = request.last_bump_time ? new Date(request.last_bump_time) : null;
      const lastRequestTime = new Date(request.last_request_time);
      const now = new Date();

      const lastActionTime = lastBumpTime && lastBumpTime > lastRequestTime ? lastBumpTime : lastRequestTime;
      const timeDiff = now.getTime() - lastActionTime.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      const pendingStatuses = ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'];
      const isPending = pendingStatuses.includes(request.status);
      const canBump = isPending && hoursDiff >= 24;
      const hoursUntilCanBump = isPending && hoursDiff < 24 ? Math.ceil(24 - hoursDiff) : 0;

      return {
        ...request,
        can_bump: canBump,
        hours_until_can_bump: hoursUntilCanBump,
        is_pending: isPending
      };
    }) || [];

    const responseTime = Date.now() - startTime;

    console.log(`[VERIFICATION-STATUS] Fetched ${requests?.length || 0} verification requests for user ${authResult.user.id} in ${responseTime}ms`);

    return NextResponse.json({
      requests: requestsWithCooldown,
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
