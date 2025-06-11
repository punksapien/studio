/**
 * Verification Token Utility
 *
 * Provides secure token generation and validation for email verification.
 * Uses industry-standard JWT with appropriate security settings.
 */

import { SignJWT, jwtVerify } from 'jose'
import { nanoid } from 'nanoid'
import { validateEnvironmentOrThrow } from './env-validation'

// Token expiration time in seconds (default: 24 hours)
const DEFAULT_TOKEN_EXPIRY = 24 * 60 * 60 // 24 hours

// Use consistent encoding for JWT operations
const encoder = new TextEncoder()

/**
 * Generate a secure verification token for email verification
 * Uses jose library (web-standard compliant) with robust security defaults
 */
export async function generateVerificationToken(
  email: string,
  options?: {
    expiresIn?: number; // Override expiration time in seconds
    type?: 'register' | 'email_change' | 'login'; // Type of verification
    redirectTo?: string; // Redirect URL after verification
  }
): Promise<string> {
  const expiresIn = options?.expiresIn || DEFAULT_TOKEN_EXPIRY
  const secret = getJwtSecret()
  const tokenId = nanoid(16) // Generate unique token ID

  // Create a standard JWT with secure defaults
  const token = await new SignJWT({
    email,
    type: options?.type || 'register',
    redirectTo: options?.redirectTo || '',
    purpose: 'email_verification'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .setJti(tokenId) // Add unique token ID to prevent replay
    .setSubject(email)
    .setIssuer(getIssuer())
    .setAudience(getAudience())
    .sign(encoder.encode(secret))

  console.log(`[VERIFICATION-TOKEN] Generated token for ${email} (exp: ${expiresIn}s)`)
  return token
}

/**
 * Validate a verification token and extract its payload if valid
 *
 * Returns null if token is invalid or expired
 */
export async function validateVerificationToken(
  token: string
): Promise<{
  email: string;
  type: string;
  redirectTo?: string;
  exp: number;
  iat: number;
} | null> {
  try {
    const secret = getJwtSecret()

    const { payload } = await jwtVerify(token, encoder.encode(secret), {
      issuer: getIssuer(),
      audience: getAudience(),
    })

    // Type safety checks
    if (
      typeof payload.email !== 'string' ||
      typeof payload.type !== 'string' ||
      payload.purpose !== 'email_verification' ||
      !payload.exp
    ) {
      console.warn('[VERIFICATION-TOKEN] Invalid token payload structure')
      return null
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      console.warn(`[VERIFICATION-TOKEN] Token expired at ${new Date(payload.exp * 1000).toISOString()}`)
      return null
    }

    console.log(`[VERIFICATION-TOKEN] Valid token for ${payload.email}, expires ${new Date(payload.exp * 1000).toISOString()}`)

    return {
      email: payload.email as string,
      type: payload.type as string,
      redirectTo: payload.redirectTo as string | undefined,
      exp: payload.exp as number,
      iat: payload.iat as number
    }
  } catch (error) {
    console.error('[VERIFICATION-TOKEN] Token validation error:', error)
    return null
  }
}

/**
 * Check if an email exists and is unverified in the database
 * This is used to validate that tokens are only honored for legitimate users
 */
export async function isEmailPendingVerification(email: string): Promise<boolean> {
  // This should query the database directly or via an API to check:
  // 1. If the email exists in auth.users
  // 2. If the email is NOT yet verified

  // For security reasons, implement with supabase service role client
  // to bypass RLS policies and directly access auth.users table

  try {
    const { createClient } = await import('@supabase/supabase-js')

    // Create admin client with service role key
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

    // Check if the email exists and is not verified
    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_email_verified')
      .eq('email', email)
      .single()

    if (error) {
      // If error is PGRST116 (not found), email doesn't exist
      if (error.code === 'PGRST116') {
        console.log(`[VERIFICATION-TOKEN] Email ${email} not found in user_profiles`)
        return false
      }
      throw error
    }

    // If email exists but is already verified, return false
    if (data.is_email_verified) {
      console.log(`[VERIFICATION-TOKEN] Email ${email} already verified`)
      return false
    }

    // Email exists and is not verified - legitimate verification pending
    console.log(`[VERIFICATION-TOKEN] Email ${email} found and pending verification`)
    return true
  } catch (error) {
    console.error('[VERIFICATION-TOKEN] Error checking email verification status:', error)
    return false
  }
}

// Helper functions to ensure consistent JWT configuration

function getJwtSecret(): string {
  // Validate environment on first call to ensure proper configuration
  validateEnvironmentOrThrow()

  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET or NEXTAUTH_SECRET environment variable is required')
  }
  return secret
}

function getIssuer(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://nobridge.ai'
}

function getAudience(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://nobridge.ai'
}
