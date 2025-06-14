import useSWR from 'swr';
import { auth } from '@/lib/auth';
import type { UserProfile } from '@/lib/auth';

// SWR configuration for profile caching
const profileFetcher = async () => {
  const profile = await auth.getCurrentUserProfile();
  if (!profile) throw new Error('No profile found');
  return profile;
};

interface UseCachedProfileOptions {
  refreshInterval?: number;
  dedupingInterval?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}

export function useCachedProfile(options?: UseCachedProfileOptions) {
  const {
    refreshInterval = 60000, // Default: 60 seconds (instead of 3)
    dedupingInterval = 5000, // Dedupe requests within 5 seconds
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
  } = options || {};

  const { data, error, isLoading, mutate } = useSWR<UserProfile>(
    'profile', // Single cache key for all profile requests
    profileFetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus,
      revalidateOnReconnect,
      // Keep previous data while revalidating
      keepPreviousData: true,
      // Share cache across all components
      revalidateIfStale: false,
      // Retry on error with exponential backoff
      errorRetryInterval: 5000,
      errorRetryCount: 3,
      // Cache for 5 minutes even after component unmounts
      focusThrottleInterval: 5000,
    }
  );

  return {
    profile: data,
    error,
    isLoading,
    // Force refresh when needed (e.g., after profile update)
    refreshProfile: () => mutate(),
  };
}

// Export a singleton hook for global profile state
export function useGlobalProfile() {
  // This will share the same cache across ALL components
  return useCachedProfile({
    refreshInterval: 300000, // 5 minutes for global state
    dedupingInterval: 10000, // Dedupe within 10 seconds
  });
}

// Export a hook for real-time components (like DebugState)
export function useRealtimeProfile() {
  return useCachedProfile({
    refreshInterval: 30000, // 30 seconds for real-time
    dedupingInterval: 5000, // Still dedupe aggressively
  });
}
