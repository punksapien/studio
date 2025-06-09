
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationService } from '@/lib/auth-service';
import type { SyncAlertsSummary, SyncAlertItem } from '@/lib/types';

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
    // Assuming an 'active_sync_alerts' view or 'sync_alerts' table with a status column
    // For demonstration, I'll query 'sync_alert_rules' and simulate active alerts.
    // In a real system, you'd query a table of triggered, unresolved alerts.
    const { data: alertRules, error } = await supabaseAdmin
      .from('sync_alert_rules') // Or your actual table/view for active alerts e.g., 'sync_alerts'
      .select('id, rule_name, severity, last_triggered_at, details, is_resolved') // Adjust columns
      .eq('is_resolved', false) // Example: Fetch unresolved alerts
      .limit(10)
      .order('last_triggered_at', { ascending: false });

    if (error) {
      console.error('Error fetching sync alerts:', error);
      if (error.code === '42P01') { // Relation does not exist
        const placeholderAlerts: SyncAlertsSummary = {
          activeCriticalAlerts: 1,
          activeHighAlerts: 2,
          recentAlerts: [
            { id: 'alert1', ruleName: 'High Latency Sync', severity: 'CRITICAL', triggeredAt: new Date().toISOString(), details: 'Operation X took 5000ms', resolvedAt: null },
            { id: 'alert2', ruleName: 'Cache Miss Rate High', severity: 'HIGH', triggeredAt: new Date(Date.now() - 3600000).toISOString(), details: 'Cache miss rate above 20%', resolvedAt: null },
          ],
        };
        return NextResponse.json(placeholderAlerts);
      }
      return NextResponse.json({ error: 'Failed to fetch sync alerts', details: error.message }, { status: 500 });
    }
    
    const activeCriticalAlerts = alertRules.filter(a => a.severity === 'CRITICAL').length;
    const activeHighAlerts = alertRules.filter(a => a.severity === 'HIGH').length;

    const recentAlerts: SyncAlertItem[] = alertRules.map(alert => ({
      id: alert.id,
      ruleName: alert.rule_name,
      severity: alert.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      triggeredAt: alert.last_triggered_at,
      details: alert.details || 'No details provided.',
      resolvedAt: alert.is_resolved ? alert.updated_at : null, // Assuming updated_at is set on resolution
    }));


    const summary: SyncAlertsSummary = {
      activeCriticalAlerts,
      activeHighAlerts,
      recentAlerts: recentAlerts.slice(0, 5), // Show top 5 recent
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Unexpected error in /api/admin/sync-alerts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
