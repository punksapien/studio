// Firebase Studio: Applying specific path checks for dashboard routes - v2
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
  // This ensures that these sections use their own dedicated layouts.
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isBuyerDashboardRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isSellerDashboardRoute = pathname === '/seller-dashboard' || pathname.startsWith('/seller-dashboard/');

  const isDashboardRoute = isAdminRoute || isBuyerDashboardRoute || isSellerDashboardRoute;

  if (isDashboardRoute) {
    // For dashboard routes, render children directly as they have their own layouts.
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
