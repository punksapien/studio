
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

  const isDashboardRoute =
    pathname.startsWith('/admin') || // Corrected path for admin routes
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/seller-dashboard');

  if (isDashboardRoute) {
    // For dashboard routes, render children directly without Navbar/Footer
    // as they have their own specific layouts.
    return <>{children}</>;
  }

  // For non-dashboard routes, include the global Navbar and Footer
  return (
    <>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}
