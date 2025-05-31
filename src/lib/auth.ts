import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'buyer' | 'seller' | 'admin'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone_number?: string
  country?: string
  role: UserRole
  is_email_verified: boolean
  email_verified_at?: string
  verification_status: 'anonymous' | 'pending_verification' | 'verified' | 'rejected'
  is_paid: boolean

  // Seller-specific fields
  initial_company_name?: string

  // Buyer-specific fields
  buyer_persona_type?: string
  buyer_persona_other?: string
  investment_focus_description?: string
  preferred_investment_size?: string
  key_industries_of_interest?: string

  created_at: string
  updated_at: string
  last_login?: string
  listing_count: number
  inquiry_count: number
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  phone_number?: string
  country?: string
  role: UserRole

  // Seller-specific
  initial_company_name?: string

  // Buyer-specific
  buyer_persona_type?: string
  buyer_persona_other?: string
  investment_focus_description?: string
  preferred_investment_size?: string
  key_industries_of_interest?: string
}

// Authentication helper functions
export const auth = {
  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Get current user's profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

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
  },

  // Sign up new user
  async signUp(userData: RegisterData) {
    const { email, password, ...profileData } = userData

    // For development, we'll bypass email confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          // Include additional metadata for the user
          ...profileData
        }
      }
    })

    if (authError) {
      // Handle specific error cases
      if (authError.message.includes('User already registered')) {
        throw new Error('An account with this email already exists. Please try logging in instead.')
      }
      throw new Error(`Registration failed: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Registration failed: No user data returned')
    }

    // Create user profile in our custom table
    if (authData.user) {
      const profileData = {
        id: authData.user.id,
        email,
        full_name: userData.full_name,
        phone_number: userData.phone_number || null,
        location_country: userData.country || null,
        role: userData.role,
        verification_status: 'anonymous' as const,
        is_paid: false,
        // Seller-specific
        initial_company_name: userData.initial_company_name || null,
        // Buyer-specific
        buying_persona: userData.buyer_persona_type || null,
        buyer_persona_other: userData.buyer_persona_other || null,
        investment_focus_description: userData.investment_focus_description || null,
        preferred_investment_size: userData.preferred_investment_size || null,
        key_industries_of_interest: userData.key_industries_of_interest || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(profileData)

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // For now, we'll continue even if profile creation fails
        // The user can complete their profile later
        console.warn('Profile creation failed, but user account was created. User can complete profile setup later.')
      }
    }

    return authData
  },

  // Sign in user
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(`Login failed: ${error.message}`)
    }

    // Update last login timestamp
    if (data.user) {
      await supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id)
    }

    return data
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(`Logout failed: ${error.message}`)
    }
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      throw new Error(`Password reset failed: ${error.message}`)
    }
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      throw new Error(`Password update failed: ${error.message}`)
    }
  },

  // Resend email verification
  async resendEmailVerification() {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: '', // Will use current user's email
    })

    if (error) {
      throw new Error(`Email verification resend failed: ${error.message}`)
    }
  },

  // Verify email with OTP token
  async verifyEmailOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    if (error) {
      throw new Error(`Email verification failed: ${error.message}`)
    }

    return data
  },

  // Check if user has specific role
  async hasRole(role: UserRole): Promise<boolean> {
    const profile = await this.getCurrentUserProfile()
    return profile?.role === role
  },

  // Check if user is admin
  async isAdmin(): Promise<boolean> {
    return this.hasRole('admin')
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null)
    })
  },

  // Check if email is already registered but unverified
  async checkEmailStatus(email: string): Promise<{ exists: boolean; verified: boolean; canResend: boolean }> {
    try {
      const { data, error } = await supabase.auth.admin.getUserByEmail(email)

      if (error || !data) {
        return { exists: false, verified: false, canResend: false }
      }

      const verified = !!data.email_confirmed_at
      return {
        exists: true,
        verified,
        canResend: !verified
      }
    } catch (error) {
      // If we can't check, assume email is available
      return { exists: false, verified: false, canResend: false }
    }
  },

  // Resend verification for specific email
  async resendVerificationForEmail(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      throw new Error(`Email verification resend failed: ${error.message}`)
    }
  },
}
