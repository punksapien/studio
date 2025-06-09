import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/profile - Fetch current user profile
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()

    // Create Supabase client with cookie support (same as middleware)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get user from session (this works in API routes with cookies)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('[API-PROFILE] No authenticated user found:', userError?.message)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('[API-PROFILE] Fetching profile for user:', user.id)

    // Fetch profile using the authenticated Supabase client
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[API-PROFILE] Error fetching user profile:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    console.log('[API-PROFILE] Profile fetched successfully for user:', user.id, 'Role:', profile.role)
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('[API-PROFILE] Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()

    // Create Supabase client with cookie support
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Define allowed fields for update (excluding system fields)
    const allowedFields = [
      'full_name',
      'phone_number',
      'country',
      'initial_company_name',
      'buyer_persona_type',
      'buyer_persona_other',
      'investment_focus_description',
      'preferred_investment_size',
      'key_industries_of_interest'
    ]

    // Filter body to only include allowed fields
    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    if (Object.keys(updateData).length === 1) { // Only updated_at
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      )
    }

    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
