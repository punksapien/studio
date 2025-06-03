
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper to get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }
  const token = authHeader.substring(7);
  return supabaseAdmin.auth.getUser(token);
}

// GET /api/onboarding/status - Check user's onboarding status
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await getUserFromToken(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || 'Invalid token' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('is_onboarding_completed, onboarding_step_completed, submitted_documents, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error in /api/onboarding/status GET:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile', details: profileError.message }, { status: 500 });
    }

    const currentStep = profile.onboarding_step_completed || 0;
    const totalSteps = profile.role === 'seller' ? 5 : 2; // Buyer: 2 steps, Seller: 5 steps
    let nextStepPath = `/onboarding/${profile.role}/${currentStep + 1}`;
    if (currentStep >= totalSteps) {
        nextStepPath = profile.role === 'seller' ? '/seller-dashboard' : '/dashboard';
    }
    if (profile.is_onboarding_completed) {
        nextStepPath = profile.role === 'seller' ? '/seller-dashboard' : '/dashboard';
    }


    return NextResponse.json({
      is_onboarding_completed: profile.is_onboarding_completed,
      onboarding_step_completed: profile.onboarding_step_completed,
      submitted_documents: profile.submitted_documents,
      role: profile.role,
      next_step: nextStepPath
    });

  } catch (error) {
    console.error('Onboarding status GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/onboarding/status - Update user's onboarding step
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await getUserFromToken(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { step_completed, submitted_documents, complete_onboarding } = body;

    const updateData: any = { updated_at: new Date().toISOString() };

    if (typeof step_completed === 'number') {
      updateData.onboarding_step_completed = step_completed;
    }

    if (submitted_documents && typeof submitted_documents === 'object') {
      // Fetch existing submitted_documents and merge
      const { data: currentProfile, error: fetchProfileError } = await supabaseAdmin
        .from('user_profiles')
        .select('submitted_documents')
        .eq('id', user.id)
        .single();
      
      if (fetchProfileError && fetchProfileError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
        console.error('Error fetching current submitted_documents:', fetchProfileError);
        // Continue without merging if fetch fails, new data will overwrite or create
      }

      const existingDocs = currentProfile?.submitted_documents || {};
      updateData.submitted_documents = { ...existingDocs, ...submitted_documents };
    }

    if (complete_onboarding === true) {
      updateData.is_onboarding_completed = true;
      updateData.onboarding_completed_at = new Date().toISOString();
    }

    if (Object.keys(updateData).length === 1 && 'updated_at' in updateData) {
        return NextResponse.json({ message: "No actionable data provided for update." }, { status: 400 });
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('id, is_onboarding_completed, onboarding_step_completed, submitted_documents, role')
      .single();

    if (updateError) {
      console.error('Profile update error in /api/onboarding/status POST:', updateError);
      return NextResponse.json({ error: 'Failed to update profile', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Onboarding status POST error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
