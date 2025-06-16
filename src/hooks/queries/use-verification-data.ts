'use client';

import { useQuery } from '@tanstack/react-query';

// Query keys factory
export const verificationKeys = {
  all: ['verification'] as const,
  requests: () => [...verificationKeys.all, 'requests'] as const,
  request: (id: string) => [...verificationKeys.all, 'request', id] as const,
} as const;

// Fetch verification requests
async function fetchVerificationRequests() {
  const response = await fetch('/api/verification/request');

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export function useVerificationData() {
  return useQuery({
    queryKey: verificationKeys.requests(),
    queryFn: fetchVerificationRequests,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useVerificationRequest() {
  const query = useVerificationData();

  return {
    requests: query.data?.requests || [],
    currentStatus: query.data?.currentStatus || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
