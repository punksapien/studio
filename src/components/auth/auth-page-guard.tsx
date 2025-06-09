'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'

interface AuthPageGuardProps {
  children: React.ReactNode
}

export function AuthPageGuard({ children }: AuthPageGuardProps) {
  const { user, profile, loading } = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    // If we're not loading and user is authenticated, redirect them away
    // 🔥 ENHANCED: Also check for user-only state (no profile) to handle edge cases
    if (!loading && user) {
      // If we have a user but no profile, there might be a zombie auth issue
      if (!profile) {
        console.log('AuthPageGuard: User exists but no profile found - clearing session and staying on auth page')
        // Clear the problematic session and let them register/login properly
        supabase.auth.signOut()
        return
      }
      // 🚀 MVP SIMPLIFICATION: Direct dashboard redirect (bypass onboarding)
      // Original logic: Complex onboarding step check and redirection
      // MVP logic: Send all authenticated users directly to their appropriate dashboard

      console.log('AuthPageGuard: Authenticated user detected, redirecting to dashboard (onboarding bypassed for MVP)');

      // Direct dashboard redirect based on role (no onboarding checks)
        if (profile.role === 'seller') {
          router.push('/seller-dashboard')
        } else if (profile.role === 'buyer') {
          router.push('/dashboard')
        } else if (profile.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }

      // ORIGINAL ONBOARDING LOGIC (commented out for MVP):
      // // Redirect based on onboarding status and role
      // if (!profile.is_onboarding_completed) {
      //   // User hasn't completed onboarding, redirect to appropriate onboarding flow
      //   if (profile.role === 'buyer') {
      //     router.push('/onboarding/buyer/1')
      //   } else if (profile.role === 'seller') {
      //     router.push('/onboarding/seller/1')
      //   } else {
      //     router.push('/')
      //   }
      // } else {
      //   // User has completed onboarding, redirect to dashboard
      //   if (profile.role === 'seller') {
      //     router.push('/seller-dashboard')
      //   } else if (profile.role === 'buyer') {
      //     router.push('/dashboard')
      //   } else if (profile.role === 'admin') {
      //     router.push('/admin')
      //   } else {
      //     router.push('/')
      //   }
      // }
    }
  }, [user, profile, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Only render children if user is not authenticated
  if (!user || !profile) {
    return <>{children}</>
  }

  // Don't render anything while redirecting
  return null
}
