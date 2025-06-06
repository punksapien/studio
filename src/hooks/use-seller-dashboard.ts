
import { useState, useEffect, useCallback } from 'react'

interface DashboardStats {
  activeListingsCount: number
  totalInquiriesReceived: number
  inquiriesAwaitingEngagement: number
  verificationStatus: 'verified' | 'pending_verification' | 'anonymous'
}

interface Listing {
  id: string
  title: string
  status: string
  asking_price?: number
  inquiry_count?: number
}

interface DashboardData {
  user: {
    id: string
    fullName: string
    verificationStatus: 'verified' | 'pending_verification' | 'anonymous'
  } | null
  stats: DashboardStats
  recentListings: Listing[]
  isLoading: boolean
  error: string | null
  refreshData: () => Promise<void>; // Added refresh function
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
    error: null,
    refreshData: async () => {}, // Initial empty function
  })

  const fetchDashboardData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }))

      const userResponse = await fetch('/api/auth/current-user')
      if (!userResponse.ok) throw new Error('Failed to fetch user data')
      const userData = await userResponse.json()

      const listingsResponse = await fetch('/api/user/listings?limit=50&sort_by=updated_at&sort_order=desc')
      if (!listingsResponse.ok) throw new Error('Failed to fetch listings')
      const listingsData = await listingsResponse.json()

      const inquiriesResponse = await fetch('/api/inquiries?role=seller&limit=100')
      if (!inquiriesResponse.ok) throw new Error('Failed to fetch inquiries')
      const inquiriesData = await inquiriesResponse.json()
      
      const activeStatuses = ['active', 'verified_anonymous', 'verified_with_financials', 'pending_verification']
      const activeListings = listingsData.listings?.filter(
        (listing: any) => activeStatuses.includes(listing.status)
      ) || []

      const activeListingsCount = activeListings.length
      const totalInquiriesReceived = inquiriesData.pagination?.total || 0
      const inquiriesAwaitingEngagement = inquiriesData.inquiries?.filter(
        (inq: any) => inq.status === 'new_inquiry'
      ).length || 0

      const verificationStatus = userData.profile?.verification_status === 'verified'
        ? 'verified'
        : userData.profile?.verification_status === 'pending_verification'
        ? 'pending_verification'
        : 'anonymous'

      const formattedListings: Listing[] = activeListings.map((listing: any) => ({
        id: listing.id,
        title: listing.listing_title_anonymous || listing.title || 'Untitled Listing',
        status: listing.status,
        asking_price: listing.asking_price,
        inquiry_count: inquiriesData.inquiries?.filter((inq: any) => inq.listing_id === listing.id).length || 0
      }))

      setData(prev => ({
        ...prev,
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
        recentListings: formattedListings.slice(0, 3),
        isLoading: false,
        error: null
      }))

    } catch (error) {
      console.error('Dashboard data fetch error:', error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }))
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return { ...data, refreshData: fetchDashboardData };
}
