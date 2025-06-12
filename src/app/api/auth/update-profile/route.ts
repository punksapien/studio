import { createClient } from '@supabase/supabase-js'
import { NextResponse, NextRequest } from 'next/server'
import { AuthenticationService } from '@/lib/auth-service'

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user using the same service as other endpoints
    const authResult = await AuthenticationService.getInstance().authenticateUser(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user, profile } = authResult
    const body = await request.json()

    console.log('Profile update request for user:', user.id, body)

    // Extract and validate the profile data
    const {
      full_name,
      phone_number,
      country,
      initial_company_name,
      buyer_persona_type,
      buyer_persona_other,
      investment_focus_description,
      preferred_investment_size,
      key_industries_of_interest
    } = body

    // Prepare update data (only include non-undefined fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (full_name !== undefined) updateData.full_name = full_name
    if (phone_number !== undefined) updateData.phone_number = phone_number
    if (country !== undefined) updateData.country = country
    if (initial_company_name !== undefined) updateData.initial_company_name = initial_company_name
    if (buyer_persona_type !== undefined) updateData.buyer_persona_type = buyer_persona_type
    if (buyer_persona_other !== undefined) updateData.buyer_persona_other = buyer_persona_other
    if (investment_focus_description !== undefined) updateData.investment_focus_description = investment_focus_description
    if (preferred_investment_size !== undefined) updateData.preferred_investment_size = preferred_investment_size
    if (key_industries_of_interest !== undefined) updateData.key_industries_of_interest = key_industries_of_interest

    console.log('Updating profile with data:', updateData)

    // Update user profile in database using service role key
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    console.log('Profile updated successfully:', updatedProfile)

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    })

  } catch (error) {
    console.error('Unexpected error in update-profile API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
