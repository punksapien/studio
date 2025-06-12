import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationService } from '@/services/AuthenticationService';

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface RouteParams {
  params: {
    id: string;
  };
}

// DELETE - Manually delete account
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const { reason, admin_user_id } = await request.json();

    // Get user info before deletion for audit
    const { data: userInfo, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('email, account_status')
      .eq('id', id)
      .single();

    if (userError || !userInfo) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Log the manual deletion
    await supabaseAdmin
      .from('account_cleanup_audit')
      .insert({
        user_id: id,
        user_email: userInfo.email,
        action: 'deleted',
        reason: reason || 'Manual deletion by admin',
        admin_user_id: admin_user_id,
        metadata: {
          manual: true,
          previous_status: userInfo.account_status,
          deleted_at: new Date().toISOString()
        }
      });

    // First, mark the zombie account as processed
    const { error: updateError } = await supabaseAdmin
      .from('zombie_accounts')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)

    if (updateError) {
      console.error('[ADMIN-CLEANUP] Error marking zombie account as processed:', updateError)
      return NextResponse.json(
        { error: 'Failed to mark zombie account as processed', details: updateError },
        { status: 500 }
      )
    }

    // Use the soft delete function for user account
    const { data: deleteResult, error: deleteError } = await supabaseAdmin
      .rpc('soft_delete_user_account', {
        user_id: id,
        deleter_id: authResult.user
      })

    if (deleteError) {
      console.error('[ADMIN-CLEANUP] Error soft deleting user account:', deleteError)
      return NextResponse.json(
        { error: 'Failed to soft delete user account', details: deleteError },
        { status: 500 }
      )
    }

    // Note: We still need to handle auth.users deletion separately
    // This is a limitation of Supabase - we can't soft delete from auth schema
    // You may want to keep auth users but mark them as inactive instead

    console.log(`[ADMIN-CLEANUP] Successfully soft deleted zombie account ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('[ADMIN-CLEANUP] Error in manual deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH - Update account (extend grace period or manually verify)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const { action, reason, admin_user_id, hours_extension = 24 } = await request.json();

    // Get current user info
    const { data: userInfo, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('email, account_status, verification_deadline, deletion_scheduled_at')
      .eq('id', id)
      .single();

    if (userError || !userInfo) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let auditAction = '';
    let auditReason = '';

    switch (action) {
      case 'extend':
        // Extend verification deadline
        const newDeadline = new Date(Date.now() + hours_extension * 60 * 60 * 1000);
        updateData = {
          verification_deadline: newDeadline.toISOString(),
          deletion_scheduled_at: null, // Reset deletion schedule
          account_status: 'unverified' // Reset to unverified if was pending deletion
        };
        auditAction = 'grace_extended';
        auditReason = reason || `Grace period extended by ${hours_extension} hours`;
        break;

      case 'verify':
        // Manually verify account
        updateData = {
          account_status: 'active',
          is_email_verified: true,
          verification_deadline: null,
          deletion_scheduled_at: null
        };
        auditAction = 'manually_verified';
        auditReason = reason || 'Manually verified by admin';
        break;

      case 'suspend':
        // Suspend account
        updateData = {
          account_status: 'suspended',
          verification_deadline: null,
          deletion_scheduled_at: null
        };
        auditAction = 'account_suspended';
        auditReason = reason || 'Account suspended by admin';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: extend, verify, or suspend' },
          { status: 400 }
        );
    }

    // Update user profile
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('[ADMIN-CLEANUP] Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user', details: updateError.message },
        { status: 500 }
      );
    }

    // Log the action
    await supabaseAdmin
      .from('account_cleanup_audit')
      .insert({
        user_id: id,
        user_email: userInfo.email,
        action: auditAction,
        reason: auditReason,
        admin_user_id: admin_user_id,
        metadata: {
          manual: true,
          previous_status: userInfo.account_status,
          new_data: updateData,
          hours_extension: action === 'extend' ? hours_extension : null
        }
      });

    console.log(`[ADMIN-CLEANUP] ${auditAction} for user ${userInfo.email} (${id})`);

    return NextResponse.json({
      success: true,
      message: `Account ${action} completed successfully`,
      updated_data: updateData
    });

  } catch (error) {
    console.error('[ADMIN-CLEANUP] Error in account update:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and check admin permissions
    const auth = new AuthenticationService()
    const authResult = await auth.authenticateUser(request)

    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (authResult.profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params;

    // Get user info before deletion for audit
    const { data: userInfo, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('email, account_status')
      .eq('id', id)
      .single();

    if (userError || !userInfo) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Log the manual deletion
    await supabaseAdmin
      .from('account_cleanup_audit')
      .insert({
        user_id: id,
        user_email: userInfo.email,
        action: 'deleted',
        reason: 'Manual deletion by admin',
        admin_user_id: authResult.user,
        metadata: {
          manual: true,
          previous_status: userInfo.account_status,
          deleted_at: new Date().toISOString()
        }
      });

    // First, mark the zombie account as processed
    const { error: updateError } = await supabaseAdmin
      .from('zombie_accounts')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)

    if (updateError) {
      console.error('[ADMIN-CLEANUP] Error marking zombie account as processed:', updateError)
      return NextResponse.json(
        { error: 'Failed to mark zombie account as processed', details: updateError },
        { status: 500 }
      )
    }

    // Use the soft delete function for user account
    const { data: deleteResult, error: deleteError } = await supabaseAdmin
      .rpc('soft_delete_user_account', {
        user_id: id,
        deleter_id: authResult.user
      })

    if (deleteError) {
      console.error('[ADMIN-CLEANUP] Error soft deleting user account:', deleteError)
      return NextResponse.json(
        { error: 'Failed to soft delete user account', details: deleteError },
        { status: 500 }
      )
    }

    // Note: We still need to handle auth.users deletion separately
    // This is a limitation of Supabase - we can't soft delete from auth schema
    // You may want to keep auth users but mark them as inactive instead

    console.log(`[ADMIN-CLEANUP] Successfully soft deleted zombie account ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('[ADMIN-CLEANUP] Error in manual deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and check admin permissions
    const auth = new AuthenticationService()
    const authResult = await auth.authenticateUser(request)

    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (authResult.profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params;
    const { action, reason, admin_user_id, hours_extension = 24 } = await request.json();

    // Get current user info
    const { data: userInfo, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('email, account_status, verification_deadline, deletion_scheduled_at')
      .eq('id', id)
      .single();

    if (userError || !userInfo) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let auditAction = '';
    let auditReason = '';

    switch (action) {
      case 'extend':
        // Extend verification deadline
        const newDeadline = new Date(Date.now() + hours_extension * 60 * 60 * 1000);
        updateData = {
          verification_deadline: newDeadline.toISOString(),
          deletion_scheduled_at: null, // Reset deletion schedule
          account_status: 'unverified' // Reset to unverified if was pending deletion
        };
        auditAction = 'grace_extended';
        auditReason = reason || `Grace period extended by ${hours_extension} hours`;
        break;

      case 'verify':
        // Manually verify account
        updateData = {
          account_status: 'active',
          is_email_verified: true,
          verification_deadline: null,
          deletion_scheduled_at: null
        };
        auditAction = 'manually_verified';
        auditReason = reason || 'Manually verified by admin';
        break;

      case 'suspend':
        // Suspend account
        updateData = {
          account_status: 'suspended',
          verification_deadline: null,
          deletion_scheduled_at: null
        };
        auditAction = 'account_suspended';
        auditReason = reason || 'Account suspended by admin';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: extend, verify, or suspend' },
          { status: 400 }
        );
    }

    // Update user profile
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('[ADMIN-CLEANUP] Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user', details: updateError.message },
        { status: 500 }
      );
    }

    // Log the action
    await supabaseAdmin
      .from('account_cleanup_audit')
      .insert({
        user_id: id,
        user_email: userInfo.email,
        action: auditAction,
        reason: auditReason,
        admin_user_id: admin_user_id,
        metadata: {
          manual: true,
          previous_status: userInfo.account_status,
          new_data: updateData,
          hours_extension: action === 'extend' ? hours_extension : null
        }
      });

    console.log(`[ADMIN-CLEANUP] ${auditAction} for user ${userInfo.email} (${id})`);

    return NextResponse.json({
      success: true,
      message: `Account ${action} completed successfully`,
      updated_data: updateData
    });

  } catch (error) {
    console.error('[ADMIN-CLEANUP] Error in account update:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
