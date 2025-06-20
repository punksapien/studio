import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationService } from '@/lib/auth-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface AdminImpersonationAuditLog {
  admin_user_id: string
  admin_email: string
  target_user_id: string
  target_email: string
  action: 'magic_link_generated' | 'magic_link_used' | 'impersonation_started' | 'impersonation_ended'
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
  timestamp: string
}

// POST /api/admin/users/[userId]/generate-login-link
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const correlationId = `admin-impersonate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    // Await params before accessing properties (Next.js 15+ requirement)
    const { userId } = await params
    console.log(`[ADMIN-IMPERSONATION] ${correlationId} | Generating login link for user: ${userId}`)

    // Step 1: Authenticate the admin making the request
    const authService = AuthenticationService.getInstance()
    const authResult = await authService.authenticateUser(req)

    if (!authResult.success || !authResult.user || !authResult.profile) {
      console.log(`[ADMIN-IMPERSONATION] ${correlationId} | Admin authentication failed`)
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_FAILED',
        message: 'Admin authentication required'
      }, { status: 401 })
    }

    // Step 2: Verify admin role
    if (authResult.profile.role !== 'admin') {
      console.log(`[ADMIN-IMPERSONATION] ${correlationId} | Non-admin user attempted impersonation: ${authResult.user.id} (role: ${authResult.profile.role})`)
      return NextResponse.json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Admin role required'
      }, { status: 403 })
    }

    // Step 3: Validate target user ID
    const targetUserId = userId
    if (!targetUserId || typeof targetUserId !== 'string') {
      console.log(`[ADMIN-IMPERSONATION] ${correlationId} | Invalid target user ID: ${targetUserId}`)
      return NextResponse.json({
        success: false,
        error: 'INVALID_USER_ID',
        message: 'Valid user ID required'
      }, { status: 400 })
    }

    // Step 4: Fetch target user details
    console.log(`[ADMIN-IMPERSONATION] ${correlationId} | Fetching target user details...`)
    const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetUserId)

    if (userError || !targetUser.user) {
      console.error(`[ADMIN-IMPERSONATION] ${correlationId} | Target user not found:`, userError)
      return NextResponse.json({
        error: 'Target user not found',
        correlationId
      }, { status: 404 })
    }

    // Step 5: Get target user profile
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name, role, email')
      .eq('id', targetUserId)
      .single()

    if (profileError || !targetProfile) {
      console.error(`[ADMIN-IMPERSONATION] ${correlationId} | Target user profile not found:`, profileError)
      return NextResponse.json({
        error: 'Target user profile not found',
        correlationId
      }, { status: 404 })
    }

    // Step 6: Prevent admin-to-admin impersonation for security
    if (targetProfile.role === 'admin') {
      console.log(`[ADMIN-IMPERSONATION] ${correlationId} | Blocked admin-to-admin impersonation attempt`)
      return NextResponse.json({
        success: false,
        error: 'ADMIN_IMPERSONATION_NOT_ALLOWED',
        message: 'Cannot generate login links for other admin accounts',
        correlationId
      }, { status: 403 })
    }

    // Step 7: Generate a magic link for the target user
    console.log(`[ADMIN-IMPERSONATION] ${correlationId} | Generating magic link...`)

    const dashboardUrl = targetProfile.role === 'seller' ? '/seller-dashboard' : '/dashboard';

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.user.email!,
      options: {
        redirectTo: dashboardUrl
      }
    });

    if (linkError) {
      console.error(`[ADMIN-IMPERSONATION] ${correlationId} | Failed to generate magic link:`, linkError)
      return NextResponse.json({
        success: false,
        error: 'MAGIC_LINK_FAILED',
        message: 'Could not generate impersonation link',
        details: linkError.message,
        correlationId
      }, { status: 500 })
    }

    const { properties } = linkData;
    const { hashed_token } = properties;

    const impersonationUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`);
    impersonationUrl.searchParams.set('token_hash', hashed_token);
    impersonationUrl.searchParams.set('type', 'magiclink');
    impersonationUrl.searchParams.set('next', dashboardUrl);

    // Step 8: Log admin impersonation attempt for audit trail
    const auditLog: AdminImpersonationAuditLog = {
      admin_user_id: authResult.user.id,
      admin_email: authResult.user.email || authResult.profile.email,
      target_user_id: targetUserId,
      target_email: targetUser.user.email!,
      action: 'magic_link_generated',
      ip_address: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      metadata: {
        correlation_id: correlationId,
        target_user_role: targetProfile.role,
        target_user_name: targetProfile.full_name,
        redirected_to: dashboardUrl
      },
      timestamp: new Date().toISOString()
    }

    // Store audit log (create table if needed)
    const { error: auditError } = await supabaseAdmin
      .from('admin_impersonation_audit')
      .insert(auditLog)

    if (auditError) {
      console.error(`[ADMIN-IMPERSONATION] ${correlationId} | Failed to log audit trail:`, auditError)
      // Continue anyway - don't fail the request due to audit logging issues
    } else {
      console.log(`[ADMIN-IMPERSONATION] ${correlationId} | Audit trail logged successfully`)
    }

    // Step 9: Return successful response
    console.log(`[ADMIN-IMPERSONATION] ${correlationId} | Admin impersonation link generated successfully for ${targetProfile.full_name} (${targetProfile.email})`)

    return NextResponse.json({
      success: true,
      impersonationUrl: impersonationUrl.toString(),
      targetUser: {
        id: targetUserId,
        name: targetProfile.full_name,
        email: targetProfile.email,
        role: targetProfile.role
      },
      expiresInMinutes: 60, // Magic links are valid for 60 minutes
      correlationId,
      warning: 'This link provides full access to the user\'s account. Use responsibly.'
    })

  } catch (error) {
    console.error(`[ADMIN-IMPERSONATION] ${correlationId} | Unexpected error:`, error)

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred',
      correlationId
    }, { status: 500 })
  }
}

// GET /api/admin/users/[userId]/generate-login-link - Not allowed
export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed. Use POST to generate login links.'
  }, { status: 405 })
}
