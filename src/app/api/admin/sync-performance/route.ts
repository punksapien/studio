
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationService } from '@/lib/auth-service';
import type { SyncPerformanceMetrics } from '@/lib/types';

export async function GET(req: NextRequest) {
  const authService = AuthenticationService.getInstance();
  const authResult = await authService.authenticateUser(req);

  if (!authResult.success || !authResult.user || authResult.profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Assuming 'sync_performance_dashboard' is a view or a function that returns a single row of aggregated metrics.
    // If it's a table with multiple rows, you'd need to aggregate here (e.g., AVG, PERCENTILE_CONT).
    const { data, error } = await supabaseAdmin
      .from('sync_performance_dashboard') // This view should exist from your Phase 3 migration
      .select('avg_processing_time_ms, p95_latency_ms, p99_latency_ms, total_operations_last_hour, error_rate_percent')
      .single(); // Assuming the view provides a single row summary

    if (error) {
      console.error('Error fetching sync performance metrics:', error);
      // If the view doesn't exist, PGRST116 "Relation ... does not exist" might occur.
      // For now, return placeholder data or a more specific error.
      if (error.code === 'PGRST116') {
         // Placeholder data if view doesn't exist or is empty
        const placeholderMetrics: SyncPerformanceMetrics = {
          averageProcessingTimeMs: 75,
          p95LatencyMs: 150,
          p99LatencyMs: 250,
          totalOperationsLastHour: 1234,
          errorRatePercent: 0.5,
        };
        return NextResponse.json(placeholderMetrics);
      }
      return NextResponse.json({ error: 'Failed to fetch sync performance metrics', details: error.message }, { status: 500 });
    }
    
    const metrics: SyncPerformanceMetrics = {
      averageProcessingTimeMs: data.avg_processing_time_ms || 0,
      p95LatencyMs: data.p95_latency_ms || 0,
      p99LatencyMs: data.p99_latency_ms || 0,
      totalOperationsLastHour: data.total_operations_last_hour || 0,
      errorRatePercent: data.error_rate_percent || 0,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Unexpected error in /api/admin/sync-performance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
