
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface BuyerStepperProps {
  currentStep: number;
  stepTitles: string[];
}

export function BuyerStepper({ currentStep, stepTitles }: BuyerStepperProps) {
  const totalSteps = stepTitles.length;

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-center space-x-8 md:space-x-12"> {/* Adjusted to justify-center and added spacing */}
        {stepTitles.map((title, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            // Removed conditional flex-1, let items size naturally with space-x
            <li key={title} className="relative">
              {index < totalSteps - 1 && (
                <div
                  className={cn(
                    "absolute inset-0 top-4 flex items-center",
                    // Adjust left and width for connector line to be more centered between two items
                    "left-full w-8 md:w-12 -ml-4 md:-ml-6" // Offset by half the space-x
                  )}
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
                    "mt-2 text-xs font-medium w-auto min-w-[60px] max-w-[120px] truncate", // Use w-auto for more flexible title width
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
