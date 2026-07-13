import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationService } from '@/lib/auth-service'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const setPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// POST /api/admin/users/[userId]/set-password - Admin sets a new password for a non-admin user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

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

    const body = await req.json()
    const parsed = setPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid password' },
        { status: 400 }
      )
    }

    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetProfile.role === 'admin' && userId !== authResult.user.id) {
      return NextResponse.json(
        { error: 'Cannot change the password of another admin account' },
        { status: 403 }
      )
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: parsed.data.password,
    })

    if (updateError) {
      console.error('[ADMIN-SET-PASSWORD] Failed to update password:', updateError)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    console.log(`[ADMIN-SET-PASSWORD] Admin ${authResult.user.id} changed password for user ${userId}`)

    return NextResponse.json({ success: true, message: 'Password updated successfully.' })
  } catch (error) {
    console.error('Unexpected error in admin set-password API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
