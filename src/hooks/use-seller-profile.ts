import { useState, useEffect } from 'react'

interface ProfileData {
  user: {
    id: string
    email: string
    fullName: string
    phoneNumber: string
    country: string
    role: 'seller' | 'buyer'
    initialCompanyName?: string
    buyerType?: string
    verificationStatus: string
  } | null
  isLoading: boolean
  error: string | null
}

export function useSellerProfile(): ProfileData & {
  updateProfile: (data: any) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
} {
  const [data, setData] = useState<ProfileData>({
    user: null,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }))

        const response = await fetch('/api/auth/current-user')
        if (!response.ok) {
          throw new Error('Failed to fetch user profile')
        }

        const userData = await response.json()

        setData({
          user: {
            id: userData.user.id,
            email: userData.user.email,
            fullName: userData.profile?.full_name || '',
            phoneNumber: userData.profile?.phone_number || '',
            country: userData.profile?.country || '',
            role: userData.profile?.role || 'seller',
            initialCompanyName: userData.profile?.initial_company_name || '',
            buyerType: userData.profile?.buyer_type || undefined,
            verificationStatus: userData.profile?.verification_status || 'anonymous'
          },
          isLoading: false,
          error: null
        })

      } catch (error) {
        console.error('Profile data fetch error:', error)
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load profile data'
        }))
      }
    }

    fetchProfileData()
  }, [])

  const updateProfile = async (profileData: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: profileData.fullName,
          phone_number: profileData.phoneNumber,
          country: profileData.country,
          initial_company_name: profileData.initialCompanyName,
          buyer_type: profileData.buyerType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      // Update local state
      setData(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          fullName: profileData.fullName,
          phoneNumber: profileData.phoneNumber,
          country: profileData.country,
          initialCompanyName: profileData.initialCompanyName,
          buyerType: profileData.buyerType,
        } : null
      }))

      return true
    } catch (error) {
      console.error('Profile update error:', error)
      return false
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change password')
      }

      return true
    } catch (error) {
      console.error('Password change error:', error)
      throw error // Re-throw to handle specific error messages
    }
  }

  return {
    ...data,
    updateProfile,
    changePassword
  }
}
