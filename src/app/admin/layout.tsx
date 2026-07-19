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
  FileText,
  Home,
  Briefcase,
  ShieldCheck,
  LineChart,
  BellRing,
  RefreshCw,
  AlertTriangle,
  Mail,
  MailWarning,
  MailCheck,
  ChevronDown,
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import { useAuth } from '@/contexts/auth-context';

// Flat admin theme: square corners and no shadows everywhere in the admin area.
// Applied via a class on <body> so portaled elements (dialogs, dropdowns,
// tooltips) are covered as well.
const sidebarStyles = `
  body.admin-flat *,
  body.admin-flat *::before,
  body.admin-flat *::after {
    border-radius: 0 !important;
  }

  body.admin-flat [class*="shadow"] {
    box-shadow: none !important;
  }
`;

const adminSidebarNavGroups = [
  {
    label: 'Management',
    items: [
      { title: 'User Management', href: '/admin/users', icon: Users, tooltip: "Manage Users" },
      { title: 'Listing Management', href: '/admin/listings', icon: Briefcase, tooltip: "Manage Listings" },
      { title: 'Appeal Management', href: '/admin/appeals', icon: MessageSquare, tooltip: "Review Listing Appeals" },
      { title: 'Engagement Queue', href: '/admin/engagement-queue', icon: BellRing, tooltip: "Engagement Queue" },
    ],
  },
  {
    label: 'Verification',
    items: [
      { title: 'Buyer Verification', href: '/admin/verification-queue/buyers', icon: ShieldCheck, tooltip: "Buyer Verifications" },
      { title: 'Seller Verification', href: '/admin/verification-queue/sellers', icon: ShieldCheck, tooltip: "Seller/Listing Verifications" },
    ],
  },
  {
    label: 'General',
    items: [
      { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, tooltip: "Admin Overview" },
      { title: 'Analytics', href: '/admin/analytics', icon: LineChart, tooltip: "Platform Analytics" },
    ],
  },
  {
    label: 'Email',
    items: [
      { title: 'Email Logs', href: '/admin/email-logs', icon: Mail, tooltip: "Email Delivery Tracking" },
      { title: 'Email Recovery', href: '/admin/email-recovery', icon: MailWarning, tooltip: "Email Recovery Tool" },
      { title: 'Email Test', href: '/admin/email-test', icon: MailCheck, tooltip: "Send Test Emails" },
    ],
  },
  {
    label: 'Others',
    items: [
      { title: 'Blog Management', href: '/admin/blog', icon: FileText, tooltip: "Manage Blog Posts" },
      { title: 'Sync Tools', href: '/admin/sync-tools', icon: RefreshCw, tooltip: "Data Synchronization Tools" },
    ],
  },
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
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Simple admin check - trust that middleware has already validated access
  const isAdmin = profile?.role === 'admin';
  const hasProfile = !!profile;

  // 🚀 ROBUST FIX: Client-side initialization without complex auth checks
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Flat admin theme: covers portaled UI (dialogs, dropdowns, tooltips) too
  React.useEffect(() => {
    document.body.classList.add('admin-flat');
    return () => document.body.classList.remove('admin-flat');
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
    <SidebarProvider defaultOpen style={{ '--sidebar-width': '19rem' } as React.CSSProperties}>
      <style dangerouslySetInnerHTML={{ __html: sidebarStyles }} />
      <div className="flex min-h-screen w-full bg-gray-50/30">
        <Sidebar variant="sidebar" className="h-screen sticky top-0 shrink-0 border-r-0 bg-white text-foreground">
          <div className="flex h-full flex-col bg-white border-r border-gray-200">
            <SidebarHeader className="h-[88px] shrink-0 justify-center px-6 py-0 bg-white">
              <div className="flex items-center justify-between">
                <Logo size="lg" forceTheme="light" />
                <SidebarTrigger className="md:hidden rounded-none hover:bg-gray-100 transition-colors duration-200" />
              </div>
              {/* Session recovery indicator */}
              {recoveryAttempts > 0 && (
                <div className="mt-3">
                  <Badge variant="outline" className="text-xs border-emerald-400/30 text-emerald-600 bg-emerald-50">
                    Session Recovered {recoveryAttempts > 1 ? `(${recoveryAttempts} attempts)` : ''}
                  </Badge>
                </div>
              )}
            </SidebarHeader>
            <SidebarContent className="flex-grow px-4 pb-6 bg-white">
              <div className="pb-4">
                <SidebarSeparator className="bg-gray-200" />
              </div>
              {adminSidebarNavGroups.map((group, groupIndex) => (
                <React.Fragment key={group.label}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    className={`flex w-full items-center justify-between px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 transition-colors hover:text-gray-600 ${groupIndex === 0 ? '' : 'pt-4'}`}
                  >
                    {group.label}
                    <ChevronDown className={`h-3 w-3 shrink-0 transition-transform duration-200 ${collapsedGroups[group.label] ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsedGroups[group.label] && (
                  <SidebarMenu className="space-y-1">
                    {group.items.map((item) => {
                      const IconComponent = item.icon;
                      const iconProps = { className: "h-4 w-4 mr-3 shrink-0" };
                      const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

                      return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={{ children: item.tooltip, className: "bg-gray-800 text-white border-gray-600" }}
                          className={`
                            h-11 rounded-none px-4 transition-colors duration-200
                            focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-white
                            ${isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            }
                          `}
                        >
                          <Link href={item.href} className="flex items-center w-full">
                            <IconComponent {...iconProps} />
                            <span className="truncate font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )})}
                  </SidebarMenu>
                  )}
                </React.Fragment>
              ))}
            </SidebarContent>
            <SidebarFooter className="p-4 pb-4 md:pb-6 bg-white">
              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground flex items-center justify-start"
                >
                  <Link href="/">
                    <Home className="h-5 w-5 mr-2" />
                    Back to Homepage
                  </Link>
                </Button>
                <LogoutButton fullWidth className="justify-start" />
              </div>
            </SidebarFooter>
          </div>
        </Sidebar>
        <SidebarInset className="flex-grow min-w-0 h-screen flex flex-col overflow-hidden bg-white">
           <header className="md:hidden flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <Logo size="lg" forceTheme="light" />
              <SidebarTrigger className="rounded-none hover:bg-gray-100 transition-colors duration-200"/>
           </header>
           <div className="px-4 pb-4 pt-2 md:px-6 md:pb-6 md:pt-6 flex-1 min-h-0 overflow-hidden flex flex-col bg-brand-dark-blue">
            {children}
           </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
