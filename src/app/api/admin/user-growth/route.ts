import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthenticationService } from '@/lib/auth-service'

interface MonthlyUserGrowth {
  month: string
  sellers: number
  buyers: number
  total: number
}

// GET /api/admin/user-growth
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
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  try {
    // Get monthly user registration data for the last 12 months
    const { data: userGrowthData, error } = await supabase.rpc('get_monthly_user_growth')

    if (error) {
      console.error('Error fetching user growth data:', error)

      // Fallback to basic query if the function doesn't exist
      const now = new Date()
      const monthsBack = 12
      const monthlyData: MonthlyUserGrowth[] = []

      for (let i = monthsBack - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

        const [sellersCount, buyersCount] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'seller')
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString())
            .then(({ count }) => count ?? 0),

          supabase
            .from('user_profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'buyer')
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString())
            .then(({ count }) => count ?? 0),
        ])

        monthlyData.push({
          month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          sellers: sellersCount,
          buyers: buyersCount,
          total: sellersCount + buyersCount,
        })
      }

      return NextResponse.json(monthlyData, {
        headers: {
          'Cache-Control': 's-maxage=3600', // 1-hour cache for historical data
        },
      })
    }

    return NextResponse.json(userGrowthData || [], {
      headers: {
        'Cache-Control': 's-maxage=3600', // 1-hour cache for historical data
      },
    })
  } catch (error) {
    console.error('Unexpected error in user growth API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
