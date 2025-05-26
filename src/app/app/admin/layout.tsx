
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
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
  SidebarFooter
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
  MessageSquareQuote,
  Home,
} from 'lucide-react';

const adminSidebarNavItems = [
  { title: 'Dashboard', href: '/app/admin', icon: LayoutDashboard, tooltip: "Admin Overview" },
  { title: 'User Management', href: '/app/admin/users', icon: Users, tooltip: "Manage Users" },
  { title: 'Listing Management', href: '/app/admin/listings', icon: Briefcase, tooltip: "Manage Listings" },
  { title: 'Buyer Verification', href: '/app/admin/verification-queue/buyers', icon: UserCheck, tooltip: "Buyer Verifications" },
  { title: 'Seller/Listing Verification', href: '/app/admin/verification-queue/sellers', icon: Building, tooltip: "Seller/Listing Verifications" },
  { title: 'Engagement Queue', href: '/app/admin/engagement-queue', icon: BellRing, tooltip: "Engagement Queue" },
  { title: 'Analytics', href: '/app/admin/analytics', icon: LineChart, tooltip: "Platform Analytics" },
];

const utilityNavItems = [
  { title: 'Help', href: '/help', icon: HelpCircle, tooltip: "Get Help" }, // Assuming /help is a public page
  { title: 'Refer Docs', href: '/docs', icon: FileText, tooltip: "View Documentation" }, // Assuming /docs is public
  { title: 'FAQ', href: '/faq', icon: MessageSquareQuote, tooltip: "Frequently Asked Questions" }, // Assuming /faq is public
  { title: 'Back to Homepage', href: '/', icon: Home, tooltip: "Go to Nobridge Homepage" },
];

const isAdminAuthenticated = true; // Placeholder for actual auth check

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (!isAdminAuthenticated && pathname !== '/app/admin/login') {
    if (typeof window !== 'undefined') {
      // This client-side redirect should be handled by middleware ideally for server components
      // For client components, this is okay, but ensure no hydration mismatch
      // For now, just logging as actual redirect logic might need useRouter from 'next/navigation'
      console.warn("Admin not authenticated, redirect to /app/admin/login would happen here.");
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Logo size="2xl" />
        <p className="mt-4 text-lg text-muted-foreground">Access Denied. Redirecting to login...</p>
        {/* <Button asChild><Link href="/app/admin/login">Go to Login</Link></Button> */}
      </div>
    );
  }

  if (pathname === '/app/admin/login') {
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
              {adminSidebarNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/app/admin' && pathname.startsWith(item.href))}
                    tooltip={{ children: item.tooltip, className: "bg-primary text-primary-foreground" }}
                  >
                    <Link href={item.href} className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3 shrink-0" />
                      <span className="truncate">{item.title}</span>
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
                     <Link href={item.href} className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
           <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
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
