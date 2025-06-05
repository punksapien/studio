import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationService } from '@/lib/auth-service'
import { createClient } from '@supabase/supabase-js'
import type { VerificationRequestItem, VerificationQueueStatus, VerificationStatus, UserRole } from '@/lib/types'

/**
 * GET /api/admin/verification-queue/buyers
 *
 * Returns buyer verification requests for admin management
 * Requires admin authentication
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const auth = new AuthenticationService()

  try {
    // Authenticate admin user
    const authResult = await auth.authenticateUser(request)
    if (!authResult.success || !authResult.user || !authResult.profile) {
      return NextResponse.json(
        { error: 'Authentication required', type: 'unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin role
    if (authResult.profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', type: 'forbidden' },
        { status: 403 }
      )
    }

    // Get query parameters
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')))
    const status = url.searchParams.get('status') || 'all'

    const offset = (page - 1) * limit

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
    )

    // Build query for verification requests
    let query = supabase
      .from('verification_requests')
      .select(`
        id,
        user_id,
        request_type,
        status,
        reason,
        admin_notes,
        documents_submitted,
        created_at,
        updated_at,
        user_profiles!inner (
          id,
          full_name,
          email,
          role,
          verification_status,
          phone_number,
          country,
          created_at,
          is_email_verified
        )
      `)
      .eq('user_profiles.role', 'buyer')
      .eq('request_type', 'user_verification')
      .order('created_at', { ascending: false })

    // Apply status filter if specified
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('verification_requests')
      .select('*, user_profiles!inner(*)', { count: 'exact', head: true })
      .eq('user_profiles.role', 'buyer')
      .eq('request_type', 'user_verification')

    // Get paginated results
    const { data: requests, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[ADMIN-VERIFICATION-QUEUE] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch verification requests', type: 'database_error' },
        { status: 500 }
      )
    }

    // Transform data to match VerificationRequestItem interface
    const transformedRequests: VerificationRequestItem[] = (requests || []).map(req => ({
      id: req.id,
      timestamp: new Date(req.created_at),
      userId: req.user_id,
      userName: req.user_profiles.full_name,
      userRole: req.user_profiles.role as UserRole,
      userEmail: req.user_profiles.email,
      userPhone: req.user_profiles.phone_number,
      userCountry: req.user_profiles.country,
      isEmailVerified: req.user_profiles.is_email_verified,
      reason: req.reason || 'User verification request',
      operationalStatus: req.status as VerificationQueueStatus,
      profileStatus: req.user_profiles.verification_status as VerificationStatus,
      adminNotes: req.admin_notes ? (typeof req.admin_notes === 'string' ?
        [{
          id: '1',
          note: req.admin_notes,
          timestamp: new Date(req.updated_at),
          operationalStatusAtTimeOfNote: req.status as VerificationQueueStatus,
          profileStatusAtTimeOfNote: req.user_profiles.verification_status as VerificationStatus,
          adminId: 'system',
          adminName: 'System'
        }] : []) : [],
      documentsSubmitted: req.documents_submitted || [],
      updatedAt: new Date(req.updated_at)
    }))

    const responseTime = Date.now() - startTime

    console.log(`[ADMIN-VERIFICATION-QUEUE] Buyer queue fetched: ${transformedRequests.length} requests (page ${page}, total: ${totalCount}) in ${responseTime}ms`)

    return NextResponse.json({
      requests: transformedRequests,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      },
      responseTime
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('[ADMIN-VERIFICATION-QUEUE] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        type: 'server_error',
        responseTime
      },
      { status: 500 }
    )
  }
}
