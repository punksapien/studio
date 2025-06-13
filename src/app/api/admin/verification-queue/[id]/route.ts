import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationService } from '@/lib/auth-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await params;
    const body = await request.json();
    const {
      operationalStatus,
      profileStatus,
      adminNote,
      adminName,
      lockRequest,
      unlockRequest,
      lockReason
    } = body;

    // Validate required fields
    if (!operationalStatus && !profileStatus && !adminNote && !lockRequest && !unlockRequest) {
      return NextResponse.json(
        { error: 'At least one field (operationalStatus, profileStatus, adminNote, lockRequest, unlockRequest) is required' },
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

    // Handle admin lock/unlock requests first
    if (lockRequest || unlockRequest) {
      const action = lockRequest ? 'lock' : 'unlock';
      const reason = lockReason || (lockRequest ? 'Admin is reviewing this request' : null);

      const { data: lockResult, error: lockError } = await supabase
        .rpc('admin_lock_verification_request', {
          request_id: id,
          admin_id: authResult.user.id,
          action: action,
          lock_reason: reason
        });

      if (lockError) {
        console.error(`Error ${action}ing verification request:`, lockError);
        return NextResponse.json(
          { error: `Failed to ${action} verification request` },
          { status: 500 }
        );
      }

      const result = lockResult[0];
      const responseTime = Date.now() - startTime;

      console.log(`[ADMIN-VERIFICATION-${action.toUpperCase()}] Request ${id} ${action}ed by admin ${authResult.user.id} in ${responseTime}ms`);

      return NextResponse.json({
        success: true,
        message: `Verification request ${action}ed successfully`,
        data: {
          id: id,
          locked: action === 'lock',
          lockReason: reason,
          lockedAt: action === 'lock' ? new Date().toISOString() : null
        },
        responseTime
      });
    }

    // Use atomic function to update verification status
    if (operationalStatus || profileStatus || adminNote) {
      const { data: updateResult, error: updateError } = await supabase
        .rpc('update_verification_status', {
          p_request_id: id,
          p_new_operational_status: operationalStatus || null,
          p_new_profile_status: profileStatus || null,
          p_admin_note: adminNote || null,
          p_admin_name: adminName || authResult.profile.full_name || 'Admin'
        });

      if (updateError) {
        console.error('Error updating verification status:', updateError);
        return NextResponse.json(
          { error: 'Failed to update verification status: ' + updateError.message },
          { status: 500 }
        );
      }

      if (!updateResult || updateResult.length === 0) {
        return NextResponse.json(
          { error: 'No result from update function' },
          { status: 500 }
        );
      }

      const result = updateResult[0];

      if (!result.success) {
        return NextResponse.json(
          { error: result.message || 'Failed to update verification status' },
          { status: 400 }
        );
      }

      const responseTime = Date.now() - startTime;

      console.log(`[ADMIN-VERIFICATION-UPDATE] Request ${id} updated by admin ${authResult.user.id} in ${responseTime}ms`);
      console.log(`[ADMIN-VERIFICATION-UPDATE] Changes - Operational: ${operationalStatus || 'unchanged'}, Profile: ${profileStatus || 'unchanged'}, Note: ${adminNote ? 'added' : 'none'}`);

      // Fetch the updated request to return current state
      const { data: updatedRequest, error: fetchError } = await supabase
        .from('verification_requests')
        .select(`
          id,
          status,
          admin_notes,
          updated_at,
          user_profiles!verification_requests_user_id_fkey!inner (
            verification_status
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError || !updatedRequest) {
        console.error('Error fetching updated request:', fetchError);
        // Don't fail the whole request, just return success
        return NextResponse.json({
          success: true,
          message: result.message,
          responseTime
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Verification status updated successfully',
        data: {
          id: updatedRequest.id,
          operationalStatus: updatedRequest.status,
          profileStatus: updatedRequest.user_profiles.verification_status,
          adminNotes: updatedRequest.admin_notes,
          updatedAt: updatedRequest.updated_at
        },
        responseTime
      });
    }

    // If no update operation was requested
    return NextResponse.json(
      { error: 'No update operation specified' },
      { status: 400 }
    );

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', responseTime },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await params;

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

    // Get verification request with user details
    const { data: request, error } = await supabase
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
        user_profiles!verification_requests_user_id_fkey!inner (
          id,
          full_name,
          email,
          role,
          verification_status,
          phone_number,
          country,
          is_email_verified
        )
      `)
      .eq('id', id)
      .single();

    if (error || !request) {
      console.error('Verification request not found:', error);
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      request: {
        id: request.id,
        userId: request.user_id,
        userName: request.user_profiles.full_name,
        userEmail: request.user_profiles.email,
        userRole: request.user_profiles.role,
        operationalStatus: request.status,
        profileStatus: request.user_profiles.verification_status,
        reason: request.reason,
        adminNotes: request.admin_notes || [],
        documentsSubmitted: request.documents_submitted || [],
        createdAt: request.created_at,
        updatedAt: request.updated_at
      },
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
