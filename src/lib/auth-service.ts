import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AuthLogger, AuthErrorFactory, AuthErrorType, CircuitBreaker } from './auth-errors'
import type { User } from '@supabase/supabase-js'

// Authentication Strategy Interface
interface AuthStrategy {
  name: string
  priority: number
  verify(request?: any): Promise<AuthResult>
}

interface AuthResult {
  success: boolean
  user?: User
  profile?: any
  error?: any
  strategy?: string
}

interface ProfileRecoveryResult {
  profile: any
  created: boolean
  recovered: boolean
}

export class AuthenticationService {
  private static instance: AuthenticationService
  private strategies: AuthStrategy[] = []
  private circuitBreaker: CircuitBreaker
  private logger: AuthLogger

  constructor() {
    this.logger = AuthLogger.getInstance()
    this.circuitBreaker = new CircuitBreaker(3, 30000) // 3 failures, 30s timeout
    this.initializeStrategies()
  }

  static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService()
    }
    return AuthenticationService.instance
  }

  private initializeStrategies(): void {
    this.strategies = [
      new BearerTokenStrategy(),
      new CookieSessionStrategy(),
      new ServiceRoleStrategy()
    ].sort((a, b) => b.priority - a.priority)
  }

  async authenticateUser(request?: any): Promise<AuthResult> {
    const correlationId = this.logger.generateCorrelationId()
    const startTime = Date.now()

    this.logger.logAuthAttempt('unknown', 'multi-strategy-auth', correlationId)

    for (const strategy of this.strategies) {
      // Skip strategy if circuit is open
      if (this.circuitBreaker.isOpen(strategy.name)) {
        console.warn(`[AUTH-SERVICE] Skipping ${strategy.name} - circuit breaker open`)
        continue
      }

      try {
        const result = await strategy.verify(request)

        if (result.success && result.user) {
          // Record success
          this.circuitBreaker.recordSuccess(strategy.name)

          // Ensure profile exists
          const profileResult = await this.ensureProfileExists(result.user, correlationId)
          result.profile = profileResult.profile

          const duration = Date.now() - startTime
          this.logger.logPerformanceMetric(
            'multi-strategy-auth',
            duration,
            true,
            correlationId,
            { strategy: strategy.name, profileCreated: profileResult.created }
          )

          this.logger.logAuthSuccess(result.user.id, result.profile.id, correlationId)

          return {
            ...result,
            strategy: strategy.name
          }
        }

      } catch (error) {
        console.error(`[AUTH-SERVICE] Strategy ${strategy.name} failed:`, error)

        // Record failure for circuit breaker
        this.circuitBreaker.recordFailure(strategy.name)

        // Log the failure
        const authError = AuthErrorFactory.fromSupabaseError(error, {
          endpoint: '/api/auth/current-user',
          method: 'GET'
        })
        this.logger.logAuthFailure(authError)
      }
    }

    // All strategies failed
    const duration = Date.now() - startTime
    this.logger.logPerformanceMetric('multi-strategy-auth', duration, false, correlationId)

    return {
      success: false,
      error: AuthErrorFactory.createError(
        AuthErrorType.INVALID_CREDENTIALS,
        'All authentication strategies failed',
        'Please log in again',
        { endpoint: '/api/auth/current-user' }
      )
    }
  }

  async ensureProfileExists(user: User, correlationId: string): Promise<ProfileRecoveryResult> {
    try {
      // Try to get existing profile first
      const profile = await this.getProfile(user.id)
      if (profile) {
        return { profile, created: false, recovered: false }
      }

      // Profile doesn't exist, try to recover/create
      return await this.recoverOrCreateProfile(user, correlationId)

    } catch (error) {
      console.error('[PROFILE-RECOVERY] Failed to ensure profile exists:', error)
      throw AuthErrorFactory.fromSupabaseError(error, {
        endpoint: '/api/auth/profile-recovery',
        userId: user.id
      })
    }
  }

  private async getProfile(userId: string): Promise<any | null> {
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

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return profile
    } catch (error) {
      console.error('[PROFILE-GET] Failed to get profile:', error)
      return null
    }
  }

  private async recoverOrCreateProfile(user: User, correlationId: string): Promise<ProfileRecoveryResult> {
    console.log(`[PROFILE-RECOVERY] ${correlationId} | Attempting to recover/create profile for user ${user.id}`)

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

      // Get full user data from auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id)

      if (authError || !authUser.user) {
        throw new Error(`Failed to get auth user data: ${authError?.message}`)
      }

      // Extract metadata for profile creation
      const metadata = authUser.user.user_metadata || {}
      const role = metadata.role || 'buyer' // Default to buyer

      // Create profile
      const newProfile = {
        id: user.id,
        email: user.email!,
        role: role,
        first_name: metadata.firstName || '',
        last_name: metadata.lastName || '',
        company_name: metadata.companyName || '',
        verification_status: 'pending',
        is_onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: profile, error: insertError } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single()

      if (insertError) {
        // Check if it's a duplicate error (profile created by another process)
        if (insertError.code === '23505') {
          console.log(`[PROFILE-RECOVERY] ${correlationId} | Profile already exists, fetching...`)
          const existingProfile = await this.getProfile(user.id)
          if (existingProfile) {
            return { profile: existingProfile, created: false, recovered: true }
          }
        }
        throw insertError
      }

      console.log(`[PROFILE-RECOVERY] ${correlationId} | Successfully created profile for user ${user.id}`)
      return { profile, created: true, recovered: false }

    } catch (error) {
      console.error(`[PROFILE-RECOVERY] ${correlationId} | Failed to recover/create profile:`, error)
      throw error
    }
  }

  getCircuitBreakerStatus(): Record<string, string> {
    return {
      bearerToken: this.circuitBreaker.getState('bearer-token'),
      cookieSession: this.circuitBreaker.getState('cookie-session'),
      serviceRole: this.circuitBreaker.getState('service-role')
    }
  }
}

// Strategy Implementations

class BearerTokenStrategy implements AuthStrategy {
  name = 'bearer-token'
  priority = 3

  async verify(request?: any): Promise<AuthResult> {
    const authHeader = request?.headers?.get?.('authorization') || request?.headers?.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return { success: false, error: 'No bearer token' }
    }

    const token = authHeader.substring(7)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { success: false, error: error || 'Invalid token' }
    }

    return { success: true, user }
  }
}

class CookieSessionStrategy implements AuthStrategy {
  name = 'cookie-session'
  priority = 2

  async verify(): Promise<AuthResult> {
    try {
      // Always use cookies() from next/headers for this strategy
      const cookieStore = await cookies()

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            async getAll() {
              return cookieStore.getAll()
            },
            async setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      )

      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return { success: false, error: error || 'No session' }
      }

      return { success: true, user }

    } catch (error) {
      return { success: false, error }
    }
  }
}

class ServiceRoleStrategy implements AuthStrategy {
  name = 'service-role'
  priority = 1

  async verify(): Promise<AuthResult> {
    // This is a fallback strategy for system operations
    // Not typically used for user authentication
    return { success: false, error: 'Service role not for user auth' }
  }
}
