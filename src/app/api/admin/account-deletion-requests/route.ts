import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationService } from '@/lib/auth-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET - List pending account deletion requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const authService = AuthenticationService.getInstance()
    const authResult = await authService.authenticateUser(request)

    if (!authResult.success || !authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden_role' }, { status: 403 })
    }

    // Fetch pending deletion requests
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('account_deletion_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })

    if (requestsError) {
      console.error('[ADMIN-DELETION-REQUESTS] Error fetching requests:', requestsError)
      return NextResponse.json(
        { error: 'Failed to fetch deletion requests', details: requestsError.message },
        { status: 500 }
      )
    }

    // Enrich each request with requester profile info
    const userIds = Array.from(new Set((requests || []).map(r => r.user_id)))

    let profileMap: Record<string, any> = {}
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, first_name, last_name, email, role')
        .in('id', userIds)

      if (profilesError) {
        console.warn('[ADMIN-DELETION-REQUESTS] Error fetching profiles:', profilesError)
      } else {
        profileMap = (profiles || []).reduce((acc: Record<string, any>, p) => {
          acc[p.id] = p
          return acc
        }, {})
      }
    }

    const enrichedRequests = (requests || []).map(req => {
      const p = profileMap[req.user_id] || {}
      return {
        ...req,
        full_name: p.full_name ?? null,
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
        email: req.email || p.email || null,
        role: req.role || p.role || null,
      }
    })

    return NextResponse.json({
      requests: enrichedRequests,
      statistics: {
        pending: enrichedRequests.length
      }
    })
  } catch (error) {
    console.error('[ADMIN-DELETION-REQUESTS] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
