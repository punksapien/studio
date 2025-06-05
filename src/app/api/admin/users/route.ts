import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthenticationService } from '@/lib/auth-service'

// GET /api/admin/users - Get paginated users with search and filtering
export async function GET(req: NextRequest) {
  // Authenticate the requester and make sure they are an admin
  const authService = AuthenticationService.getInstance()
  const authResult = await authService.authenticateUser(req)

  if (!authResult.success || !authResult.user || !authResult.profile) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  if (authResult.profile.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden_role' }, { status: 403 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { searchParams } = new URL(req.url)

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Filter parameters
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'all'
    const verificationStatus = searchParams.get('verification_status') || 'all'
    const paidStatus = searchParams.get('paid_status') || 'all'

    // Build the query
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        verification_status,
        country,
        created_at,
        updated_at,
        is_onboarding_completed,
        onboarding_step_completed
      `, { count: 'exact' })

    // Apply search filter (name or email)
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply role filter
    if (role !== 'all') {
      query = query.eq('role', role)
    }

    // Apply verification status filter
    if (verificationStatus !== 'all') {
      query = query.eq('verification_status', verificationStatus)
    }

    // TODO: Add paid status filter once we have subscription/payment tracking
    // For now, we'll mock this field as 'free' for all users

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Transform the data to match our frontend types
    const transformedUsers = users?.map(user => ({
      id: user.id,
      fullName: user.full_name || 'Unknown',
      email: user.email || 'No email',
      role: user.role,
      verificationStatus: user.verification_status || 'unverified',
      country: user.country || 'Unknown',
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      isPaid: false, // TODO: Calculate from subscriptions table when available
      isOnboardingCompleted: user.is_onboarding_completed || false,
      onboardingStep: user.onboarding_step_completed || 0
    })) || []

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: {
        search,
        role,
        verificationStatus,
        paidStatus
      }
    }, {
      headers: {
        'Cache-Control': 's-maxage=60', // 1-minute cache
        'X-Total-Count': count?.toString() || '0'
      }
    })

  } catch (error) {
    console.error('Unexpected error in admin users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
