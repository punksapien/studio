import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService } from '@/lib/auth-service';

export async function GET(req: NextRequest) {
  const authService = AuthenticationService.getInstance();
  const authResult = await authService.authenticateUser(req);

  if (!authResult.success || !authResult.user || authResult.profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Sync system has been removed - returning empty data
  return NextResponse.json({ activeAlerts: [], alertRules: [] });
}
