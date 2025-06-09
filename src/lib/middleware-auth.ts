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
  // Email verification fields
  is_email_verified: boolean
  email_verified_at?: string
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
   * Authenticate user in middleware context - COMPATIBLE with browser client cookies
   * This uses the same Supabase configuration as the browser client to ensure cookie compatibility
   */
  async authenticateUserInMiddleware(
    req: NextRequest,
    res: NextResponse
  ): Promise<MiddlewareAuthResult> {
    const startTime = Date.now()
    const correlationId = this.logger.generateCorrelationId()
    const pathname = req.nextUrl.pathname

    this.logger.logAuthAttempt('middleware', 'compatible-cookie-auth', correlationId)
    console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Starting COMPATIBLE auth for ${pathname}`)

    try {
      // Use server client that's compatible with browser client cookies
      const supabase = this.createCompatibleSupabaseClient(req, res)
      const { data: { user }, error } = await supabase.auth.getUser()

      if (user && !error) {
        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Compatible cookie auth successful. User: ${user.id}`)

        // Get profile using the same client
        const profile = await this.getProfileUsingCompatibleClient(supabase, user.id, correlationId)

        if (!profile) {
          console.warn(`[MIDDLEWARE-AUTH] ${correlationId} | User ${user.id} found via cookie, but profile missing.`)
          const authError = AuthErrorFactory.createError(
            AuthErrorType.PROFILE_NOT_FOUND,
            'User profile not found after cookie authentication.',
            'Please try again or contact support.',
            { endpoint: pathname, method: 'MIDDLEWARE', userId: user.id }
          )
          this.logger.logAuthFailure(authError)
          return {
            success: false, user, profile: null, error: authError, correlationId,
            strategy: 'compatible-cookie-fail-profile', executionTime: Date.now() - startTime
          }
        }

        const executionTime = Date.now() - startTime
        this.logger.logAuthSuccess(user.id, profile.id, correlationId)
        this.logger.logPerformanceMetric(
          'middleware-auth',
          executionTime,
          true,
          correlationId,
          {
            strategy: 'compatible-cookie-success',
            pathname,
            userId: user.id,
            userRole: profile.role
          }
        )
        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | SUCCESS (Compatible Cookie) | User: ${user.id} | Role: ${profile.role} | Time: ${executionTime}ms`)
        return {
          success: true, user, profile, correlationId,
          strategy: 'compatible-cookie-success', executionTime
        }
      }

      // If cookie auth failed, log details
      if (error) {
        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Compatible cookie auth error: ${error.message}`)
      } else {
        console.log(`[MIDDLEWARE-AUTH] ${correlationId} | No active session found with compatible cookies`)
      }

      // All strategies failed
      const executionTime = Date.now() - startTime
      const authError = AuthErrorFactory.createError(
        AuthErrorType.INVALID_CREDENTIALS,
        'No valid authentication found',
        'Please log in again.',
        { endpoint: pathname, method: 'MIDDLEWARE' }
      )
      this.logger.logAuthFailure(authError)
      this.logger.logPerformanceMetric(
        'middleware-auth',
        executionTime,
        false,
        correlationId,
        { pathname, reason: 'no_valid_auth' }
      )
      console.log(`[MIDDLEWARE-AUTH] ${correlationId} | FAILED (No Valid Auth) | Time: ${executionTime}ms`)
      return {
        success: false, user: null, profile: null, error: authError, correlationId,
        strategy: 'no-auth', executionTime
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
   * Create Supabase client that's compatible with browser client cookies
   * This ensures cookie format compatibility between browser and server
   */
  private createCompatibleSupabaseClient(req: NextRequest, res: NextResponse) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables')
    }

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            req.cookies.set({ name, value, ...options })
            res.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            req.cookies.set({ name, value: '', ...options })
            res.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )
  }

  /**
   * Get profile using the compatible client to ensure consistency
   */
  private async getProfileUsingCompatibleClient(
    supabase: any,
    userId: string,
    correlationId: string
  ): Promise<UserProfile | null> {
    try {
      console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Fetching profile for user: ${userId}`)

      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          role,
          verification_status,
          created_at,
          updated_at,
          first_name,
          last_name,
          company_name,
          is_onboarding_completed,
          onboarding_step_completed,
          is_email_verified,
          email_verified_at
        `)
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn(`[MIDDLEWARE-AUTH] ${correlationId} | Profile not found for user ${userId} (PGRST116)`)
        } else {
          console.error(`[MIDDLEWARE-AUTH] ${correlationId} | Profile fetch error:`, error)
        }
        return null
      }

      if (!data) {
        console.warn(`[MIDDLEWARE-AUTH] ${correlationId} | Profile data is null for user ${userId}`)
        return null
      }

      console.log(`[MIDDLEWARE-AUTH] ${correlationId} | Profile fetched successfully for user ${userId}`)

      // Ensure compatibility with middleware expectations
      const profile: UserProfile = {
        id: data.id,
        role: data.role,
        is_onboarding_completed: data.is_onboarding_completed ?? false,
        onboarding_step_completed: data.onboarding_step_completed ?? null,
        verification_status: data.verification_status || 'anonymous',
        email: data.email,
        created_at: data.created_at,
        updated_at: data.updated_at,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        company_name: data.company_name || undefined,
        is_email_verified: data.is_email_verified ?? false,
        email_verified_at: data.email_verified_at
      }

      return profile

    } catch (error) {
      console.error(`[MIDDLEWARE-AUTH] ${correlationId} | Unexpected error fetching profile:`, error)
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
