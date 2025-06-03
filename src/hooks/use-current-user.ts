'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone_number?: string
  country?: string
  role: 'buyer' | 'seller' | 'admin'
  is_email_verified: boolean
  email_verified_at?: string
  verification_status: 'anonymous' | 'pending_verification' | 'verified' | 'rejected'
  is_paid: boolean

  // Onboarding fields
  is_onboarding_completed: boolean
  onboarding_completed_at?: string
  onboarding_step_completed: number
  submitted_documents?: Record<string, any> // e.g. { "identity": "path/to/id.pdf", "business_reg": "path/to/reg.pdf" }


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

export interface CurrentUserData {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  strategy?: string // Which auth strategy was used
  lastUpdate?: string // When data was last fetched
}

export function useCurrentUser(): CurrentUserData {
  const [data, setData] = useState<CurrentUserData>({
    user: null,
    profile: null,
    loading: true,
    error: null
  })

  const fetchCurrentUser = async (retryCount = 0) => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        setData({
          user: null,
          profile: null,
          loading: false,
          error: null,
          lastUpdate: new Date().toISOString()
        })
        return
      }

      const response = await fetch('/api/auth/current-user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        // Handle specific error types from the new API
        const contentType = response.headers.get('content-type')

        if (response.status === 401) {
          setData({
            user: null,
            profile: null,
            loading: false,
            error: null,
            lastUpdate: new Date().toISOString()
          })
          return
        }

        if (response.status === 429) {
          // Rate limited - extract retry info
          const retryAfter = response.headers.get('retry-after')
          const rateLimitReset = response.headers.get('x-ratelimit-reset-time')

          const errorData = await response.json().catch(() => ({ error: 'Rate limited' }))

          setData(prev => ({
            ...prev,
            loading: false,
            error: `Rate limited. ${errorData.error || 'Too many requests'} ${retryAfter ? `Try again in ${retryAfter} seconds.` : ''}`
          }))
          return
        }

        if (response.status === 503) {
          // Service unavailable - maybe retry
          const errorData = await response.json().catch(() => ({ error: 'Service unavailable' }))

          if (retryCount < 2) {
            console.log(`Service unavailable, retrying in 2 seconds (attempt ${retryCount + 1}/3)`)
            setTimeout(() => fetchCurrentUser(retryCount + 1), 2000)
            return
          }

          setData(prev => ({
            ...prev,
            loading: false,
            error: 'Authentication service is temporarily unavailable. Please try again later.'
          }))
          return
        }

        // Check if response is HTML (middleware redirect) instead of JSON
        if (contentType && contentType.includes('text/html')) {
          console.warn('Received HTML response (likely middleware redirect) instead of JSON from current-user API')
          setData({
            user: null,
            profile: null,
            loading: false,
            error: null,
            lastUpdate: new Date().toISOString()
          })
          return
        }

        const errorData = await response.json().catch(() => ({
          error: 'Unknown error occurred',
          correlationId: 'unknown'
        }))

        throw new Error(errorData.error || 'Failed to fetch user data')
      }

      const responseData = await response.json()

      // Handle new API response format
      const { user, profile, metadata } = responseData

      setData({
        user,
        profile,
        loading: false,
        error: null,
        strategy: metadata?.strategy,
        lastUpdate: metadata?.timestamp || new Date().toISOString()
      })

    } catch (error) {
      console.error('Error fetching current user:', error)

      // If this is a network error and we haven't retried, try once more
      if (retryCount < 1 && (error instanceof TypeError || error?.message?.includes('fetch'))) {
        console.log('Network error, retrying in 1 second...')
        setTimeout(() => fetchCurrentUser(retryCount + 1), 1000)
        return
      }

      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }))
    }
  }

  useEffect(() => {
    fetchCurrentUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        fetchCurrentUser() // Refetch user data on any auth change
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  return data
}

export async function updateUserProfile(updateData: Partial<UserProfile>): Promise<UserProfile> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated - please log in again')
  }

  const response = await fetch('/api/auth/update-profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(updateData)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update profile')
  }
  const { profile } = await response.json()
  return profile
}

// Onboarding utility functions
export async function checkOnboardingStatus(): Promise<{
  is_onboarding_completed: boolean;
  onboarding_step_completed: number;
  submitted_documents?: Record<string, any>;
  role: 'buyer' | 'seller' | 'admin';
  next_step: string;
}> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated for checkOnboardingStatus');
  }

  const response = await fetch('/api/onboarding/status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to check onboarding status');
  }
  return response.json();
}

export async function updateOnboardingStatus(updates: {
  step_completed?: number;
  submitted_documents?: Record<string, any>;
  complete_onboarding?: boolean;
}): Promise<{ success: boolean; profile: UserProfile }> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated for updateOnboardingStatus');
  }

  const response = await fetch('/api/onboarding/status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update onboarding status');
  }
  return response.json();
}

export async function uploadOnboardingDocument(file: File, documentType: string): Promise<{
  success: boolean;
  documentRecord: any; // Define specific type for onboarding document record
  filePath: string;
  signedUrl?: string;
}> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated for uploadOnboardingDocument');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);

  const response = await fetch('/api/onboarding/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      // Content-Type is set automatically by browser for FormData
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload document');
  }
  return response.json();
}

// Verification request utility function
export async function sendVerificationRequestEmail() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch('/api/verification/request-email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to send verification request email')
  }

  return response.json()
}
