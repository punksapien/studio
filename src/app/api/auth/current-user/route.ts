import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationService } from '@/lib/auth-service'
import { AuthErrorFactory, AuthErrorType } from '@/lib/auth-errors'
import { RateLimiter, getClientIdentifier } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  const rateLimiter = RateLimiter.getInstance()
  const { ip } = getClientIdentifier(request)

  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimiter.checkRateLimit(ip, 'auth-per-ip')

    if (!rateLimitResult.allowed) {
      const headers = {
        ...rateLimiter.getRateLimitHeaders(rateLimitResult),
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      }

      return NextResponse.json(
        {
          error: rateLimitResult.message,
          type: 'rate_limited',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { status: 429, headers }
      )
    }

    const authService = AuthenticationService.getInstance()
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
            error: error.userMessage,
            type: 'rate_limited',
            retryAfter: 60
          },
          { status: 429 }
        )
      }

      // Add rate limit headers even for failed requests
      const headers = rateLimiter.getRateLimitHeaders(rateLimitResult)

      // Generic unauthorized response
      return NextResponse.json(
        {
          error: 'Not authenticated',
          type: 'unauthorized'
        },
        { status: 401, headers }
      )
    }

    // Success - return user and profile data
    const response = {
      user: {
        id: result.user!.id,
        email: result.user!.email,
        emailConfirmed: !!result.user!.email_confirmed_at,
        lastSignIn: result.user!.last_sign_in_at
      },
      profile: result.profile,
      metadata: {
        strategy: result.strategy,
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

    // Create structured error response
    const authError = AuthErrorFactory.fromSupabaseError(error, {
      endpoint: '/api/auth/current-user',
      method: 'GET',
      userAgent: request.headers.get('user-agent') || undefined,
      ip
    })

    return NextResponse.json(
      {
        error: authError.userMessage,
        type: 'internal_error',
        correlationId: authError.correlationId
      },
      { status: 500 }
    )
  }
}
