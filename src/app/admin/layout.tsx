
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
  Users,
  Briefcase,
  BellRing,
  LogOut,
  LineChart,
  UserCheck,
  Building,
  HelpCircle,
  FileText,
  MessageSquareQuote, // Corrected import
  Home,
} from 'lucide-react';

const adminSidebarNavItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'User Management', href: '/admin/users', icon: Users },
  { title: 'Listing Management', href: '/admin/listings', icon: Briefcase },
  { title: 'Buyer Verification', href: '/admin/verification-queue/buyers', icon: UserCheck },
  { title: 'Seller/Listing Verification', href: '/admin/verification-queue/sellers', icon: Building },
  { title: 'Engagement Queue', href: '/admin/engagement-queue', icon: BellRing },
  { title: 'Analytics', href: '/admin/analytics', icon: LineChart },
];

const utilityNavItems = [
  { title: 'Help', href: '/help', icon: HelpCircle }, 
  { title: 'Refer Docs', href: '/docs', icon: FileText }, 
  { title: 'FAQ', href: '/faq', icon: MessageSquareQuote }, // Corrected icon
  { title: 'Back to Homepage', href: '/', icon: Home },
];

// Placeholder for admin authentication
const isAdminAuthenticated = true;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (!isAdminAuthenticated && pathname !== '/admin/login') {
    if (typeof window !== 'undefined') {
      // For client-side redirect, uncomment and use next/navigation if preferred
      // import { useRouter } from 'next/navigation';
      // const router = useRouter();
      // router.replace('/admin/login');
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
            {adminSidebarNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))}
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
            <span>Logout Admin</span>
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
