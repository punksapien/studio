'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import {
  LayoutDashboard,
  UserCircle,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  PlusCircle,
  HelpCircle,
  FileText,
  MessageSquareQuote,
  Home,
  Mail,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import type { UserRole } from '@/lib/types';
import LogoutButton from '@/components/auth/LogoutButton';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const sellerSidebarNavItems = [
  { title: 'Overview', href: '/seller-dashboard', icon: LayoutDashboard, tooltip: "Dashboard Overview" },
  { title: 'My Profile', href: '/seller-dashboard/profile', icon: UserCircle, tooltip: "Manage Profile" },
  { title: 'My Listings', href: '/seller-dashboard/listings', icon: Briefcase, tooltip: "Manage Listings" },
  { title: 'Create Listing', href: '/seller-dashboard/listings/create', icon: PlusCircle, tooltip: "Create New Listing" },
  { title: 'My Inquiries', href: '/seller-dashboard/inquiries', icon: MessageSquare, tooltip: "View Inquiries" },
  // { title: 'Messages', href: '/seller-dashboard/messages', icon: Mail, tooltip: "My Conversations" },
  { title: 'Verification', href: '/seller-dashboard/verification', icon: ShieldCheck, tooltip: "Account/Listing Verification" },
  { title: 'Notifications', href: '/seller-dashboard/notifications', icon: Bell, tooltip: "My Notifications" },
  { title: 'Settings', href: '/seller-dashboard/settings', icon: Settings, tooltip: "Account Settings" },
];

const utilityNavItems = [
  { title: 'Help', href: '/help', icon: HelpCircle, tooltip: "Get Help" },
  { title: 'FAQ', href: '/faq', icon: MessageSquareQuote, tooltip: "Frequently Asked Questions" },
  { title: 'Back to Homepage', href: '/', icon: Home, tooltip: "Go to Homepage" },
];

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, isLoading, error } = useAuth();
  const [inquiryCount, setInquiryCount] = React.useState(0);

  // Fetch inquiry count for notification badge
  React.useEffect(() => {
    const fetchInquiryCount = async () => {
      if (!profile || profile.role !== 'seller') return;

      try {
        const response = await fetch('/api/inquiries?role=seller&limit=100');
        const data = await response.json();

        if (response.ok && data.inquiries) {
          setInquiryCount(data.inquiries.length);
        }
      } catch (error) {
        console.warn('Failed to fetch inquiry count for sidebar badge:', error);
      }
    };

    fetchInquiryCount();
  }, [profile]);

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
  if (profile && profile.role !== 'seller') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Logo size="2xl" forceTheme="light"/>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          You must be logged in as a seller to view this page.
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Your current role: {profile.role}
        </p>
        <Button asChild className="mt-4">
          <Link href={profile.role === 'admin' ? '/admin' : '/dashboard'}>
            Go to {profile.role === 'admin' ? 'Admin' : 'Buyer'} Dashboard
          </Link>
        </Button>
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
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {sellerSidebarNavItems.map((item) => {
                const IconComponent = item.icon;
                const iconProps = { className:"h-5 w-5 mr-3 shrink-0" };

                const overviewPath = '/seller-dashboard';
                let itemIsActive = pathname === item.href;
                if (item.href === overviewPath && pathname === overviewPath) {
                    itemIsActive = true;
                } else if (item.href !== overviewPath && pathname.startsWith(item.href) && (pathname.length === item.href.length || pathname[item.href.length] === '/')) {
                    itemIsActive = true;
                }

                if (item.title === "My Listings") {
                    itemIsActive = pathname.startsWith("/seller-dashboard/listings") && !pathname.startsWith("/seller-dashboard/listings/create");
                }
                if (item.title === "Create Listing") {
                    itemIsActive = pathname === "/seller-dashboard/listings/create";
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={itemIsActive}
                      tooltip={{ children: item.tooltip, className: "bg-primary text-primary-foreground" }}
                    >
                      <Link href={item.href} className="flex items-center">
                        <IconComponent {...iconProps} />
                        <span className="truncate">{item.title}</span>
                        {/* Show red notification badge for My Inquiries */}
                        {item.title === 'My Inquiries' && inquiryCount > 0 && (
                          <Badge
                            className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 rounded-full flex items-center justify-center"
                          >
                            {inquiryCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
           <header className="md:hidden flex items-center justify-between p-2 border-b bg-card sticky top-0 z-10">
              <Logo size="lg" forceTheme="light" />
              <SidebarTrigger/>
            </header>
            <div className="p-6 md:p-8 lg:p-10 flex-grow flex flex-col overflow-y-auto">
              {children}
            </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
