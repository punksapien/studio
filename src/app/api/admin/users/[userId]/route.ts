import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthenticationService } from '@/lib/auth-service'

// GET /api/admin/users/[userId] - Get detailed user information
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate the requester and make sure they are an admin
    const authService = AuthenticationService.getInstance()
    const authResult = await authService.authenticateUser(req)

    if (!authResult.success || !authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden_role' }, { status: 403 })
    }

    const { userId } = params

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch user profile with auth data
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        verification_status,
        country,
        phone_number,
        initial_company_name,
        buyer_persona_type,
        buyer_persona_other,
        investment_focus_description,
        preferred_investment_size,
        key_industries_of_interest,
        is_onboarding_completed,
        onboarding_completed_at,
        onboarding_step_completed,
        submitted_documents,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single()

    if (profileError || !userProfile) {
      if (profileError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Fetch auth user data for email verification status and last login
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)

    // Get user's activity counts (listings, inquiries) in parallel
    const [listingsResult, inquiriesAsBuyerResult, inquiriesAsSellerResult] = await Promise.all([
      // Listings if seller (placeholder for future listings table)
      userProfile.role === 'seller'
        ? Promise.resolve({ data: [], count: 0 }) // TODO: Replace with actual listings query when table exists
        : Promise.resolve({ data: [], count: 0 }),

      // Inquiries as buyer (placeholder for future inquiries table)
      userProfile.role === 'buyer'
        ? Promise.resolve({ data: [], count: 0 }) // TODO: Replace with actual inquiries query when table exists
        : Promise.resolve({ data: [], count: 0 }),

      // Inquiries received as seller (placeholder for future inquiries table)
      userProfile.role === 'seller'
        ? Promise.resolve({ data: [], count: 0 }) // TODO: Replace with actual inquiries query when table exists
        : Promise.resolve({ data: [], count: 0 })
    ])

    // Transform the data to match frontend expectations
    const userDetails = {
      // Basic profile info
      id: userProfile.id,
      fullName: userProfile.full_name || 'Unknown User',
      email: userProfile.email || 'No email',
      phoneNumber: userProfile.phone_number || 'N/A',
      role: userProfile.role,
      verificationStatus: userProfile.verification_status || 'unverified',
      country: userProfile.country || 'Unknown',

      // Auth-related info
      isEmailVerified: authUser?.user?.email_confirmed_at ? true : false,
      lastLogin: authUser?.user?.last_sign_in_at || null,

      // Company/business info
      initialCompanyName: userProfile.initial_company_name,

      // Buyer persona info (for buyers)
      buyerPersonaType: userProfile.buyer_persona_type,
      buyerPersonaOther: userProfile.buyer_persona_other,
      investmentFocusDescription: userProfile.investment_focus_description,
      preferredInvestmentSize: userProfile.preferred_investment_size,
      keyIndustriesOfInterest: userProfile.key_industries_of_interest,

      // Onboarding info
      is_onboarding_completed: userProfile.is_onboarding_completed || false,
      isOnboardingCompleted: userProfile.is_onboarding_completed || false,
      onboarding_step_completed: userProfile.onboarding_step_completed || 0,
      onboardingStep: userProfile.onboarding_step_completed || 0,
      onboardingCompletedAt: userProfile.onboarding_completed_at,
      submittedDocuments: userProfile.submitted_documents,

      // Timestamps
      createdAt: userProfile.created_at,
      updatedAt: userProfile.updated_at,

      // Payment status (placeholder - will be calculated from subscriptions in future)
      isPaid: false, // TODO: Calculate from subscriptions table when available

      // Activity counts
      listingCount: listingsResult.count || 0,
      inquiryCount: (inquiriesAsBuyerResult.count || 0) + (inquiriesAsSellerResult.count || 0),

      // Recent activity (placeholder for now)
      recentListings: listingsResult.data || [],
      recentInquiries: [...(inquiriesAsBuyerResult.data || []), ...(inquiriesAsSellerResult.data || [])],
    }

    console.log('Admin User Detail API - returning data for user:', userId, {
      fullName: userDetails.fullName,
      role: userDetails.role,
      verificationStatus: userDetails.verificationStatus,
      isEmailVerified: userDetails.isEmailVerified,
      lastLogin: userDetails.lastLogin
    })

    return NextResponse.json({
      user: userDetails,
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'database'
      }
    }, {
      headers: {
        'Cache-Control': 's-maxage=30', // 30-second cache for user details
      }
    })

  } catch (error) {
    console.error('Unexpected error in admin user detail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
