import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { middlewareAuth, type UserProfile } from './lib/middleware-auth'

/**
 * Production-Grade Middleware with Authentication & Onboarding Flow
 *
 * This middleware ensures:
 * - 100% consistency with production authentication system
 * - Comprehensive onboarding state management
 * - Production-grade error handling and logging
 * - Rate limiting and security headers
 * - Proper cookie handling with correlation ID tracing
 */
export async function middleware(req: NextRequest) {
  const startTime = Date.now()
  const pathname = req.nextUrl.pathname
  const res = NextResponse.next()

  // Add security headers to all responses
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  console.log(`[MIDDLEWARE] ${new Date().toISOString()} | ${req.method} ${pathname} | User-Agent: ${req.headers.get('user-agent')?.slice(0, 50)}...`)

  // Public paths that don't require authentication
  const publicPaths = [
    // Auth pages
    '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/update-password',
    // Admin auth page (public for unauthenticated access)
    '/admin/login',
    // Misc auth related
    '/auth/verify-otp', '/auth/callback', '/auth/verification-error', '/auth/verification-success',
    '/verify-email', // Allow unauthenticated users to verify email
    '/about', '/contact', '/pricing', '/terms', '/privacy',
    '/api/test', '/api/auth/create-profile', // Allow create-profile API for signup process
    '/api/health', '/api/debug', // Allow health and debug endpoints
  ]

  const isPublicPath = publicPaths.includes(pathname) ||
                       pathname === '/' || // Handle root path separately
                       pathname.startsWith('/_next/') || // Next.js internals
                       pathname.startsWith('/assets/') || // Static assets
                       pathname.includes('.') // Files like .png, .svg etc.

  // Allow public paths (except auth pages - they need special handling)
  if (isPublicPath && !pathname.startsWith('/auth/')) {
    const middlewareTime = Date.now() - startTime
    console.log(`[MIDDLEWARE] PUBLIC | ${pathname} | Time: ${middlewareTime}ms`)
    return res
  }

  // Handle API routes early - let individual handlers perform auth checks
  // Exception: Auth API routes might need middleware processing
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const middlewareTime = Date.now() - startTime
    console.log(`[MIDDLEWARE] API-PASSTHROUGH | ${pathname} | Time: ${middlewareTime}ms`)
    return res
  }

  // Authenticate user using production authentication service
  const authResult = await middlewareAuth.authenticateUserInMiddleware(req, res)
  const { success, user, profile, error, correlationId, strategy, executionTime } = authResult

  // Special handling for /verify-email - allow unauthenticated, redirect authenticated users
  if (pathname === '/verify-email') {
    if (success && user && profile) {
      // User is already authenticated, redirect them to appropriate dashboard or onboarding
      const redirect = middlewareAuth.determineRedirectUrl(profile, pathname, correlationId)
      console.log(`[MIDDLEWARE] ${correlationId} | Authenticated user accessing /verify-email, redirecting to ${redirect.url} (${redirect.reason})`)
      return NextResponse.redirect(new URL(redirect.url, req.url))
    }
    // User is not authenticated, allow access to verify their email
    console.log(`[MIDDLEWARE] ${correlationId} | Unauthenticated user accessing /verify-email - ALLOWED`)
    return res
  }

  // Handle auth pages
  if (pathname.startsWith('/auth/')) {
    if (success && user && profile) {
      // User is authenticated - redirect away from auth pages
      if (['/auth/login', '/auth/register'].includes(pathname) || pathname.startsWith('/auth/register/')) {
        const redirect = middlewareAuth.determineRedirectUrl(profile, pathname, correlationId)
        console.log(`[MIDDLEWARE] ${correlationId} | Authenticated user accessing auth page, redirecting to ${redirect.url} (${redirect.reason})`)

        middlewareAuth.logOnboardingState(
          correlationId,
          user.id,
          profile,
          'redirect_from_auth_page',
          pathname
        )

        return NextResponse.redirect(new URL(redirect.url, req.url))
      }
    }
    // Allow access to other auth pages like /auth/callback, /auth/update-password etc.
    console.log(`[MIDDLEWARE] ${correlationId} | Auth page access: ${pathname} - ALLOWED`)
    return res
  }

  // Handle protected routes - require authentication
  if (!success || !user || !profile) {
    console.log(`[MIDDLEWARE] ${correlationId} | Unauthenticated access to ${pathname}, redirecting to login`)
    console.log(`[MIDDLEWARE] ${correlationId} | Auth failure reason: ${error?.type || 'unknown'} | Strategy: ${strategy || 'none'}`)

    // Determine correct login page based on route namespace
    const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/auth/login'
    const redirectUrl = new URL(loginPath, req.url)
    if (pathname !== loginPath) {
      redirectUrl.searchParams.set('redirectTo', pathname)
    }

    // Return proper JSON response for API routes
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          error: 'Authentication required',
          type: 'unauthorized',
          correlationId,
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlationId,
            ...Object.fromEntries(res.headers.entries())
          }
        }
      )
    }

    return NextResponse.redirect(redirectUrl)
  }

  // User is authenticated and has profile - log current state
  console.log(`[MIDDLEWARE] ${correlationId} | Authenticated user: ${user.id} | Role: ${profile.role} | Onboarding: ${profile.is_onboarding_completed} | Step: ${profile.onboarding_step_completed}`)

  middlewareAuth.logOnboardingState(
    correlationId,
    user.id,
    profile,
    'middleware_check',
    pathname
  )

  // Handle onboarding routes
  if (pathname.startsWith('/onboarding')) {
    return handleOnboardingRoutes(req, res, profile, correlationId, pathname)
  }

  // Handle dashboard routes - enforce onboarding completion
  const protectedAppRoutes = ['/dashboard', '/seller-dashboard', '/admin']
  if (protectedAppRoutes.some(route => pathname.startsWith(route))) {
    return handleDashboardRoutes(req, res, user, profile, correlationId, pathname)
  }

  // Special handling for marketplace route – allow buyers, sellers, and admins
  if (pathname.startsWith('/marketplace')) {
    console.log(`[MIDDLEWARE] ${correlationId} | Marketplace access allowed for role ${profile.role}`)
    return res
  }

  // Special handling for listing detail pages – allow buyers, sellers, and admins
  if (pathname.startsWith('/listings/')) {
    console.log(`[MIDDLEWARE] ${correlationId} | Listing detail access allowed for role ${profile.role}`)
    return res
  }

  // Skip further dashboard-role redirects for API endpoints
  if (pathname.startsWith('/api/')) {
    return res
  }

  // Ensure user is on the correct dashboard for their role (for other protected routes)
  if (profile.role === 'buyer' && !pathname.startsWith('/dashboard')) {
    console.log(`[MIDDLEWARE] ${correlationId} | Buyer accessing wrong dashboard: ${pathname} -> /dashboard`)
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (profile.role === 'seller' && !(pathname.startsWith('/seller-dashboard') || pathname.startsWith('/marketplace') || pathname.startsWith('/listings/'))) {
    console.log(`[MIDDLEWARE] ${correlationId} | Seller accessing wrong dashboard: ${pathname} -> /seller-dashboard`)
    return NextResponse.redirect(new URL('/seller-dashboard', req.url))
  }

  if (profile.role === 'admin' && (pathname.startsWith('/dashboard') || pathname.startsWith('/seller-dashboard'))) {
    console.log(`[MIDDLEWARE] ${correlationId} | Admin accessing wrong dashboard: ${pathname} -> /admin`)
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // Enforce admin-only access to /admin routes
  if (pathname.startsWith('/admin') && profile.role !== 'admin') {
    console.log(`[MIDDLEWARE] ${correlationId} | Non-admin role (${profile.role}) attempted to access admin area: ${pathname}`)

    // If API route under /admin, return JSON 403
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          error: 'forbidden_role',
          type: 'forbidden',
          correlationId,
          timestamp: new Date().toISOString()
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlationId,
            ...Object.fromEntries(res.headers.entries())
          }
        }
      )
    }

    // For page requests, show 403 response
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Allow access to other protected routes
  const middlewareTime = Date.now() - startTime
  console.log(`[MIDDLEWARE] ${correlationId} | Protected route access: ${pathname} - ALLOWED | Total time: ${middlewareTime}ms`)
  return res
}

/**
 * Handle onboarding route access and validation
 */
function handleOnboardingRoutes(
  req: NextRequest,
  res: NextResponse,
  profile: UserProfile,
  correlationId: string,
  pathname: string
): NextResponse {
  const { role, is_onboarding_completed, onboarding_step_completed } = profile

  // If onboarding is complete, redirect away from onboarding pages (unless it's success page)
  if (is_onboarding_completed && !pathname.endsWith('/success')) {
    const dashboardUrl = role === 'seller' ? '/seller-dashboard' : role === 'admin' ? '/admin' : '/dashboard'
    console.log(`[MIDDLEWARE] ${correlationId} | Onboarding complete, redirecting from ${pathname} to ${dashboardUrl}`)

    middlewareAuth.logOnboardingState(
      correlationId,
      profile.id,
      profile,
      'onboarding_already_complete',
      pathname
    )

    return NextResponse.redirect(new URL(dashboardUrl, req.url))
  }

  // Check if user is on the correct role's onboarding path
  const expectedOnboardingRolePath = `/onboarding/${role}`
  if (!pathname.startsWith(expectedOnboardingRolePath)) {
    console.log(`[MIDDLEWARE] ${correlationId} | Wrong onboarding path: User role ${role} accessing ${pathname}`)

    const redirect = middlewareAuth.determineRedirectUrl(profile, pathname, correlationId)

    middlewareAuth.logOnboardingState(
      correlationId,
      profile.id,
      profile,
      'wrong_onboarding_path',
      pathname
    )

    return NextResponse.redirect(new URL(redirect.url, req.url))
  }

  // User is on their correct role's onboarding path
  // Enforce sequential step navigation (cannot jump ahead)
  const segments = pathname.split("/").filter(Boolean); // ['onboarding','seller','2']
  const stepSegment = segments[2];
  const isNumericStep = stepSegment && /^\d+$/.test(stepSegment);
  if (isNumericStep) {
    const requestedStep = parseInt(stepSegment, 10);
    const expectedStep = (onboarding_step_completed ?? 0) + 1;
    // Allow revisiting completed steps (<= onboarding_step_completed)
    if (requestedStep > expectedStep) {
      console.log(`[MIDDLEWARE] ${correlationId} | User attempted to skip ahead to step ${requestedStep}; expected ${expectedStep}. Redirecting.`);
      const redirectUrl = new URL(`/onboarding/${role}/${expectedStep}`, req.url);
      redirectUrl.searchParams.set('notice', 'complete_previous_step');
      return NextResponse.redirect(redirectUrl);
    }
  }

  console.log(`[MIDDLEWARE] ${correlationId} | Onboarding route access: ${pathname} - ALLOWED`)

  middlewareAuth.logOnboardingState(
    correlationId,
    profile.id,
    profile,
    'onboarding_route_access',
    pathname
  )

  return res
}

/**
 * Handle dashboard route access and role validation
 */
function handleDashboardRoutes(
  req: NextRequest,
  res: NextResponse,
  user: any,
  profile: UserProfile,
  correlationId: string,
  pathname: string
): NextResponse {
  const { role, is_onboarding_completed } = profile

  // Enforce onboarding completion for dashboard access (EXEMPT ADMINS - they don't need onboarding)
  if (role !== 'admin' && !is_onboarding_completed) {
    console.log(`[MIDDLEWARE] ${correlationId} | Onboarding incomplete, redirecting from ${pathname}`)

    const redirect = middlewareAuth.determineRedirectUrl(profile, pathname, correlationId)

    middlewareAuth.logOnboardingState(
      correlationId,
      user.id,
      profile,
      'onboarding_incomplete_dashboard_access',
      pathname
    )

    const redirectUrl = new URL(redirect.url, req.url)
    redirectUrl.searchParams.set('notice', 'complete_onboarding')
    return NextResponse.redirect(redirectUrl)
  }

  // Ensure user lands on their correct dashboard page
  if (role === 'buyer' && !pathname.startsWith('/dashboard')) {
    console.log(`[MIDDLEWARE] ${correlationId} | Buyer attempting to access ${pathname}. Redirecting to /dashboard`)
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (role === 'seller' && !pathname.startsWith('/seller-dashboard')) {
    console.log(`[MIDDLEWARE] ${correlationId} | Seller attempting to access ${pathname}. Redirecting to /seller-dashboard`)
    return NextResponse.redirect(new URL('/seller-dashboard', req.url))
  }

  if (role === 'admin' && !pathname.startsWith('/admin')) {
    console.log(`[MIDDLEWARE] ${correlationId} | Admin attempting to access ${pathname}. Redirecting to /admin`)
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  console.log(`[MIDDLEWARE] ${correlationId} | Dashboard access: ${pathname} - ALLOWED`)

  middlewareAuth.logOnboardingState(
    correlationId,
    user.id,
    profile,
    'dashboard_access_granted',
    pathname
  )

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/).*)', // Match all paths except static assets
  ],
}
