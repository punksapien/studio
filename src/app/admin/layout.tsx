
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
  Users,
  Briefcase,
  BellRing,
  ShieldAlert,
  LogOut,
  LineChart,
  UserCheck,
  Building,
  FileText // Added for document review icon
} from 'lucide-react';

const adminSidebarNavItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'User Management', href: '/admin/users', icon: Users },
  { title: 'Listing Management', href: '/admin/listings', icon: Briefcase },
  { title: 'Buyer Verification', href: '/admin/verification-queue/buyers', icon: UserCheck },
  { title: 'Seller/Listing Verification', href: '/admin/verification-queue/sellers', icon: Building }, // Renamed for clarity
  { title: 'Engagement Queue', href: '/admin/engagement-queue', icon: BellRing },
  { title: 'Analytics', href: '/admin/analytics', icon: LineChart },
];

// Placeholder for admin authentication check
// In a real app, this layout would be protected, and non-admins redirected.
const isAdminAuthenticated = true; 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (!isAdminAuthenticated && pathname !== '/admin/login') {
    // In a real app, use Next.js redirect() or router.push()
    // For MVP structure, we'll assume access or show a message if not on login
    if (typeof window !== 'undefined') {
      // window.location.href = '/admin/login'; // Basic redirect for now
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <Logo size="2xl" />
            <p className="mt-4 text-lg text-muted-foreground">Access Denied. Redirecting to login...</p>
            {/* Spinner or loading state */}
        </div>
    );
  }
  
  // If on login page, don't render the sidebar layout
  if (pathname === '/admin/login') {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background py-12">
          {children}
        </div>
      );
  }


  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon">
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
                  tooltip={{ children: item.title, className:"bg-primary text-primary-foreground" }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
         <div className="p-4 border-t border-sidebar-border mt-auto">
           <SidebarMenuButton variant="outline" className="w-full text-destructive-foreground bg-destructive hover:bg-destructive/90">
                <LogOut />
                <span>Logout Admin</span>
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
