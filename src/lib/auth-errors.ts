import { v4 as uuidv4 } from 'uuid'

// Error Classification System
export enum AuthErrorType {
  // User-facing errors
  INVALID_CREDENTIALS = 'invalid_credentials',
  PROFILE_NOT_FOUND = 'profile_not_found',
  ACCOUNT_LOCKED = 'account_locked',
  EMAIL_NOT_VERIFIED = 'email_not_verified',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',

  // System errors
  DATABASE_CONNECTION = 'database_connection',
  SUPABASE_API_FAILURE = 'supabase_api_failure',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  CONFIGURATION_ERROR = 'configuration_error',
  NETWORK_ERROR = 'network_error',

  // Recoverable errors
  TEMPORARY_FAILURE = 'temporary_failure',
  RATE_LIMITED = 'rate_limited',
  TIMEOUT = 'timeout',

  // Unknown/Unexpected
  UNKNOWN_ERROR = 'unknown_error'
}

export interface AuthError {
  type: AuthErrorType
  message: string
  userMessage: string
  details?: any
  correlationId: string
  timestamp: string
  context: {
    userId?: string
    endpoint: string
    userAgent?: string
    ip?: string
    method?: string
  }
  retryable: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  errorRate: number
  lastCheck: string
  details?: any
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    database: ServiceHealth
    supabase: ServiceHealth
    redis?: ServiceHealth
  }
  metrics: {
    responseTime: number
    activeUsers: number
    errorRate: number
    successRate: number
  }
  timestamp: string
}

// Performance Metrics
export interface PerformanceMetric {
  operation: string
  duration: number
  success: boolean
  timestamp: string
  correlationId: string
  metadata?: any
}

export class AuthLogger {
  private static instance: AuthLogger
  private metricsQueue: PerformanceMetric[] = []
  private errorQueue: AuthError[] = []

  static getInstance(): AuthLogger {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger()
    }
    return AuthLogger.instance
  }

  generateCorrelationId(): string {
    return uuidv4()
  }

  logAuthAttempt(userId: string, method: string, correlationId: string): void {
    console.log(`[AUTH-ATTEMPT] ${correlationId} | User: ${userId} | Method: ${method} | Time: ${new Date().toISOString()}`)
  }

  logAuthSuccess(userId: string, profileId: string, correlationId: string): void {
    console.log(`[AUTH-SUCCESS] ${correlationId} | User: ${userId} | Profile: ${profileId} | Time: ${new Date().toISOString()}`)
  }

  logAuthFailure(error: AuthError): void {
    console.error(`[AUTH-FAILURE] ${error.correlationId} | Type: ${error.type} | Message: ${error.message} | Severity: ${error.severity}`)
    console.error(`[AUTH-FAILURE] Context:`, error.context)
    if (error.details) {
      console.error(`[AUTH-FAILURE] Details:`, error.details)
    }

    this.errorQueue.push(error)
    this.flushErrorsIfNeeded()
  }

  logPerformanceMetric(operation: string, duration: number, success: boolean, correlationId: string, metadata?: any): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      success,
      timestamp: new Date().toISOString(),
      correlationId,
      metadata
    }

    console.log(`[PERFORMANCE] ${correlationId} | ${operation} | ${duration}ms | Success: ${success}`)
    this.metricsQueue.push(metric)
    this.flushMetricsIfNeeded()
  }

  private flushErrorsIfNeeded(): void {
    if (this.errorQueue.length >= 10) {
      // In production, send to monitoring service (DataDog, Sentry, etc.)
      this.errorQueue = []
    }
  }

  private flushMetricsIfNeeded(): void {
    if (this.metricsQueue.length >= 20) {
      // In production, send to metrics service
      this.metricsQueue = []
    }
  }

  getRecentErrors(): AuthError[] {
    return [...this.errorQueue]
  }

  getRecentMetrics(): PerformanceMetric[] {
    return [...this.metricsQueue]
  }
}

export class AuthErrorFactory {
  static createError(
    type: AuthErrorType,
    message: string,
    userMessage: string,
    context: Partial<AuthError['context']>,
    details?: any
  ): AuthError {
    const correlationId = AuthLogger.getInstance().generateCorrelationId()

    return {
      type,
      message,
      userMessage,
      details,
      correlationId,
      timestamp: new Date().toISOString(),
      context: {
        endpoint: context.endpoint || 'unknown',
        userId: context.userId,
        userAgent: context.userAgent,
        ip: context.ip,
        method: context.method
      },
      retryable: this.isRetryable(type),
      severity: this.getSeverity(type)
    }
  }

  static fromSupabaseError(error: any, context: Partial<AuthError['context']>): AuthError {
    let type = AuthErrorType.UNKNOWN_ERROR
    let userMessage = 'An unexpected error occurred. Please try again.'

    // Classify Supabase errors
    if (error.message?.includes('Invalid login credentials')) {
      type = AuthErrorType.INVALID_CREDENTIALS
      userMessage = 'Invalid email or password. Please check your credentials and try again.'
    } else if (error.message?.includes('Email not confirmed')) {
      type = AuthErrorType.EMAIL_NOT_VERIFIED
      userMessage = 'Please verify your email address before logging in.'
    } else if (error.message?.includes('User not found')) {
      type = AuthErrorType.PROFILE_NOT_FOUND
      userMessage = 'Account not found. Please check your email or sign up for a new account.'
    } else if (error.code === 'PGRST116') {
      type = AuthErrorType.PROFILE_NOT_FOUND
      userMessage = 'User profile not found. Please contact support.'
    } else if (error.message?.includes('rate limit')) {
      type = AuthErrorType.RATE_LIMITED
      userMessage = 'Too many requests. Please wait a moment and try again.'
    } else if (error.message?.includes('network') || error.message?.includes('connection')) {
      type = AuthErrorType.NETWORK_ERROR
      userMessage = 'Connection error. Please check your internet connection and try again.'
    } else if (error.message?.includes('createServerClient requires configuring')) {
      type = AuthErrorType.CONFIGURATION_ERROR
      userMessage = 'Authentication service temporarily unavailable. Please try again in a moment.'
    }

    return this.createError(
      type,
      error.message || 'Unknown error',
      userMessage,
      context,
      error
    )
  }

  private static isRetryable(type: AuthErrorType): boolean {
    const retryableTypes = [
      AuthErrorType.TEMPORARY_FAILURE,
      AuthErrorType.NETWORK_ERROR,
      AuthErrorType.DATABASE_CONNECTION,
      AuthErrorType.SERVICE_UNAVAILABLE,
      AuthErrorType.TIMEOUT
    ]
    return retryableTypes.includes(type)
  }

  private static getSeverity(type: AuthErrorType): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case AuthErrorType.INVALID_CREDENTIALS:
      case AuthErrorType.EMAIL_NOT_VERIFIED:
        return 'low'

      case AuthErrorType.PROFILE_NOT_FOUND:
      case AuthErrorType.RATE_LIMITED:
        return 'medium'

      case AuthErrorType.DATABASE_CONNECTION:
      case AuthErrorType.SUPABASE_API_FAILURE:
      case AuthErrorType.SERVICE_UNAVAILABLE:
        return 'high'

      case AuthErrorType.CONFIGURATION_ERROR:
        return 'critical'

      default:
        return 'medium'
    }
  }
}

// Circuit Breaker Implementation
export class CircuitBreaker {
  private failures: Map<string, number> = new Map()
  private lastFailureTime: Map<string, number> = new Map()
  private state: Map<string, 'closed' | 'open' | 'half-open'> = new Map()

  constructor(
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 60000
  ) {}

  isOpen(service: string): boolean {
    const currentState = this.state.get(service) || 'closed'

    if (currentState === 'open') {
      const lastFailure = this.lastFailureTime.get(service) || 0
      if (Date.now() - lastFailure > this.resetTimeoutMs) {
        this.state.set(service, 'half-open')
        return false
      }
      return true
    }

    return false
  }

  recordSuccess(service: string): void {
    this.failures.set(service, 0)
    this.state.set(service, 'closed')
  }

  recordFailure(service: string): void {
    const currentFailures = this.failures.get(service) || 0
    const newFailures = currentFailures + 1

    this.failures.set(service, newFailures)
    this.lastFailureTime.set(service, Date.now())

    if (newFailures >= this.failureThreshold) {
      this.state.set(service, 'open')
      console.warn(`[CIRCUIT-BREAKER] Service ${service} circuit opened after ${newFailures} failures`)
    }
  }

  getState(service: string): 'closed' | 'open' | 'half-open' {
    return this.state.get(service) || 'closed'
  }
}
