import { useState, useEffect, useCallback, useRef } from 'react'

interface DashboardStats {
  activeInquiriesCount: number
  newMessagesCount: number
  verificationStatus: 'verified' | 'pending_verification' | 'rejected' | 'anonymous'
}

interface Inquiry {
  id: string
  listingTitle: string
  status: string
  inquiryTimestamp: string
  statusBuyerPerspective: string
}

interface Listing {
  id: string
  title: string
  status: string
  asking_price?: number
  industry?: string
}

interface VerificationRequest {
  id: string
  request_type: string
  status: string
  can_bump: boolean
  hours_until_can_bump?: number
}

interface BuyerDashboardData {
  user: {
    id: string
    fullName: string
    verificationStatus: 'verified' | 'pending_verification' | 'rejected' | 'anonymous'
    role: string
    onboardingStepCompleted: number
    isOnboardingCompleted: boolean
  } | null
  stats: DashboardStats
  recentInquiries: Inquiry[]
  verificationRequests: VerificationRequest[]
  isLoading: boolean
  error: string | null
  refreshData: () => Promise<void>
  isPolling: boolean
}

export function useBuyerDashboard(): BuyerDashboardData {
  const [data, setData] = useState<BuyerDashboardData>({
    user: null,
    stats: {
      activeInquiriesCount: 0,
      newMessagesCount: 0,
      verificationStatus: 'anonymous'
    },
    recentInquiries: [],
    verificationRequests: [],
    isLoading: true,
    error: null,
    refreshData: async () => {},
    isPolling: false,
  })

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const requestInProgressRef = useRef(false)

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url)

        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
          if (i === retries - 1) {
            console.warn(`[RATE-LIMIT] Max retries reached for ${url}, returning cached/default data`)
            return new Response(JSON.stringify({
              error: 'rate_limited',
              message: 'Data temporarily unavailable due to rate limiting'
            }), {
              status: 429,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          console.log(`[RATE-LIMIT] Request rate limited, retrying in ${delay}ms (attempt ${i + 1}/${retries})`)
          await sleep(delay)
          delay *= 2
          continue
        }

        return response
      } catch (error) {
        if (i === retries - 1) {
          console.error(`[FETCH-ERROR] Failed to fetch ${url} after ${retries} attempts:`, error)
          return new Response(JSON.stringify({
            error: 'network_error',
            message: 'Network error - please check your connection'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        await sleep(delay)
        delay *= 2
      }
    }

    return new Response(JSON.stringify({
      error: 'unknown_error',
      message: 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const fetchDashboardData = useCallback(async (isBackgroundRefresh = false) => {
    // Prevent multiple simultaneous requests
    if (requestInProgressRef.current) {
      console.log('[BUYER-DASHBOARD] Request already in progress, skipping')
      return
    }

    try {
      requestInProgressRef.current = true

      if (!isBackgroundRefresh) {
        setData(prev => ({ ...prev, isLoading: true, error: null }))
      }

      // Fetch user data using the same pattern as seller dashboard
      const userResponse = await fetchWithRetry('/api/auth/current-user')
      const userData = await userResponse.json()

      // Handle rate limited or error responses gracefully
      if (userData.error === 'rate_limited') {
        console.log('[BUYER-DASHBOARD] User data rate limited, using cached data')
        if (!data.user) {
          setData(prev => ({
            ...prev,
            isLoading: false,
            error: 'Loading data... Please wait a moment.'
          }))
          return
        }
      } else if (!userResponse.ok || userData.error) {
        console.warn('[BUYER-DASHBOARD] Failed to fetch user data, continuing with cached data')
        if (!data.user) {
          setData(prev => ({
            ...prev,
            isLoading: false,
            error: 'Unable to load user data. Please refresh the page.'
          }))
          return
        }
      }

      // Only proceed if we have valid user data and user is a buyer
      if (!userData.user || !userData.profile || userData.profile.role !== 'buyer') {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: userData.profile?.role !== 'buyer' ? 'This dashboard is for buyers only.' : 'Authentication required.'
        }))
        return
      }

      // Fetch verification requests using the same endpoint pattern
      const verificationResponse = await fetchWithRetry('/api/verification/request')
      const verificationData = await verificationResponse.json()

      // Handle verification data gracefully
      const verificationRequests = (verificationData.error || !verificationResponse.ok) ? [] : (verificationData.requests || [])

      // Fetch buyer inquiries (placeholder for now - will be implemented later)
      const inquiriesResponse = await fetchWithRetry('/api/inquiries?role=buyer&limit=10')
      const inquiriesData = await inquiriesResponse.json()

      // Handle inquiries data gracefully
      const inquiries = (inquiriesData.error || !inquiriesResponse.ok) ? [] : (inquiriesData.inquiries || [])

      // Calculate stats
      const activeInquiriesCount = inquiries.filter(
        (inq: any) => inq.status !== 'archived' && inq.status !== 'completed'
      ).length || 0

      const newMessagesCount = 0 // Placeholder - will implement messaging later

      // Determine verification status
      const verificationStatus: 'verified' | 'pending_verification' | 'rejected' | 'anonymous' =
        userData.profile?.verification_status === 'verified'
          ? 'verified'
          : userData.profile?.verification_status === 'pending_verification'
          ? 'pending_verification'
          : verificationRequests.some((req: any) => req.status === 'rejected')
          ? 'rejected'
          : 'anonymous'

      // Format recent inquiries
      const recentInquiries: Inquiry[] = inquiries.slice(0, 3).map((inq: any) => ({
        id: inq.id,
        listingTitle: inq.listing_title || 'Untitled Listing',
        status: inq.status,
        inquiryTimestamp: inq.created_at,
        statusBuyerPerspective: inq.status_buyer_perspective || inq.status
      }))

      const newData = {
        user: {
          id: userData.user.id,
          fullName: userData.profile?.full_name || 'Buyer',
          verificationStatus,
          role: userData.profile.role,
          onboardingStepCompleted: userData.profile.onboarding_step_completed || 0,
          isOnboardingCompleted: userData.profile.is_onboarding_completed || false
        },
        stats: {
          activeInquiriesCount,
          newMessagesCount,
          verificationStatus
        },
        recentInquiries,
        verificationRequests: verificationRequests.map((req: any) => ({
          id: req.id,
          request_type: req.request_type,
          status: req.status,
          can_bump: req.can_bump || false,
          hours_until_can_bump: req.hours_until_can_bump
        })),
        isLoading: false,
        error: null,
        refreshData: fetchDashboardData,
        isPolling,
      }

      setData(newData)

    } catch (error) {
      console.error('[BUYER-DASHBOARD] Error fetching dashboard data:', error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load dashboard data. Please try refreshing the page.'
      }))
    } finally {
      requestInProgressRef.current = false
    }
  }, [data.user, isPolling])

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Handle visibility change to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
          setIsPolling(false)
        }
      } else {
        // Resume polling when page becomes visible
        if (!pollingIntervalRef.current && data.user) {
          fetchDashboardData(true)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [data.user, fetchDashboardData])

  return {
    ...data,
    refreshData: fetchDashboardData,
  }
}
