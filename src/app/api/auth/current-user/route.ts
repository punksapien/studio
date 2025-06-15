import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationService } from '@/lib/auth-service'
import { AuthErrorFactory, AuthErrorType } from '@/lib/auth-errors'
import { RateLimiter, getClientIdentifier } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  const rateLimiter = RateLimiter.getInstance()
  const { ip } = getClientIdentifier(request)

  try {
    // Apply rate limiting with graceful handling
    const rateLimitResult = await rateLimiter.checkRateLimit(ip, 'auth-per-ip')

    if (!rateLimitResult.allowed) {
      const headers = {
        ...rateLimiter.getRateLimitHeaders(rateLimitResult),
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      }

      return NextResponse.json(
        {
          error: 'Too many requests',
          type: 'rate_limited',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { status: 429, headers }
      )
    }

    // Get auth service with error handling
    let authService: AuthenticationService
    try {
      authService = AuthenticationService.getInstance()
    } catch (error) {
      console.error('[CURRENT-USER] Failed to get auth service:', error)
      return NextResponse.json(
        {
          error: 'Authentication service temporarily unavailable',
          type: 'service_unavailable'
        },
        { status: 503 }
      )
    }

    // Authenticate user with comprehensive error handling
    const result = await authService.authenticateUser(request)

    if (!result.success) {
      // Handle different error types appropriately
      const error = result.error

      if (error?.type === AuthErrorType.CONFIGURATION_ERROR) {
        return NextResponse.json(
          {
            error: 'Authentication service temporarily unavailable',
            type: 'service_unavailable',
            retryAfter: 30
          },
          { status: 503 }
        )
      }

      if (error?.type === AuthErrorType.RATE_LIMITED) {
        return NextResponse.json(
          {
            error: 'Too many authentication attempts',
            type: 'rate_limited',
            retryAfter: 60
          },
          { status: 429 }
        )
      }

      // Add rate limit headers even for failed requests
      const headers = rateLimiter.getRateLimitHeaders(rateLimitResult)

      // Generic unauthorized response - don't expose internal errors
      return NextResponse.json(
        {
          error: 'Not authenticated',
          type: 'unauthorized'
        },
        { status: 401, headers }
      )
    }

    // Validate result data before sending response
    if (!result.user || !result.user.id) {
      console.error('[CURRENT-USER] Invalid user data in auth result')
      return NextResponse.json(
        {
          error: 'Invalid authentication data',
          type: 'internal_error'
        },
        { status: 500 }
      )
    }

    // Success - return user and profile data with safe defaults
    const response = {
      user: {
        id: result.user.id,
        email: result.user.email || '',
        emailConfirmed: !!result.user.email_confirmed_at,
        lastSignIn: result.user.last_sign_in_at || null
      },
      profile: result.profile || {
        id: result.user.id,
        email: result.user.email || '',
        full_name: result.user.email?.split('@')[0] || 'User',
        role: 'buyer',
        verification_status: 'anonymous',
        is_onboarding_completed: false
      },
      metadata: {
        strategy: result.strategy || 'unknown',
        timestamp: new Date().toISOString()
      }
    }

    // Add security and rate limit headers
    const headers = {
      ...rateLimiter.getRateLimitHeaders(rateLimitResult),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }

    return NextResponse.json(response, { headers })

  } catch (error) {
    console.error('[CURRENT-USER] Unexpected error:', error)

    // Never expose internal errors to client - always return generic error
    return NextResponse.json(
      {
        error: 'Authentication service temporarily unavailable',
        type: 'internal_error',
        message: 'Please try again later'
      },
      { status: 500 }
    )
  }
}
