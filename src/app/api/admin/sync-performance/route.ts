import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService } from '@/lib/auth-service';
import type { SyncPerformanceMetrics } from '@/lib/types';

export async function GET(req: NextRequest) {
  const authService = AuthenticationService.getInstance();
  const authResult = await authService.authenticateUser(req);

  if (!authResult.success || !authResult.user || authResult.profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Sync system has been removed - returning placeholder data
  const placeholderMetrics: SyncPerformanceMetrics = {
    averageProcessingTimeMs: 0,
    p95LatencyMs: 0,
    p99LatencyMs: 0,
    totalOperationsLastHour: 0,
    errorRatePercent: 0,
  };

  return NextResponse.json(placeholderMetrics);
}
