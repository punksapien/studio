import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password, role = 'buyer' } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

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
        is_onboarding_completed: false,
        onboarding_step_completed: 0,
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
