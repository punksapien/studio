import { useState, useEffect } from 'react'

interface DashboardStats {
  activeListingsCount: number
  totalInquiriesReceived: number
  inquiriesAwaitingEngagement: number
  verificationStatus: 'verified' | 'pending_verification' | 'anonymous'
}

interface DashboardData {
  user: {
    id: string
    fullName: string
    verificationStatus: 'verified' | 'pending_verification' | 'anonymous'
  } | null
  stats: DashboardStats
  recentListings: any[]
  isLoading: boolean
  error: string | null
}

export function useSellerDashboard(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    user: null,
    stats: {
      activeListingsCount: 0,
      totalInquiriesReceived: 0,
      inquiriesAwaitingEngagement: 0,
      verificationStatus: 'anonymous'
    },
    recentListings: [],
    isLoading: true,
    error: null
  })

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }))

        // Fetch current user data
        const userResponse = await fetch('/api/auth/current-user')
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data')
        }
        const userData = await userResponse.json()

        // Fetch user's listings (get all listings to calculate accurate stats)
        const listingsResponse = await fetch('/api/user/listings?limit=50&sort_by=updated_at&sort_order=desc')
        if (!listingsResponse.ok) {
          throw new Error('Failed to fetch listings')
        }
        const listingsData = await listingsResponse.json()

        // Fetch user's inquiries (as seller)
        const inquiriesResponse = await fetch('/api/inquiries?role=seller&limit=100')
        if (!inquiriesResponse.ok) {
          throw new Error('Failed to fetch inquiries')
        }
        const inquiriesData = await inquiriesResponse.json()

        // Calculate active listings count (verified_anonymous + verified_with_financials)
        const activeListings = listingsData.listings?.filter(
          (listing: any) => listing.status === 'verified_anonymous' || listing.status === 'verified_with_financials'
        ) || []

        const activeListingsCount = activeListings.length
        const totalInquiriesReceived = inquiriesData.pagination?.total || 0
        const inquiriesAwaitingEngagement = inquiriesData.inquiries?.filter(
          (inq: any) => inq.status === 'new_inquiry'
        ).length || 0

        // Map verification status
        const verificationStatus = userData.profile?.verification_status === 'verified'
          ? 'verified'
          : userData.profile?.verification_status === 'pending_verification'
          ? 'pending_verification'
          : 'anonymous'

        setData({
          user: {
            id: userData.user.id,
            fullName: userData.profile?.full_name || 'User',
            verificationStatus
          },
          stats: {
            activeListingsCount,
            totalInquiriesReceived,
            inquiriesAwaitingEngagement,
            verificationStatus
          },
          recentListings: activeListings.slice(0, 3), // Show first 3 active listings
          isLoading: false,
          error: null
        })

      } catch (error) {
        console.error('Dashboard data fetch error:', error)
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load dashboard data'
        }))
      }
    }

    fetchDashboardData()
  }, [])

  return data
}
