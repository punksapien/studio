
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
  MessageSquareQuote, 
  Home,
} from 'lucide-react';

const adminSidebarNavItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, tooltip: "Admin Overview" },
  { title: 'User Management', href: '/admin/users', icon: Users, tooltip: "Manage Users" },
  { title: 'Listing Management', href: '/admin/listings', icon: Briefcase, tooltip: "Manage Listings" },
  { title: 'Buyer Verification', href: '/admin/verification-queue/buyers', icon: UserCheck, tooltip: "Buyer Verifications" },
  { title: 'Seller/Listing Verification', href: '/admin/verification-queue/sellers', icon: Building, tooltip: "Seller/Listing Verifications" },
  { title: 'Engagement Queue', href: '/admin/engagement-queue', icon: BellRing, tooltip: "Engagement Queue" },
  { title: 'Analytics', href: '/admin/analytics', icon: LineChart, tooltip: "Platform Analytics" },
];

const utilityNavItems = [
  { title: 'Help', href: '/help', icon: HelpCircle, tooltip: "Get Help" },
  { title: 'Refer Docs', href: '/docs', icon: FileText, tooltip: "View Documentation" },
  { title: 'FAQ', href: '/faq', icon: MessageSquareQuote, tooltip: "Frequently Asked Questions" },
  { title: 'Back to Homepage', href: '/', icon: Home, tooltip: "Go to Homepage" },
];

// Placeholder for admin authentication - in a real app, this would come from session/auth
const isAdminAuthenticated = true; // Assume admin is authenticated for layout display

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // If using Clerk or similar, this check would be handled by middleware or auth hooks
  if (!isAdminAuthenticated && pathname !== '/admin/login') {
    // Client-side redirect for prototype if needed
    if (typeof window !== 'undefined') {
      // import { useRouter } from 'next/navigation'; // (if you prefer programmatic redirect)
      // const router = useRouter();
      // router.replace('/admin/login');
      window.location.href = '/admin/login'; // Simple redirect for now
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
    <SidebarProvider defaultOpen className="flex min-h-screen flex-col bg-background">
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <Logo size="lg" />
            <SidebarTrigger className="md:hidden" /> {/* Only show trigger on mobile for sheet */}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {adminSidebarNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))}
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
        <div className="p-4 border-t border-sidebar-border mt-auto"> {/* Sidebar specific footer */}
          <Button variant="outline" className="w-full text-destructive-foreground bg-destructive hover:bg-destructive/90">
            <LogOut className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden">Logout Admin</span>
          </Button>
        </div>
      </Sidebar>
      <SidebarInset className="flex-grow flex flex-col overflow-hidden"> {/* Main content area */}
         <div className="flex-grow flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
          <header className="md:hidden flex items-center justify-between mb-4 p-2 border rounded-md bg-card">
            <Logo size="lg" />
            <SidebarTrigger/>
          </header>
          <div className="flex-grow">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
