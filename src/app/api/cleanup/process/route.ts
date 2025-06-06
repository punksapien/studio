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

export async function POST(request: NextRequest) {
  try {
    // Verify this is an authorized cleanup request
    const authHeader = request.headers.get('Authorization');
    const expectedToken = process.env.CLEANUP_SERVICE_TOKEN || 'default-cleanup-token';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cleanup service token' },
        { status: 401 }
      );
    }

    console.log('[CLEANUP-SERVICE] Starting automated account cleanup process...');

    // Step 1: Mark expired accounts for deletion
    const { data: markResult, error: markError } = await supabaseAdmin
      .rpc('mark_expired_accounts_for_deletion');

    if (markError) {
      console.error('[CLEANUP-SERVICE] Error marking accounts for deletion:', markError);
      return NextResponse.json(
        { error: 'Failed to mark accounts for deletion', details: markError.message },
        { status: 500 }
      );
    }

    console.log(`[CLEANUP-SERVICE] Marked ${markResult} accounts for deletion`);

    // Step 2: Clean up accounts that have exceeded grace period
    const { data: cleanupResult, error: cleanupError } = await supabaseAdmin
      .rpc('cleanup_expired_accounts');

    if (cleanupError) {
      console.error('[CLEANUP-SERVICE] Error cleaning up accounts:', cleanupError);
      return NextResponse.json(
        { error: 'Failed to cleanup accounts', details: cleanupError.message },
        { status: 500 }
      );
    }

    console.log(`[CLEANUP-SERVICE] Cleaned up ${cleanupResult} accounts`);

    // Step 3: Get accounts that need Supabase Auth deletion
    const { data: pendingAuth, error: pendingError } = await supabaseAdmin
      .from('account_cleanup_audit')
      .select('user_id, user_email')
      .eq('action', 'deleted')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order('created_at', { ascending: false });

    if (pendingError) {
      console.error('[CLEANUP-SERVICE] Error fetching pending auth deletions:', pendingError);
    } else if (pendingAuth && pendingAuth.length > 0) {
      // Delete from Supabase Auth
      let authDeletionCount = 0;
      for (const account of pendingAuth) {
        try {
          const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(account.user_id);
          if (authDeleteError) {
            console.error(`[CLEANUP-SERVICE] Failed to delete user ${account.user_id} from auth:`, authDeleteError);
          } else {
            authDeletionCount++;
            console.log(`[CLEANUP-SERVICE] Deleted user ${account.user_email} (${account.user_id}) from Supabase Auth`);
          }
        } catch (error) {
          console.error(`[CLEANUP-SERVICE] Exception deleting user ${account.user_id} from auth:`, error);
        }
      }
      console.log(`[CLEANUP-SERVICE] Deleted ${authDeletionCount} users from Supabase Auth`);
    }

    // Step 4: Get current cleanup statistics
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('user_profiles')
      .select('account_status')
      .in('account_status', ['unverified', 'pending_deletion']);

    let statisticsSummary = { unverified: 0, pending_deletion: 0 };
    if (!statsError && stats) {
      statisticsSummary = stats.reduce((acc, profile) => {
        acc[profile.account_status as keyof typeof acc]++;
        return acc;
      }, { unverified: 0, pending_deletion: 0 });
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        accounts_marked_for_deletion: markResult || 0,
        accounts_cleaned_up: cleanupResult || 0,
        auth_deletions: pendingAuth?.length || 0
      },
      current_stats: statisticsSummary,
      message: 'Cleanup process completed successfully'
    };

    console.log('[CLEANUP-SERVICE] Cleanup process completed:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[CLEANUP-SERVICE] Unexpected error during cleanup:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
