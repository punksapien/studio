import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const RATE_LIMIT_MAX = 3; // Max 3 submissions per hour per IP

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return `contact_form:${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // First request or window expired, reset
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, resetTime: record.resetTime };
  }

  // Increment count
  record.count++;
  rateLimitMap.set(key, record);
  return { allowed: true };
}

function sanitizeInput(input: string): string {
  // Basic sanitization to prevent injection
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitKey = getRateLimitKey(request);
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime ? new Date(rateLimit.resetTime).toISOString() : 'unknown';
      console.log(`[CONTACT-FORM] Rate limit exceeded for ${rateLimitKey}`);

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. You can submit up to 3 contact forms per hour.',
          resetTime
        },
        { status: 429 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Input validation
    if (!name || !email || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, email, and message are required.'
        },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a valid email address.'
        },
        { status: 400 }
      );
    }

    if (name.length > 100 || email.length > 100 || message.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Input too long. Name and email must be under 100 characters, message under 2000 characters.'
        },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email);
    const cleanSubject = subject ? sanitizeInput(subject) : 'General Inquiry';
    const cleanMessage = sanitizeInput(message);

    console.log(`[CONTACT-FORM] Processing submission from ${cleanName} (${cleanEmail})`);

    // Send email to admin
    const emailHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${cleanName} (${cleanEmail})</p>
      <p><strong>Subject:</strong> ${cleanSubject}</p>
      <p><strong>Message:</strong></p>
      <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
        ${cleanMessage.replace(/\n/g, '<br>')}
      </div>
      <hr>
      <p style="color: #666; font-size: 12px;">
        Submitted at: ${new Date().toLocaleString()}<br>
        From IP: ${getRateLimitKey(request).replace('contact_form:', '')}
      </p>
    `;

    const result = await emailService.sendNotificationEmail({
      to: 'Business@nobridge.co',
      subject: `Contact Form: ${cleanSubject}`,
      html: emailHtml,
      from: 'noreply@nobridge.co'
    });

    if (!result.success) {
      console.error(`[CONTACT-FORM] Email sending failed:`, result.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send your message. Please try again later or contact us directly.',
          debug: result.debug
        },
        { status: 500 }
      );
    }

    console.log(`[CONTACT-FORM] Successfully sent contact form email from ${cleanName} via ${result.service}`);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
      service: result.service,
      attempts: result.attempts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CONTACT-FORM] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
