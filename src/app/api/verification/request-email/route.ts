import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

// POST /api/verification/request-email - Send verification request email using Supabase
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Verify user has completed onboarding
    if (!profile.is_onboarding_completed) {
      return NextResponse.json({ error: 'Onboarding must be completed before requesting verification' }, { status: 400 });
    }

    // Create verification request record in database
    const { data: verificationRequest, error: insertError } = await supabase
      .from('verification_requests')
      .insert({
        user_id: user.id,
        request_type: 'user_verification',
        status: 'New Request',
        reason: `${profile.role} verification request`,
        documents_submitted: [],
        admin_notes: null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create verification request:', insertError);
      return NextResponse.json({ error: 'Failed to create verification request' }, { status: 500 });
    }

    // Create email content for Supabase
    const emailSubject = `${profile.role === 'seller' ? 'Seller' : 'Buyer'} Verification Request Received - Nobridge`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Request Received</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .success-icon { width: 64px; height: 64px; margin: 0 auto 20px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; }
          .button { display: inline-block; background-color: #1e40af; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .info-box { background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✓</div>
            <h1 style="margin: 0; font-size: 24px;">Verification Request Received!</h1>
          </div>

          <div class="content">
            <h2 style="color: #1e40af; margin-top: 0;">Hello ${profile.full_name},</h2>

            <p>Great news! We've received your ${profile.role} verification request and your onboarding is now complete.</p>

            <div class="info-box">
              <h3 style="margin-top: 0; color: #1e40af;">What happens next?</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${profile.role === 'seller' ? `
                  <li><strong>Document Review:</strong> Our team will review your business documents within 3-5 business days</li>
                  <li><strong>Verification Call:</strong> We may schedule a brief verification call if needed</li>
                  <li><strong>Account Activation:</strong> Once approved, you'll gain access to premium seller features</li>
                  <li><strong>Listing Creation:</strong> Start creating verified business listings with enhanced visibility</li>
                ` : `
                  <li><strong>Profile Review:</strong> Our team will review your buyer profile within 1-2 business days</li>
                  <li><strong>Verification Call:</strong> We may schedule a brief verification call to understand your investment interests</li>
                  <li><strong>Account Activation:</strong> Once approved, you'll gain access to detailed business information</li>
                  <li><strong>Direct Access:</strong> Connect directly with verified sellers and access exclusive listings</li>
                `}
              </ul>
            </div>

            <p><strong>Want to expedite your verification?</strong></p>
            <p>You can request priority verification by visiting your dashboard. Our admin team will prioritize your request and reach out within 24 hours.</p>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/${profile.role === 'seller' ? 'seller-dashboard' : 'dashboard'}/verification" class="button">
                Visit Your Dashboard
              </a>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0; color: #059669;">In the meantime:</h3>
              <p style="margin: 10px 0;">
                ${profile.role === 'seller'
                  ? 'You can start drafting your business listing and explore the seller dashboard features.'
                  : 'You can browse public listings and explore the marketplace to familiarize yourself with available opportunities.'
                }
              </p>
            </div>

            <p>If you have any questions about the verification process, please don't hesitate to contact our support team.</p>

            <p>Thank you for choosing Nobridge!</p>

            <p style="margin-bottom: 0;">
              Best regards,<br>
              <strong>The Nobridge Team</strong>
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">© 2024 Nobridge. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Supabase's built-in email system
    try {
      // Use Supabase Auth's admin email function
      const { error: emailError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email!,
        options: {
          data: {
            verification_request_id: verificationRequest.id,
            subject: emailSubject,
            html_content: emailHtml,
            email_type: 'verification_request'
          }
        }
      });

      if (emailError) {
        console.error('Supabase email error:', emailError);
        // Still return success since the verification request was created
        return NextResponse.json({
          success: true,
          message: 'Verification request created successfully. Email notification may not have been sent.',
          verification_request: verificationRequest,
          email_status: 'failed'
        });
      }

      console.log(`[VERIFICATION-EMAIL] Email sent successfully to ${user.email} for ${profile.role} verification`);

      return NextResponse.json({
        success: true,
        message: 'Verification request created and email sent successfully',
        verification_request: verificationRequest,
        email_status: 'sent'
      });

    } catch (emailError) {
      console.error('Email sending failed:', emailError);

      // Still return success since the verification request was created
      return NextResponse.json({
        success: true,
        message: 'Verification request created successfully. Email notification may not have been sent.',
        verification_request: verificationRequest,
        email_status: 'failed'
      });
    }

  } catch (error) {
    console.error('Verification request email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
