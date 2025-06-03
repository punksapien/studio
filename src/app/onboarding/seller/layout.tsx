'use client';

import * as React from 'react';
import { SellerStepper } from '@/components/onboarding/seller-stepper';
// Removed Logo import
import { useParams } from 'next/navigation';
import Link from 'next/link'; // Keep Link if used for other purposes, e.g. back to homepage

export default function SellerOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const currentStep = params.step ? parseInt(params.step as string, 10) : 1;
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isSuccessPage = params.step === 'success' || pathname.endsWith('/onboarding/seller/success');

  const sellerStepTitles = [
    "Business Overview",
    "Seller Identity",
    "Business Docs",
    "Financials",
    "Review & Submit",
  ];

  return (
    <div className="min-h-screen bg-brand-light-gray flex flex-col items-center py-8 md:py-12 px-4">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          {/* Logo component removed from here */}
          <h1 className="text-3xl md:text-4xl font-bold text-brand-dark-blue mt-4 mb-2 font-heading">
            Complete Your Seller Profile & Business Verification
          </h1>
          <p className="text-muted-foreground">
            Provide key details to get your business ready for verified buyers.
          </p>
        </div>

        {!isSuccessPage && (
          <div className="mb-10 max-w-3xl mx-auto">
            <SellerStepper currentStep={currentStep} stepTitles={sellerStepTitles} />
          </div>
        )}

        <main className="bg-brand-white p-6 md:p-10 rounded-xl shadow-xl">
          {children}
        </main>
      </div>
    </div>
  );
}
