/**
 * Environment Variable Validation Utility
 *
 * Provides comprehensive validation of required environment variables
 * following industry security standards and Next.js best practices.
 */

// Required environment variables for the application
const REQUIRED_ENV_VARS = {
  // JWT Security (Critical)
  JWT_SECRET: 'JWT secret for token generation and validation',
  NEXTAUTH_SECRET: 'NextAuth.js compatible JWT secret (fallback)',

  // Supabase Configuration (Critical)
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key for admin operations',

  // Application Configuration (Important)
  NEXT_PUBLIC_APP_URL: 'Application base URL for redirects and links'
} as const

type RequiredEnvVar = keyof typeof REQUIRED_ENV_VARS

interface ValidationResult {
  isValid: boolean
  missing: RequiredEnvVar[]
  warnings: string[]
  errors: string[]
}

/**
 * Validate JWT secret meets industry security standards
 */
function validateJwtSecret(secret: string): { isValid: boolean; error?: string } {
  // RFC 7519 recommends minimum 256-bit (32 bytes) for HMAC-SHA256
  const MIN_LENGTH = 32

  if (secret.length < MIN_LENGTH) {
    return {
      isValid: false,
      error: `JWT secret too short. Must be at least ${MIN_LENGTH} characters for security. Current: ${secret.length}`
    }
  }

  // Check for obvious weak patterns
  const weakPatterns = [
    /^(secret|password|key|test)/i,
    /^(123|abc|qwe)/i,
    /(.)\1{10,}/  // Repeated characters
  ]

  for (const pattern of weakPatterns) {
    if (pattern.test(secret)) {
      return {
        isValid: false,
        error: 'JWT secret appears to use a weak pattern. Use cryptographically secure random generation.'
      }
    }
  }

  return { isValid: true }
}

/**
 * Validate all required environment variables
 */
export function validateEnvironment(): ValidationResult {
  const missing: RequiredEnvVar[] = []
  const warnings: string[] = []
  const errors: string[] = []

  // Check for missing environment variables
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key as RequiredEnvVar]
    if (!value) {
      missing.push(key as RequiredEnvVar)
    }
  }

  // JWT Secret validation (either JWT_SECRET or NEXTAUTH_SECRET must be present and secure)
  const jwtSecret = process.env.JWT_SECRET
  const nextAuthSecret = process.env.NEXTAUTH_SECRET

  if (!jwtSecret && !nextAuthSecret) {
    errors.push('Either JWT_SECRET or NEXTAUTH_SECRET must be configured')
  } else {
    // Validate the primary secret if available
    const primarySecret = jwtSecret || nextAuthSecret
    if (primarySecret) {
      const jwtValidation = validateJwtSecret(primarySecret)
      if (!jwtValidation.isValid) {
        errors.push(`JWT Secret validation failed: ${jwtValidation.error}`)
      }
    }

    // Warn if only fallback is available
    if (!jwtSecret && nextAuthSecret) {
      warnings.push('Using NEXTAUTH_SECRET as JWT_SECRET. Consider setting JWT_SECRET explicitly.')
    }
  }

  // Supabase URL validation
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL starting with http:// or https://')
  }

  // App URL validation
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl && !appUrl.startsWith('http')) {
    errors.push('NEXT_PUBLIC_APP_URL must be a valid URL starting with http:// or https://')
  }

  // Development environment warnings
  if (process.env.NODE_ENV === 'development') {
    if (supabaseUrl?.includes('127.0.0.1') || supabaseUrl?.includes('localhost')) {
      warnings.push('Using local Supabase instance - ensure supabase start is running')
    }
  }

  // Production environment checks
  if (process.env.NODE_ENV === 'production') {
    if (supabaseUrl?.includes('127.0.0.1') || supabaseUrl?.includes('localhost')) {
      errors.push('Production environment cannot use localhost Supabase URL')
    }

    if (appUrl?.includes('localhost') || appUrl?.includes('127.0.0.1')) {
      errors.push('Production environment cannot use localhost APP_URL')
    }
  }

  return {
    isValid: missing.length === 0 && errors.length === 0,
    missing,
    warnings,
    errors
  }
}

/**
 * Validate environment and throw detailed error if validation fails
 * Call this during application startup
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment()

  if (!result.isValid) {
    const errorMessages = []

    if (result.missing.length > 0) {
      errorMessages.push('Missing required environment variables:')
      result.missing.forEach(key => {
        errorMessages.push(`  - ${key}: ${REQUIRED_ENV_VARS[key]}`)
      })
    }

    if (result.errors.length > 0) {
      errorMessages.push('Environment validation errors:')
      result.errors.forEach(error => {
        errorMessages.push(`  - ${error}`)
      })
    }

    if (result.missing.length > 0) {
      errorMessages.push('\nTo fix this:')
      errorMessages.push('1. Create a .env.local file in your project root')
      errorMessages.push('2. Add the missing environment variables')
      errorMessages.push('3. For JWT secrets, use: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
      errorMessages.push('4. Restart your development server')
    }

    throw new Error(errorMessages.join('\n'))
  }

  // Show warnings if any
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:')
    result.warnings.forEach(warning => {
      console.warn(`  - ${warning}`)
    })
  }

  console.log('✅ Environment validation passed')
}

/**
 * Get a formatted environment status report
 */
export function getEnvironmentStatus(): string {
  const result = validateEnvironment()
  const status = []

  status.push('🔧 Environment Configuration Status:')
  status.push('')

  // Check each required variable
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key as RequiredEnvVar]
    const status_icon = value ? '✅' : '❌'
    const masked_value = value ? (key.includes('SECRET') || key.includes('KEY') ? '[REDACTED]' : value) : '[MISSING]'
    status.push(`${status_icon} ${key}: ${masked_value}`)
  }

  status.push('')
  status.push(`Environment: ${process.env.NODE_ENV || 'development'}`)
  status.push(`Validation: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`)

  if (result.warnings.length > 0) {
    status.push('')
    status.push('⚠️  Warnings:')
    result.warnings.forEach(warning => {
      status.push(`  - ${warning}`)
    })
  }

  if (result.errors.length > 0) {
    status.push('')
    status.push('❌ Errors:')
    result.errors.forEach(error => {
      status.push(`  - ${error}`)
    })
  }

  return status.join('\n')
}
