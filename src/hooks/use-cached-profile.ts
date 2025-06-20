import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import type { UserProfile, User } from '@/lib/auth';
import React from 'react';

// Simple, graceful auth fetcher with comprehensive error handling
const authFetcher = async (): Promise<{ user: User | null; profile: UserProfile | null }> => {
  try {
    // First check if we have a session (fast, cached check)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // If no session or session error, return null gracefully
    if (sessionError || !session?.access_token) {
      return { user: null, profile: null };
    }

    // Make API call with proper error handling
    const response = await fetch('/api/auth/current-user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    // Handle different response statuses gracefully
    if (!response.ok) {
      // For auth-related errors, return null instead of throwing
      if (response.status === 401 || response.status === 403) {
        console.warn('[AUTH] Authentication failed, user needs to re-login');
        return { user: null, profile: null };
      }

      // For rate limiting, return null and let SWR handle retry
      if (response.status === 429) {
        console.warn('[AUTH] Rate limited, will retry later');
        return { user: null, profile: null };
      }

      // For server errors, return null and log the issue
      if (response.status >= 500) {
        console.error(`[AUTH] Server error ${response.status}, falling back to null state`);
        return { user: null, profile: null };
      }

      // For other errors, return null gracefully
      console.warn(`[AUTH] Unexpected response status ${response.status}, falling back to null state`);
      return { user: null, profile: null };
    }

    const data = await response.json();
    return {
      user: data.user || null,
      profile: data.profile || null
    };

  } catch (error) {
    // Handle all errors gracefully - never throw
    if (error.name === 'AbortError') {
      console.warn('[AUTH] Request timeout, will retry later');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.warn('[AUTH] Network error, will retry later');
    } else {
      console.error('[AUTH] Unexpected error:', error);
    }

    // Always return null state on error - let the app handle unauthenticated state
    return { user: null, profile: null };
  }
};

interface UseAuthOptions {
  refreshInterval?: number;
  dedupingInterval?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}

// Main auth hook with conservative, graceful settings
export function useAuth(options?: UseAuthOptions) {
  const {
    refreshInterval = 600000, // 10 minutes - much less aggressive
    dedupingInterval = 60000, // 1 minute deduplication
    revalidateOnFocus = false, // Never revalidate on focus
    revalidateOnReconnect = true,
  } = options || {};

  // Track if we've done initial session check
  const [hasInitialSession, setHasInitialSession] = React.useState(false);
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);

  // Check for existing session on mount
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setHasInitialSession(!!session);
      } catch (error) {
        console.warn('[AUTH] Initial session check failed:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const { data, error, isLoading, mutate } = useSWR<{ user: User | null; profile: UserProfile | null }>(
    'auth', // Single cache key for ALL auth requests
    authFetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus,
      revalidateOnReconnect,
      // Conservative settings to prevent issues
      keepPreviousData: true,
      revalidateIfStale: false, // Don't auto-revalidate stale data
      errorRetryInterval: 30000, // 30 seconds between retries
      errorRetryCount: 2, // Only retry twice
      focusThrottleInterval: 300000, // 5 minute throttle on focus events
      // Never throw errors - always handle gracefully
      onError: (error) => {
        console.warn('[AUTH] SWR error handled gracefully:', error);
      },
      // Don't retry on client-side errors
      shouldRetryOnError: (error) => {
        return false; // Never retry - handle errors gracefully
      },
    }
  );

  // During initial session check, return loading state
  // This prevents showing "not logged in" when we might actually be logged in
  if (isCheckingSession) {
    return {
      user: null,
      profile: null,
      error: null,
      isLoading: true,
      refreshAuth: () => mutate(),
    };
  }

  // If we have a session but data hasn't loaded yet, keep loading state
  // This prevents the flash of "not logged in" content
  if (hasInitialSession && !data && isLoading) {
    return {
      user: null,
      profile: null,
      error: null,
      isLoading: true,
      refreshAuth: () => mutate(),
    };
  }

  return {
    user: data?.user || null,
    profile: data?.profile || null,
    error: null, // Never expose errors to components - handle gracefully
    isLoading,
    // Force refresh when needed (e.g., after login/logout)
    refreshAuth: () => mutate(),
  };
}

// Global auth hook with very conservative settings
export function useGlobalAuth() {
  return useAuth({
    refreshInterval: 600000, // 10 minutes
    dedupingInterval: 60000, // 1 minute deduplication
    revalidateOnFocus: false, // Never revalidate on focus
    revalidateOnReconnect: true,
  });
}

// Primary hook that ALL components should use
export function useCurrentUser() {
  const auth = useAuth();
  return {
    user: auth.user,
    profile: auth.profile,
    loading: auth.isLoading,
    error: null, // Never expose errors - handle gracefully
    // Legacy compatibility
    isLoading: auth.isLoading,
    refreshAuth: auth.refreshAuth,
  };
}

// Legacy function name for backward compatibility
export function useCachedProfile(options?: UseAuthOptions) {
  const auth = useAuth(options);
  return {
    profile: auth.profile,
    error: null, // Never expose errors
    isLoading: auth.isLoading,
    refreshProfile: auth.refreshAuth,
  };
}

// For admin components that might need slightly more frequent updates
export function useRealtimeProfile() {
  return useAuth({
    refreshInterval: 300000, // 5 minutes (still conservative)
    dedupingInterval: 60000, // 1 minute deduplication
    revalidateOnFocus: false, // Never on focus
  });
}

// Legacy aliases for backward compatibility
export function useGlobalProfile() {
  return useGlobalAuth();
}
