import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationService } from '@/lib/auth-service';
import { VERIFICATION_CONFIG } from '@/lib/verification-config';

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
    const {
      request_type,
      listing_id,
      reason,
      action,
      request_id,
      phone_number,
      best_time_to_call,
      user_notes
    } = body;

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
      .select('id, status, last_request_time, bump_count, last_bump_time, request_type, bump_enabled, bump_disabled_reason, admin_locked_at, admin_lock_reason, user_notes')
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
      // Check for cooldown using centralized config
      if (pendingRequest) {
        const lastRequestTime = new Date(pendingRequest.last_request_time);

        if (VERIFICATION_CONFIG.isCooldownActive(lastRequestTime)) {
          const secondsRemaining = VERIFICATION_CONFIG.getCooldownRemainingSeconds(lastRequestTime);
          const hoursRemaining = VERIFICATION_CONFIG.getCooldownRemainingHours(lastRequestTime);

          return NextResponse.json(
            {
              error: 'Request cooldown active',
              message: `You can submit a new verification request in ${VERIFICATION_CONFIG.formatTimeRemaining(hoursRemaining)}. After the cooldown, you can bump your existing request to the top of the queue.`,
              cooldown_hours_remaining: hoursRemaining,
              can_bump: false,
              existing_request: pendingRequest
            },
            { status: 429 }
          );
        }
      }

      // Use atomic function to create verification request and update user status
      const { data: result, error: createError } = await supabase
        .rpc('create_verification_request', {
          p_user_id: authResult.user.id,
          p_listing_id: listing_id || null,
          p_request_type: request_type,
          p_reason: reason,
          p_phone_number: phone_number || authResult.profile.phone_number,
          p_best_time_to_call: best_time_to_call || null,
          p_user_notes: user_notes || null
        });

      if (createError) {
        console.error('Error creating verification request:', createError);
        return NextResponse.json(
          { error: 'Failed to create verification request' },
          { status: 500 }
        );
      }

      // Check if the function returned a result
      if (!result || result.length === 0) {
        console.error('No result from create_verification_request function');
        return NextResponse.json(
          { error: 'Failed to create verification request - no result' },
          { status: 500 }
        );
      }

      const functionResult = result[0];

      // Check if the operation was successful
      if (!functionResult.success) {
        return NextResponse.json(
          { error: functionResult.message || 'Failed to create verification request' },
          { status: 400 }
        );
      }

      const responseTime = Date.now() - startTime;

      console.log(`[VERIFICATION-REQUEST] New ${request_type} request created for user ${authResult.user.id} (request_id: ${functionResult.request_id}) in ${responseTime}ms`);

      return NextResponse.json({
        success: true,
        request: {
          id: functionResult.request_id,
          user_id: authResult.user.id,
          request_type,
          status: 'New Request',
          reason,
          phone_number: phone_number || authResult.profile.phone_number,
          best_time_to_call: best_time_to_call || null,
          user_notes: user_notes || null
        },
        // ✅ PRODUCTION: Updated message for admin review workflow
        message: `Your ${request_type.replace('_', ' ')} request has been submitted successfully. Our team will review it and contact you soon.`,
        responseTime
      });

    } else if (requestAction === 'bump') {
      // Handle bump request using new production-grade function
      if (request_id) {
        console.log(`[VERIFICATION-BUMP-V2] Processing bump request for ID: ${request_id}`);

        // Use the new database function for bump validation and execution
        const { data: bumpResult, error: bumpError } = await supabase
          .rpc('execute_bump_request', {
            request_id: request_id,
            user_id: authResult.user.id,
            bump_reason: reason || null
          });

        if (bumpError) {
          console.error(`[VERIFICATION-BUMP-ERROR] Database error:`, bumpError);
          return NextResponse.json(
            { error: 'Database error while processing bump request' },
            { status: 500 }
          );
        }

        const result = bumpResult[0];
        const responseTime = Date.now() - startTime;

        if (!result.success) {
          console.log(`[VERIFICATION-BUMP-BLOCKED] Bump request blocked for user ${authResult.user.id}: ${result.message} in ${responseTime}ms`);
          return NextResponse.json(
            { error: result.message },
            { status: 400 }
          );
        }

        console.log(`[VERIFICATION-BUMP-SUCCESS] Request ${request_id} bumped for user ${authResult.user.id} (bump #${result.new_bump_count}, priority: ${result.new_priority_score}) in ${responseTime}ms`);

        return NextResponse.json({
          success: true,
          message: result.message,
          data: {
            request_id: request_id,
            bump_count: result.new_bump_count,
            priority_score: result.new_priority_score
          }
        });
      }
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
        bump_enabled,
        bump_disabled_reason,
        admin_locked_at,
        admin_lock_reason,
        user_notes,
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

    // Calculate cooldown status for each request using new database validation
    const requestsWithCooldown = await Promise.all(requests?.map(async (request) => {
      const pendingStatuses = ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'];
      const isPending = pendingStatuses.includes(request.status);

      let canBump = false;
      let hoursUntilCanBump = 0;

      if (isPending) {
        // Use the new database function to validate bump eligibility
        const { data: bumpValidation, error: validationError } = await supabase
          .rpc('validate_bump_request', {
            request_id: request.id,
            user_id: authResult.user.id
          });

        if (!validationError && bumpValidation && bumpValidation.length > 0) {
          const validation = bumpValidation[0];
          canBump = validation.can_bump;
          hoursUntilCanBump = validation.hours_until_eligible || 0;
        }
      }

      return {
        ...request,
        can_bump: canBump,
        hours_until_can_bump: hoursUntilCanBump,
        is_pending: isPending
      };
    }) || []);

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
