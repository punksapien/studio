'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useGlobalProfile } from '@/hooks/use-cached-profile';
import type { UserProfile } from '@/lib/auth';
import { mutate } from 'swr';

interface AuthContextValue {
  profile: UserProfile | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refreshProfile: () => Promise<UserProfile | undefined>;
  // Global cache invalidation helpers
  invalidateProfile: () => void;
  invalidateAll: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { profile, isLoading, error, refreshProfile } = useGlobalProfile();

  // Global cache invalidation functions
  const invalidateProfile = () => {
    // This will force all components using the profile to refetch
    mutate('profile');
  };

  const invalidateAll = () => {
    // Invalidate all SWR caches (useful after logout)
    mutate(() => true, undefined, { revalidate: false });
  };

  const value: AuthContextValue = {
    profile,
    isLoading,
    error,
    refreshProfile,
    invalidateProfile,
    invalidateAll,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hooks for common use cases
export function useCurrentUser() {
  const { profile, isLoading } = useAuth();
  return {
    user: profile ? { id: profile.id, email: profile.email } : null,
    profile,
    isLoading,
  };
}

export function useUserRole() {
  const { profile } = useAuth();
  return profile?.role;
}

export function useIsAuthenticated() {
  const { profile, isLoading } = useAuth();
  return {
    isAuthenticated: !!profile,
    isLoading,
  };
}
