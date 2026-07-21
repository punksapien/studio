'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
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
  MessageSquare,
  Settings,
  Bell,
  ShoppingCart,
  Home,
  Loader2,
  Sparkles
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import {
  BUYER_UNVERIFIED_ALLOWED_PREFIXES,
  isUnverifiedAllowedPath,
  isBuyerLockdownFlagOn,
} from '@/lib/lockdown';

// Flat buyer theme: square corners and no shadows everywhere in the buyer area.
// Applied via a class on <body> so portaled elements (dialogs, dropdowns,
// tooltips) are covered as well.
const sidebarStyles = `
  body.buyer-flat *,
  body.buyer-flat *::before,
  body.buyer-flat *::after {
    border-radius: 0 !important;
  }

  body.buyer-flat [class*="shadow"] {
    box-shadow: none !important;
  }
`;

const buyerSidebarNavItems = [
  { title: 'Overview', href: '/dashboard', icon: LayoutDashboard, tooltip: "Dashboard Overview" },
  { title: 'My Inquiries', href: '/dashboard/inquiries', icon: MessageSquare, tooltip: "View Inquiries" },
  // { title: 'Messages', href: '/dashboard/messages', icon: Mail, tooltip: "My Conversations" },
  { title: 'Notifications', href: '/dashboard/notifications', icon: Bell, tooltip: "My Notifications" },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings, tooltip: "Account Settings" },
];

const utilityNavItems = [
  { title: 'Browse Marketplace', href: '/marketplace', icon: ShoppingCart, tooltip: "Browse Marketplace" },
];

const onboardingNavItem = {
  title: 'Onboarding',
  href: '/dashboard/onboarding',
  icon: Sparkles,
  tooltip: 'Getting started',
};

// Pre-verification, these are the only interactive destinations.
const ALWAYS_UNLOCKED_TITLES = new Set(['Onboarding', 'Settings']);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading } = useAuth();
  const [inquiryCount, setInquiryCount] = React.useState(0);

  // Lock state: only ever lock when a buyer profile is loaded and not verified.
  // When profile is null (middleware-trusted session) we never lock.
  const lockdownEnabled = isBuyerLockdownFlagOn();
  const isBuyer = profile?.role === 'buyer';
  const isUnverified = lockdownEnabled && isBuyer && profile?.verification_status !== 'verified';

  // Build the nav for the current state. Onboarding is prepended only when locked.
  const navItems = isUnverified
    ? [onboardingNavItem, ...buyerSidebarNavItems]
    : buyerSidebarNavItems;

  // When unverified and sitting on a locked deep link, bounce to Onboarding.
  const isOnAllowedPath =
    !isUnverified ||
    isUnverifiedAllowedPath(pathname, BUYER_UNVERIFIED_ALLOWED_PREFIXES);
  const shouldRedirectToOnboarding =
    isUnverified && !isOnAllowedPath && !pathname.startsWith('/dev-preview');

  React.useEffect(() => {
    if (shouldRedirectToOnboarding) {
      router.replace('/dashboard/onboarding');
    }
  }, [shouldRedirectToOnboarding, router]);

  // Flat buyer theme: covers portaled UI (dialogs, dropdowns, tooltips) too
  React.useEffect(() => {
    document.body.classList.add('buyer-flat');
    return () => document.body.classList.remove('buyer-flat');
  }, []);

  // Fetch inquiry count for notification badge
  React.useEffect(() => {
    const fetchInquiryCount = async () => {
      try {
        const response = await fetch('/api/inquiries?role=buyer&limit=100');
        const data = await response.json();

        if (response.ok && data.inquiries) {
          setInquiryCount(data.inquiries.length);
        }
      } catch (error) {
        console.warn('Failed to fetch inquiry count for sidebar badge:', error);
      }
    };

    fetchInquiryCount();
  }, []);

  // Compute active state for a nav item. General rule: exact match for the
  // Overview route, or startsWith with a path boundary for sub-paths.
  const getIsActive = (href: string, title?: string) => {
    const overviewPath = '/dashboard';

    if (href === overviewPath) {
      return pathname === overviewPath;
    }
    // Profile is now reached via Settings, so Settings stays active on the profile page too.
    if (title === 'Settings') return pathname.startsWith('/dashboard/settings') || pathname.startsWith('/dashboard/profile');
    return pathname.startsWith(href) && (pathname.length === href.length || pathname[href.length] === '/');
  };

  // Show loading state while fetching user data - but don't block access
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  // If we have profile data, check role-based access
  // If no profile data, trust middleware and render dashboard (middleware handles auth)
  if (profile && profile.role !== 'buyer') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Logo size="2xl" forceTheme="light" />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Access Denied</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          You must be logged in as a buyer to view this page.
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Your current role: {profile.role}
        </p>
        <Button asChild className="mt-4">
          <Link href={profile.role === 'admin' ? '/admin' : '/seller-dashboard'}>
            Go to {profile.role === 'admin' ? 'Admin' : 'Seller'} Dashboard
          </Link>
        </Button>
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
            </SidebarHeader>
            <SidebarContent className="flex-grow px-4 pb-6 bg-white">
              <div className="pb-4">
                <SidebarSeparator className="bg-gray-200" />
              </div>
              <SidebarMenu className="space-y-1">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const iconProps = { className: "h-4 w-4 mr-3 shrink-0" };
                  const isActive = getIsActive(item.href, item.title);
                  const isLocked = isUnverified && !ALWAYS_UNLOCKED_TITLES.has(item.title);

                  // Locked items keep the exact same size/position but are
                  // non-interactive: no <Link>, muted styling, a lock affordance.
                  if (isLocked) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          aria-disabled="true"
                          tooltip={{ children: 'Available after verification', className: "bg-gray-800 text-white border-gray-600" }}
                          className="h-11 rounded-none px-4 text-gray-400 cursor-not-allowed opacity-60 hover:bg-transparent hover:text-gray-400"
                        >
                          <span className="flex items-center w-full">
                            <IconComponent {...iconProps} />
                            <span className="truncate font-medium">{item.title}</span>
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

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
                        {item.title === 'My Inquiries' && inquiryCount > 0 && (
                          <Badge variant="secondary" className="ml-auto">{inquiryCount}</Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )})}
              </SidebarMenu>

              <div className="py-4">
                <SidebarSeparator className="bg-gray-200" />
              </div>

              <SidebarMenu className="space-y-1">
                {utilityNavItems.map((item) => {
                  const IconComponent = item.icon;
                  const iconProps = { className: "h-4 w-4 mr-3 shrink-0" };
                  const isActive = getIsActive(item.href, item.title);

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
           <header className="md:hidden flex items-center justify-between p-4 border-b bg-white/80 sticky top-0 z-10">
              <Logo size="lg" forceTheme="light" />
              <SidebarTrigger className="rounded-none hover:bg-gray-100 transition-colors duration-200"/>
           </header>
           <div className="px-4 pb-4 pt-2 md:px-6 md:pb-6 md:pt-6 flex-1 min-h-0 overflow-hidden flex flex-col bg-brand-dark-blue">
            {shouldRedirectToOnboarding ? (
              <div className="flex flex-1 flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="mt-4 text-lg text-white/70">Redirecting...</p>
              </div>
            ) : (
              children
            )}
           </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

