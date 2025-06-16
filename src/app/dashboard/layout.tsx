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
  SidebarFooter,
  SidebarInset
} from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  UserCircle,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  ShoppingCart,
  HelpCircle,
  FileText,
  MessageSquareQuote,
  Home,
  Mail,
  ShieldCheck
} from 'lucide-react';
import type { UserRole } from '@/lib/types';
import LogoutButton from '@/components/auth/LogoutButton';

const currentUserRole: UserRole | null = 'buyer';

const buyerSidebarNavItems = [
  { title: 'Overview', href: '/dashboard', icon: LayoutDashboard, tooltip: "Dashboard Overview" },
  { title: 'My Profile', href: '/dashboard/profile', icon: UserCircle, tooltip: "Manage Profile" },
  { title: 'My Inquiries', href: '/dashboard/inquiries', icon: MessageSquare, tooltip: "View Inquiries" },
  // { title: 'Messages', href: '/dashboard/messages', icon: Mail, tooltip: "My Conversations" },
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
  const [inquiryCount, setInquiryCount] = React.useState(0);

  // Fetch inquiry count for notification badge
  React.useEffect(() => {
    const fetchInquiryCount = async () => {
      try {
        const response = await fetch('/api/inquiries?role=buyer&limit=100');
        const data = await response.json();

        if (response.ok && data.inquiries) {
          setInquiryCount(data.inquiries.length);
        }
      } catch (error) {
        console.warn('Failed to fetch inquiry count for sidebar badge:', error);
      }
    };

    fetchInquiryCount();
  }, []);

  if (currentUserRole !== 'buyer') {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Logo size="2xl" forceTheme="light" />
        <p className="mt-4 text-lg text-muted-foreground">Access Denied or incorrect role. This is the Buyer Dashboard.</p>
         <Button asChild className="mt-4"><Link href="/">Go to Homepage</Link></Button>
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
          <SidebarContent>
            <SidebarMenu>
              {buyerSidebarNavItems.map((item) => {
                 const IconComponent = item.icon;
                 const iconProps = { className:"h-5 w-5 mr-3 shrink-0" };
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                    tooltip={{ children: item.tooltip, className: "bg-primary text-primary-foreground" }}
                  >
                    <Link href={item.href} className="flex items-center">
                      <IconComponent {...iconProps} />
                      <span className="truncate">{item.title}</span>
                      {/* Show red notification badge for My Inquiries */}
                      {item.title === 'My Inquiries' && inquiryCount > 0 && (
                        <Badge
                          className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 rounded-full flex items-center justify-center"
                        >
                          {inquiryCount}
                        </Badge>
                      )}
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
            <header className="md:hidden flex items-center justify-between p-2 border-b bg-card sticky top-0 z-10">
              <Logo size="lg" forceTheme="light" />
              <SidebarTrigger/>
            </header>
            <div className="p-6 md:p-8 lg:p-10 flex-grow flex flex-col overflow-y-auto">
             {children}
            </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
