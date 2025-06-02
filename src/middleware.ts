import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface UserProfile {
  id: string
  role: 'buyer' | 'seller' | 'admin'
  is_onboarding_completed: boolean
  onboarding_step_completed: number | null
}

interface AuthResult {
  isAuthenticated: boolean
  userId?: string
  profile?: UserProfile
  session?: any
  error?: string
}

// This is a basic pass-through middleware.
// If Clerk was the only reason for this middleware,
// and no other global request processing is needed,
// this file could potentially be removed, or you can add other middleware logic here.
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const startTime = Date.now()

  // Early return for static assets and public pages
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: req.headers }
  })

  try {
    // Create Supabase client with proper error handling
    const supabase = createSupabaseClient(req, response)

    // Get authentication state with multiple fallback methods
    const authResult = await getAuthenticationState(supabase, req)

    // Log authentication state for debugging
    logAuthState(pathname, authResult, Date.now() - startTime)

    // Handle different route types based on authentication state
    if (pathname.startsWith('/auth/')) {
      return handleAuthRoutes(req, response, authResult)
    }

    if (pathname.startsWith('/onboarding/')) {
      return handleOnboardingRoutes(req, response, authResult)
    }

    if (pathname.startsWith('/api/')) {
      return handleApiRoutes(req, response, authResult)
    }

    const protectedRoutes = ['/dashboard', '/seller-dashboard', '/admin']
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      return handleProtectedRoutes(req, response, authResult)
    }

    return response

  } catch (error) {
    console.error(`[Middleware] Critical error on ${pathname}:`, error)

    // Graceful degradation: don't block requests but log errors
    const protectedRoutes = ['/dashboard', '/seller-dashboard', '/admin']
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      // Only redirect to login for protected routes on error
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', req.url))
    }

    return NextResponse.next()
  }
}

function shouldSkipMiddleware(pathname: string): boolean {
  const skipPatterns = [
    '/_next/',
    '/favicon.ico',
    '/api/test', // Allow test endpoint
    '/',
    '/marketplace',
    '/about',
    '/contact',
    '/pricing',
    '/how-'
  ]

  return skipPatterns.some(pattern => pathname.startsWith(pattern)) ||
         pathname.includes('.') // Files like .png, .svg, etc.
}

function createSupabaseClient(req: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          req.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
}

async function getAuthenticationState(supabase: any, req: NextRequest): Promise<AuthResult> {
  try {
    // Method 1: Try cookie-based session (SSR)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (session && !sessionError) {
      // Get user profile
      const profile = await getUserProfile(supabase, session.user.id)
      return {
        isAuthenticated: true,
        userId: session.user.id,
        session,
        profile
      }
    }

    // Method 2: Try Authorization header (for API consistency)
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)

      if (user && !userError) {
        const profile = await getUserProfile(supabase, user.id)
        return {
          isAuthenticated: true,
          userId: user.id,
          profile
        }
      }
    }

    // Method 3: Check cookies directly (fallback)
    const accessToken = req.cookies.get('sb-access-token')?.value ||
                       req.cookies.get('supabase-auth-token')?.value

    if (accessToken) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
        if (user && !userError) {
          const profile = await getUserProfile(supabase, user.id)
          return {
            isAuthenticated: true,
            userId: user.id,
            profile
          }
        }
      } catch (tokenError) {
        console.warn('[Middleware] Token verification failed:', tokenError)
      }
    }

    return {
      isAuthenticated: false,
      error: sessionError?.message || 'No valid authentication found'
    }

  } catch (error) {
    console.error('[Middleware] Authentication check failed:', error)
    return {
      isAuthenticated: false,
      error: 'Authentication system error'
    }
  }
}

async function getUserProfile(supabase: any, userId: string): Promise<UserProfile | undefined> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, role, is_onboarding_completed, onboarding_step_completed')
      .eq('id', userId)
      .single()

    if (error) {
      console.warn(`[Middleware] Profile fetch failed for user ${userId}:`, error)
      return undefined
    }

    return profile
  } catch (error) {
    console.error(`[Middleware] Profile query error for user ${userId}:`, error)
    return undefined
  }
}

function logAuthState(pathname: string, authResult: AuthResult, duration: number) {
  const status = authResult.isAuthenticated ? 'AUTHENTICATED' : 'UNAUTHENTICATED'
  const userId = authResult.userId ? authResult.userId.substring(0, 8) + '...' : 'none'
  const role = authResult.profile?.role || 'unknown'
  const onboarding = authResult.profile?.is_onboarding_completed ? 'complete' : 'pending'

  console.log(`[Middleware] ${status} ${pathname} user=${userId} role=${role} onboarding=${onboarding} (${duration}ms)`)

  if (authResult.error) {
    console.warn(`[Middleware] Auth error: ${authResult.error}`)
  }
}

function handleAuthRoutes(req: NextRequest, response: NextResponse, authResult: AuthResult): NextResponse {
  const pathname = req.nextUrl.pathname

  if (authResult.isAuthenticated) {
    // Authenticated user on auth pages - redirect to appropriate dashboard
    if (pathname === '/auth/login' || pathname === '/auth/register') {
      const redirectUrl = determineRedirectUrl(authResult.profile)
      console.log(`[Middleware] Redirecting authenticated user from ${pathname} to ${redirectUrl}`)
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    // Allow specific auth pages even when authenticated
    const allowedAuthPages = ['/auth/update-password', '/auth/verify-otp', '/auth/callback']
    if (allowedAuthPages.some(page => pathname.startsWith(page))) {
      return response
    }

    // Redirect from other auth pages
    const redirectUrl = determineRedirectUrl(authResult.profile)
    return NextResponse.redirect(new URL(redirectUrl, req.url))
  } else {
    // Unauthenticated user - allow most auth pages
    const allowedUnauthPages = [
      '/auth/login', '/auth/register', '/auth/callback',
      '/auth/forgot-password', '/auth/update-password',
      '/auth/verification-error', '/auth/verification-success', '/auth/verify-otp'
    ]

    if (allowedUnauthPages.some(page => pathname === page || pathname.startsWith(page + '/'))) {
      return response
    }

    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

function handleOnboardingRoutes(req: NextRequest, response: NextResponse, authResult: AuthResult): NextResponse {
  const pathname = req.nextUrl.pathname

  if (!authResult.isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login?redirectTo=' + pathname, req.url))
  }

  if (!authResult.profile) {
    console.warn('[Middleware] No profile found for authenticated user on onboarding route')
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  const { role, is_onboarding_completed, onboarding_step_completed } = authResult.profile

  // If onboarding is complete, redirect to dashboard
  if (is_onboarding_completed && !pathname.endsWith('/success')) {
    const dashboardUrl = role === 'seller' ? '/seller-dashboard' :
                        role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(dashboardUrl, req.url))
  }

  // Validate onboarding step and role
  const currentStep = (onboarding_step_completed || 0) + 1
  const maxSteps = role === 'seller' ? 5 : 2
  const expectedPath = `/onboarding/${role}/${currentStep}`

  // Check if user is on correct role's onboarding
  if (!pathname.startsWith(`/onboarding/${role}/`)) {
    return NextResponse.redirect(new URL(expectedPath, req.url))
  }

  // Check if user is on correct step
  if (!is_onboarding_completed && currentStep <= maxSteps &&
      pathname !== expectedPath && !pathname.endsWith('/success')) {
    return NextResponse.redirect(new URL(expectedPath, req.url))
  }

  return response
}

function handleApiRoutes(req: NextRequest, response: NextResponse, authResult: AuthResult): NextResponse {
  // API routes handle their own authentication
  // This allows for flexibility in API auth methods
  return response
}

function handleProtectedRoutes(req: NextRequest, response: NextResponse, authResult: AuthResult): NextResponse {
  const pathname = req.nextUrl.pathname

  if (!authResult.isAuthenticated) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (!authResult.profile) {
    console.warn('[Middleware] No profile found for authenticated user on protected route')
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  const { role, is_onboarding_completed, onboarding_step_completed } = authResult.profile

  // Check onboarding completion
  if (!is_onboarding_completed) {
    const nextStep = (onboarding_step_completed || 0) + 1
    const maxSteps = role === 'seller' ? 5 : 2
    const onboardingPath = nextStep <= maxSteps ?
      `/onboarding/${role}/${nextStep}` : `/onboarding/${role}/success`
    return NextResponse.redirect(new URL(onboardingPath, req.url))
  }

  // Ensure user is on correct dashboard for their role
  const expectedDashboard = role === 'seller' ? '/seller-dashboard' :
                           role === 'admin' ? '/admin' : '/dashboard'

  if (pathname.startsWith(expectedDashboard)) {
    return response // User is on correct dashboard
  }

  // Check if user is on any dashboard but wrong one
  const dashboards = ['/dashboard', '/seller-dashboard', '/admin']
  if (dashboards.some(dash => pathname.startsWith(dash))) {
    return NextResponse.redirect(new URL(expectedDashboard, req.url))
  }

  return response
}

function determineRedirectUrl(profile: UserProfile | undefined): string {
  if (!profile) return '/dashboard'

  const { role, is_onboarding_completed, onboarding_step_completed } = profile

  if (!is_onboarding_completed) {
    const nextStep = (onboarding_step_completed || 0) + 1
    const maxSteps = role === 'seller' ? 5 : 2
    return nextStep <= maxSteps ?
      `/onboarding/${role}/${nextStep}` : `/onboarding/${role}/success`
  }

  return role === 'seller' ? '/seller-dashboard' :
         role === 'admin' ? '/admin' : '/dashboard'
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and images
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

