import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationService } from '@/lib/auth-service';

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

    // Ensure admin role
    if (authResult.profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
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

    // Calculate date ranges
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    try {
      // Get ready for connection count
      const { count: readyForConnectionCount, error: readyError } = await supabase
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ready_for_admin_connection');

      if (readyError) {
        console.error('[ADMIN-STATS] Error counting ready for connection:', readyError);
      }

      // Get pending verification count
      const { count: pendingVerificationCount, error: pendingError } = await supabase
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .in('status', [
          'seller_engaged_buyer_pending_verification',
          'seller_engaged_seller_pending_verification'
        ]);

      if (pendingError) {
        console.error('[ADMIN-STATS] Error counting pending verification:', pendingError);
      }

      // Get total facilitated today
      const { count: facilitatedTodayCount, error: facilitatedTodayError } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      if (facilitatedTodayError) {
        console.error('[ADMIN-STATS] Error counting facilitated today:', facilitatedTodayError);
      }

      // Get total active conversations
      const { count: activeConversationsCount, error: activeConversationsError } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      if (activeConversationsError) {
        console.error('[ADMIN-STATS] Error counting active conversations:', activeConversationsError);
      }

      const stats = {
        ready_for_connection: readyForConnectionCount || 0,
        pending_verification: pendingVerificationCount || 0,
        total_facilitated_today: facilitatedTodayCount || 0,
        total_active_conversations: activeConversationsCount || 0
      };

      const response = {
        success: true,
        stats,
        responseTime: Date.now() - startTime
      };

      console.log(`[ADMIN-STATS] Statistics fetched in ${response.responseTime}ms`);

      return NextResponse.json(response);

    } catch (dbError) {
      console.error('[ADMIN-STATS] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch statistics', responseTime: Date.now() - startTime },
        { status: 500 }
      );
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('[ADMIN-STATS] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', responseTime },
      { status: 500 }
    );
  }
}
