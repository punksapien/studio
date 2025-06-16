'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - data is considered fresh for 1 minute
        staleTime: 1000 * 60,
        // Cache time - data stays in cache for 5 minutes
        gcTime: 1000 * 60 * 5,
        // Retry failed requests with exponential backoff
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        // Refetch behavior
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
