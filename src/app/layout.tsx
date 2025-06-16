import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import GlobalLayoutWrapper from '@/components/layout/GlobalLayoutWrapper';
import NoticeListener from '@/components/NoticeListener';
import { DebugState } from '@/components/shared/DebugState';
import { AuthProvider } from '@/contexts/auth-context';
import { SWRProvider } from '@/contexts/swr-provider';
import { QueryProvider } from '@/contexts/query-provider';
import { GeistSans } from 'geist/font/sans';
import { Toaster as SonnerToaster } from "sonner";

// Force all pages to be dynamic
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nobridge - Business Marketplace Platform',
  description: 'Connecting SME owners with investors and buyers in Asia.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }, // Standard .ico
      { url: '/assets/nobridge_app_icon.png', type: 'image/png', sizes: 'any' }, // PNG icon
    ],
    apple: '/assets/apple-touch-icon.png', // Ensure this file exists at public/assets/apple-touch-icon.png
    shortcut: '/assets/nobridge_app_icon.png', // Shortcut icon using the png
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Satoshi Font from Fontshare CDN */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
        />
      </head>
      <body className="font-sans antialiased flex flex-col min-h-screen bg-background text-foreground">
        <QueryProvider>
          <SWRProvider>
            <AuthProvider>
              <GlobalLayoutWrapper>
                {children}
              </GlobalLayoutWrapper>
              <NoticeListener />
              <Toaster />
              <DebugState />
            </AuthProvider>
          </SWRProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
