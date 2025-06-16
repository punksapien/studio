'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useGlobalAuth } from '@/hooks/use-cached-profile';
import { supabase } from '@/lib/supabase';
import type { UserProfile, User } from '@/lib/auth';
import { mutate } from 'swr';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | undefined;
  refreshAuth: () => Promise<any>;
  // Global cache invalidation helpers
  invalidateAuth: () => void;
  invalidateAll: () => void;
  // 🔥 ROBUST LOGOUT: Centralized logout that handles both Supabase and cache
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, profile, isLoading, error, refreshAuth } = useGlobalAuth();

  // Global cache invalidation functions
  const invalidateAuth = () => {
    // This will force all components using auth to refetch
    mutate('auth');
  };

  const invalidateAll = () => {
    // Invalidate all SWR caches (useful after logout)
    mutate(() => true, undefined, { revalidate: false });
  };

  // 🔥 CENTRALIZED LOGOUT: Handles both Supabase signout and cache invalidation
  const logout = async () => {
    try {
      // First clear Supabase auth session
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase logout error:', error);
        // Continue with cache invalidation even if Supabase logout fails
      }

      // Immediately invalidate auth cache to update all components
      invalidateAuth();

      // Also refresh the auth state to ensure immediate UI update
      await refreshAuth();

    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, try to clear the cache
      invalidateAuth();
      throw error; // Re-throw so components can handle the error
    }
  };

  const value: AuthContextValue = {
    user,
    profile,
    isLoading,
    error,
    refreshAuth,
    invalidateAuth,
    invalidateAll,
    logout,
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

// Helper hooks for common use cases - all use the same cached data
export function useCurrentUser() {
  const { user, profile, isLoading } = useAuth();
  return {
    user,
    profile,
    isLoading,
    // Legacy compatibility
    loading: isLoading,
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
