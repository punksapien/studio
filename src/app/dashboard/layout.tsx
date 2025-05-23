
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react'; // Ensured React import for JSX
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
  Briefcase, // Kept for potential future use, but not in current buyer nav
  MessageSquare,
  Settings,
  LogOut,
  ShieldCheck,
  Bell,
  PlusCircle // Kept for potential future use
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

// Placeholder for current user role - in a real app, this would come from session
const currentUserRole: UserRole | null = 'buyer'; // Explicitly buyer for this dashboard

const allSidebarNavItems = [
  { title: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['buyer', 'seller'] },
  { title: 'My Profile', href: '/dashboard/profile', icon: UserCircle, roles: ['buyer', 'seller'] },
  { title: 'My Inquiries', href: '/dashboard/inquiries', icon: MessageSquare, roles: ['buyer', 'seller'] },
  { title: 'Verification', href: '/dashboard/verification', icon: ShieldCheck, roles: ['buyer', 'seller'] },
  { title: 'Notifications', href: '/dashboard/notifications', icon: Bell, roles: ['buyer', 'seller']},
  { title: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['buyer', 'seller'] },
  // Seller specific (will be filtered out for buyer)
  { title: 'My Listings', href: '/seller-dashboard/listings', icon: Briefcase, roles: ['seller'] },
  { title: 'Create Listing', href: '/seller-dashboard/listings/create', icon: PlusCircle, roles: ['seller'] },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const sidebarNavItems = allSidebarNavItems.filter(item => 
    currentUserRole && item.roles.includes(currentUserRole)
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
      <SidebarInset className="flex-grow pt-20"> {/* Added pt-20 for sticky navbar offset and flex-grow */}
        <div className="p-4 md:p-6 lg:p-8 flex-grow flex flex-col"> {/* flex-grow and flex-col here too */}
          <header className="md:hidden flex items-center justify-between mb-4 p-2 border rounded-md bg-card">
             <Logo size="lg" />
             <SidebarTrigger/>
          </header>
          <div className="flex-grow"> {/* This div will take the remaining space */}
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
