import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
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

    // Delete from user_profiles (cascades)
    const { error: deleteError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[ADMIN-CLEANUP] Error deleting user profile:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user profile', details: deleteError.message },
        { status: 500 }
      );
    }

    // Delete from Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authDeleteError) {
      console.error('[ADMIN-CLEANUP] Error deleting from auth:', authDeleteError);
      // Don't fail the request - profile is already deleted
    }

    console.log(`[ADMIN-CLEANUP] Manually deleted user ${userInfo.email} (${id})`);

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
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
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
