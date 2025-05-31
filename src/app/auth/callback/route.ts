import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Successfully verified via magic link and user is now logged in

      // Get user profile to determine where to redirect
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      // Redirect to appropriate dashboard based on role
      let redirectPath = '/dashboard' // default
      if (profile?.role === 'seller') {
        redirectPath = '/seller-dashboard'
      } else if (profile?.role === 'buyer') {
        redirectPath = '/dashboard'
      } else if (profile?.role === 'admin') {
        redirectPath = '/admin'
      }

      // Add success message as query param
      const redirectUrl = new URL(redirectPath, requestUrl.origin)
      redirectUrl.searchParams.set('verified', 'true')

      return NextResponse.redirect(redirectUrl)
    } else {
      // Error with magic link verification
      return NextResponse.redirect(new URL('/auth/verification-error', requestUrl.origin))
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}
