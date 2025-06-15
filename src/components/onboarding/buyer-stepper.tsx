
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, User, FileText } from 'lucide-react';

interface BuyerStepperProps {
  currentStep: number;
  stepTitles: string[];
}

export function BuyerStepper({ currentStep, stepTitles }: BuyerStepperProps) {
  const totalSteps = stepTitles.length;

  const stepIcons = [
    User,     // Icon for "Welcome & Info"
    FileText, // Icon for "Identity Document"
  ];

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-start justify-center">
        {stepTitles.map((title, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const IconComponent = stepIcons[index] || Check;

          return (
            <li key={title} className={cn("relative", index < totalSteps -1 ? "flex-1 min-w-[160px]" : "min-w-[160px]")}> {/* Increased min-w */}
              {index < totalSteps - 1 && (
                <div
                  className={cn(
                    "absolute inset-0 top-[18px] flex items-center",
                    "left-[calc(50%+1rem)] right-[calc(-50%+1rem)]" 
                  )}
                  aria-hidden="true"
                >
                  <div className={cn("h-0.5 w-full", isCompleted ? "bg-brand-sky-blue" : "bg-brand-light-gray/80")} />
                </div>
              )}
              <div className="relative flex flex-col items-center text-center group">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold border-2 transition-all duration-200 ease-in-out",
                    isCompleted ? "bg-brand-sky-blue text-brand-white border-brand-sky-blue" :
                    isActive ? "border-brand-sky-blue bg-brand-white text-brand-sky-blue ring-4 ring-brand-sky-blue/20" :
                    "border-brand-light-gray bg-brand-white text-muted-foreground group-hover:border-brand-dark-blue/50"
                  )}
                >
                  {isCompleted ? <Check className="h-6 w-6" /> : <IconComponent className={cn("h-5 w-5", isActive ? "text-brand-sky-blue" : "text-muted-foreground/70 group-hover:text-brand-dark-blue/70")} />}
                </div>
                <p className={cn(
                    "mt-2.5 text-xs font-medium w-auto max-w-[150px]", // Adjusted max-width
                    isActive ? "text-brand-sky-blue" : "text-muted-foreground group-hover:text-brand-dark-blue/90"
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
