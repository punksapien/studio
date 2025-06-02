import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET /api/onboarding/status - Check user's onboarding status
export async function GET(request: NextRequest) {
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

    // Get user's onboarding status from user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_onboarding_completed, onboarding_step_completed, submitted_documents, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({
      is_onboarding_completed: profile.is_onboarding_completed,
      onboarding_step_completed: profile.onboarding_step_completed,
      submitted_documents: profile.submitted_documents,
      role: profile.role,
      next_step: getNextStep(profile.role, profile.onboarding_step_completed)
    });

  } catch (error) {
    console.error('Onboarding status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/onboarding/status - Update user's onboarding step
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

    const body = await request.json();
    const { step_completed, submitted_documents, complete_onboarding } = body;

    // Build update object
    const updateData: any = {};

    if (typeof step_completed === 'number') {
      updateData.onboarding_step_completed = step_completed;
    }

    if (submitted_documents) {
      updateData.submitted_documents = submitted_documents;
    }

    if (complete_onboarding === true) {
      updateData.is_onboarding_completed = true;
      updateData.onboarding_completed_at = new Date().toISOString();
    }

    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('is_onboarding_completed, onboarding_step_completed, submitted_documents, role')
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Onboarding update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getNextStep(role: string, currentStep: number): string {
  const totalSteps = role === 'seller' ? 5 : 2;

  if (currentStep >= totalSteps) {
    return 'completed';
  }

  return `/onboarding/${role}/${currentStep + 1}`;
}
