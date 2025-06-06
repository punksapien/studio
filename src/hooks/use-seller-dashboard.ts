import { useState, useEffect, useCallback, useRef } from 'react'

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
  refreshData: () => Promise<void>;
  isPolling: boolean;
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
    refreshData: async () => {},
    isPolling: false,
  })

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const requestInProgressRef = useRef(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url)

        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
          if (i === retries - 1) throw new Error('Rate limited - please try again in a moment')

          console.log(`[RATE-LIMIT] Request rate limited, retrying in ${delay}ms (attempt ${i + 1}/${retries})`)
          await sleep(delay)
          delay *= 2 // Exponential backoff
          continue
        }

        return response
      } catch (error) {
        if (i === retries - 1) throw error
        await sleep(delay)
        delay *= 2
      }
    }
    throw new Error('Max retries exceeded')
  }

  const fetchDashboardData = useCallback(async (isBackgroundRefresh = false) => {
    // Prevent multiple simultaneous requests
    if (requestInProgressRef.current) {
      console.log('[DASHBOARD] Request already in progress, skipping')
      return
    }

    try {
      requestInProgressRef.current = true

      if (!isBackgroundRefresh) {
        setData(prev => ({ ...prev, isLoading: true, error: null }))
      }

      // Use retry logic for all requests
      const userResponse = await fetchWithRetry('/api/auth/current-user')
      if (!userResponse.ok) {
        throw new Error(userResponse.status === 429 ? 'Too many requests - please wait a moment' : 'Failed to fetch user data')
      }
      const userData = await userResponse.json()

      const listingsResponse = await fetchWithRetry('/api/user/listings?limit=50&sort_by=updated_at&sort_order=desc')
      if (!listingsResponse.ok) {
        throw new Error(listingsResponse.status === 429 ? 'Too many requests - please wait a moment' : 'Failed to fetch listings')
      }
      const listingsData = await listingsResponse.json()

      const inquiriesResponse = await fetchWithRetry('/api/inquiries?role=seller&limit=100')
      if (!inquiriesResponse.ok) {
        throw new Error(inquiriesResponse.status === 429 ? 'Too many requests - please wait a moment' : 'Failed to fetch inquiries')
      }
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

      const newData = {
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
        error: null,
        isPolling,
      }

      setData(prev => ({ ...prev, ...newData }))

      // Log status changes for real-time updates
      if (isBackgroundRefresh) {
        console.log('[REAL-TIME] Dashboard refreshed - Verification status:', verificationStatus)
      }

    } catch (error) {
      console.error('Dashboard data fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data'

      setData(prev => ({
        ...prev,
        isLoading: !isBackgroundRefresh ? false : prev.isLoading,
        error: errorMessage
      }))

      // If rate limited, slow down polling
      if (errorMessage.includes('rate limit') || errorMessage.includes('Too many requests')) {
        console.log('[RATE-LIMIT] Slowing down polling due to rate limit')
        stopPolling()
        // Restart polling after a delay
        retryTimeoutRef.current = setTimeout(() => {
          startPolling()
        }, 30000) // Wait 30 seconds before resuming polling
      }
    } finally {
      requestInProgressRef.current = false
    }
  }, [isPolling])

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return // Already polling

    setIsPolling(true)
    pollingIntervalRef.current = setInterval(() => {
      fetchDashboardData(true) // Background refresh
    }, 30000) // Poll every 30 seconds (reduced from 15 to avoid rate limiting)

    console.log('[REAL-TIME] Started polling for verification status updates (30s interval)')
  }, [fetchDashboardData])

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
      setIsPolling(false)
      console.log('[REAL-TIME] Stopped polling for verification status updates')
    }

    // Clear retry timeout if it exists
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }, [])

  const refreshData = useCallback(async () => {
    await fetchDashboardData(false)
  }, [fetchDashboardData])

  useEffect(() => {
    fetchDashboardData(false)
    startPolling() // Start real-time polling

    // Cleanup on unmount
    return () => {
      stopPolling()
    }
  }, [fetchDashboardData, startPolling, stopPolling])

  // Listen for tab visibility changes to optimize polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        fetchDashboardData(true) // Refresh when tab becomes visible
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startPolling, stopPolling, fetchDashboardData])

  return { ...data, refreshData, isPolling };
}
