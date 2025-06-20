import { supabase } from './supabase'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

// Create a fresh client for auth operations that need PKCE
function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

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

    try {
      // Use API endpoint instead of direct database access to avoid client-side issues
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.log('No valid session found for profile fetch')
        return null
      }

      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized profile fetch - user may need to re-authenticate')
          return null
        }
        throw new Error(`Profile fetch failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Profile fetched successfully via API for user ID:', user.id)
      return result.profile
    } catch (error) {
      console.error('Error fetching user profile via API:', error)
      return null
    }
  },

  // Sign up new user
  async signUp(registerData: RegisterData) {
    try {
      const supabase = createClient()
      const { email, password } = registerData

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:9002'}/auth/callback`,
          data: {
            role: registerData.role || 'buyer',
            full_name: registerData.full_name,
            phone_number: registerData.phone_number,
            country: registerData.country
          }
        }
      })

      if (error) {
        // 🔥 SMART SIGN-UP: If user is already registered, try to sign them in automatically.
        if (error.message.includes('User already registered')) {
          console.log(`Registration attempt for existing email: ${email}. Attempting automatic sign-in.`)
          try {
            const signInData = await this.signIn(email, password)
            // If sign-in is successful, return that user data.
            return { user: signInData.user, error: null, session: signInData.session }
          } catch (signInError: any) {
            // If sign-in fails (e.g., wrong password), return a clear, user-friendly error.
            return { user: null, error: 'USER_EXISTS_LOGIN_FAILED' }
          }
        }
        console.error('SignUp error:', error)
        return { user: null, error: error.message }
      }

      if (data.user && !data.user.email_confirmed_at) {
        console.log('User created but email not confirmed yet. User should check email for verification.')

        // Generate a secure verification token for this registration
        let verificationToken = '';
        try {
          const { generateVerificationToken } = await import('./verification-token');
          // Pass the correct parameters - generateVerificationToken expects (email, expiresIn)
          verificationToken = await generateVerificationToken(email, 3600); // 1 hour expiry
          console.log(`Generated verification token for ${email} (token length: ${verificationToken.length})`);
        } catch (tokenError) {
          console.error('Failed to generate verification token:', tokenError);
          // Continue without token - middleware fallback will still allow registration flow
        }

        // NOTE: Removed custom email sending since Supabase handles this automatically
        // with the proper templates configured in supabase/config.toml

        return {
          user: data.user,
          error: null,
          needsVerification: true,
          message: 'Please check your email for a verification link.',
          verificationToken // Include the token in the response
        }
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Unexpected error in signUp:', error)
      return { user: null, error: 'An unexpected error occurred' }
    }
  },

  // Sign in user
  async signIn(email: string, password: string) {
    // 🔥 IMPROVEMENT: First check if the email exists to provide better error messages
    try {
      const emailStatus = await this.checkEmailStatus(email);

      if (!emailStatus.exists) {
        // Email doesn't exist in the system
        throw new Error('ACCOUNT_NOT_FOUND');
      }

      if (!emailStatus.verified) {
        // Account exists but email not verified
        console.log(`Login failed for ${email} - email not confirmed. Attempting to resend verification.`);
        try {
          await this.resendVerificationUnauthenticated(email);
        } catch (resendError) {
          console.error('Failed to auto-resend verification during login:', resendError);
        }
        throw new Error('UNCONFIRMED_EMAIL');
      }
    } catch (error) {
      // If it's one of our custom errors, re-throw it
      if (error instanceof Error && (error.message === 'ACCOUNT_NOT_FOUND' || error.message === 'UNCONFIRMED_EMAIL')) {
        throw error;
      }
      // If email status check fails, continue with normal login flow
      console.warn('Email status check failed, proceeding with normal login:', error);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Handle email not confirmed error specifically
      if (error.message.includes('Email not confirmed')) {
        console.log(`Login failed for ${email} - email not confirmed. Attempting to resend verification.`)
        // Try to resend verification email, but don't block login flow if it fails
        try {
          await this.resendVerificationUnauthenticated(email)
        } catch (resendError) {
          console.error('Failed to auto-resend verification during login:', resendError)
        }
        // This custom error will be caught by the UI to show the right message.
        throw new Error('UNCONFIRMED_EMAIL');
      }

      // Handle invalid credentials more specifically
      if (error.message.includes('Invalid login credentials')) {
        // Since we know the email exists (from our check above), this must be wrong password
        throw new Error('WRONG_PASSWORD');
      }

      throw new Error(`Login failed: ${error.message}`)
    }

    if (data.user) {
      // On successful sign-in, also fetch the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error("Sign-in success but failed to fetch profile:", profileError);
        // Proceed without the profile, the frontend will have to handle this state.
      } else {
        // Update last_login timestamp, but don't await it to avoid slowing down login.
        supabase.from('user_profiles').update({ last_login: new Date().toISOString() }).eq('id', data.user.id).then();
      }

      return { ...data, profile: profile || null };
    }

    return { ...data, profile: null };
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(`Logout failed: ${error.message}`)
    }
  },

  // Helper function to get the base URL in a server-compatible way
  getBaseUrl() {
    // In production (Vercel), use VERCEL_URL
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    // In development, use localhost with the correct port
    // Check for PORT env var or default to the configured dev port
    const port = process.env.PORT || '9002'
    return `http://localhost:${port}`
  },

  // Request password reset
  async requestPasswordReset(email: string) {
    console.log(`[AUTH-SERVICE] Requesting password reset for: ${email}`);

    // Use the unified email service
    const { emailService } = await import('./email-service');
    const result = await emailService.sendPasswordResetEmail(email);

    if (!result.success) {
      throw new Error(`Password reset request failed: ${result.error || 'Unknown error'}`);
    }

    console.log(`[AUTH-SERVICE] Password reset email sent successfully to ${email}`);
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

  // Resend email verification for current session
  async resendEmailVerification() {
    const { data: session } = await supabase.auth.getSession()

    if (!session?.session?.user?.email) {
      throw new Error('You must be logged in to resend verification email')
    }

    const email = session.session.user.email
    console.log(`[AUTH-SERVICE] Resending verification email for authenticated user: ${email}`);

    // Use the unified email service
    const { emailService } = await import('./email-service');
    const result = await emailService.resendVerificationEmail(email);

    if (!result.success) {
      console.error(`[AUTH-SERVICE] Failed to resend verification for ${email}:`, result.error);
      throw new Error(`Failed to resend verification email: ${result.error || 'Unknown error'}`)
    }

    console.log(`[AUTH-SERVICE] Successfully resent verification email for ${email}`);
  },

  // Resend verification email for a specific email (SECURITY: Only for authenticated users)
  async resendVerificationForEmail(email: string) {
    console.log(`Attempting to resend verification for ${email}`)

    // SECURITY CHECK: Only allow resending for the current authenticated user's email
    const { data: session } = await supabase.auth.getSession()

    if (!session?.session?.user?.email) {
      throw new Error('You must be logged in to resend verification email')
    }

    // SECURITY: Only allow resending to the authenticated user's own email
    if (session.session.user.email !== email) {
      throw new Error('You can only resend verification emails to your own email address')
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${this.getBaseUrl()}/auth/callback`
      }
    })

    if (error) {
      console.error(`Failed to resend verification for ${email}:`, error)
      throw new Error(`Failed to resend verification email: ${error.message}`)
    }

    console.log(`Successfully queued verification resend for ${email}`)
  },

  // Unauthenticated resend for legitimate lockout scenarios (with rate limiting)
  async resendVerificationUnauthenticated(email: string) {
    console.log(`Attempting unauthenticated resend verification for ${email}`)

    // Basic email validation to prevent abuse
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email address format')
    }

    // Check if the email actually exists in our system before sending
    const emailStatus = await this.checkEmailStatus(email)
    if (!emailStatus.exists) {
      // For security, don't reveal that the email doesn't exist
      // But don't actually send an email either
      console.log(`Email ${email} does not exist in system - not sending email but returning success for security`)
      return // Silently succeed to prevent email enumeration
    }

    if (emailStatus.verified) {
      throw new Error('This email is already verified. Please try logging in instead.')
    }

    // Rate limiting: Only allow unauthenticated resends for unverified accounts
    if (!emailStatus.canResend) {
      throw new Error('Verification email cannot be resent for this account. Please contact support.')
    }

    // 🚀 SIMPLIFIED: Use Supabase for all environments (consistent and reliable)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${this.getBaseUrl()}/auth/callback`
      }
    })

    if (error) {
      console.error(`[AUTH-SERVICE] Failed to resend verification for ${email}:`, error)
      throw new Error(`Failed to resend verification email: ${error.message}`)
    }

    console.log(`Successfully queued unauthenticated verification resend for ${email}`)
  },

  // Verify email with OTP token
  async verifyEmailOtp(email: string, token: string, flow: 'register' | 'email_change' = 'register') {
    console.log(`[AUTH-SERVICE] Starting email verification for ${email}, flow: ${flow}, token: ${token.substring(0, 2)}***`);

    const supabaseType = flow === 'register' ? 'signup' : 'email';

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: supabaseType as any
    })

    if (error) {
      console.error(`[AUTH-SERVICE] Email verification failed for ${email}:`, error);
      throw new Error(`Email verification failed: ${error.message}`)
    }

    console.log(`[AUTH-SERVICE] OTP verification successful for ${email}:`, {
      hasUser: !!data.user,
      hasSession: !!data.session,
      userId: data.user?.id,
      sessionAccessToken: data.session?.access_token ? 'present' : 'missing'
    });

    // If verification successful, mark profile as email_verified true
    if (data.user) {
      console.log(`[AUTH-SERVICE] Updating email_verified status for user ${data.user.id}`);

      try {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            is_email_verified: true,
            email_verified_at: new Date().toISOString(),
            last_login: new Date().toISOString() // Also update last login
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.error(`[AUTH-SERVICE] Failed to update email_verified status:`, updateError);
          // Don't throw error here - verification succeeded, profile update is secondary
        } else {
          console.log(`[AUTH-SERVICE] Successfully updated email_verified status for user ${data.user.id}`);
        }
      } catch (profileUpdateError) {
        console.error(`[AUTH-SERVICE] Exception during profile update:`, profileUpdateError);
        // Continue - verification was successful
      }
    }

    console.log(`[AUTH-SERVICE] Email verification completed successfully for ${email}`);
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

  // Update user notification settings
  async updateUserSettings(settings: Record<string, any>) {
    const user = await this.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(settings)
      .eq('id', user.id)

    if (error) {
      throw new Error(`Failed to update user settings: ${error.message}`)
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null)
    })
  },

  async checkEmailStatus(email: string): Promise<{ exists: boolean; verified: boolean; canResend: boolean }> {
    try {
      // Use API route to check email status (bypasses RLS issues)
      const response = await fetch('/api/email/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        console.error('Email status check API failed:', response.status);
        return { exists: false, verified: false, canResend: false };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Email status check failed:', error);
      // If any error, assume user doesn't exist (safer for privacy)
      return { exists: false, verified: false, canResend: false };
    }
  },
}
