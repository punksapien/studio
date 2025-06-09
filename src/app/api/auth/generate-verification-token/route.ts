import { NextRequest, NextResponse } from 'next/server';
import { generateVerificationToken, isEmailPendingVerification } from '@/lib/verification-token';
import { getClientIdentifier, RateLimiter } from '@/lib/rate-limiter';

// Initialize rate limiter for token generation
const rateLimiter = RateLimiter.getInstance();

// Add token generation specific rate limiting rule
if (!rateLimiter['rules']['verification-token']) {
  rateLimiter['rules']['verification-token'] = {
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 3, // Only 3 token generations per 30 seconds
    message: 'Too many verification token requests. Please try again in 30 seconds.'
  };
}

/**
 * API Route to generate a secure verification token
 * This is used by the frontend when redirecting to /verify-email
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const { ip } = getClientIdentifier(request);
    const rateLimit = await rateLimiter.checkRateLimit(ip, 'verification-token');

    if (!rateLimit.allowed) {
      console.log(`[TOKEN-GEN] Rate limited IP: ${ip}`);
      return NextResponse.json(
        {
          error: rateLimit.message,
          type: 'rate_limited',
          resetTime: rateLimit.resetTime
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            ...rateLimiter.getRateLimitHeaders(rateLimit)
          }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, type = 'register', redirectTo, expiresIn } = body;

    // Basic validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate that this email exists and needs verification
    const isPending = await isEmailPendingVerification(email);

    // For security, we still generate a token even if email doesn't exist
    // But we flag it as potentially fraudulent
    if (!isPending) {
      console.warn(`[TOKEN-GEN] Warning: Token requested for email that doesn't exist or isn't pending verification: ${email}`);
    }

    // Generate the token
    const token = await generateVerificationToken(email, {
      type: type as 'register' | 'email_change' | 'login',
      redirectTo,
      expiresIn
    });

    // Audit logging
    console.log(`[TOKEN-GEN] Generated token for ${email} (type: ${type}, isPending: ${isPending})`);

    // Return the token
    return NextResponse.json(
      {
        token,
        email,
        type,
        expiresIn: expiresIn || 24 * 60 * 60, // Default 24 hours
      },
      {
        headers: {
          ...rateLimiter.getRateLimitHeaders(rateLimit)
        }
      }
    );
  } catch (error) {
    console.error('[TOKEN-GEN] Error generating verification token:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate verification token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
