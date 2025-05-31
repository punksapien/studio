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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successfully verified via magic link
      return NextResponse.redirect(new URL('/auth/verification-success', requestUrl.origin))
    } else {
      // Error with magic link verification
      return NextResponse.redirect(new URL('/auth/verification-error', requestUrl.origin))
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}
