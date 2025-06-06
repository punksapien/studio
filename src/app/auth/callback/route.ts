import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('Auth callback called with:', { code: !!code, url: requestUrl.toString() })

  if (code) {
    const response = NextResponse.redirect(new URL('/auth/verification-error', requestUrl.origin))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    console.log('Attempting to exchange code for session with cookies:', {
      hasCodeVerifier: !!request.cookies.get('sb-127-auth-token-code-verifier'),
      cookieNames: Array.from(request.cookies.getAll().map(c => c.name)).filter(name => name.includes('sb-'))
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.redirect(new URL(`/auth/verification-error?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
    }

    if (!data.user) {
      console.error('No user returned from session exchange')
      return NextResponse.redirect(new URL('/auth/verification-error?error=no_user', requestUrl.origin))
    }

    console.log('Successfully exchanged code, user logged in:', data.user.email)
    const userId = data.user.id;
    const userEmail = data.user.email;

    // Update email verification status in user_profiles table
    if (data.user.email_confirmed_at && userEmail) {
      console.log('[ZOMBIE-ACCOUNT] Email verification confirmed, updating account status to active...');
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          is_email_verified: true,
          email_verified_at: data.user.email_confirmed_at,
          account_status: 'active',
          verification_deadline: null,
          deletion_scheduled_at: null
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[ZOMBIE-ACCOUNT] Failed to update account status to active:', updateError);
        console.error('Failed to update email verification status in profile:', updateError);
      } else {
        console.log('[ZOMBIE-ACCOUNT] Successfully updated account status to active');
        console.log('Successfully updated email verification status in profile');

        const { error: auditError } = await supabase
          .from('account_cleanup_audit')
          .insert({
            user_id: userId,
            user_email: userEmail,
            action: 'manually_verified',
            reason: 'Email verification completed via magic link',
            metadata: {
              verification_method: 'magic_link',
              verified_at: data.user.email_confirmed_at,
              automated: true
            }
          });

        if (auditError) {
          console.error('[ZOMBIE-ACCOUNT] Failed to log verification in audit trail:', auditError);
        } else {
          console.log('[ZOMBIE-ACCOUNT] Verification logged in audit trail');
        }
      }
    }

    // Get user profile to determine where to redirect
    console.log('Fetching user profile for role-based redirect...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, verification_status, is_email_verified, is_onboarding_completed, onboarding_step_completed')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      if (profileError.code === 'PGRST116') {
        console.warn(`Profile not found for user ${userId}. Redirecting to verify-email for profile creation.`);
        const verifyEmailUrl = new URL('/verify-email', requestUrl.origin);
        verifyEmailUrl.searchParams.set('email', userEmail || '');
        verifyEmailUrl.searchParams.set('type', 'register');
        verifyEmailUrl.searchParams.set('verified_magic_link', 'true');
        return NextResponse.redirect(verifyEmailUrl);
      }
      return NextResponse.redirect(new URL('/auth/verification-error?error=profile_fetch_failed', requestUrl.origin));
    }

    console.log('User profile found:', profile);

    // Determine redirect path
    let redirectPath = '/'

    // Check if user hasn't completed onboarding
    if (!profile.is_onboarding_completed) {
      console.log(`User ${userId} email verified and needs onboarding. Role: ${profile.role}`);
      const nextStep = (profile.onboarding_step_completed || 0) + 1;
      if (profile.role === 'seller') {
        const totalSteps = 5;
        redirectPath = nextStep <= totalSteps ? `/onboarding/seller/${nextStep}` : `/onboarding/seller/success`;
      } else if (profile.role === 'buyer') {
        const totalSteps = 2;
        redirectPath = nextStep <= totalSteps ? `/onboarding/buyer/${nextStep}` : `/onboarding/buyer/success`;
      } else if (profile.role === 'admin') {
        redirectPath = '/admin';
      }
    } else {
      // User already completed onboarding, redirect to dashboard
      console.log(`User ${userId} already onboarded. Role: ${profile.role}`);
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

    if (redirectPath.includes('dashboard') || redirectPath.includes('admin')) {
        finalRedirectUrl.searchParams.set('login_success', 'true');
    } else if (redirectPath.includes('onboarding')) {
        finalRedirectUrl.searchParams.set('verification_success', 'true');
    }

    // Create a fresh response with the final redirect
    const finalResponse = NextResponse.redirect(finalRedirectUrl);

    // Copy any cookies that were set during auth
    response.cookies.getAll().forEach(cookie => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        domain: cookie.domain,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        path: cookie.path,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
      })
    })

    return finalResponse;
  }

  console.log('No code provided in callback, redirecting to login');
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}
