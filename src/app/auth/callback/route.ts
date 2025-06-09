import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  console.log('Auth callback called with:', {
    code: !!code,
    error,
    error_description,
    url: requestUrl.toString()
  })

  // Handle auth errors from Supabase
  if (error) {
    console.error('Auth callback received error:', error, error_description)
    return NextResponse.redirect(new URL(`/auth/verification-error?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin))
  }

  if (code) {
    // Create a temporary response for cookie handling - we'll create the final redirect later
    const response = NextResponse.next()

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

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Error exchanging code for session:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))

        // Handle specific PKCE errors by redirecting to a manual verification page
        if (error.message.includes('Invalid Refresh Token') ||
            error.message.includes('refresh_token_not_found') ||
            error.message.includes('pkce_verifier_invalid') ||
            error.message.includes('both auth code and code verifier should be non-empty')) {
          console.log('PKCE verification failed, redirecting to manual OTP verification')
          return NextResponse.redirect(new URL(`/verify-email?type=manual&error=pkce_failed`, requestUrl.origin))
        }

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
          const redirectResponse = NextResponse.redirect(verifyEmailUrl);
          // Copy cookies to the redirect response
          response.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value, {
              domain: cookie.domain,
              expires: cookie.expires,
              httpOnly: cookie.httpOnly,
              maxAge: cookie.maxAge,
              path: cookie.path,
              sameSite: cookie.sameSite,
              secure: cookie.secure,
            })
          })
          return redirectResponse;
        }
        return NextResponse.redirect(new URL('/auth/verification-error?error=profile_fetch_failed', requestUrl.origin));
      }

      console.log('User profile found:', profile);

      // 🚀 MVP SIMPLIFICATION: Direct dashboard redirect (bypass onboarding)
      // Original logic: Complex onboarding step check and redirection
      // MVP logic: Send all verified users directly to their appropriate dashboard
      let redirectPath = '/'

      console.log(`User ${userId} email verified, redirecting to dashboard (onboarding bypassed for MVP). Role: ${profile.role}`);

      // Direct dashboard redirect based on role (no onboarding checks)
      if (profile.role === 'seller') {
        redirectPath = '/seller-dashboard';
      } else if (profile.role === 'buyer') {
        redirectPath = '/dashboard';
      } else if (profile.role === 'admin') {
        redirectPath = '/admin';
      }

      // ORIGINAL ONBOARDING LOGIC (commented out for MVP):
      // if (!profile.is_onboarding_completed) {
      //   console.log(`User ${userId} email verified and needs onboarding. Role: ${profile.role}`);
      //   const nextStep = (profile.onboarding_step_completed || 0) + 1;
      //   if (profile.role === 'seller') {
      //     const totalSteps = 5;
      //     redirectPath = nextStep <= totalSteps ? `/onboarding/seller/${nextStep}` : `/onboarding/seller/success`;
      //   } else if (profile.role === 'buyer') {
      //     const totalSteps = 2;
      //     redirectPath = nextStep <= totalSteps ? `/onboarding/buyer/${nextStep}` : `/onboarding/buyer/success`;
      //   } else if (profile.role === 'admin') {
      //     redirectPath = '/admin';
      //   }
      // } else {
      //   // User already completed onboarding, redirect to dashboard
      //   console.log(`User ${userId} already onboarded. Role: ${profile.role}`);
      //   if (profile.role === 'seller') {
      //     redirectPath = '/seller-dashboard';
      //   } else if (profile.role === 'buyer') {
      //     redirectPath = '/dashboard';
      //   } else if (profile.role === 'admin') {
      //     redirectPath = '/admin';
      //   }
      // }

      console.log('Final redirectPath determined:', redirectPath);
      const finalRedirectUrl = new URL(redirectPath, requestUrl.origin);

      // 🚀 MVP SIMPLIFICATION: All successful auth redirects now go to dashboard with login_success
      // Original logic: Different params for onboarding vs dashboard
      // MVP logic: Always set login_success for dashboard redirects since onboarding is bypassed
      if (redirectPath.includes('dashboard') || redirectPath.includes('admin')) {
          finalRedirectUrl.searchParams.set('login_success', 'true');
      }
      // REMOVED: onboarding verification_success param (no longer used)

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

    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(new URL(`/auth/verification-error?error=${encodeURIComponent('Authentication callback failed')}`, requestUrl.origin))
    }
  }

  console.log('No code provided in callback, redirecting to login');
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}
