
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, LayoutDashboard, FilePlus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user'; // Assuming this hook can provide user's name

export default function SellerOnboardingSuccessPage() {
  const { profile } = useCurrentUser(); // Fetch current user's profile
  const [sellerName, setSellerName] = React.useState<string | null>(profile?.full_name || null);

  React.useEffect(() => {
    if (profile?.full_name) {
      setSellerName(profile.full_name);
    }
    // Clear session storage for seller onboarding data
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sellerOnboardingData');
    }
  }, [profile]);

  return (
    <div className="text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-6" />
        <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 font-heading">
            Thank You, {sellerName || 'Seller'}!
        </h2>
        <p className="text-muted-foreground mb-6">
            Your onboarding information and documents have been successfully submitted. Our team will review them within 3-5 business days.
            You will be notified via email and on your dashboard once the review is complete and your profile is verified.
        </p>
        <p className="text-muted-foreground mb-8">
            After verification, you can create detailed business listings and connect with verified buyers.
            In the meantime, you can explore your seller dashboard.
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
         <p className="text-xs text-muted-foreground mt-8">
            Once verified, you can publish your listings. If you have questions, <Link href="/contact" className="underline hover:text-primary">contact support</Link>.
        </p>
    </div>
  );
}
