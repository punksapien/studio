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

    // First, get the current verification request to check if it exists and get user info
    const { data: currentRequest, error: fetchError } = await supabase
      .from('verification_requests')
      .select(`
        id,
        user_id,
        status,
        admin_notes,
        user_profiles!verification_requests_user_id_fkey!inner (
          id,
          verification_status,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !currentRequest) {
      console.error('Verification request not found:', fetchError);
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    // Prepare updates
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    // Update operational status if provided
    if (operationalStatus) {
      updates.status = operationalStatus;
    }

    // Auto-sync operational status with profile status for consistency
    if (profileStatus) {
      if (profileStatus === 'rejected') {
        updates.status = 'Rejected';
      } else if (profileStatus === 'verified') {
        updates.status = 'Approved';
      }
    }

    // Handle admin notes - append new note to existing notes
    if (adminNote) {
      const currentNotes = currentRequest.admin_notes || [];
      const newNote = {
        id: Date.now().toString(),
        content: adminNote,
        createdAt: new Date().toISOString(),
        createdBy: adminName || authResult.profile.full_name || 'Admin',
        operationalStatus: operationalStatus || currentRequest.status,
        profileStatus: profileStatus || currentRequest.user_profiles.verification_status
      };

      const updatedNotes = Array.isArray(currentNotes)
        ? [...currentNotes, newNote]
        : [newNote];

      updates.admin_notes = updatedNotes;
    }

    // Update verification request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('verification_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating verification request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update verification request' },
        { status: 500 }
      );
    }

    // Update user profile verification status if provided
    if (profileStatus) {
      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .update({
          verification_status: profileStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentRequest.user_id);

      if (profileUpdateError) {
        console.error('Error updating user profile status:', profileUpdateError);
        return NextResponse.json(
          { error: 'Failed to update user profile status' },
          { status: 500 }
        );
      }
    }

    // Create notification for user about status change
    if (operationalStatus || profileStatus) {
      const notificationMessage = operationalStatus
        ? `Your verification request status has been updated to: ${operationalStatus}`
        : `Your profile verification status has been updated to: ${profileStatus}`;

      await supabase
        .from('notifications')
        .insert({
          user_id: currentRequest.user_id,
          type: 'verification',
          message: notificationMessage,
          link: '/seller-dashboard/verification',
          is_read: false,
          created_at: new Date().toISOString()
        });
    }

    const responseTime = Date.now() - startTime;

    console.log(`[ADMIN-VERIFICATION-UPDATE] Request ${id} updated by admin ${authResult.user.id} in ${responseTime}ms`);
    console.log(`[ADMIN-VERIFICATION-UPDATE] Changes - Operational: ${operationalStatus || 'unchanged'}, Profile: ${profileStatus || 'unchanged'}, Note: ${adminNote ? 'added' : 'none'}`);

    return NextResponse.json({
      success: true,
      message: 'Verification request updated successfully',
      data: {
        id: updatedRequest.id,
        operationalStatus: updatedRequest.status,
        profileStatus: profileStatus || currentRequest.user_profiles.verification_status,
        adminNotes: updatedRequest.admin_notes,
        updatedAt: updatedRequest.updated_at
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
