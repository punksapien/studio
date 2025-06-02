
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface SellerStepperProps {
  currentStep: number;
  stepTitles: string[];
}

export function SellerStepper({ currentStep, stepTitles }: SellerStepperProps) {
  const totalSteps = stepTitles.length;

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-between">
        {stepTitles.map((title, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <li key={title} className={cn("relative", index < totalSteps -1 ? "flex-1" : "")}>
              {index < totalSteps - 1 && (
                <div
                  className="absolute inset-0 top-4 left-0 flex w-full items-center"
                  aria-hidden="true"
                >
                  <div className={cn("h-0.5 w-full", isCompleted ? "bg-brand-sky-blue" : "bg-brand-light-gray")} />
                </div>
              )}
              <div className="relative flex flex-col items-center text-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isCompleted ? "bg-brand-sky-blue text-brand-white" :
                    isActive ? "border-2 border-brand-sky-blue bg-brand-white text-brand-sky-blue ring-2 ring-offset-2 ring-brand-sky-blue" :
                    "border-2 border-brand-light-gray bg-brand-white text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
                </div>
                <p className={cn(
                    "mt-2 text-xs font-medium w-24 truncate", // Added w-24 and truncate
                    isActive ? "text-brand-sky-blue" : "text-muted-foreground"
                )}>
                  {title}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
