
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
  SidebarSeparator, // Added SidebarSeparator
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
  ShoppingCart, // Added
  HelpCircle,   // Added
  FileText,     // Added
  MessageSquareQuestion, // Added for FAQ
  Home,         // Added for Back to Home
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

// Placeholder for current user role - in a real app, this would come from session
const currentUserRole: UserRole | null = 'buyer'; // Explicitly buyer for this dashboard

const buyerSidebarNavItems = [
  { title: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { title: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
  { title: 'My Inquiries', href: '/dashboard/inquiries', icon: MessageSquare },
  { title: 'Verification', href: '/dashboard/verification', icon: ShieldCheck },
  { title: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const utilityNavItems = [
  { title: 'Marketplace', href: '/marketplace', icon: ShoppingCart },
  { title: 'Help', href: '#', icon: HelpCircle }, // Placeholder href
  { title: 'Refer Docs', href: '#', icon: FileText }, // Placeholder href
  { title: 'FAQ', href: '#', icon: MessageSquareQuestion }, // Placeholder href
  { title: 'Back to Homepage', href: '/', icon: Home },
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
    <SidebarProvider defaultOpen className="flex min-h-screen flex-col">
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-brand-light-gray/60">
        <SidebarHeader className="p-4 border-b border-brand-light-gray/60">
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
                  tooltip={{ children: item.title, className: "bg-primary text-primary-foreground" }}
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
                  tooltip={{ children: item.title, className: "bg-primary text-primary-foreground" }}
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
        <div className="p-4 border-t border-brand-light-gray/60 mt-auto">
          <Button variant="outline" className="w-full text-destructive-foreground bg-destructive hover:bg-destructive/90">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </Sidebar>
      <SidebarInset className="flex-grow flex flex-col">
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
