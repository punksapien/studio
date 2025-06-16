'use client';

import { useQuery } from '@tanstack/react-query';

// Query keys factory for better cache management
export const userKeys = {
  all: ['user'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  profile: (userId: string) => [...userKeys.all, 'profile', userId] as const,
} as const;

// Fetch current user data using the existing API endpoint
async function fetchCurrentUser() {
  const response = await fetch('/api/auth/current-user', {
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // The API returns data directly, not wrapped in a success object
  if (!data.user) {
    throw new Error('Invalid user data received');
  }

  return {
    user: data.user,
    profile: data.profile,
  };
}

export function useUserData() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: fetchCurrentUser,
    retry: (failureCount, error: any) => {
      // Don't retry authentication errors
      if (error.message === 'Not authenticated' || error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - user data doesn't change often
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

export function useCurrentUser() {
  const query = useUserData();

  return {
    user: query.data?.user || null,
    profile: query.data?.profile || null,
    loading: query.isLoading,
    error: query.error,
    isAuthenticated: !!query.data?.user && !query.error,
    refetch: query.refetch,
  };
}
