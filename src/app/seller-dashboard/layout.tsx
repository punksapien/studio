
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
  Bell,
  PlusCircle
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

// For Seller Dashboard, role is 'seller'
const currentUserRole: UserRole = 'seller'; 

const allSidebarNavItems = [
  { title: 'Overview', href: '/seller-dashboard', icon: LayoutDashboard, roles: ['seller', 'buyer'] },
  { title: 'My Profile', href: '/seller-dashboard/profile', icon: UserCircle, roles: ['seller', 'buyer'] },
  { title: 'My Listings', href: '/seller-dashboard/listings', icon: Briefcase, roles: ['seller'] },
  { title: 'Create Listing', href: '/seller-dashboard/listings/create', icon: PlusCircle, roles: ['seller'] },
  { title: 'My Inquiries', href: '/seller-dashboard/inquiries', icon: MessageSquare, roles: ['seller', 'buyer'] }, // Seller also needs to see inquiries for their listings
  { title: 'Verification', href: '/seller-dashboard/verification', icon: ShieldCheck, roles: ['seller', 'buyer'] },
  { title: 'Notifications', href: '/seller-dashboard/notifications', icon: Bell, roles: ['seller', 'buyer']},
  { title: 'Settings', href: '/seller-dashboard/settings', icon: Settings, roles: ['seller', 'buyer'] },
];


export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const sidebarNavItems = allSidebarNavItems.filter(item => 
    item.roles.includes(currentUserRole)
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
                    isActive={pathname === item.href || (item.href !== '/seller-dashboard' && pathname.startsWith(item.href))}
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
