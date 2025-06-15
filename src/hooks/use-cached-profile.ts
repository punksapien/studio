import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import type { UserProfile, User } from '@/lib/auth';

// SWR configuration for auth caching with request deduplication
const authFetcher = async (): Promise<{ user: User | null; profile: UserProfile | null }> => {
  try {
    // First check if we have a session (fast, cached check)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return { user: null, profile: null };
    }

    // Make single API call for both user and profile data
    const response = await fetch('/api/auth/current-user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { user: null, profile: null };
      }
      if (response.status === 429) {
        // Don't throw on rate limit, return cached data and log
        console.warn('Auth API rate limited - using cached data');
        throw new Error('RATE_LIMITED');
      }
      throw new Error(`Auth fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return { user: data.user, profile: data.profile };
  } catch (error) {
    console.error('Auth fetch error:', error);
    if (error.message === 'RATE_LIMITED') {
      throw error; // Let SWR handle rate limiting with its retry logic
    }
    return { user: null, profile: null };
  }
};

interface UseAuthOptions {
  refreshInterval?: number;
  dedupingInterval?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}

// Main auth hook with aggressive caching to prevent rate limiting
export function useAuth(options?: UseAuthOptions) {
  const {
    refreshInterval = 300000, // Default: 5 minutes
    dedupingInterval = 30000, // Dedupe requests within 30 seconds
    revalidateOnFocus = false, // NEVER revalidate on focus by default
    revalidateOnReconnect = true,
  } = options || {};

  const { data, error, isLoading, mutate } = useSWR<{ user: User | null; profile: UserProfile | null }>(
    'auth', // Single cache key for ALL auth requests
    authFetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus,
      revalidateOnReconnect,
      // Aggressive caching to prevent rate limiting
      keepPreviousData: true,
      revalidateIfStale: false, // Don't auto-revalidate stale data
      errorRetryInterval: 15000, // 15 seconds between retries (less aggressive)
      errorRetryCount: 2, // Reduced retry count
      focusThrottleInterval: 60000, // 1 minute throttle on focus events
      // Handle rate limiting gracefully
      onError: (error) => {
        if (error.message === 'RATE_LIMITED') {
          console.warn('Auth requests are being rate limited - using cached data');
        }
      },
      // Don't retry on rate limit errors
      shouldRetryOnError: (error) => {
        return error.message !== 'RATE_LIMITED';
      },
    }
  );

  return {
    user: data?.user || null,
    profile: data?.profile || null,
    error,
    isLoading,
    // Force refresh when needed (e.g., after login/logout)
    refreshAuth: () => mutate(),
  };
}

// Global auth hook with VERY aggressive caching for shared state
export function useGlobalAuth() {
  return useAuth({
    refreshInterval: 300000, // 5 minutes
    dedupingInterval: 30000, // 30 seconds deduplication
    revalidateOnFocus: false, // NEVER revalidate on focus
    revalidateOnReconnect: true,
  });
}

// Export a consolidated auth hook that ALL components should use
export function useCurrentUser() {
  const auth = useAuth();
  return {
    user: auth.user,
    profile: auth.profile,
    loading: auth.isLoading,
    error: auth.error,
    // Legacy compatibility
    isLoading: auth.isLoading,
  };
}

// Legacy function name for backward compatibility
export function useCachedProfile(options?: UseAuthOptions) {
  const auth = useAuth(options);
  return {
    profile: auth.profile,
    error: auth.error,
    isLoading: auth.isLoading,
    refreshProfile: auth.refreshAuth,
  };
}

// For debugging/admin components that need more frequent updates
export function useRealtimeProfile() {
  return useAuth({
    refreshInterval: 120000, // 2 minutes (still reasonable)
    dedupingInterval: 30000, // Still dedupe aggressively
    revalidateOnFocus: false, // NEVER on focus
  });
}

// Legacy aliases for backward compatibility
export function useGlobalProfile() {
  return useGlobalAuth();
}
