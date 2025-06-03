import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { AuthenticationService, type AuthResult as MainAuthResult } from './auth-service'
import { AuthLogger, AuthErrorFactory, AuthErrorType } from './auth-errors'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

export interface MiddlewareAuthResult {
  success: boolean
  user: User | null
  profile: UserProfile | null
  error?: any
  correlationId: string
  strategy?: string
  executionTime: number
}

export interface UserProfile {
  id: string
  role: 'buyer' | 'seller' | 'admin'
  is_onboarding_completed: boolean
  onboarding_step_completed: number | null
  verification_status: string
  email: string
  created_at: string
  updated_at: string
  first_name?: string
  last_name?: string
  company_name?: string
}

export class MiddlewareAuthenticationService {
  private static instance: MiddlewareAuthenticationService
  private logger: AuthLogger
  private authService: AuthenticationService

  constructor() {
    this.logger = AuthLogger.getInstance()
    this.authService = AuthenticationService.getInstance()
  }

  static getInstance(): MiddlewareAuthenticationService {
    if (!MiddlewareAuthenticationService.instance) {
      MiddlewareAuthenticationService.instance = new MiddlewareAuthenticationService()
    }
    return MiddlewareAuthenticationService.instance
  }

  /**
   * Authenticate user in middleware context.
   * Primary strategy: Use a Supabase client configured specifically for middleware cookie handling.
   * Fallback: Use the main AuthenticationService for other strategies (e.g., Bearer token for API-like calls from client).
   */
  async authenticateUserInMiddleware(
    req: NextRequest,
    res: NextResponse
  ): Promise<MiddlewareAuthResult> {
    const startTime = Date.now()
    const correlationId = this.logger.generateCorrelationId()
    const pathname = req.nextUrl.pathname

    this.logger.logAuthAttempt('middleware', 'middleware-cookie-auth', correlationId)
    console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Starting auth for ${pathname}`)

    try {
      // Strategy 1: Middleware-specific cookie authentication
      const supabaseMiddlewareClient = this.createMiddlewareSupabaseClient(req, res)
      const { data: { user: cookieUser }, error: cookieError } = await supabaseMiddlewareClient.auth.getUser()

      let profile: UserProfile | null = null

      if (cookieUser && !cookieError) {
        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Middleware cookie auth successful. User: ${cookieUser.id}`)
        profile = await this.getDetailedProfile(cookieUser.id, correlationId)
        if (!profile) {
          // This case might indicate a desync or an issue creating profile, handle as auth failure for now
          console.warn(`[MIDDLEWARE-AUTH] ${correlationId} | User ${cookieUser.id} found via cookie, but profile missing.`)
          const error = AuthErrorFactory.createError(
            AuthErrorType.PROFILE_NOT_FOUND,
            'User profile not found after cookie authentication.',
            'Please try again or contact support.',
            { endpoint: pathname, method: 'MIDDLEWARE', userId: cookieUser.id }
          )
          this.logger.logAuthFailure(error)
          return {
            success: false, user: cookieUser, profile: null, error, correlationId,
            strategy: 'middleware-cookie-fail-profile', executionTime: Date.now() - startTime
          }
        }

        const executionTime = Date.now() - startTime
        this.logger.logAuthSuccess(cookieUser.id, profile.id, correlationId)
        this.logger.logPerformanceMetric(
          'middleware-auth',
          executionTime,
          true,
          correlationId,
          {
            strategy: 'middleware-cookie-success',
            pathname,
            userId: cookieUser.id,
            userRole: profile.role
          }
        )
        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | SUCCESS (Cookie via middleware client) | User: ${cookieUser.id} | Role: ${profile.role} | Time: ${executionTime}ms`)
        return {
          success: true, user: cookieUser, profile, correlationId,
          strategy: 'middleware-cookie-success', executionTime
        }
      } else if (cookieError) {
        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Middleware cookie client attempt resulted in error: ${cookieError.message}`);
        // Do not return yet, proceed to fallback strategies, as this specific error might be transient
        // or other strategies (like Bearer) might still apply.
      } else {
        // This means cookieUser is null and cookieError is null - no active session found by middleware cookie client.
        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | No active session found by middleware cookie client.`);
      }

      // Strategy 2: Fallback to main AuthenticationService (for Bearer tokens, etc.)
      // This is useful if the middleware is also hit by client-side API calls that include bearer tokens.
      console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Proceeding to main auth service for other strategies (e.g., Bearer token).`)
      const middlewareRequest = this.createMiddlewareRequest(req)
      const authServiceResult: MainAuthResult = await this.authService.authenticateUser(middlewareRequest)
      const executionTime = Date.now() - startTime

      if (authServiceResult.success && authServiceResult.user && authServiceResult.profile) {
        this.logger.logAuthSuccess(authServiceResult.user.id, authServiceResult.profile.id, correlationId)
        this.logger.logPerformanceMetric(
          'middleware-auth',
          executionTime,
          true,
          correlationId,
          {
            strategy: authServiceResult.strategy,
            pathname,
            userId: authServiceResult.user.id,
            userRole: authServiceResult.profile.role
          }
        )
        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | SUCCESS (Fallback: ${authServiceResult.strategy}) | User: ${authServiceResult.user.id} | Role: ${authServiceResult.profile.role} | Time: ${executionTime}ms`)
        return {
          success: true,
          user: authServiceResult.user,
          profile: authServiceResult.profile as UserProfile,
          correlationId,
          strategy: authServiceResult.strategy,
          executionTime
        }
      }

      // All strategies failed
      const errorToLog = authServiceResult.error || AuthErrorFactory.createError(
        AuthErrorType.INVALID_CREDENTIALS,
        'All middleware authentication strategies failed',
        'Please log in again.',
        { endpoint: pathname, method: 'MIDDLEWARE' }
      )
      this.logger.logAuthFailure(errorToLog)
      this.logger.logPerformanceMetric(
        'middleware-auth',
        executionTime,
        false,
        correlationId,
        { pathname, reason: 'all_strategies_failed' }
      )
      console.log(`[MIDDLEWARE-AUTH] ${correlationId} | FAILED (All Strategies) | Reason: ${errorToLog.type} | Time: ${executionTime}ms`)
      return {
        success: false, user: null, profile: null, error: errorToLog, correlationId,
        strategy: 'all-failed', executionTime
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error(`[MIDDLEWARE-AUTH] ${correlationId} | UNEXPECTED ERROR | ${error} | Time: ${executionTime}ms`)
      const authError = AuthErrorFactory.fromSupabaseError(error, {
        endpoint: pathname,
        method: 'MIDDLEWARE'
      })
      this.logger.logAuthFailure(authError)
      this.logger.logPerformanceMetric(
        'middleware-auth',
        executionTime,
        false,
        correlationId,
        { pathname, error: String(error) }
      )
      return {
        success: false, user: null, profile: null, error: authError, correlationId,
        strategy: 'exception', executionTime
      }
    }
  }

  /**
   * Create middleware-compatible request object for the main AuthenticationService (for fallback strategies)
   */
  private createMiddlewareRequest(req: NextRequest): any {
    return {
      headers: {
        get: (name: string) => req.headers.get(name),
        authorization: req.headers.get('authorization')
      },
      cookies: req.cookies,
      method: req.method,
      url: req.url
    }
  }

  /**
   * Enhanced cookie-aware Supabase client for middleware
   * Uses standardized cookie handling consistent with Next.js 15 Middleware
   */
  createMiddlewareSupabaseClient(req: NextRequest, res: NextResponse) {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set(name, value, options)
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.set(name, '', options)
          },
        },
      }
    )
  }

  /**
   * Get detailed profile information for middleware routing decisions
   */
  async getDetailedProfile(userId: string, correlationId: string): Promise<UserProfile | null> {
    try {
      console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Fetching profile for user: ${userId}`)

      // Use a service-role Supabase client that does NOT rely on request cookies.
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

      // Fetch the full profile row so we don't depend on specific column names existing
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Profile fetch failed for user ${userId}:`, error)
        return null
      }

      if (!profile) {
        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | No profile found for user: ${userId}`)
        return null
      }

      console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Profile found for user ${userId}: Role=${profile.role}, Verified=${profile.verification_status}`)

      // Determine onboarding completion. Fall back to verification status if columns missing.
      const isOnboardingCompleted =
        profile.is_onboarding_completed !== undefined
          ? profile.is_onboarding_completed
          : profile.verification_status === 'verified'

      const onboardingStep =
        profile.onboarding_step_completed !== undefined && profile.onboarding_step_completed !== null
          ? profile.onboarding_step_completed
          : isOnboardingCompleted
          ? 999
          : 1

      return {
        id: profile.id,
        role: profile.role,
        is_onboarding_completed: isOnboardingCompleted,
        onboarding_step_completed: onboardingStep,
        verification_status: profile.verification_status,
        email: profile.email,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        first_name: profile.first_name || profile.full_name?.split(' ')[0] || '',
        last_name: profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '',
        company_name: profile.company_name || (profile.role === 'seller' ? 'Not yet provided' : undefined)
      }
    } catch (error) {
      console.error(`[MIDDLEWARE-AUTH] ${correlationId} | Error fetching profile for user ${userId}:`, error)
      return null
    }
  }

  /**
   * Determine next redirect URL based on authentication and onboarding state
   */
  determineRedirectUrl(
    profile: UserProfile,
    requestedPath: string,
    correlationId: string
  ): { url: string; reason: string } {
    console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Determining redirect for ${requestedPath}`)
    console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Profile state: Role=${profile.role}, Onboarding=${profile.is_onboarding_completed}, Step=${profile.onboarding_step_completed}`)

    if (!profile.is_onboarding_completed) {
      const currentStep = profile.onboarding_step_completed || 0
      let nextStep = currentStep + 1
      if (currentStep === 0 && !profile.is_onboarding_completed) nextStep = 1

      if (profile.role === 'seller') {
        const totalSteps = 5
        const onboardingUrl = nextStep <= totalSteps
          ? `/onboarding/seller/${nextStep}`
          : `/seller-dashboard`

        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Seller onboarding redirect to: ${onboardingUrl}`)
        return {
          url: onboardingUrl,
          reason: profile.is_onboarding_completed ? 'onboarding_completed_final_redirect' : `incomplete_onboarding_step_${nextStep}`
        }
      } else if (profile.role === 'buyer') {
        const totalSteps = 2
        const onboardingUrl = nextStep <= totalSteps
          ? `/onboarding/buyer/${nextStep}`
          : `/dashboard`

        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Buyer onboarding redirect to: ${onboardingUrl}`)
        return {
          url: onboardingUrl,
          reason: profile.is_onboarding_completed ? 'onboarding_completed_final_redirect' : `incomplete_onboarding_step_${nextStep}`
        }
      } else if (profile.role === 'admin') {
        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Admin incomplete onboarding, redirecting to /admin`)
        return { url: '/admin', reason: 'admin_incomplete_onboarding_default' }
      }
    }

    if (profile.role === 'seller') {
      console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Seller dashboard redirect`)
      return { url: '/seller-dashboard', reason: 'completed_onboarding_seller' }
    } else if (profile.role === 'buyer') {
      console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Buyer dashboard redirect`)
      return { url: '/dashboard', reason: 'completed_onboarding_buyer' }
    } else if (profile.role === 'admin') {
      console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Admin dashboard redirect`)
      return { url: '/admin', reason: 'admin_access' }
    }

    console.warn(`[MIDDLEWARE-AUTH] ${correlationId} | Fallback home redirect due to unhandled role or state for user ${profile.id}`)
    return { url: '/', reason: 'fallback_unknown_role_or_state' }
  }

  /**
   * Log onboarding state changes for debugging and analytics
   */
  logOnboardingState(
    correlationId: string,
    userId: string,
    profile: UserProfile | null,
    action: string,
    requestedPath: string
  ): void {
    if (!profile) {
      console.log(`[ONBOARDING-STATE] ${correlationId} | User: ${userId} | Action: ${action} | Path: ${requestedPath} | Profile: null`)
      return
    }
    console.log(`[ONBOARDING-STATE] ${correlationId} | User: ${userId} | Action: ${action} | Path: ${requestedPath}`)
    console.log(`[ONBOARDING-STATE] ${correlationId} | Role: ${profile.role} | Completed: ${profile.is_onboarding_completed} | Step: ${profile.onboarding_step_completed}`)

    this.logger.logPerformanceMetric(
      'onboarding-state-check',
      0,
      true,
      correlationId,
      {
        userId,
        role: profile.role,
        isOnboardingCompleted: profile.is_onboarding_completed,
        onboardingStep: profile.onboarding_step_completed,
        action,
        requestedPath
      }
    )
  }
}

// Export singleton instance for use in middleware
export const middlewareAuth = MiddlewareAuthenticationService.getInstance()
