import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Add debug logging
    console.log('Profile creation API called')
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))

    // Check if request has body
    const text = await request.text()
    console.log('Raw request body:', text)

    if (!text || text.trim() === '') {
      console.error('Empty request body received')
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      )
    }

    let parsedData
    try {
      parsedData = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Body that failed to parse:', text)
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError },
        { status: 400 }
      )
    }

    const { userId, profileData } = parsedData

    console.log('Parsed data:', { userId, profileData })

    if (!userId || !profileData) {
      console.error('Missing userId or profileData:', { userId: !!userId, profileData: !!profileData })
      return NextResponse.json(
        { error: 'Missing userId or profileData' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // First, verify the user exists in auth.users (optional debug step)
    console.log('Verifying user exists in auth.users for userId:', userId)
    try {
      const { data: authUser, error: authError } = await supabaseServer.auth.admin.getUserById(userId)
      if (authError) {
        console.log('User verification failed (this might be normal if using test data):', authError)
      } else {
        console.log('User verified in auth.users:', authUser.user?.email)
      }
    } catch (authVerifyError) {
      console.log('Auth user verification failed (might be normal for test):', authVerifyError)
    }

    // Check if profile already exists
    console.log('Checking if profile already exists for user:', userId)
    const { data: existingProfile, error: checkError } = await supabaseServer
      .from('user_profiles')
      .select('id, email, full_name, role')
      .eq('id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if profile doesn't exist
      console.error('Error checking existing profile:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing profile', details: checkError },
        { status: 500 }
      )
    }

    if (existingProfile) {
      console.log('Profile already exists for user:', userId)
      return NextResponse.json(
        {
          error: 'Profile already exists',
          profile: existingProfile,
          message: 'A profile has already been created for this user'
        },
        { status: 409 } // Conflict status code
      )
    }

    console.log('About to insert profile for user:', userId)

    const { data: insertedProfile, error: profileError } = await supabaseServer
      .from('user_profiles')
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, is_onboarding_completed, onboarding_step_completed')
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError)

      // Handle specific constraint violations
      if (profileError.code === '23505') {
        // Check if it's the email uniqueness constraint
        if (profileError.message?.includes('user_profiles_email_key')) {
          return NextResponse.json(
            {
              error: 'Email already registered',
              message: 'This email address is already associated with another account. Each email can only be used for one account.',
              details: profileError
            },
            { status: 409 }
          )
        }

        // Generic duplicate constraint (probably user ID)
        return NextResponse.json(
          {
            error: 'Profile already exists',
            message: 'A profile has already been created for this user',
            details: profileError
          },
          { status: 409 }
        )
      }

      // Handle foreign key constraint violation (user doesn't exist in auth.users)
      if (profileError.code === '23503') {
        return NextResponse.json(
          {
            error: 'Invalid user ID',
            message: 'The provided user ID does not exist in the authentication system',
            details: profileError
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create profile', details: profileError },
        { status: 500 }
      )
    }

    console.log('Profile created successfully:', insertedProfile)
    return NextResponse.json({ profile: insertedProfile })
  } catch (error) {
    console.error('Profile creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
