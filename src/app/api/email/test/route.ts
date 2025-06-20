import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { action, email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required (resend-verification, forgot-password, signup)' },
        { status: 400 }
      )
    }

    console.log(`[EMAIL-TEST-API] Testing ${action} for ${email}`)

    let result

    switch (action) {
      case 'resend-verification':
        result = await emailService.resendVerificationEmail(email)
        break

      case 'forgot-password':
        result = await emailService.sendPasswordResetEmail(email)
        break

      case 'signup':
        result = await emailService.sendSignupConfirmationEmail(email)
        break

      case 'custom-email':
        result = await emailService.sendCustomEmail({
          to: email,
          subject: 'Test Email from Unified Service',
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
              <h1>🎉 Unified Email Service Test</h1>
              <p>This email was sent via the new unified email service!</p>
              <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
              <p><strong>Service:</strong> Consolidated EmailService v2.0</p>
            </div>
          `
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: resend-verification, forgot-password, signup, custom-email' },
          { status: 400 }
        )
    }

    // Return the result from EmailService with additional metadata
    return NextResponse.json({
      ...result,
      action,
      email,
      timestamp: new Date().toISOString(),
      testMode: true,
      instructions: process.env.NODE_ENV === 'development'
        ? 'Check Mailpit at http://localhost:54324 for captured emails'
        : 'Check your email inbox for the message'
    })

  } catch (error) {
    console.error('[EMAIL-TEST-API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test email',
        details: error instanceof Error ? error.message : 'Unknown error',
        action: 'error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const status = await emailService.getEmailServiceStatus()

    return NextResponse.json({
      message: 'Unified Email Test API Ready',
      status,
      availableActions: [
        'resend-verification',
        'forgot-password',
        'signup',
        'custom-email'
      ],
      usage: 'POST with { "action": "ACTION_NAME", "email": "test@example.com" }',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get email service status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
