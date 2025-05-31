import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId, profileData } = await request.json()

    if (!userId || !profileData) {
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

    const { data: insertedProfile, error: profileError } = await supabaseServer
      .from('user_profiles')
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to create profile', details: profileError },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile: insertedProfile })
  } catch (error) {
    console.error('Profile creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
