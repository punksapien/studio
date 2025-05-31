
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  SidebarFooter
} from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BellRing,
  LogOut,
  HelpCircle,
  FileText,
  MessageSquareQuote,
  Home,
} from 'lucide-react';
import { NobridgeIcon, NobridgeIconType } from '@/components/ui/nobridge-icon';

const adminSidebarNavItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, tooltip: "Admin Overview" },
  { title: 'User Management', href: '/admin/users', icon: Users, tooltip: "Manage Users" },
  { title: 'Listing Management', href: '/admin/listings', icon: NobridgeIcon, iconProps: { icon: 'business-listing' as NobridgeIconType }, tooltip: "Manage Listings" },
  { title: 'Buyer Verification', href: '/admin/verification-queue/buyers', icon: NobridgeIcon, iconProps: { icon: 'verification' as NobridgeIconType }, tooltip: "Buyer Verifications" },
  { title: 'Seller/Listing Verification', href: '/admin/verification-queue/sellers', icon: NobridgeIcon, iconProps: {icon: 'due-diligence' as NobridgeIconType }, tooltip: "Seller/Listing Verifications" },
  { title: 'Engagement Queue', href: '/admin/engagement-queue', icon: BellRing, tooltip: "Engagement Queue" },
  { title: 'Conversations', href: '/admin/conversations', icon: MessageSquare, tooltip: "Platform Conversations" },
  { title: 'Analytics', href: '/admin/analytics', icon: NobridgeIcon, iconProps: { icon: 'growth' as NobridgeIconType }, tooltip: "Platform Analytics" },
];

const utilityNavItems = [
  { title: 'Help', href: '/help', icon: HelpCircle, tooltip: "Get Help" },
  { title: 'Refer Docs', href: '/docs', icon: NobridgeIcon, iconProps: {icon: 'documents' as NobridgeIconType}, tooltip: "View Documentation" },
  { title: 'FAQ', href: '/faq', icon: MessageSquareQuote, tooltip: "Frequently Asked Questions" },
  { title: 'Back to Homepage', href: '/', icon: Home, tooltip: "Go to Nobridge Homepage" },
];

const isAdminAuthenticated = true; 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (!isAdminAuthenticated && pathname !== '/admin/login') {
    if (typeof window !== 'undefined') {
      console.warn("Admin not authenticated, redirect to /admin/login would happen here via router.");
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Logo size="2xl" />
        <p className="mt-4 text-lg text-muted-foreground">Access Denied. Redirecting to login...</p>
      </div>
    );
  }

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
        <Sidebar variant="sidebar" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <Logo size="lg" />
              <SidebarTrigger className="md:hidden" />
            </div>
          </SidebarHeader>
          <SidebarContent className="flex-grow">
            <SidebarMenu>
              {adminSidebarNavItems.map((item) => {
                const IconComponent = item.icon; // Lucide or NobridgeIcon
                const iconProps = item.iconProps ? { ...item.iconProps, size: 'sm' as const, className:"mr-3 shrink-0" } : { className:"h-5 w-5 mr-3 shrink-0" };
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
                const iconProps = item.iconProps ? { ...item.iconProps, size: 'sm' as const, className:"mr-3 shrink-0" } : { className:"h-5 w-5 mr-3 shrink-0" };
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
            <Button variant="outline" className="w-full text-destructive-foreground bg-destructive hover:bg-destructive/90">
              <LogOut className="h-5 w-5 mr-2 shrink-0" />
              <span className="truncate">Logout Admin</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-grow flex flex-col overflow-auto">
           <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10"> 
              <Logo size="lg" />
              <SidebarTrigger/>
           </header>
           <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto"> 
            {children}
           </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
