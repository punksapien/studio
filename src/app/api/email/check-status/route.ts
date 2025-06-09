import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client to bypass RLS
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log(`Checking email status for: ${email}`);

    // Check if user exists by looking up the profile using admin client
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('is_email_verified, email')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found - user doesn't exist
        console.log(`Email ${email} not found in user_profiles`);
        return NextResponse.json({
          exists: false,
          verified: false,
          canResend: false
        });
      }
      // Other error - log it but don't reveal details
      console.error('Database error checking email status:', error);
      return NextResponse.json({
        exists: false,
        verified: false,
        canResend: false
      });
    }

    // Profile found - user exists
    const result = {
      exists: true,
      verified: profile.is_email_verified || false,
      canResend: !profile.is_email_verified
    };

    console.log(`Email status for ${email}:`, result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Email status check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check email status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
