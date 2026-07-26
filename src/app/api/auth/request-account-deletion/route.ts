import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationService } from '@/lib/auth-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/auth/request-account-deletion - User requests permanent account deletion
export async function POST(request: NextRequest) {
  try {
    const authResult = await AuthenticationService.getInstance().authenticateUser(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user, profile } = authResult

    let reason: string | null = null
    try {
      const body = await request.json()
      reason = body?.reason || null
    } catch {
      // No body / invalid JSON - reason stays null
    }

    // Prevent duplicate pending requests
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('account_deletion_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingError) {
      console.error('[DELETION-REQUEST] Error checking existing request:', existingError)
      return NextResponse.json(
        { error: 'Failed to check existing deletion request' },
        { status: 500 }
      )
    }

    if (existing) {
      return NextResponse.json(
        { error: 'A deletion request is already pending review.', code: 'request_exists' },
        { status: 409 }
      )
    }

    // Insert the deletion request
    const { error: insertError } = await supabaseAdmin
      .from('account_deletion_requests')
      .insert({
        user_id: user.id,
        email: profile?.email || user.email,
        role: profile?.role || null,
        reason: reason || null,
        status: 'pending'
      })

    if (insertError) {
      console.error('[DELETION-REQUEST] Error creating deletion request:', insertError)
      return NextResponse.json(
        { error: 'Failed to create deletion request' },
        { status: 500 }
      )
    }

    // Notify all admins (non-fatal)
    try {
      const { data: adminUsers } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('role', 'admin')

      if (adminUsers && adminUsers.length > 0) {
        const notifications = adminUsers.map(admin => ({
          user_id: admin.id,
          type: 'system',
          message: `${profile?.email || user.email} (${profile?.role || 'user'}) requested account deletion`,
          link: '/admin/account-deletion-requests',
          is_read: false,
          created_at: new Date().toISOString()
        }))

        const { error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert(notifications)

        if (notificationError) {
          console.warn('[DELETION-REQUEST] Failed to notify admins:', notificationError)
        }
      }
    } catch (notificationError) {
      console.warn('[DELETION-REQUEST] Error notifying admins:', notificationError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETION-REQUEST] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create deletion request' },
      { status: 500 }
    )
  }
}

// GET /api/auth/request-account-deletion - Return the caller's current pending request (or null)
export async function GET(request: NextRequest) {
  try {
    const authResult = await AuthenticationService.getInstance().authenticateUser(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = authResult

    const { data: pendingRequest, error } = await supabaseAdmin
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (error) {
      console.error('[DELETION-REQUEST] Error fetching request:', error)
      return NextResponse.json(
        { error: 'Failed to fetch deletion request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ request: pendingRequest || null })
  } catch (error) {
    console.error('[DELETION-REQUEST] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch deletion request' },
      { status: 500 }
    )
  }
}
