
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, LayoutDashboard, Search } from 'lucide-react';

export default function BuyerOnboardingSuccessPage() {
  const [buyerName, setBuyerName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDataRaw = sessionStorage.getItem('buyerOnboardingData');
      if (savedDataRaw) {
        const savedData = JSON.parse(savedDataRaw);
        setBuyerName(savedData.fullName || 'Buyer'); 
      }
      sessionStorage.removeItem('buyerOnboardingData'); 
    }
  }, []);
  
  return (
    <div className="text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-6" />
        <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 font-heading">
            Thank You, {buyerName || 'Buyer'}!
        </h2>
        <p className="text-muted-foreground mb-6">
            Your verification request has been successfully submitted. Our team will review it within 1-2 business days. You will be notified of your status via email and on your dashboard.
        </p>
        <p className="text-muted-foreground mb-8">
            In the meantime, you can continue browsing anonymous listings or explore your buyer dashboard.
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
    </div>
  );
}
