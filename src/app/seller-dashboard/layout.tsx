
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/logo'; // Assuming Logo uses Nobridge
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  UserCircle,
  Briefcase,
  MessageSquare,
  Settings,
  LogOut,
  ShieldCheck,
  Bell,
  PlusCircle
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

// Placeholder for current user role - in a real app, this would come from session
const currentUserRole: UserRole = 'seller';

const sellerSidebarNavItems = [
  { title: 'Overview', href: '/seller-dashboard', icon: LayoutDashboard },
  { title: 'My Profile', href: '/seller-dashboard/profile', icon: UserCircle },
  { title: 'My Listings', href: '/seller-dashboard/listings', icon: Briefcase },
  { title: 'Create Listing', href: '/seller-dashboard/listings/create', icon: PlusCircle },
  { title: 'My Inquiries', href: '/seller-dashboard/inquiries', icon: MessageSquare },
  { title: 'Verification', href: '/seller-dashboard/verification', icon: ShieldCheck },
  { title: 'Notifications', href: '/seller-dashboard/notifications', icon: Bell },
  { title: 'Settings', href: '/seller-dashboard/settings', icon: Settings },
];

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // In a real app, redirect if not authenticated or not a seller
  if (currentUserRole !== 'seller') {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Logo size="2xl" />
        <p className="mt-4 text-lg text-muted-foreground">Access Denied or incorrect role.</p>
        <Button asChild className="mt-4"><Link href="/">Go to Homepage</Link></Button>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-brand-light-gray/60">
        <SidebarHeader className="p-4 border-b border-brand-light-gray/60">
          <div className="flex items-center justify-between">
            <Logo size="lg" />
            <SidebarTrigger className="md:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {sellerSidebarNavItems.map((item) => {
              const overviewPath = '/seller-dashboard';
              const myListingsPath = '/seller-dashboard/listings';
              const createListingPath = '/seller-dashboard/listings/create';

              let itemIsActive: boolean;

              if (item.href === overviewPath) {
                itemIsActive = pathname === overviewPath;
              } else if (item.href === createListingPath) {
                itemIsActive = pathname === createListingPath;
              } else if (item.href === myListingsPath) {
                itemIsActive = (pathname === myListingsPath) ||
                               (pathname.startsWith(myListingsPath + '/') && pathname !== createListingPath && !pathname.includes('/edit'));
              } else if (item.href.includes('[listingId]/edit')) {
                 itemIsActive = pathname.startsWith(myListingsPath + '/') && pathname.endsWith('/edit');
              }
              else {
                itemIsActive = pathname === item.href || pathname.startsWith(item.href + '/');
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={itemIsActive}
                    tooltip={{ children: item.title, className: "bg-primary text-primary-foreground" }}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <div className="p-4 border-t border-brand-light-gray/60 mt-auto">
          <SidebarMenuButton variant="outline" className="w-full text-destructive-foreground bg-destructive hover:bg-destructive/90">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </SidebarMenuButton>
        </div>
      </Sidebar>
      <SidebarInset className="flex-grow flex flex-col"> {/* Removed pt-20, ensure flex-grow */}
        <div className="p-4 md:p-6 lg:p-8 flex-grow flex flex-col">
          <header className="md:hidden flex items-center justify-between mb-4 p-2 border rounded-md bg-card">
            <Logo size="lg" />
            <SidebarTrigger />
          </header>
          <div className="flex-grow">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
