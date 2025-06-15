
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Users,
  MessageSquare,
  LogOut,
  HelpCircle,
  FileText,
  MessageSquareQuote,
  Home,
  Briefcase,
  ShieldCheck,
  LineChart,
  BellRing,
  DatabaseZap, // Changed from FlaskConical for Data Injection Hub
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';

const adminSidebarNavItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, tooltip: "Admin Overview" },
  { title: 'User Management', href: '/admin/users', icon: Users, tooltip: "Manage Users" },
  { title: 'Listing Management', href: '/admin/listings', icon: Briefcase, tooltip: "Manage Listings" },
  { title: 'Appeal Management', href: '/admin/appeals', icon: MessageSquare, tooltip: "Review Listing Appeals" },
  { title: 'Buyer Verification', href: '/admin/verification-queue/buyers', icon: ShieldCheck, tooltip: "Buyer Verifications" },
  { title: 'Seller/Listing Verification', href: '/admin/verification-queue/sellers', icon: ShieldCheck, tooltip: "Seller/Listing Verifications" },
  { title: 'Engagement Queue', href: '/admin/engagement-queue', icon: BellRing, tooltip: "Engagement Queue" },
  { title: 'Conversations', href: '/admin/conversations', icon: MessageSquare, tooltip: "Platform Conversations" },
  { title: 'Analytics', href: '/admin/analytics', icon: LineChart, tooltip: "Platform Analytics" },
  { title: 'Data Injection Hub', href: '/admin/hack-tool', icon: DatabaseZap, tooltip: "Batch Data Tool" },
];

const utilityNavItems = [
  { title: 'Help', href: '/help', icon: HelpCircle, tooltip: "Get Help" },
  { title: 'Refer Docs', href: '/docs', icon: FileText, tooltip: "View Documentation" },
  { title: 'FAQ', href: '/faq', icon: MessageSquareQuote, tooltip: "Frequently Asked Questions" },
  { title: 'Back to Homepage', href: '/', icon: Home, tooltip: "Go to Nobridge Homepage" },
];

const isAdminAuthenticated = true; // Placeholder for actual auth check

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAdminAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [pathname, router]);


  if (!isAdminAuthenticated && pathname !== '/admin/login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Logo size="2xl" forceTheme="light" />
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
        <Sidebar variant="sidebar" className="h-screen sticky top-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <Logo size="lg" forceTheme="light" />
              <SidebarTrigger className="md:hidden" />
            </div>
          </SidebarHeader>
          <SidebarContent className="flex-grow">
            <SidebarMenu>
              {adminSidebarNavItems.map((item) => {
                const IconComponent = item.icon;
                const iconProps = { className:"h-5 w-5 mr-3 shrink-0" };
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
           <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
              <Logo size="lg" forceTheme="light" />
              <SidebarTrigger/>
           </header>
           {/* Reverted padding change for hack-tool page */}
           <div className="p-6 md:p-8 lg:p-10 flex-1 overflow-y-auto">
            {children}
           </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
