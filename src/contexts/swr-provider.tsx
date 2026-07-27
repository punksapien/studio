'use client';

import { SWRConfig, type SWRConfiguration } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

// Hoisted to module scope: this config references no props or state, so it never
// needs to be rebuilt. A fresh object literal on every render would make SWRConfig
// re-create its context value and re-render every consumer below it.
const SWR_CONFIG: SWRConfiguration = {
  // Global SWR configuration optimized for reducing requests and preventing rate limits
  refreshInterval: 300000, // 5 minutes default refresh (was too aggressive before)
  dedupingInterval: 30000, // Dedupe requests within 30 seconds
  revalidateOnFocus: false, // CRITICAL: Don't revalidate on window focus
  revalidateOnReconnect: true, // Revalidate when connection restored
  revalidateIfStale: false, // Don't auto-revalidate stale data

  // Error handling and retries
  errorRetryInterval: 15000, // 15 seconds between error retries (reduced from 10s)
  errorRetryCount: 2, // Max 2 retries (reduced from 3)

  // Performance optimizations
  keepPreviousData: true, // Keep previous data while fetching new
  focusThrottleInterval: 60000, // Throttle focus revalidation to 1 minute

  // Global error handler with rate limit awareness
  onError: (error, key) => {
    if (error.message === 'RATE_LIMITED') {
      console.warn(`SWR: Rate limited for key ${key} - using cached data`);
      return; // Don't log rate limit errors
    }
    if (error.status === 429) {
      console.warn(`SWR: 429 rate limit for key ${key} - backing off`);
      return;
    }
    console.error(`SWR Error for key ${key}:`, error);
  },

  // Global loading handler
  onLoadingSlow: (key) => {
    console.warn(`SWR: Slow request detected for key ${key}`);
  },

  // Custom shouldRetryOnError to prevent retry loops on rate limits
  shouldRetryOnError: (error) => {
    // Don't retry on rate limits or auth errors
    if (error.message === 'RATE_LIMITED' || error.status === 429 || error.status === 401) {
      return false;
    }
    // Don't retry on client errors (4xx)
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
    return true;
  },
};

export function SWRProvider({ children }: SWRProviderProps) {
  return <SWRConfig value={SWR_CONFIG}>{children}</SWRConfig>;
}
