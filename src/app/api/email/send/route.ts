import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { type, email, data } = await request.json();

    // Validate input
    if (!type || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: type, email' },
        { status: 400 }
      );
    }

    console.log(`[EMAIL-SEND-API] Processing ${type} email for ${email}`);

    let result;

    switch (type) {
      case 'verification':
        result = await emailService.resendVerificationEmail(email);
        break;

      case 'password_reset':
        result = await emailService.sendPasswordResetEmail(email);
        break;

      case 'custom':
        if (!data?.subject || !data?.html) {
          return NextResponse.json(
            { error: 'Missing required fields for custom email: subject, html' },
            { status: 400 }
          );
        }

        result = await emailService.sendCustomEmail({
          to: email,
          subject: data.subject,
          html: data.html,
          from: data.from
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type. Use: verification, password_reset, custom' },
          { status: 400 }
        );
    }

    // Return unified response format
    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `${type} email sent successfully`
        : result.error,
      service: result.service,
      attempts: result.attempts,
      debug: result.debug,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[EMAIL-SEND-API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
