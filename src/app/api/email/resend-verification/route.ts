import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RateLimiter, getClientIdentifier } from '@/lib/rate-limiter';
import { sendVerificationEmail } from '@/lib/resend-service';

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize rate limiter with email-specific rules
const rateLimiter = RateLimiter.getInstance();

// Add email resend specific rate limiting rule
if (!rateLimiter['rules']['email-resend']) {
  rateLimiter['rules']['email-resend'] = {
    windowMs: (parseInt(process.env.EMAIL_RESEND_COOLDOWN_SECONDS) || 20) * 1000, // Default 20 seconds, configurable
    maxRequests: 1, // Only 1 resend request per window
    message: `Please wait ${parseInt(process.env.EMAIL_RESEND_COOLDOWN_SECONDS) || 20} seconds before requesting another verification email.`
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Apply rate limiting based on email address
    const { ip } = getClientIdentifier(request);
    const rateLimitKey = `${email}:${ip}`; // Combine email and IP for more specific rate limiting
    const rateLimit = await rateLimiter.checkRateLimit(rateLimitKey, 'email-resend');

    if (!rateLimit.allowed) {
      const cooldownSeconds = parseInt(process.env.EMAIL_RESEND_COOLDOWN_SECONDS) || 20;
      const resetTime = new Date(rateLimit.resetTime).toLocaleTimeString();

      console.log(`[EMAIL-RESEND-RATE-LIMIT] ${email} from ${ip} rate limited. Reset at: ${resetTime}`);

      return NextResponse.json(
        {
          error: rateLimit.message,
          type: 'rate_limited',
          cooldownSeconds,
          resetTime: rateLimit.resetTime,
          resetTimeFormatted: resetTime
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

    console.log(`[EMAIL-RESEND] Processing request for: ${email} (Rate limit: ${rateLimit.remaining} remaining)`);

    // Check if the email exists in our system first
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_email_verified, email')
      .eq('email', email)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // No user found - for security, don't reveal this but return success
        console.log(`[EMAIL-RESEND] Email ${email} not found - returning success for security`);
        return NextResponse.json({
          success: true,
          message: 'If this email exists in our system, a verification email has been sent.',
          debugInfo: process.env.NODE_ENV === 'development' ? 'Email not found in system' : undefined
        });
      }
      throw profileError;
    }

    // Check if already verified (log for debugging but still allow resend for testing)
    if (profile.is_email_verified) {
      console.log(`[EMAIL-RESEND] Note: ${email} is already verified, but sending verification email for testing purposes`);
    }

    // 🚀 PROPER IMPLEMENTATION: Use your actual Resend service
    console.log('[EMAIL-RESEND] Using proper Resend service for email delivery');

    // Generate verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const verificationUrl = `${baseUrl}/auth/callback?email=${encodeURIComponent(email)}&type=signup`;

    // Use your actual Resend service
    const emailResult = await sendVerificationEmail(email, verificationUrl);

    if (!emailResult.success) {
      console.error('[EMAIL-RESEND] Resend service error:', emailResult.error);
      throw new Error(`Failed to send verification email: ${emailResult.error}`);
    }

    const processingTime = Date.now() - startTime;
    const emailService = process.env.NODE_ENV === 'production' ? 'resend-production' : 'resend-development';

    console.log(`[EMAIL-RESEND] Successfully sent verification email to ${email} via ${emailService} (${processingTime}ms)`);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully!',
      debugInfo: process.env.NODE_ENV === 'development' ? {
        environment: process.env.NODE_ENV,
        service: emailService,
        processingTime: `${processingTime}ms`,
        rateLimitRemaining: rateLimit.remaining,
        cooldownSeconds: parseInt(process.env.EMAIL_RESEND_COOLDOWN_SECONDS) || 20,
        emailResult
      } : undefined
    }, {
      headers: rateLimiter.getRateLimitHeaders(rateLimit)
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[EMAIL-RESEND] Error occurred:', error);
    console.error(`[EMAIL-RESEND] Processing time before error: ${processingTime}ms`);

    return NextResponse.json(
      {
        error: 'Failed to resend verification email',
        details: error instanceof Error ? error.message : 'Unknown error',
        debugInfo: process.env.NODE_ENV === 'development' ? {
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString()
        } : undefined
      },
      { status: 500 }
    );
  }
}
