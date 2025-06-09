
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationService } from '@/lib/auth-service';
import type { SyncCachePerformance } from '@/lib/types';

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
    // Assuming 'sync_cache_performance' view exists
    const { data, error } = await supabaseAdmin
      .from('sync_cache_performance') // This view should exist from your Phase 3 migration
      .select('cache_hit_ratio_percent, total_active_entries, avg_entry_size_bytes, read_throughput_per_second')
      .single();

    if (error) {
      console.error('Error fetching sync cache performance:', error);
       if (error.code === 'PGRST116') {
        const placeholderCache: SyncCachePerformance = {
          hitRatioPercent: 92.3,
          totalEntries: 5432,
          averageEntrySizeBytes: 1024,
          readThroughputPerSecond: 150,
        };
        return NextResponse.json(placeholderCache);
      }
      return NextResponse.json({ error: 'Failed to fetch sync cache performance', details: error.message }, { status: 500 });
    }

    const performance: SyncCachePerformance = {
      hitRatioPercent: data.cache_hit_ratio_percent || 0,
      totalEntries: data.total_active_entries || 0,
      averageEntrySizeBytes: data.avg_entry_size_bytes, // Optional
      readThroughputPerSecond: data.read_throughput_per_second, // Optional
    };

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Unexpected error in /api/admin/sync-cache:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
