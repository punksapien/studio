import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Custom hook for accessing authenticated user data with automatic fetching
 * This prevents redundant API calls by using a centralized store
 */
export function useAuthUser() {
  const { user, profile, isLoading, error, fetchUser } = useAuthStore();

  useEffect(() => {
    // Fetch user data on mount if not already loaded
    if (!user && !isLoading && !error) {
      fetchUser().catch(err => {
        console.error('[USE-AUTH-USER] Failed to fetch user:', err);
      });
    }
  }, []); // Only run on mount

  return {
    user,
    profile,
    isLoading,
    error,
    isAuthenticated: !!user && !!profile,
    refetch: fetchUser,
  };
}

/**
 * Hook specifically for role-based pages
 */
export function useRequiredRole(requiredRole: 'buyer' | 'seller' | 'admin') {
  const { user, profile, isLoading, error } = useAuthUser();

  const hasRole = profile?.role === requiredRole;
  const roleError = !isLoading && profile && !hasRole
    ? `This page is for ${requiredRole}s only`
    : null;

  return {
    user,
    profile,
    isLoading,
    error: error || roleError,
    hasRole,
    isAuthenticated: !!user && !!profile,
  };
}
