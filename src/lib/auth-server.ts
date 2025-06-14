import { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { UserProfile } from './auth'

// Server-side authentication helpers for API routes
export const authServer = {
  // Create Supabase client that can read cookies from request
  createServerClient(request: NextRequest) {
    let response = new Response()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // We can't set cookies in API routes, but this is required by the interface
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            // We can't remove cookies in API routes, but this is required by the interface
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    return { supabase, response }
  },

  // Get current user from request cookies
  async getCurrentUser(request: NextRequest): Promise<User | null> {
    try {
      const { supabase } = this.createServerClient(request)
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        console.error('Error getting current user:', error)
        return null
      }

      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  // Get current user's profile (server-safe)
  async getCurrentUserProfile(request: NextRequest): Promise<UserProfile | null> {
    const user = await this.getCurrentUser(request)
    if (!user) return null

    try {
      const { supabase } = this.createServerClient(request)
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
  async updatePassword(newPassword: string, request: NextRequest) {
    try {
      const { supabase } = this.createServerClient(request)
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
