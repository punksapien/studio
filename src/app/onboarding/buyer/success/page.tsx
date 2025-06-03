
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, LayoutDashboard, Search } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user'; // Assuming this hook can provide user's name

export default function BuyerOnboardingSuccessPage() {
  const { profile } = useCurrentUser(); // Fetch current user's profile
  const [buyerName, setBuyerName] = React.useState<string | null>(profile?.full_name || null);

  React.useEffect(() => {
    if (profile?.full_name) {
      setBuyerName(profile.full_name);
    }
    // Clear session storage for buyer onboarding data
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('buyerOnboardingData');
    }
  }, [profile]);
  
  return (
    <div className="text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-6" />
        <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 font-heading">
            Thank You, {buyerName || 'Buyer'}!
        </h2>
        <p className="text-muted-foreground mb-6">
            Your verification information has been successfully submitted. Our team will review it within 1-2 business days.
            You will be notified of your verification status via email and on your dashboard.
        </p>
        <p className="text-muted-foreground mb-8">
            Once verified, you'll gain full access to detailed business information and secure communication channels.
            In the meantime, you can explore anonymous listings in our marketplace or visit your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
                <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-5 w-5" /> Go to Buyer Dashboard
                </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
                <Link href="/marketplace">
                    <Search className="mr-2 h-5 w-5" /> Browse Marketplace
                </Link>
            </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-8">
            If you have any urgent questions, please <Link href="/contact" className="underline hover:text-primary">contact our support team</Link>.
        </p>
    </div>
  );
}
