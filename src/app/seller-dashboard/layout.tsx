
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
  SidebarTrigger,
  SidebarSeparator,
  SidebarFooter
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
  Mail 
} from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { NobridgeIcon, NobridgeIconType } from '@/components/ui/nobridge-icon';


const currentUserRole: UserRole | null = 'seller'; 

const sellerSidebarNavItems = [
  { title: 'Overview', href: '/seller-dashboard', icon: LayoutDashboard, tooltip: "Dashboard Overview" },
  { title: 'My Profile', href: '/seller-dashboard/profile', icon: UserCircle, tooltip: "Manage Profile" },
  { title: 'My Listings', href: '/seller-dashboard/listings', icon: NobridgeIcon, iconProps: { icon: 'business-listing' as NobridgeIconType }, tooltip: "Manage Listings" },
  { title: 'Create Listing', href: '/seller-dashboard/listings/create', icon: PlusCircle, tooltip: "Create New Listing" },
  { title: 'My Inquiries', href: '/seller-dashboard/inquiries', icon: MessageSquare, tooltip: "View Inquiries" },
  { title: 'Messages', href: '/seller-dashboard/messages', icon: Mail, tooltip: "My Conversations" }, 
  { title: 'Verification', href: '/seller-dashboard/verification', icon: NobridgeIcon, iconProps: { icon: 'verification' as NobridgeIconType }, tooltip: "Account/Listing Verification" },
  { title: 'Notifications', href: '/seller-dashboard/notifications', icon: Bell, tooltip: "My Notifications" },
  { title: 'Settings', href: '/seller-dashboard/settings', icon: Settings, tooltip: "Account Settings" },
];

const utilityNavItems = [
  { title: 'Help', href: '/help', icon: HelpCircle, tooltip: "Get Help" },
  { title: 'Refer Docs', href: '/docs', icon: NobridgeIcon, iconProps: {icon: 'documents' as NobridgeIconType}, tooltip: "View Documentation" },
  { title: 'FAQ', href: '/faq', icon: MessageSquareQuote, tooltip: "Frequently Asked Questions" },
  { title: 'Back to Homepage', href: '/', icon: Home, tooltip: "Go to Homepage" },
];

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (currentUserRole !== 'seller') {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Logo size="2xl" />
        <p className="mt-4 text-lg text-muted-foreground">Access Denied or incorrect role. This is the Seller Dashboard.</p>
        <Button asChild className="mt-4"><Link href="/">Go to Homepage</Link></Button>
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
          <SidebarContent>
            <SidebarMenu>
              {sellerSidebarNavItems.map((item) => {
                const IconComponent = item.icon;
                const iconProps = item.iconProps ? { ...item.iconProps, size: 'sm' as const, className:"mr-3 shrink-0" } : { className:"h-5 w-5 mr-3 shrink-0" };
                
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
            <Button variant="outline" className="w-full text-destructive-foreground bg-destructive hover:bg-destructive/90 flex items-center justify-center"> 
              <LogOut className="h-5 w-5 mr-2" /> 
              <span className="truncate">Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-grow flex flex-col overflow-hidden">
           <header className="md:hidden flex items-center justify-between p-2 border-b bg-card sticky top-0 z-10">
              <Logo size="lg" />
              <SidebarTrigger/>
            </header>
            <div className="flex-grow flex flex-col">
              {children}
            </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
