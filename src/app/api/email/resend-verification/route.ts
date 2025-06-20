import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is required'
        },
        { status: 400 }
      );
    }

    console.log(`[RESEND-VERIFICATION-API] Processing request for ${email}`);

    // Use the unified email service with retry logic and proper error handling
    const result = await emailService.resendVerificationEmail(email);

    // Return consistent response format
    return NextResponse.json({
      success: result.success,
      message: result.success
        ? 'Verification email sent successfully. Please check your inbox.'
        : result.error,
      debug: result.debug,
      service: result.service,
      attempts: result.attempts
    });

  } catch (error) {
    console.error('[RESEND-VERIFICATION-API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send verification email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
