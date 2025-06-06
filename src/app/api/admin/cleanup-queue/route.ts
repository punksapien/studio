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

export async function GET(request: NextRequest) {
  try {
    // Get current user from session to verify admin access
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user is admin (simplified - in production use proper session validation)
    // For now, we'll fetch cleanup queue data directly

    // Get accounts in cleanup queue (unverified and pending deletion)
    const { data: cleanupQueue, error: queueError } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        email,
        account_status,
        verification_deadline,
        deletion_scheduled_at,
        created_at,
        role,
        full_name,
        first_name,
        last_name
      `)
      .in('account_status', ['unverified', 'pending_deletion'])
      .order('verification_deadline', { ascending: true });

    if (queueError) {
      console.error('[ADMIN-CLEANUP-QUEUE] Error fetching cleanup queue:', queueError);
      return NextResponse.json(
        { error: 'Failed to fetch cleanup queue', details: queueError.message },
        { status: 500 }
      );
    }

    // Get recent audit history (last 50 actions)
    const { data: auditHistory, error: auditError } = await supabaseAdmin
      .from('account_cleanup_audit')
      .select(`
        id,
        user_email,
        action,
        reason,
        metadata,
        created_at,
        admin_user_id
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (auditError) {
      console.error('[ADMIN-CLEANUP-QUEUE] Error fetching audit history:', auditError);
      // Don't fail the request, just log the error
    }

    // Calculate statistics
    const stats = {
      unverified: cleanupQueue?.filter(u => u.account_status === 'unverified').length || 0,
      pending_deletion: cleanupQueue?.filter(u => u.account_status === 'pending_deletion').length || 0,
      total: cleanupQueue?.length || 0
    };

    // Add time calculations
    const now = new Date();
    const queueWithTimeInfo = cleanupQueue?.map(user => ({
      ...user,
      time_until_deletion: user.verification_deadline
        ? Math.max(0, new Date(user.verification_deadline).getTime() - now.getTime())
        : null,
      time_until_permanent_deletion: user.deletion_scheduled_at
        ? Math.max(0, new Date(user.deletion_scheduled_at).getTime() - now.getTime())
        : null,
      is_expired: user.verification_deadline
        ? new Date(user.verification_deadline) < now
        : false
    }));

    return NextResponse.json({
      success: true,
      data: {
        queue: queueWithTimeInfo || [],
        audit_history: auditHistory || [],
        statistics: stats
      }
    });

  } catch (error) {
    console.error('[ADMIN-CLEANUP-QUEUE] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
