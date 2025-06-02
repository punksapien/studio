
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  // Do not use 'next' query param from Supabase callback directly for security.
  // Determine redirect based on user state after verification.

  console.log('Auth callback called with:', { code: !!code, url: requestUrl.toString() })

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('Attempting to exchange code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth/verification-error', requestUrl.origin))
    }

    if (!data.user) {
      console.error('No user returned from session exchange')
      return NextResponse.redirect(new URL('/auth/verification-error', requestUrl.origin))
    }

    console.log('Successfully exchanged code, user logged in:', data.user.email)
    const userId = data.user.id;
    const userEmail = data.user.email;

    // Get user profile to determine where to redirect
    console.log('Fetching user profile for role-based redirect...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, verification_status, is_email_verified') // Fetch necessary fields
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      // If profile fetch fails, it's critical. Maybe redirect to a generic error page or home.
      // For now, let's assume they are a new user if profile is not found yet and redirect to onboarding.
      // This is a common race condition.
      if (profileError.code === 'PGRST116') { // "No rows found"
        console.warn(`Profile not found for user ${userId}. Assuming new user, redirecting to /verify-email to fetch role via API if possible or let user proceed.`);
        // It's tricky to know role here if profile doesn't exist.
        // A safer bet is to redirect to a page that can determine next steps, or login.
        // For simplicity with existing flow, redirect to verify-email which can handle onboarding redirect.
        const verifyEmailUrl = new URL('/verify-email', requestUrl.origin);
        verifyEmailUrl.searchParams.set('email', userEmail || ''); // Pass email if available
        verifyEmailUrl.searchParams.set('type', 'register'); // Indicate it's post-registration
        verifyEmailUrl.searchParams.set('verified_magic_link', 'true');
        return NextResponse.redirect(verifyEmailUrl);
      }
      return NextResponse.redirect(new URL('/auth/verification-error?message=profile_fetch_failed', requestUrl.origin));
    }

    console.log('User profile found:', profile);

    // Determine redirect path
    let redirectPath = '/' // Default to home page

    // Check if user's email was just verified and they haven't completed onboarding
    const emailJustVerified = !profile.is_email_verified; // If this is false after update, it means it was just verified
    const needsOnboarding = profile.verification_status === 'anonymous' || profile.verification_status === 'pending_verification';

    if (emailJustVerified && needsOnboarding) {
      console.log(`User ${userId} email just verified and needs onboarding. Role: ${profile.role}`);
      if (profile.role === 'seller') {
        redirectPath = '/onboarding/seller/1';
      } else if (profile.role === 'buyer') {
        redirectPath = '/onboarding/buyer/1';
      } else if (profile.role === 'admin') {
        redirectPath = '/admin'; // Admins might not have onboarding
      }
    } else {
      // Existing user or onboarding completed, redirect to dashboard
      console.log(`User ${userId} already onboarded or not a new registration. Role: ${profile.role}`);
      if (profile.role === 'seller') {
        redirectPath = '/seller-dashboard';
      } else if (profile.role === 'buyer') {
        redirectPath = '/dashboard';
      } else if (profile.role === 'admin') {
        redirectPath = '/admin';
      }
    }
    
    console.log('Final redirectPath determined:', redirectPath);
    const finalRedirectUrl = new URL(redirectPath, requestUrl.origin);
    // Add success message to dashboards if applicable
    if (redirectPath.includes('dashboard') || redirectPath.includes('admin')) {
        finalRedirectUrl.searchParams.set('login_success', 'true');
    } else if (redirectPath.includes('onboarding')) {
        finalRedirectUrl.searchParams.set('verification_success', 'true');
    }
    
    return NextResponse.redirect(finalRedirectUrl);
  }

  console.log('No code provided in callback, redirecting to login');
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}
