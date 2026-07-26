import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hasLeadsChatWebhook, postMaAssessmentCard } from '@/lib/google-chat';

// Input validation schema — email is the only field the popup collects.
const leadSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email } = leadSchema.parse(body);

    const { error } = await supabaseAdmin
      .from('ma_assessment_leads')
      .insert([{ email, source: 'popup_ma_assessment' }]);

    if (error) {
      console.error('[ma-assessment] insert failed:', error);
      return NextResponse.json(
        { success: false, error: 'Unable to save your request. Please try again.' },
        { status: 500 }
      );
    }

    // Best-effort Chat notification. Awaited so serverless does not tear down
    // the function before the request completes; a Chat failure must never fail
    // the request.
    try {
      if (hasLeadsChatWebhook()) {
        await postMaAssessmentCard(email);
        console.log('[ma-assessment] chat notify sent for', email);
      } else {
        console.warn('[ma-assessment] GOOGLE_CHAT_LEADS_WEBHOOK_URL not configured — skipped notify');
      }
    } catch (err) {
      console.error('[ma-assessment] chat notify failed:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    console.error('[ma-assessment] unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
