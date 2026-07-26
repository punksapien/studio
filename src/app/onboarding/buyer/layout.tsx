
'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import * as React from 'react';
import { BuyerStepper } from '@/components/onboarding/buyer-stepper';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/shared/logo';

export default function BuyerOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const currentStep = params.step ? parseInt(params.step as string, 10) : 1;

  const buyerStepTitles = [
    "About You",
    "Your Company",
    "Investment Profile",
  ];

  return (
    <div className="min-h-screen bg-brand-light-gray flex flex-col items-center py-8 md:py-12 px-4">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <Logo size="xl" forceTheme="light" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-semibold text-brand-dark-blue mt-4 mb-2 font-heading">
            Complete Your Buyer Profile
          </h1>
          <p className="text-muted-foreground">
            A few quick details to personalize your experience — you can skip the optional steps and come back later.
          </p>
        </div>

        <div className="mb-10 max-w-xl mx-auto">
          <BuyerStepper currentStep={currentStep} stepTitles={buyerStepTitles} />
        </div>

        <main className="bg-brand-white p-6 md:p-10 rounded-none">
          {children}
        </main>
      </div>
    </div>
  );
}
