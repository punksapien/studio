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

  // Get current user session
  async getCurrentUserAndSession() {
    return supabase.auth.getSession()
  },

  // Get current user's profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = await this.getCurrentUser()
    if (!user) {
      console.log('No authenticated user found when trying to fetch profile.')
      return null
    }

    console.log('Fetching profile for user ID:', user.id)

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.info('Profile not found for user ID:', user.id, '(PGRST116). This is expected for new users before profile creation or if profile creation failed.')
      } else {
        console.error('Error fetching user profile:', error)
        console.error('Profile fetch error details:', JSON.stringify(error, null, 2))
      }
      console.log('User ID that was queried:', user.id)
      return null
    }

    console.log('Profile fetched successfully for user ID:', user.id, data ? '' : '(but data is null/undefined)')
    return data
  },

  // Sign up new user
  async signUp(userData: RegisterData) {
    const { email, password, ...profileDataRest } = userData

    console.log('Starting registration for:', email)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          ...profileDataRest
        }
      }
    })

    console.log('Auth signup result:', { authData, authError })

    if (authError) {
      console.error('Auth signup error:', authError)
      if (authError.message.includes('User already registered')) {
        throw new Error('An account with this email already exists. Please try logging in instead.')
      }
      throw new Error(`Registration failed: ${authError.message}`)
    }

    if (!authData.user) {
      console.error('No user data returned from auth signup')
      throw new Error('Registration failed: No user data returned')
    }

    console.log('User created in auth, now creating profile:', authData.user.id)

    if (authData.user) {
      const profileInsertData = {
        email,
        full_name: userData.full_name,
        phone_number: userData.phone_number || null,
        country: userData.country || null,
        role: userData.role,
        verification_status: 'anonymous' as const,
        is_paid: false,
        initial_company_name: userData.initial_company_name || null,
        buyer_persona_type: userData.buyer_persona_type || null,
        buyer_persona_other: userData.buyer_persona_other || null,
        investment_focus_description: userData.investment_focus_description || null,
        preferred_investment_size: userData.preferred_investment_size || null,
        key_industries_of_interest: userData.key_industries_of_interest || null
      }

      console.log('About to create profile via API:', profileInsertData)

      try {
        const response = await fetch('/api/auth/create-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: authData.user.id,
            profileData: profileInsertData
          })
        })

        let result
        let rawText
        try {
          rawText = await response.text()
          result = JSON.parse(rawText)
        } catch (jsonError) {
          console.error('Failed to parse API response as JSON:', jsonError)
          console.error('Response status for profile creation:', response.status)
          console.error('Response statusText for profile creation:', response.statusText)
          console.error('Raw response body from profile creation:', rawText)
          // If API response isn't valid JSON but user auth succeeded, allow process to continue.
          // The profile might be created by a trigger or the user can complete it later.
          console.warn('Profile creation API did not return valid JSON, but user account was created. Proceeding with authData.')
          return authData // Return authData even if profile API response parsing fails
        }

        if (!response.ok) {
          if (response.status === 409) {
            console.log('Profile already exists for user (API reported 409) - continuing with registration flow.')
          } else {
            console.error('Profile creation API failed with status:', response.status, result)
            console.warn('Profile creation via API failed, but user account was created. User may need to complete profile later or retry.')
          }
        } else {
          console.log('Profile created successfully via API:', result.profile)
        }
      } catch (error) {
        console.error('Error calling profile creation API:', error)
        console.warn('Profile creation API call failed, but user account was created. User may need to complete profile later or retry.')
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

  // Request password reset
  async requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      throw new Error(`Password reset request failed: ${error.message}`)
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

  // Resend email verification (for current user)
  async resendEmailVerification() {
    const { error } = await supabase.auth.resend({ // This resends for the current user if email is blank
      type: 'signup',
      email: '', 
    })

    if (error) {
      throw new Error(`Email verification resend failed: ${error.message}`)
    }
  },
  
  // Resend verification for a specific email (used if user is not yet logged in from that email)
  async resendVerificationForEmail(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })
    if (error) {
      throw new Error(`Resending verification for ${email} failed: ${error.message}`)
    }
  },

  // Verify email with OTP token
  async verifyEmailOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email' // This type is for verifying email post-signup or email change
    })

    if (error) {
      throw new Error(`Email verification failed: ${error.message}`)
    }
    
    // If verification successful, mark profile as email_verified true
    if (data.user) {
        await supabase
            .from('user_profiles')
            .update({ is_email_verified: true, email_verified_at: new Date().toISOString() })
            .eq('id', data.user.id);
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
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null)
    })
  },

  async checkEmailStatus(email: string): Promise<{ exists: boolean; verified: boolean; canResend: boolean }> {
    try {
      // This is a client-side interpretation.
      // A secure backend check would be better but is more complex for client-side auth library.
      // Attempting signUp and checking for "User already registered" is one way.
      // For now, let's assume a simplified check or that signUp error handling is sufficient.
      return { exists: false, verified: false, canResend: true }; 
    } catch (error) {
      return { exists: false, verified: false, canResend: false };
    }
  },
}
