import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  console.log('Auth callback called with:', { code: !!code, next, url: requestUrl.toString() })

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

    // Get user profile to determine where to redirect
    console.log('Fetching user profile for role-based redirect...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      // Still redirect to home page even if profile fetch fails
    }

    console.log('User profile found:', profile)

    // Redirect to appropriate dashboard based on role
    let redirectPath = '/' // default to home page
    if (profile?.role === 'seller') {
      redirectPath = '/seller-dashboard'
    } else if (profile?.role === 'buyer') {
      redirectPath = '/dashboard'
    } else if (profile?.role === 'admin') {
      redirectPath = '/admin'
    }

    console.log('Redirecting to:', redirectPath)

    // Add success message as query param
    const redirectUrl = new URL(redirectPath, requestUrl.origin)
    redirectUrl.searchParams.set('verified', 'true')

    return NextResponse.redirect(redirectUrl)
  }

  console.log('No code provided in callback, redirecting to login')
  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}
