
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is a placeholder. In a real app, use a secure way to get the admin client.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
   { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    // TODO: Add robust admin authentication check here
    // For MVP, assuming this endpoint is protected by other means or is internal.

    const { users, role } = await request.json();

    if (!Array.isArray(users) || !role || (role !== 'buyer' && role !== 'seller')) {
      return NextResponse.json({ error: 'Invalid input. Expects an array of users and a role (buyer/seller).' }, { status: 400 });
    }

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const userData of users) {
      const { email, fullName, password, phoneNumber, country, initialCompanyName, buyerPersonaType } = userData;
      
      // Basic validation
      if (!email || !fullName || !password) {
        failed++;
        errors.push(`Skipped: Missing email, fullName, or password for row with email '${email || 'N/A'}'.`);
        continue;
      }

      try {
        // Simulate user creation in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm for batch tool
          user_metadata: {
            full_name: fullName,
            role: role, // This might be overridden by handle_new_user trigger
          },
        });

        if (authError) {
          throw new Error(`Auth creation failed for ${email}: ${authError.message}`);
        }

        // Simulate profile creation/update in user_profiles
        // The handle_new_user trigger might create a basic profile.
        // We might need to update it here with more specific data or if the trigger sets a default role.
        const profileData: any = {
          id: authData.user.id, // Link to auth user
          email,
          full_name: fullName,
          phone_number: phoneNumber,
          country,
          role, // Ensure the correct role is set
          is_email_verified: true,
          email_verified_at: new Date().toISOString(),
          verification_status: 'anonymous', // Default for batch added users
          is_onboarding_completed: false, // Default
          onboarding_step_completed: 0, // Default
        };

        if (role === 'seller' && initialCompanyName) {
          profileData.initial_company_name = initialCompanyName;
        }
        if (role === 'buyer' && buyerPersonaType) {
          profileData.buyer_persona_type = buyerPersonaType;
          // Add other buyer persona fields if provided in CSV
        }
        
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .upsert(profileData, { onConflict: 'id' }); // Upsert to handle if trigger created a basic one

        if (profileError) {
           throw new Error(`Profile creation/update failed for ${email}: ${profileError.message}`);
        }
        
        successful++;
      } catch (e) {
        failed++;
        const message = e instanceof Error ? e.message : String(e);
        errors.push(`Failed for ${email}: ${message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Batch user processing complete. Role: ${role}.`,
      processed: users.length,
      successful,
      failed,
      errors,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: 'Batch user processing failed.', details: message }, { status: 500 });
  }
}
