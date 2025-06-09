import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Add better error handling for JSON parsing
    let requestBody
    try {
      const text = await req.text()
      console.log('Raw request body:', text)

      if (!text || text.trim() === '') {
        return NextResponse.json({ error: 'Request body is empty' }, { status: 400 })
      }

      requestBody = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Request headers:', Object.fromEntries(req.headers.entries()))
      return NextResponse.json({
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }, { status: 400 })
    }

    const { email, password, role = 'buyer' } = requestBody

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 400 })
    }

    // Create profile record
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        role: role,
        // 🚀 MVP SIMPLIFICATION: Auto-complete onboarding for test users
        // Original logic: is_onboarding_completed: false, onboarding_step_completed: 0
        // MVP logic: Test users bypass onboarding for immediate dashboard access
        is_onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step_completed: role === 'seller' ? 5 : 2, // Max steps for each role
        verification_status: 'unverified',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't return error here, auth user was created successfully
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: role,
        needsEmailVerification: !authData.user.email_confirmed_at
      },
      message: 'Test user created successfully. Check email for verification if required.'
    })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
