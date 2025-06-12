import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService } from '@/lib/auth-service';
import type { SyncCachePerformance } from '@/lib/types';

export async function GET(req: NextRequest) {
  const authService = AuthenticationService.getInstance();
  const authResult = await authService.authenticateUser(req);

  if (!authResult.success || !authResult.user || authResult.profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Sync system has been removed - returning placeholder data
  const placeholderCache: SyncCachePerformance = {
    hitRatioPercent: 0,
    totalEntries: 0,
    averageEntrySizeBytes: 0,
    readThroughputPerSecond: 0,
  };

  return NextResponse.json(placeholderCache);
}
