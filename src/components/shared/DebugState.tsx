'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/auth';
import { useRealtimeProfile } from '@/hooks/use-cached-profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Settings, X, RefreshCw } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface DebugInfo {
  isAuthenticated: boolean;
  userId?: string;
  role?: string;
  email?: string;
  isEmailVerified?: boolean;
  onboardingComplete?: boolean;
  profileId?: string;
  pathname: string;
  cacheStatus: 'fresh' | 'stale' | 'revalidating';
  lastUpdated?: string;
}

export function DebugState() {
  const [sessionInfo, setSessionInfo] = useState<{ userId?: string; email?: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Use the smart cached profile hook
  const { profile, error, isLoading, refreshProfile } = useRealtimeProfile();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only fetch session info once on mount (this rarely changes)
  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        const { data: sessionData } = await auth.getCurrentUserAndSession();
        const session = sessionData.session;
        setSessionInfo({
          userId: session?.user?.id,
          email: session?.user?.email,
        });
      } catch (error) {
        console.error('[DebugState] Error fetching session:', error);
      }
    };

    fetchSessionInfo();
  }, []); // Empty deps - only run once

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    // Also refresh session info
    try {
      const { data: sessionData } = await auth.getCurrentUserAndSession();
      const session = sessionData.session;
      setSessionInfo({
        userId: session?.user?.id,
        email: session?.user?.email,
      });
    } catch (error) {
      console.error('[DebugState] Error refreshing session:', error);
    }
    setIsRefreshing(false);
  };

  // Build debug info from cached data
  const debugInfo: DebugInfo = {
    isAuthenticated: !!sessionInfo?.userId,
    userId: sessionInfo?.userId,
    role: profile?.role,
    email: sessionInfo?.email,
    isEmailVerified: profile?.is_email_verified,
    onboardingComplete: profile?.onboarding_complete,
    profileId: profile?.id,
    pathname: pathname,
    cacheStatus: isLoading ? 'revalidating' : (profile ? 'fresh' : 'stale'),
    lastUpdated: profile ? new Date().toLocaleTimeString() : undefined,
  };

  // Only render in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <Button size="icon" variant="default" onClick={() => setIsOpen(true)} className="rounded-full shadow-lg">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-full">
      <Card className="shadow-2xl border-2 border-primary/20 bg-background/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-lg">Dev State (Smart Cached)</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleManualRefresh}
              className="h-7 w-7"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-xs">
          {error ? (
            <div className="text-red-500 p-4">
              Error loading profile: {error.message}
            </div>
          ) : (
            <div className="space-y-2 font-mono">
              {Object.entries(debugInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center border-b border-border/50 pb-1">
                  <span className="font-semibold text-muted-foreground">{key}:</span>
                  <span className={`text-right ${
                    key === 'cacheStatus'
                      ? value === 'fresh'
                        ? 'text-green-500'
                        : value === 'revalidating'
                          ? 'text-yellow-500'
                          : 'text-red-500'
                      : typeof value === 'boolean'
                        ? (value ? 'text-green-500' : 'text-red-500')
                        : 'text-foreground'
                  }`}>
                    {JSON.stringify(value, null, 2) ?? 'N/A'}
                  </span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                <p>🚀 Using SWR smart caching</p>
                <p>• Auto-refresh: 30s</p>
                <p>• Deduping: 5s window</p>
                <p>• Focus revalidation: ON</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
