
// Firebase Studio: Applying specific path checks for dashboard routes - v4 (Final Check)
'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { Footer } from './footer';
import type { ReactNode } from 'react';

interface GlobalLayoutWrapperProps {
  children: ReactNode;
}

export default function GlobalLayoutWrapper({ children }: GlobalLayoutWrapperProps) {
  const pathname = usePathname();

  // Check if the current path is an admin, buyer dashboard, or seller dashboard route.
  // Ensure exact matches for root dashboard paths and startsWith for sub-paths.
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isBuyerDashboardRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isSellerDashboardRoute = pathname === '/seller-dashboard' || pathname.startsWith('/seller-dashboard/');

  // Consolidate the check for any dashboard-like route
  const isDedicatedLayoutRoute = isAdminRoute || isBuyerDashboardRoute || isSellerDashboardRoute;

  if (isDedicatedLayoutRoute) {
    // For routes with their own dedicated layouts, render children directly.
    // These dedicated layouts (e.g., AdminLayout, DashboardLayout) handle their own structure.
    return <>{children}</>;
  }

  // For all other non-dashboard routes, include the global Navbar and Footer.
  return (
    <>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}
