
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface UserProfile {
  id: string;
  role: 'buyer' | 'seller' | 'admin';
  is_onboarding_completed: boolean;
  onboarding_step_completed: number | null; // Can be null if not started
}

async function getSupabaseUserAndProfile(req: NextRequest, res: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options })
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null, error: userError?.message || 'No user session' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, role, is_onboarding_completed, onboarding_step_completed')
    .eq('id', user.id)
    .single<UserProfile>();
  
  if (profileError && profileError.code !== 'PGRST116') { // PGRST116: No rows found
    console.warn(`[Middleware] Profile fetch failed for user ${user.id}:`, profileError.message);
    return { user, profile: null, error: `Profile fetch failed: ${profileError.message}` };
  }
  
  return { user, profile: profile || null, error: null };
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  const publicPaths = [
    '/', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/update-password',
    '/auth/verify-otp', '/auth/callback', '/auth/verification-error', '/auth/verification-success',
    '/marketplace', '/about', '/contact', '/pricing', '/terms', '/privacy',
    '/api/test', '/api/auth/create-profile' // Allow create-profile API for signup process
  ];

  const isPublicPath = publicPaths.some(path => pathname === path || (path.endsWith('/') && pathname.startsWith(path))) ||
                       pathname.startsWith('/listings/') || // Public listing detail pages
                       pathname.startsWith('/_next/') || // Next.js internals
                       pathname.startsWith('/assets/') || // Static assets
                       pathname.includes('.'); // Files like .png, .svg etc.

  if (isPublicPath && !pathname.startsWith('/auth/')) {
    return res;
  }
  
  const { user, profile, error: authError } = await getSupabaseUserAndProfile(req, res);

  // Handle auth pages
  if (pathname.startsWith('/auth/')) {
    if (user && profile) { // User is authenticated
      if (['/auth/login', '/auth/register'].includes(pathname) || pathname.startsWith('/auth/register/')) {
        // If authenticated and on login/register, redirect based on onboarding/role
        if (!profile.is_onboarding_completed) {
          const nextStep = (profile.onboarding_step_completed || 0) + 1;
          const rolePath = profile.role === 'seller' ? 'seller' : 'buyer';
          const totalSteps = profile.role === 'seller' ? 5 : 2;
          const onboardingTarget = nextStep <= totalSteps ? `/onboarding/${rolePath}/${nextStep}` : `/onboarding/${rolePath}/success`;
          return NextResponse.redirect(new URL(onboardingTarget, req.url));
        }
        const dashboardUrl = profile.role === 'seller' ? '/seller-dashboard' : profile.role === 'admin' ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(dashboardUrl, req.url));
      }
    }
    // Allow access to other auth pages like /auth/callback, /auth/update-password etc.
    return res;
  }

  // Handle protected routes (dashboards, onboarding)
  if (!user || !profile) {
    console.log(`[Middleware] Unauthenticated access to ${pathname}, redirecting to login.`);
    const redirectUrl = new URL('/auth/login', req.url);
    if (pathname !== '/auth/login') {
      redirectUrl.searchParams.set('redirectTo', pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // User is authenticated, profile exists. Now check onboarding.
  const { role, is_onboarding_completed, onboarding_step_completed } = profile;
  const currentOnboardingStep = onboarding_step_completed || 0;
  const buyerTotalSteps = 2;
  const sellerTotalSteps = 5;

  if (pathname.startsWith('/onboarding')) {
    if (is_onboarding_completed && !pathname.endsWith('/success')) {
      // If onboarding is complete, redirect away from onboarding pages (unless it's success page)
      const dashboardUrl = role === 'seller' ? '/seller-dashboard' : role === 'admin' ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }

    // Check if user is on the correct role's onboarding path
    const expectedOnboardingRolePath = `/onboarding/${role}`;
    if (!pathname.startsWith(expectedOnboardingRolePath)) {
      console.log(`[Middleware] User with role ${role} trying to access wrong onboarding path ${pathname}. Redirecting.`);
      const correctNextStep = currentOnboardingStep + 1;
      const correctTotalSteps = role === 'seller' ? sellerTotalSteps : buyerTotalSteps;
      const correctOnboardingTarget = correctNextStep <= correctTotalSteps ? `/onboarding/${role}/${correctNextStep}` : `/onboarding/${role}/success`;
      return NextResponse.redirect(new URL(correctOnboardingTarget, req.url));
    }
    // User is on their correct role's onboarding path, allow access.
    return res;
  }

  // For dashboard routes, enforce onboarding completion
  const protectedAppRoutes = ['/dashboard', '/seller-dashboard', '/admin'];
  if (protectedAppRoutes.some(route => pathname.startsWith(route))) {
    if (!is_onboarding_completed) {
      console.log(`[Middleware] User ${user.id} (role: ${role}) has not completed onboarding, redirecting from ${pathname}.`);
      const nextStep = currentOnboardingStep + 1;
      const totalSteps = role === 'seller' ? sellerTotalSteps : buyerTotalSteps;
      const onboardingTarget = nextStep <= totalSteps ? `/onboarding/${role}/${nextStep}` : `/onboarding/${role}/success`;
      return NextResponse.redirect(new URL(onboardingTarget, req.url));
    }

    // Ensure user is on the correct dashboard for their role
    if (role === 'buyer' && !pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (role === 'seller' && !pathname.startsWith('/seller-dashboard')) {
      return NextResponse.redirect(new URL('/seller-dashboard', req.url));
    }
    if (role === 'admin' && !pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/).*)', // Match all paths except static assets
  ],
};
