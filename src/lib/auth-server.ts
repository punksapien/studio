import { NextRequest } from 'next/server'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import { UserProfile } from './auth'

// Server-side authentication helpers for API routes
export const authServer = {
  // Get current user from request headers
  async getCurrentUser(request?: NextRequest): Promise<User | null> {
    try {
      // In API routes, we need to get the session from the request
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  // Get current user's profile (server-safe)
  async getCurrentUserProfile(request?: NextRequest): Promise<UserProfile | null> {
    const user = await this.getCurrentUser(request)
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error)
      return null
    }
  },

  // Update password (server-safe)
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw new Error(`Password update failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }
}
