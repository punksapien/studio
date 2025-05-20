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
  ShieldCheck
} from 'lucide-react';

const sidebarNavItems = [
  { title: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { title: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
  { title: 'My Listings', href: '/dashboard/listings', icon: Briefcase, role: 'seller' }, // Example: Seller only
  { title: 'Create Listing', href: '/dashboard/listings/create', icon: Briefcase, role: 'seller' }, // Example: Seller only
  { title: 'My Inquiries', href: '/dashboard/inquiries', icon: MessageSquare },
  { title: 'Verification', href: '/dashboard/verification', icon: ShieldCheck },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
];

// Placeholder for user role - in a real app, this would come from session
const currentUserRole: 'seller' | 'buyer' | null = 'seller'; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
            {sidebarNavItems.map((item) => {
              if (item.role && item.role !== currentUserRole) {
                return null;
              }
              return (
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
              );
            })}
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
