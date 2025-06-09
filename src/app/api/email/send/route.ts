import { NextRequest, NextResponse } from 'next/server';
import { sendEmailWithResend } from '@/lib/resend-service';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client for fallback
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

    let result;

    switch (type) {
      case 'verification':
        if (process.env.NODE_ENV === 'production') {
          // Use Resend in production
          const verificationUrl = data?.verificationUrl || `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${data?.token}`;
          result = await sendEmailWithResend({
            to: email,
            subject: 'Verify Your Email Address',
            html: `
              <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <h1>Verify Your Email</h1>
                <p>Click the link below to verify your email address:</p>
                <a href="${verificationUrl}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  Verify Email
                </a>
              </div>
            `
          });
        } else {
          // Use Supabase Auth in development (will go to Inbucket)
          const { error } = await supabase.auth.admin.generateLink({
            type: 'signup',
            email: email,
            options: {
              redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
            }
          });

          if (error) {
            throw error;
          }

          result = { success: true, data: { id: 'supabase-dev-email' } };
        }
        break;

      case 'password_reset':
        if (process.env.NODE_ENV === 'production') {
          // Use Resend in production
          const resetUrl = data?.resetUrl || `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password?token=${data?.token}`;
          result = await sendEmailWithResend({
            to: email,
            subject: 'Reset Your Password',
            html: `
              <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <h1>Reset Your Password</h1>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  Reset Password
                </a>
              </div>
            `
          });
        } else {
          // Use Supabase Auth in development
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`
          });

          if (error) {
            throw error;
          }

          result = { success: true, data: { id: 'supabase-dev-email' } };
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return NextResponse.json({
      success: true,
      message: `${type} email sent successfully`,
      environment: process.env.NODE_ENV,
      service: process.env.NODE_ENV === 'production' ? 'resend' : 'supabase-inbucket'
    });

  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
