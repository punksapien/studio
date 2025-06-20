'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarSeparator,
  SidebarFooter,
  SidebarInset
} from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  LogOut,
  HelpCircle,
  FileText,
  MessageSquareQuote,
  Home,
  Briefcase,
  ShieldCheck,
  LineChart,
  BellRing,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import { useAuth } from '@/contexts/auth-context';

const adminSidebarNavItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, tooltip: "Admin Overview" },
  { title: 'User Management', href: '/admin/users', icon: Users, tooltip: "Manage Users" },
  { title: 'Listing Management', href: '/admin/listings', icon: Briefcase, tooltip: "Manage Listings" },
  { title: 'Appeal Management', href: '/admin/appeals', icon: MessageSquare, tooltip: "Review Listing Appeals" },
  { title: 'Buyer Verification', href: '/admin/verification-queue/buyers', icon: ShieldCheck, tooltip: "Buyer Verifications" },
  { title: 'Seller Verification', href: '/admin/verification-queue/sellers', icon: ShieldCheck, tooltip: "Seller/Listing Verifications" },
  { title: 'Engagement Queue', href: '/admin/engagement-queue', icon: BellRing, tooltip: "Engagement Queue" },
  // { title: 'Conversations', href: '/admin/conversations', icon: MessageSquare, tooltip: "Platform Conversations" },
  { title: 'Analytics', href: '/admin/analytics', icon: LineChart, tooltip: "Platform Analytics" },
  { title: 'Sync Tools', href: '/admin/sync-tools', icon: RefreshCw, tooltip: "Data Synchronization Tools" },
];

const utilityNavItems = [
  { title: 'Help', href: '/help', icon: HelpCircle, tooltip: "Get Help" },
  { title: 'FAQ', href: '/faq', icon: MessageSquareQuote, tooltip: "Frequently Asked Questions" },
  { title: 'Back to Homepage', href: '/', icon: Home, tooltip: "Go to Nobridge Homepage" },
];

// 🚀 ROBUST FIX: Simplified constants for admin layout

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading, refreshAuth } = useAuth();

  // 🚀 ROBUST AUTHENTICATION FIX: Trust middleware authentication
  // Since middleware already validates admin access before reaching this layout,
  // we only need minimal client-side validation for UI state management
  const [isClient, setIsClient] = React.useState(false);
  const [sessionError, setSessionError] = React.useState<string | null>(null);
  const [recoveryAttempts, setRecoveryAttempts] = React.useState(0);

  // Simple admin check - trust that middleware has already validated access
  const isAdmin = profile?.role === 'admin';
  const hasProfile = !!profile;

  // 🚀 ROBUST FIX: Client-side initialization without complex auth checks
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // 🚀 ROBUST FIX: Minimal role-based redirect logic
  // Trust middleware authentication - only redirect if definitely not admin
  React.useEffect(() => {
    // Only run on client and skip while loading or on login page
    if (!isClient || isLoading || pathname === '/admin/login') {
      return;
    }

    // Only redirect if we have a profile and it's definitely not admin
    if (hasProfile && !isAdmin) {
      console.log(`[ADMIN-LAYOUT] Non-admin user detected (role: ${profile?.role}), redirecting to login`);
      router.push('/admin/login');
    } else if (isAdmin) {
      console.log(`[ADMIN-LAYOUT] Admin user verified successfully`);
    }
  }, [isClient, isLoading, pathname, router, isAdmin, hasProfile, profile?.role]);

  // 🚀 ROBUST FIX: Simplified session recovery
  const handleSessionRecovery = async () => {
    if (recoveryAttempts >= 3) return;

    console.log(`[ADMIN-LAYOUT] Attempting session recovery (attempt ${recoveryAttempts + 1}/3)`);
    setRecoveryAttempts(prev => prev + 1);

    try {
      // Try to refresh the auth state
      if (refreshAuth) {
        await refreshAuth();
        setSessionError(null);
        console.log(`[ADMIN-LAYOUT] Session recovery attempt completed`);
      } else {
        // Fallback: force page reload to clear corrupted state
        console.log(`[ADMIN-LAYOUT] No refreshAuth available, forcing page reload`);
        window.location.reload();
      }
    } catch (error) {
      console.error(`[ADMIN-LAYOUT] Session recovery failed:`, error);
      setSessionError(`Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleForceLogin = () => {
    console.log(`[ADMIN-LAYOUT] Force login requested`);
    // Clear any corrupted auth state and redirect
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    }
    router.push('/admin/login');
  };

  // 🚀 ROBUST FIX: Simple loading state - trust middleware authentication
  if (!isClient || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Logo size="2xl" forceTheme="light" />
        <div className="flex items-center gap-2 mt-4">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <p className="text-lg text-muted-foreground">Loading admin dashboard...</p>
        </div>
        {sessionError && (
          <div className="mt-4 text-center">
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md max-w-md text-center">
              <p className="text-sm text-yellow-800">{sessionError}</p>
            </div>
            <div className="flex gap-2 justify-center mt-3">
              <Button
                onClick={handleSessionRecovery}
                disabled={recoveryAttempts >= 3}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recover Session ({recoveryAttempts}/3)
              </Button>
              <Button onClick={handleForceLogin} size="sm">
                Force Re-login
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 🚀 ROBUST FIX: Only show access denied if we have profile data confirming non-admin role
  // Trust middleware - if user reached here, they passed middleware auth checks
  if (hasProfile && !isAdmin && pathname !== '/admin/login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Logo size="2xl" forceTheme="light" />
        <div className="flex items-center gap-2 mt-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-lg text-muted-foreground">Access Denied</p>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          You are not an administrator. Current role: {profile?.role || 'unknown'}
        </p>
        <Button onClick={handleForceLogin} className="mt-4">Go to Admin Login</Button>
      </div>
    );
  }

  // Allow login page to render without the layout
  if (pathname === '/admin/login') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background py-12">
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <Sidebar variant="sidebar" className="h-screen sticky top-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <Logo size="lg" forceTheme="light" />
              <SidebarTrigger className="md:hidden" />
            </div>
            {/* Session recovery indicator */}
            {recoveryAttempts > 0 && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  Session Recovered {recoveryAttempts > 1 ? `(${recoveryAttempts} attempts)` : ''}
                </Badge>
              </div>
            )}
          </SidebarHeader>
          <SidebarContent className="flex-grow">
            <SidebarMenu>
              {adminSidebarNavItems.map((item) => {
                const IconComponent = item.icon;
                const iconProps = { className:"h-5 w-5 mr-3 shrink-0" };
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))}
                    tooltip={{ children: item.tooltip, className: "bg-primary text-primary-foreground" }}
                  >
                    <Link href={item.href} className="flex items-center">
                      <IconComponent {...iconProps} />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )})}
            </SidebarMenu>
            <SidebarSeparator className="my-4" />
            <SidebarMenu>
              {utilityNavItems.map((item) => {
                const IconComponent = item.icon;
                const iconProps = { className:"h-5 w-5 mr-3 shrink-0" };
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={{ children: item.tooltip, className: "bg-primary text-primary-foreground" }}
                  >
                     <Link href={item.href} className="flex items-center">
                      <IconComponent {...iconProps} />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )})}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <LogoutButton fullWidth />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-grow flex flex-col overflow-hidden">
           <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
              <Logo size="lg" forceTheme="light" />
              <SidebarTrigger/>
           </header>
           <div className="p-6 md:p-8 lg:p-10 flex-1 overflow-y-auto">
            {children}
           </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
