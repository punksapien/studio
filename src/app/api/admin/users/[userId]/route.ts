import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthenticationService } from '@/lib/auth-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface RouteParams {
  params: Promise<{ userId: string }>
}

// GET /api/admin/users/[userId] - Get detailed user information
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Await the params object
    const { userId } = await params;

    // Authenticate the requester and make sure they are an admin
    const authService = AuthenticationService.getInstance()
    const authResult = await authService.authenticateUser(req)

    if (!authResult.success || !authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden_role' }, { status: 403 })
    }

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
        additional_email,
        additional_phone,
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

    // Get user's activity counts (listings, inquiries, verification requests, conversations) in parallel
    const [listingsResult, inquiriesAsBuyerResult, inquiriesAsSellerResult, verificationResult, conversationsResult] = await Promise.all([
      userProfile.role === 'seller'
        ? supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', userId)
            .is('deleted_at', null)
        : Promise.resolve({ count: 0 }),

      userProfile.role === 'buyer'
        ? supabase
            .from('inquiries')
            .select('id', { count: 'exact', head: true })
            .eq('buyer_id', userId)
            .is('deleted_at', null)
        : Promise.resolve({ count: 0 }),

      userProfile.role === 'seller'
        ? supabase
            .from('inquiries')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', userId)
            .is('deleted_at', null)
        : Promise.resolve({ count: 0 }),

      supabase
        .from('verification_requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .is('deleted_at', null)
    ])

    // Transform the data to match frontend expectations
    const userDetails = {
      // Basic profile info
      id: userProfile.id,
      fullName: userProfile.full_name || 'Unknown User',
      email: userProfile.email || 'No email',
      phoneNumber: userProfile.phone_number || 'N/A',
      additionalEmail: userProfile.additional_email || null,
      additionalPhone: userProfile.additional_phone || null,
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

      // Activity counts
      listingCount: listingsResult.count || 0,
      inquiryCount: (inquiriesAsBuyerResult.count || 0) + (inquiriesAsSellerResult.count || 0),
      verificationRequestCount: verificationResult.count || 0,
      conversationCount: conversationsResult.count || 0,
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

// DELETE /api/admin/users/[userId] - Permanently delete a user (optionally blocking the email)
// Body: { block?: boolean, reason?: string }
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;

    const authService = AuthenticationService.getInstance()
    const authResult = await authService.authenticateUser(req)

    if (!authResult.success || !authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden_role' }, { status: 403 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (userId === authResult.user.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 403 })
    }

    let block = false
    let reason: string | undefined
    try {
      const body = await req.json()
      block = body?.block === true
      reason = typeof body?.reason === 'string' ? body.reason : undefined
    } catch {
      // No/invalid body — treat as plain delete
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: targetProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role, email, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetProfile.role === 'admin') {
      return NextResponse.json({ error: 'Admin accounts cannot be deleted' }, { status: 403 })
    }

    // Auth record holds the canonical email; fall back to the profile email
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const email = (authUser?.user?.email || targetProfile.email || '').toLowerCase()

    // Block BEFORE deleting so a failure here never leaves a deleted-but-unblocked user
    if (block) {
      if (!email) {
        return NextResponse.json({ error: 'Cannot block: user has no email on record' }, { status: 500 })
      }
      const { error: blockError } = await supabase
        .from('blocked_emails')
        .upsert({
          email,
          reason: reason || 'Deleted & blocked by admin',
          blocked_by: authResult.user.id,
          original_user_id: userId,
        })

      if (blockError) {
        console.error('[ADMIN-DELETE-USER] Failed to block email:', blockError)
        return NextResponse.json({ error: 'Failed to block email' }, { status: 500 })
      }
    }

    // Hard delete: auth.users -> user_profiles -> all child tables via ON DELETE CASCADE
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('[ADMIN-DELETE-USER] Failed to delete user:', deleteError)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    console.log(`[ADMIN-DELETE-USER] Admin ${authResult.user.id} deleted user ${userId} (${email})${block ? ' and blocked the email' : ''}`)

    return NextResponse.json({
      success: true,
      message: block
        ? 'User deleted and email permanently blocked from re-registering.'
        : 'User deleted. The email can be used to sign up again.',
      blocked: block,
    })
  } catch (error) {
    console.error('Unexpected error in admin user delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/users/[userId] - Directly manage a seller's verification status
// Body: { action: 'verify_seller' | 'revoke_seller_verification', note?: string }
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params

    // Authenticate the requester and make sure they are an admin
    const authService = AuthenticationService.getInstance()
    const authResult = await authService.authenticateUser(req)

    if (!authResult.success || !authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden_role' }, { status: 403 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body - must be valid JSON' }, { status: 400 })
    }

    const { action, note } = body
    const validActions = ['verify_seller', 'revoke_seller_verification']
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Load the target user
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, email, role, verification_status')
      .eq('id', userId)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (targetProfile.role !== 'seller') {
      return NextResponse.json({ error: 'Target user is not a seller' }, { status: 400 })
    }

    const newVerificationStatus = action === 'verify_seller' ? 'verified' : 'anonymous'

    // Update the profile verification status. A DB trigger auto-syncs
    // listings.is_seller_verified — do not sync it manually here.
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        verification_status: newVerificationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[ADMIN-VERIFY-SELLER] Failed to update verification status:', updateError)
      return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 })
    }

    console.log(`[ADMIN-VERIFY-SELLER] Admin ${authResult.user.id} set ${userId} verification_status=${newVerificationStatus}`)

    // Best-effort (non-fatal): close any open user_verification requests so the
    // admin queue does not show stale rows. Terminal statuses are 'Approved'
    // and 'Rejected'; anything else is considered open.
    try {
      const terminalStatus = action === 'verify_seller' ? 'Approved' : 'Rejected'
      const { data: openRequests } = await supabaseAdmin
        .from('verification_requests')
        .select('id, admin_notes')
        .eq('user_id', userId)
        .eq('request_type', 'user_verification')
        .not('status', 'in', '("Approved","Rejected")')

      for (const openRequest of openRequests || []) {
        const appendedNotes = note
          ? (openRequest.admin_notes ? `${openRequest.admin_notes}\n${note}` : note)
          : openRequest.admin_notes
        await supabaseAdmin
          .from('verification_requests')
          .update({
            status: terminalStatus,
            admin_notes: appendedNotes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', openRequest.id)
      }
    } catch (closeError) {
      console.warn('[ADMIN-VERIFY-SELLER] Failed to close open verification requests:', closeError)
      // Non-fatal
    }

    // Audit trail (best-effort, non-fatal)
    const { error: auditError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: authResult.user.id,
        action_type: 'seller_verification_direct',
        target_type: 'user',
        target_id: userId,
        details: {
          action,
          previous_verification_status: targetProfile.verification_status,
          new_verification_status: newVerificationStatus,
          target_user_name: targetProfile.full_name,
          target_user_email: targetProfile.email,
          note: note || null,
        },
        timestamp: new Date().toISOString(),
      })
    if (auditError) {
      console.warn('[ADMIN-VERIFY-SELLER] Failed to log admin action:', auditError)
      // Non-fatal
    }

    // Notify the seller (best-effort, non-fatal)
    const notificationMessage = action === 'verify_seller'
      ? 'Your seller account has been verified by the Nobridge team.'
      : 'Your seller verification has been revoked. Please contact the Nobridge team for details.'
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'verification',
        message: notificationMessage,
        link: '/seller-dashboard/verification',
        is_read: false,
      })
    if (notificationError) {
      console.warn('[ADMIN-VERIFY-SELLER] Failed to create seller notification:', notificationError)
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      verification_status: newVerificationStatus,
    })

  } catch (error) {
    console.error('Unexpected error in admin user PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
