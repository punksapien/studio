
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  UserCircle,
  MessageSquare,
  Settings,
  LogOut,
  ShieldCheck,
  Bell,
  ShoppingCart, 
  HelpCircle,   
  FileText,     
  MessageSquareQuote, // Corrected from MessageSquareQuestion
  Home,         
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

const currentUserRole: UserRole | null = 'buyer'; 

const buyerSidebarNavItems = [
  { title: 'Overview', href: '/dashboard', icon: LayoutDashboard, tooltip: "Dashboard Overview" },
  { title: 'My Profile', href: '/dashboard/profile', icon: UserCircle, tooltip: "Manage Profile" },
  { title: 'My Inquiries', href: '/dashboard/inquiries', icon: MessageSquare, tooltip: "View Inquiries" },
  { title: 'Verification', href: '/dashboard/verification', icon: ShieldCheck, tooltip: "Account Verification" },
  { title: 'Notifications', href: '/dashboard/notifications', icon: Bell, tooltip: "My Notifications" },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings, tooltip: "Account Settings" },
];

const utilityNavItems = [
  { title: 'Marketplace', href: '/marketplace', icon: ShoppingCart, tooltip: "Browse Marketplace" },
  { title: 'Help', href: '/help', icon: HelpCircle, tooltip: "Get Help" }, 
  { title: 'Refer Docs', href: '/docs', icon: FileText, tooltip: "View Documentation" }, 
  { title: 'FAQ', href: '/faq', icon: MessageSquareQuote, tooltip: "Frequently Asked Questions" },
  { title: 'Back to Homepage', href: '/', icon: Home, tooltip: "Go to Homepage" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (currentUserRole !== 'buyer') {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Logo size="2xl" />
        <p className="mt-4 text-lg text-muted-foreground">Access Denied or incorrect role.</p>
         <Button asChild className="mt-4"><Link href="/">Go to Homepage</Link></Button>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen className="flex min-h-screen"> {/* Ensure flex-row behavior */}
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <Logo size="lg" />
            <SidebarTrigger className="md:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {buyerSidebarNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                  tooltip={{ children: item.tooltip, className: "bg-primary text-primary-foreground" }}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarSeparator className="my-4" />
          <SidebarMenu>
            {utilityNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.tooltip, className: "bg-primary text-primary-foreground" }}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <div className="p-4 border-t border-sidebar-border mt-auto">
          <Button variant="outline" className="w-full text-destructive-foreground bg-destructive hover:bg-destructive/90">
            <LogOut className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </div>
      </Sidebar>
      <SidebarInset className="flex-grow flex flex-col overflow-hidden"> 
        <div className="flex-grow flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
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
