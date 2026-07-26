import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationService } from '@/lib/auth-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST - Process (delete) or dismiss a deletion request (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authService = AuthenticationService.getInstance()
    const authResult = await authService.authenticateUser(request)

    if (!authResult.success || !authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden_role' }, { status: 403 })
    }

    const { id } = await params
    const { action, reason } = await request.json()

    if (action !== 'delete' && action !== 'dismiss') {
      return NextResponse.json(
        { error: "Invalid action. Must be: delete or dismiss" },
        { status: 400 }
      )
    }

    // Load the deletion request
    const { data: deletionRequest, error: loadError } = await supabaseAdmin
      .from('account_deletion_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (loadError || !deletionRequest) {
      return NextResponse.json(
        { error: 'Deletion request not found' },
        { status: 404 }
      )
    }

    if (action === 'delete') {
      // Soft-delete + cascade via the existing RPC
      const { error: deleteError } = await supabaseAdmin
        .rpc('soft_delete_user_account', {
          user_id: deletionRequest.user_id,
          deleter_id: authResult.user.id
        })

      if (deleteError) {
        console.error('[ADMIN-DELETION-REQUESTS] Error soft deleting user account:', deleteError)
        return NextResponse.json(
          { error: 'Failed to soft delete user account', details: deleteError.message },
          { status: 500 }
        )
      }

      // Audit log (non-fatal)
      const { error: auditError } = await supabaseAdmin
        .from('account_cleanup_audit')
        .insert({
          user_id: deletionRequest.user_id,
          user_email: deletionRequest.email,
          action: 'deleted',
          reason: reason || 'User-requested deletion',
          admin_user_id: authResult.user.id,
          metadata: {
            source: 'deletion_request',
            request_id: id
          }
        })

      if (auditError) {
        console.warn('[ADMIN-DELETION-REQUESTS] Failed to write audit record:', auditError)
      }

      // Mark request completed
      const { error: updateError } = await supabaseAdmin
        .from('account_deletion_requests')
        .update({
          status: 'completed',
          reviewed_by: authResult.user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) {
        console.error('[ADMIN-DELETION-REQUESTS] Error updating request status:', updateError)
        return NextResponse.json(
          { error: 'Account deleted but failed to update request status', details: updateError.message },
          { status: 500 }
        )
      }
    } else {
      // Dismiss
      const { error: updateError } = await supabaseAdmin
        .from('account_deletion_requests')
        .update({
          status: 'dismissed',
          reviewed_by: authResult.user.id,
          reviewed_at: new Date().toISOString(),
          reason: reason || null
        })
        .eq('id', id)

      if (updateError) {
        console.error('[ADMIN-DELETION-REQUESTS] Error dismissing request:', updateError)
        return NextResponse.json(
          { error: 'Failed to dismiss deletion request', details: updateError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN-DELETION-REQUESTS] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
