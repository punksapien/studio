import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: 'buyer' | 'seller' | 'admin';
  verification_status: string;
  is_email_verified: boolean;
  is_onboarding_completed: boolean;
  avatar_url?: string;
}

interface AuthStore {
  // State
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
  fetchPromise: Promise<any> | null;

  // Actions
  fetchUser: () => Promise<{ user: User | null; profile: Profile | null }>;
  setUser: (user: User | null, profile: Profile | null) => void;
  clearAuth: () => void;
  reset: () => void;
}

// Cache duration in milliseconds (30 seconds)
const CACHE_DURATION = 30000;

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      isLoading: false,
      error: null,
      lastFetch: null,
      fetchPromise: null,

      // Fetch user with deduplication and caching
      fetchUser: async () => {
        const state = get();
        const now = Date.now();

        // Return cached data if fresh
        if (state.lastFetch && now - state.lastFetch < CACHE_DURATION && state.user) {
          console.log('[AUTH-STORE] Returning cached user data');
          return { user: state.user, profile: state.profile };
        }

        // If already fetching, return existing promise (deduplication)
        if (state.fetchPromise) {
          console.log('[AUTH-STORE] Request already in progress, returning existing promise');
          return state.fetchPromise;
        }

        // Create new fetch promise
        const fetchPromise = (async () => {
          try {
            set({ isLoading: true, error: null });
            console.log('[AUTH-STORE] Fetching fresh user data');

            const response = await fetch('/api/auth/current-user', {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              if (response.status === 401) {
                // User not authenticated
                set({
                  user: null,
                  profile: null,
                  isLoading: false,
                  lastFetch: now,
                  fetchPromise: null,
                });
                return { user: null, profile: null };
              }

              throw new Error(`Failed to fetch user: ${response.status}`);
            }

            const data = await response.json();

            if (data.user && data.profile) {
              set({
                user: data.user,
                profile: data.profile,
                isLoading: false,
                error: null,
                lastFetch: now,
                fetchPromise: null,
              });
              console.log('[AUTH-STORE] User data fetched successfully');
              return { user: data.user, profile: data.profile };
            } else {
              set({
                user: null,
                profile: null,
                isLoading: false,
                lastFetch: now,
                fetchPromise: null,
              });
              return { user: null, profile: null };
            }
          } catch (error) {
            console.error('[AUTH-STORE] Error fetching user:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch user',
              fetchPromise: null,
            });
            throw error;
          }
        })();

        set({ fetchPromise });
        return fetchPromise;
      },

      // Set user manually (for login/logout)
      setUser: (user, profile) => {
        set({
          user,
          profile,
          lastFetch: Date.now(),
          error: null,
        });
      },

      // Clear auth state
      clearAuth: () => {
        set({
          user: null,
          profile: null,
          lastFetch: null,
          error: null,
          fetchPromise: null,
        });
      },

      // Reset store to initial state
      reset: () => {
        set({
          user: null,
          profile: null,
          isLoading: false,
          error: null,
          lastFetch: null,
          fetchPromise: null,
        });
      },
    }),
    {
      name: 'auth-store',
    }
  )
);
