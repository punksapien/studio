import { NextRequest, NextResponse } from 'next/server';
import { sendEmailWithResend } from '@/lib/resend-service';
import { createClient } from '@supabase/supabase-js';

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
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    let result;
    const testEmail = email || 'test@example.com';

    if (process.env.NODE_ENV === 'production') {
      // Test Resend in production
      result = await sendEmailWithResend({
        to: testEmail,
        subject: 'Test Email from Resend',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h1>🎉 Resend Test Email</h1>
            <p>This email was sent via Resend in production mode!</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>
        `
      });
    } else {
      // Test Supabase Auth (goes to Inbucket) in development
      const { data, error } = await supabase.auth.signInWithOtp({
        email: testEmail,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      result = { success: true, data };
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      environment: process.env.NODE_ENV,
      service: process.env.NODE_ENV === 'production' ? 'resend' : 'supabase-inbucket',
      emailSentTo: testEmail,
      instructions: process.env.NODE_ENV === 'production'
        ? 'Check your email inbox'
        : 'Check Inbucket at http://127.0.0.1:54324',
      result
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint ready',
    environment: process.env.NODE_ENV,
    service: process.env.NODE_ENV === 'production' ? 'resend' : 'supabase-inbucket',
    instructions: 'POST with { "email": "test@example.com" } to send test email'
  });
}
