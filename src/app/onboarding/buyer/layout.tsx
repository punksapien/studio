'use client';

import * as React from 'react';
import { BuyerStepper } from '@/components/onboarding/buyer-stepper';
import { Logo } from '@/components/shared/logo';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function BuyerOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const currentStep = params.step ? parseInt(params.step as string, 10) : 1;
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isSuccessPage = params.step === 'success' || pathname.endsWith('/onboarding/buyer/success');

  const buyerStepTitles = [
    "Welcome & Profile",
    "Identity Verification",
  ];

  return (
    <div className="min-h-screen bg-brand-light-gray flex flex-col items-center py-8 md:py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Link href="/" aria-label="Back to homepage">
            <Logo size="xl" forceTheme="light" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-dark-blue mt-4 mb-2 font-heading">
            Become a Verified Nobridge Buyer
          </h1>
          <p className="text-muted-foreground">
            Complete your profile to unlock full access.
          </p>
        </div>

        {!isSuccessPage && (
          <div className="mb-10">
            <BuyerStepper currentStep={currentStep} stepTitles={buyerStepTitles} />
          </div>
        )}

        <main className="bg-brand-white p-6 md:p-10 rounded-xl shadow-xl">
          {children}
        </main>
      </div>
    </div>
  );
}
