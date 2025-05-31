import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// PUT /api/auth/change-password - Change user password
export async function PUT(request: NextRequest) {
  try {
    const user = await auth.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { newPassword } = body

    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Use the auth utility function to update password
    await auth.updatePassword(newPassword)

    return NextResponse.json({
      message: 'Password updated successfully'
    })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update password' },
      { status: 500 }
    )
  }
}
