/**
 * Verification Token Utility
 *
 * Provides secure token generation and validation for email verification.
 * Uses industry-standard JWT with appropriate security settings.
 * Edge Runtime compatible - only uses Web APIs and process.env
 */

import { SignJWT, jwtVerify } from 'jose'

/**
 * Get JWT secret from environment variables
 * Edge Runtime compatible - only uses process.env
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET or NEXTAUTH_SECRET must be set in environment variables');
  }

  return secret;
}

/**
 * Generate a verification token for email verification
 */
export async function generateVerificationToken(email: string, expiresIn: number = 3600): Promise<string> {
  const secret = getJwtSecret();

  const payload = {
    email,
    type: 'email_verification',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + (expiresIn * 1000)))
    .sign(new TextEncoder().encode(secret));

  console.log(`[VERIFICATION-TOKEN] Generated token for ${email} (exp: ${expiresIn}s)`)
  return token;
}

/**
 * Validate and decode a verification token
 */
export async function validateVerificationToken(token: string): Promise<{ email: string; type: string } | null> {
  try {
    const secret = getJwtSecret();

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    // Validate payload structure
    if (!payload.email || !payload.type || payload.type !== 'email_verification') {
      console.warn('[VERIFICATION-TOKEN] Invalid token payload structure')
      return null;
    }

    // Check expiration (jose should handle this automatically, but double-check)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.warn(`[VERIFICATION-TOKEN] Token expired at ${new Date(payload.exp * 1000).toISOString()}`)
      return null;
    }

    console.log(`[VERIFICATION-TOKEN] Valid token for ${payload.email}, expires ${new Date(payload.exp * 1000).toISOString()}`)

    return {
      email: payload.email as string,
      type: payload.type as string
    };
  } catch (error) {
    console.error('[VERIFICATION-TOKEN] Token validation error:', error)
    return null;
  }
}

/**
 * Check if an email exists and is unverified in the database
 * This is used to validate that tokens are only honored for legitimate users
 */
export async function isEmailPendingVerification(email: string): Promise<boolean> {
  try {
    const { createClient } = await import('@supabase/supabase-js')

    // Get environment variables directly (Edge Runtime supports process.env)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[VERIFICATION-TOKEN] Missing Supabase environment variables')
      return false
    }

    // Create admin client with service role key
    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
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

function getIssuer(): string {
  return getServerEnv('NEXT_PUBLIC_APP_URL') || 'https://nobridge.ai'
}

function getAudience(): string {
  return getServerEnv('NEXT_PUBLIC_APP_URL') || 'https://nobridge.ai'
}
