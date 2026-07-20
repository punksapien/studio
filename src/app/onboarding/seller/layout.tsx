'use client';

import * as React from 'react';
import { SellerStepper } from '@/components/onboarding/seller-stepper';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/shared/logo';

export default function SellerOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const currentStep = params.step ? parseInt(params.step as string, 10) : 1;

  const sellerStepTitles = [
    "About You",
    "Your Company",
    "Business Details",
  ];

  return (
    <div className="min-h-screen bg-brand-light-gray flex flex-col items-center py-8 md:py-12 px-4">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <Logo size="xl" forceTheme="light" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-semibold text-brand-dark-blue mt-4 mb-2 font-heading">
            Complete Your Seller Profile
          </h1>
          <p className="text-muted-foreground">
            A few quick details about you and your business — you can skip the optional steps and come back later.
          </p>
        </div>

        <div className="mb-10 max-w-xl mx-auto">
          <SellerStepper currentStep={currentStep} stepTitles={sellerStepTitles} />
        </div>

        <main className="bg-brand-white p-6 md:p-10 rounded-none">
          {children}
        </main>
      </div>
    </div>
  );
}
