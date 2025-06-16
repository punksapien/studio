import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Admin endpoint to prompt users for verification
 * POST /api/admin/prompt-verification
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const { userId, userRole, reason, urgencyLevel = 'normal' } = await request.json();

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'userId and userRole are required' },
        { status: 400 }
      );
    }

    // Authenticate admin user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: adminProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin role required' },
        { status: 403 }
      );
    }

    // Get target user details
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role, verification_status')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already verified
    if (targetUser.verification_status === 'verified') {
      return NextResponse.json(
        { error: 'User is already verified' },
        { status: 400 }
      );
    }

    // Create verification prompt notification
    const urgencyMessages = {
      low: 'When you have time, please consider verifying your profile to unlock additional features.',
      normal: 'To proceed with your current inquiry and access full platform features, please verify your profile.',
      high: '⚡ Priority: Please verify your profile immediately to continue with your active inquiries and unlock full access.',
      urgent: '🚨 URGENT: Immediate verification required to proceed with time-sensitive inquiries. Please verify now.'
    };

    const notificationMessage = reason
      ? `Admin Request: ${reason} - ${urgencyMessages[urgencyLevel as keyof typeof urgencyMessages]}`
      : urgencyMessages[urgencyLevel as keyof typeof urgencyMessages];

    const dashboardLink = userRole === 'seller' ? '/seller-dashboard/verification' : '/dashboard/verification';

    // Insert notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'verification_prompt',
        message: notificationMessage,
        link: dashboardLink,
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('[ADMIN-PROMPT-VERIFICATION] Failed to create notification:', notificationError);
      return NextResponse.json(
        { error: 'Failed to create verification prompt' },
        { status: 500 }
      );
    }

    // Log admin action
    const { error: logError } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: user.id,
        action_type: 'verification_prompt',
        target_type: 'user',
        target_id: userId,
        details: {
          target_user_name: targetUser.full_name,
          target_user_email: targetUser.email,
          target_user_role: targetUser.role,
          current_verification_status: targetUser.verification_status,
          reason: reason || 'Admin verification prompt',
          urgency_level: urgencyLevel
        },
        timestamp: new Date().toISOString()
      });

    if (logError) {
      console.warn('[ADMIN-PROMPT-VERIFICATION] Failed to log admin action:', logError);
      // Don't fail the operation for logging issues
    }

    const responseTime = Date.now() - startTime;

    console.log(`[ADMIN-PROMPT-VERIFICATION] Verification prompt sent to ${targetUser.full_name} (${userId}) in ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      message: `Verification prompt sent to ${targetUser.full_name}`,
      details: {
        user_id: userId,
        user_name: targetUser.full_name,
        urgency_level: urgencyLevel,
        notification_sent: true
      },
      responseTime
    });

  } catch (error) {
    console.error('[ADMIN-PROMPT-VERIFICATION] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
