import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthLogger } from '@/lib/auth-errors'

export async function GET(request: NextRequest) {
  // Only available in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoint not available in production' }, { status: 404 })
  }

  const logger = AuthLogger.getInstance()
  const correlationId = logger.generateCorrelationId()

  try {
    const debug = {
      timestamp: new Date().toISOString(),
      correlationId,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      database: await getDatabaseDebugInfo(),
      auth: await getAuthDebugInfo(),
      metrics: {
        recentErrors: logger.getRecentErrors(),
        recentMetrics: logger.getRecentMetrics()
      },
      configuration: {
        cookieConfig: getCookieConfiguration(),
        supabaseConfig: getSupabaseConfiguration()
      }
    }

    return NextResponse.json(debug)

  } catch (error) {
    console.error('[DEBUG] Auth state debug failed:', error)
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: String(error),
        correlationId
      },
      { status: 500 }
    )
  }
}

async function getDatabaseDebugInfo() {
  try {
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

    // Check user_profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, role, verification_status, is_onboarding_completed')
      .limit(10)

    // Check auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    return {
      profilesTable: {
        error: profilesError ? profilesError.message : null,
        count: profiles?.length || 0,
        sample: profiles?.slice(0, 3).map(p => ({
          id: p.id,
          email: p.email,
          role: p.role,
          verified: p.verification_status
        })) || []
      },
      authUsers: {
        error: authError ? authError.message : null,
        count: authUsers?.users?.length || 0,
        sample: authUsers?.users?.slice(0, 3).map(u => ({
          id: u.id,
          email: u.email,
          emailConfirmed: !!u.email_confirmed_at,
          lastSignIn: u.last_sign_in_at
        })) || []
      }
    }

  } catch (error) {
    return {
      error: String(error),
      profilesTable: { error: 'Failed to check', count: 0, sample: [] },
      authUsers: { error: 'Failed to check', count: 0, sample: [] }
    }
  }
}

async function getAuthDebugInfo() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Test basic auth service
    const { data: session, error: sessionError } = await supabase.auth.getSession()

    return {
      sessionCheck: {
        error: sessionError ? sessionError.message : null,
        hasSession: !!session?.session,
        sessionValid: !!session?.session?.access_token
      },
      serviceStatus: {
        anonKeyValid: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKeyValid: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlValid: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    }

  } catch (error) {
    return {
      error: String(error),
      sessionCheck: { error: 'Failed to check', hasSession: false, sessionValid: false },
      serviceStatus: { anonKeyValid: false, serviceRoleKeyValid: false, urlValid: false }
    }
  }
}

function getCookieConfiguration() {
  return {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  }
}

function getSupabaseConfiguration() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + '...',
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...'
  }
}
