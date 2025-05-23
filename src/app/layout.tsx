import type { Metadata } from 'next';
// Removed Inter font import
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import GlobalLayoutWrapper from '@/components/layout/GlobalLayoutWrapper';

// Satoshi font will be applied via globals.css and tailwind.config.ts

export const metadata: Metadata = {
  title: 'Nobridge - Business Marketplace Platform',
  description: 'Connecting SME owners with investors and buyers in Asia.',
  icons: {
    icon: '/favicon.ico',
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
        <GlobalLayoutWrapper>
          {children}
        </GlobalLayoutWrapper>
        <Toaster />
      </body>
    </html>
  );
}
