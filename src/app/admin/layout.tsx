
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react'; // Ensure React is imported
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
  MessageSquareQuote, // Corrected from MessageSquareQuestion
  Home,
} from 'lucide-react';
// Removed UserRole import as it's not directly used here

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

const isAdminAuthenticated = true; // Placeholder for actual auth check

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (!isAdminAuthenticated && pathname !== '/admin/login') {
    if (typeof window !== 'undefined') {
      console.warn("Admin not authenticated, redirect to /admin/login would happen here via router.");
      // import { useRouter } from 'next/navigation'; const router = useRouter(); router.push('/admin/login');
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
    <SidebarProvider defaultOpen> {/* Ensures sidebar is open by default on desktop */}
      <div className="flex min-h-screen"> {/* Ensures the layout takes full screen height */}
        <Sidebar variant="sidebar" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"> {/* Removed collapsible="icon" */}
          <SidebarHeader className="p-4 border-b border-sidebar-border">
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
                    tooltip={{ children: item.tooltip, className: "bg-primary text-primary-foreground" }}
                  >
                    <Link href={item.href} className="flex items-center"> {/* Ensure flex and items-center for alignment */}
                      <item.icon className="h-5 w-5 mr-3" /> {/* Added mr-3 for spacing */}
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
                    <Link href={item.href} className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <Button variant="outline" className="w-full text-destructive-foreground bg-destructive hover:bg-destructive/90 flex items-center justify-center"> {/* Added flex items-center justify-center */}
              <LogOut className="h-5 w-5 mr-2" /> {/* Added mr-2 for spacing */}
              <span>Logout Admin</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
             <header className="md:hidden flex items-center justify-between mb-4 p-2 border rounded-md bg-card">
                <Logo size="lg" />
                <SidebarTrigger/>
            </header>
            <div className="flex-grow"> {/* This div will allow children to take full height */}
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

    