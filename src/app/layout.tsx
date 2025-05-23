
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a professional sans-serif
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
// Removed Navbar and Footer imports, they are now in GlobalLayoutWrapper
import GlobalLayoutWrapper from '@/components/layout/GlobalLayoutWrapper'; // Import the new wrapper

const inter = Inter({
  variable: '--font-sans', // Using --font-sans as Tailwind will pick this up
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Nobridge - Business Marketplace Platform', // Updated Project Name
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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased flex flex-col min-h-screen bg-background text-foreground">
        <GlobalLayoutWrapper>
          {children}
        </GlobalLayoutWrapper>
        <Toaster />
      </body>
    </html>
  );
}
