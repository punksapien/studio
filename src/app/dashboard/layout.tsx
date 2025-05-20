
'use client';

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
} from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  UserCircle,
  Briefcase,
  MessageSquare,
  Settings,
  LogOut,
  ShieldCheck,
  Bell
} from 'lucide-react';
import type { UserRole } from '@/lib/types';


// Placeholder for current user role - in a real app, this would come from session
const currentUserRole: UserRole | null = 'buyer'; // Set to 'buyer' for buyer dashboard development

const allSidebarNavItems = [
  { title: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['seller', 'buyer'] },
  { title: 'My Profile', href: '/dashboard/profile', icon: UserCircle, roles: ['seller', 'buyer'] },
  { title: 'My Listings', href: '/dashboard/listings', icon: Briefcase, roles: ['seller'] },
  { title: 'Create Listing', href: '/dashboard/listings/create', icon: Briefcase, roles: ['seller'] },
  { title: 'My Inquiries', href: '/dashboard/inquiries', icon: MessageSquare, roles: ['seller', 'buyer'] },
  { title: 'Verification', href: '/dashboard/verification', icon: ShieldCheck, roles: ['seller', 'buyer'] },
  { title: 'Notifications', href: '/dashboard/notifications', icon: Bell, roles: ['seller', 'buyer']},
  { title: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['seller', 'buyer'] },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const sidebarNavItems = allSidebarNavItems.filter(item => 
    !item.roles || (currentUserRole && item.roles.includes(currentUserRole))
  );

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <Logo size="lg" />
            <SidebarTrigger className="md:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {sidebarNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                    tooltip={{ children: item.title, className: "bg-primary text-primary-foreground" }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarContent>
        <div className="p-4 border-t border-sidebar-border mt-auto">
           <SidebarMenuButton variant="outline" className="w-full text-destructive-foreground bg-destructive hover:bg-destructive/90">
                <LogOut />
                <span>Logout</span>
           </SidebarMenuButton>
        </div>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header within inset for mobile trigger and page title */}
          <header className="md:hidden flex items-center justify-between mb-4 p-2 border rounded-md bg-card">
             <Logo size="lg" />
             <SidebarTrigger/>
          </header>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
