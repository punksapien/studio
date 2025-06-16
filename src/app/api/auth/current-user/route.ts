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

    // Success - return user and profile data with safe defaults and proper field transformation
    const response = {
      user: {
        id: result.user.id,
        email: result.user.email || '',
        emailConfirmed: !!result.user.email_confirmed_at,
        lastSignIn: result.user.last_sign_in_at || null
      },
      profile: result.profile ? {
        // Core profile fields with proper camelCase transformation
        id: result.profile.id,
        email: result.profile.email,
        full_name: result.profile.full_name,
        role: result.profile.role,

        // Verification fields - transformed and normalized
        verification_status: result.profile.verification_status, // Keep original for compatibility
        verificationStatus: result.profile.verification_status, // Add camelCase version

        // Payment/subscription status - derived field
        isPaid: determinePaymentStatus(result.profile),

        // Additional profile fields with proper transformation
        phone_number: result.profile.phone_number,
        phoneNumber: result.profile.phone_number, // Add camelCase version
        country: result.profile.country,
        is_onboarding_completed: result.profile.is_onboarding_completed,
        isOnboardingCompleted: result.profile.is_onboarding_completed, // Add camelCase version
        onboarding_step_completed: result.profile.onboarding_step_completed,
        onboardingStepCompleted: result.profile.onboarding_step_completed, // Add camelCase version
        created_at: result.profile.created_at,
        updated_at: result.profile.updated_at,
        is_email_verified: result.profile.is_email_verified,
        isEmailVerified: result.profile.is_email_verified // Add camelCase version
      } : {
        // Default profile structure if no profile exists
        id: result.user.id,
        email: result.user.email || '',
        full_name: result.user.email?.split('@')[0] || 'User',
        role: 'buyer',
        verification_status: 'anonymous',
        verificationStatus: 'anonymous',
        isPaid: false,
        is_onboarding_completed: false,
        isOnboardingCompleted: false,
        onboarding_step_completed: 0,
        onboardingStepCompleted: 0,
        is_email_verified: false,
        isEmailVerified: false
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

/**
 * Determines payment/subscription status for a user profile
 * This is a business logic function that should be enhanced based on actual payment system
 */
function determinePaymentStatus(profile: any): boolean {
  if (!profile) return false;

  // For now, we consider verified users as "paid" since verification implies access to premium features
  // This should be replaced with actual subscription/payment status checking
  const verificationStatus = profile.verification_status;

  // Verified users have paid access to premium features
  if (verificationStatus === 'verified') return true;

  // Add additional payment status checks here when payment system is implemented
  // Example: check for active subscription, payment history, etc.

  return false;
}
