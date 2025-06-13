'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Settings, X } from 'lucide-react';
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
}

export function DebugState() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const fetchDebugInfo = async () => {
    setIsLoading(true);
    try {
      const profile = await auth.getCurrentUserProfile();
      const { data: sessionData } = await auth.getCurrentUserAndSession();
      const session = sessionData.session;

      setDebugInfo({
        isAuthenticated: !!session?.user,
        userId: session?.user?.id,
        role: profile?.role,
        email: session?.user?.email,
        isEmailVerified: profile?.is_email_verified,
        onboardingComplete: profile?.onboarding_complete,
        profileId: profile?.id,
        pathname: pathname,
      });
    } catch (error) {
      console.error('[DebugState] Error fetching state:', error);
      setDebugInfo({ isAuthenticated: false, pathname });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, [pathname]); // Refetch when path changes

  // Subscribe to auth state changes for real-time updates
  useEffect(() => {
    const { data: authListener } = auth.onAuthStateChange(() => {
      fetchDebugInfo();
    });

    // Poll every 3 seconds for extra freshness (catches edge cases)
    const interval = setInterval(fetchDebugInfo, 3000);

    return () => {
      authListener?.subscription?.unsubscribe();
      clearInterval(interval);
    };
  }, []);

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
          <CardTitle className="text-lg">Dev State</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-xs">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2 font-mono">
              {debugInfo && Object.entries(debugInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center border-b border-border/50 pb-1">
                  <span className="font-semibold text-muted-foreground">{key}:</span>
                  <span className={`text-right ${typeof value === 'boolean' ? (value ? 'text-green-500' : 'text-red-500') : 'text-foreground'}`}>
                    {JSON.stringify(value, null, 2) ?? 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
