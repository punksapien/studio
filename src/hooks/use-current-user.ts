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
  submitted_documents?: Record<string, any>

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
}

export function useCurrentUser(): CurrentUserData {
  const [data, setData] = useState<CurrentUserData>({
    user: null,
    profile: null,
    loading: true,
    error: null
  })

  const fetchCurrentUser = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Get the current session to access the JWT token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        // No valid session, user not authenticated
        setData({
          user: null,
          profile: null,
          loading: false,
          error: null
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
        if (response.status === 401) {
          // User not authenticated
          setData({
            user: null,
            profile: null,
            loading: false,
            error: null
          })
          return
        }

        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch user data')
      }

      const { user, profile } = await response.json()

      setData({
        user,
        profile,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Error fetching current user:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  useEffect(() => {
    fetchCurrentUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          fetchCurrentUser()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return data
}

export async function updateUserProfile(updateData: Partial<UserProfile>): Promise<UserProfile> {
  // Get the current session to access the JWT token
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
export async function checkOnboardingStatus() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch('/api/onboarding/status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to check onboarding status')
  }

  return response.json()
}

export async function updateOnboardingStatus(updates: {
  step_completed?: number
  submitted_documents?: Record<string, any>
  complete_onboarding?: boolean
}) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch('/api/onboarding/status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update onboarding status')
  }

  return response.json()
}

export async function uploadOnboardingDocument(file: File, documentType: string) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('document_type', documentType)

  const response = await fetch('/api/onboarding/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to upload document')
  }

  return response.json()
}
