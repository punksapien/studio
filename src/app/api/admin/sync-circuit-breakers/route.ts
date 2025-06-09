
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationService } from '@/lib/auth-service';
import type { SyncCircuitBreakerStatus, CircuitBreakerInfo } from '@/lib/types';

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
    // Assuming 'sync_circuit_breakers' table exists
    const { data, error } = await supabaseAdmin
      .from('sync_circuit_breakers')
      .select('name, state, failure_count, last_failure_at') // Adjust column names as per your schema
      .order('name');

    if (error) {
      console.error('Error fetching sync circuit breakers:', error);
      if (error.code === '42P01') { // Relation does not exist
         const placeholderBreakers: SyncCircuitBreakerStatus = {
          circuitBreakers: [
            { name: 'stripe_sync', state: 'CLOSED', failures: 0, lastFailureAt: null },
            { name: 'email_service_webhook', state: 'OPEN', failures: 5, lastFailureAt: new Date().toISOString() },
          ],
        };
        return NextResponse.json(placeholderBreakers);
      }
      return NextResponse.json({ error: 'Failed to fetch sync circuit breakers', details: error.message }, { status: 500 });
    }

    const circuitBreakers: CircuitBreakerInfo[] = data.map(cb => ({
      name: cb.name,
      state: cb.state as 'CLOSED' | 'OPEN' | 'HALF_OPEN', // Ensure type casting
      failures: cb.failure_count || 0,
      lastFailureAt: cb.last_failure_at,
    }));

    return NextResponse.json({ circuitBreakers });
  } catch (error) {
    console.error('Unexpected error in /api/admin/sync-circuit-breakers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
