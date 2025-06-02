
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CheckCircle2, LayoutDashboard, FilePlus } from 'lucide-react';

export default function SellerOnboardingSuccessPage() {
  const [sellerName, setSellerName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDataRaw = sessionStorage.getItem('sellerOnboardingData');
      if (savedDataRaw) {
        const savedData = JSON.parse(savedDataRaw);
        setSellerName(savedData.registeredBusinessName || 'Seller'); // Or fetch from user profile
      }
      sessionStorage.removeItem('sellerOnboardingData'); // Clear data after use
    }
  }, []);

  return (
    <div className="text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-6" />
        <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 font-heading">
            Thank You, {sellerName || 'Seller'}!
        </h2>
        <p className="text-muted-foreground mb-6">
            Your onboarding information and documents have been successfully submitted. Our team will review them within 3-5 business days. You will be notified via email and on your dashboard once the review is complete.
        </p>
        <p className="text-muted-foreground mb-8">
            In the meantime, you can start drafting your business listing or explore your seller dashboard.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
                <Link href="/seller-dashboard">
                    <LayoutDashboard className="mr-2 h-5 w-5" /> Go to Seller Dashboard
                </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
                <Link href="/seller-dashboard/listings/create">
                    <FilePlus className="mr-2 h-5 w-5" /> Start Drafting Listing
                </Link>
            </Button>
        </div>
    </div>
  );
}
