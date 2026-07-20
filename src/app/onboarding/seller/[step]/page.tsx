'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Building2, CheckCircle, Loader2, TrendingUp, UserCircle } from 'lucide-react';
import { updateOnboardingStatus, updateUserProfile } from '@/hooks/use-current-user';
import { useCurrentUser } from '@/hooks/use-cached-profile';
import { ContactStepFields } from '@/components/onboarding/steps/contact-step';
import { CompanyStepFields } from '@/components/onboarding/steps/company-step';
import { employeeCountRanges, revenueRanges } from '@/lib/types';

// --- Schemas ---
// Step 1 (full name + phone) is required. The remaining steps and fields are
// optional: those steps can be skipped entirely, and an empty "Continue" is
// legal. Enum fields are validated only when a value is chosen.
const Step1Schema = z.object({
  fullName: z.string().trim().min(1, { message: 'Full name is required.' }),
  phoneNumber: z.string().trim()
    .min(7, { message: 'Phone number is required.' })
    .regex(/^\+?[0-9\s().-]{7,20}$/, { message: 'Please enter a valid phone number.' }),
});

const Step2Schema = z.object({
  country: z.string().optional(),
  companyName: z.string().optional(),
});

const Step3Schema = z.object({
  companySizeRange: z.string().optional(),
  annualRevenueRange: z.string().optional(),
});

const stepSchemas = [Step1Schema, Step2Schema, Step3Schema];

type SellerOnboardingValues = z.infer<typeof Step1Schema> &
  z.infer<typeof Step2Schema> &
  z.infer<typeof Step3Schema>;

const TOTAL_STEPS = 3;

/** Map the current step's form values to user_profiles columns, omitting empty values. */
function profileUpdateForStep(step: number, values: SellerOnboardingValues): Record<string, string> {
  const pick = (obj: Record<string, string | undefined>) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v && v.trim() !== '')) as Record<string, string>;

  switch (step) {
    case 1:
      return pick({ full_name: values.fullName, phone_number: values.phoneNumber });
    case 2:
      return pick({ country: values.country, initial_company_name: values.companyName });
    case 3:
      return pick({
        company_size_range: values.companySizeRange,
        annual_revenue_range: values.annualRevenueRange,
      });
    default:
      return {};
  }
}

export default function SellerOnboardingStepPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { profile, refreshAuth } = useCurrentUser();
  const currentStep = parseInt(params.step as string, 10);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSkipping, setIsSkipping] = React.useState(false);

  const currentSchema = stepSchemas[currentStep - 1] || z.object({});
  const form = useForm<SellerOnboardingValues>({
    resolver: zodResolver(currentSchema as any),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      country: '',
      companyName: '',
      companySizeRange: '',
      annualRevenueRange: '',
    },
  });

  // Prefill from the saved profile so revisiting a step shows saved values.
  React.useEffect(() => {
    if (!profile) return;
    form.reset({
      fullName: profile.full_name || '',
      phoneNumber: profile.phone_number || '',
      country: profile.country || '',
      companyName: profile.initial_company_name || '',
      companySizeRange: profile.company_size_range || '',
      annualRevenueRange: profile.annual_revenue_range || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, currentStep]);

  const isFinalStep = currentStep === TOTAL_STEPS;

  const onSubmit = async (values: SellerOnboardingValues) => {
    setIsLoading(true);
    try {
      const update = profileUpdateForStep(currentStep, values);
      if (Object.keys(update).length > 0) {
        await updateUserProfile(update);
      }
      await updateOnboardingStatus({
        step_completed: currentStep,
        ...(isFinalStep && { complete_onboarding: true }),
      });
      // Refresh the cached profile so Previous/revisit prefills the values just saved
      await refreshAuth();

      if (isFinalStep) {
        toast({ title: 'Profile Complete!', description: 'Welcome to Nobridge. Your profile has been saved.' });
        router.push('/seller-dashboard');
      } else {
        router.push(`/onboarding/seller/${currentStep + 1}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      // No profile write — just mark onboarding done so the user is never routed back in.
      await updateOnboardingStatus({
        step_completed: currentStep - 1,
        complete_onboarding: true,
      });
      refreshAuth();
      router.push('/seller-dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      setIsSkipping(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      router.push(`/onboarding/seller/${currentStep - 1}`);
    }
  };

  const isBusy = isLoading || isSkipping;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <UserCircle className="h-7 w-7 text-primary" /> About You
              </CardTitle>
              <CardDescription>Tell us who you are so buyers know who they&apos;re talking to.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ContactStepFields control={form.control} isPending={isBusy} />
            </CardContent>
          </>
        );
      case 2:
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Building2 className="h-7 w-7 text-primary" /> Your Company
              </CardTitle>
              <CardDescription>Where do you operate and what is your company called?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CompanyStepFields control={form.control} isPending={isBusy} />
            </CardContent>
          </>
        );
      case 3:
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <TrendingUp className="h-7 w-7 text-primary" /> Business Details
              </CardTitle>
              <CardDescription>A rough picture of your business helps us match you with serious buyers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="companySizeRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size (Number of Employees)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={isBusy}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employeeCountRanges.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="annualRevenueRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Revenue (Approximate)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={isBusy}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select annual revenue range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {revenueRanges.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </>
        );
      default:
        return <p>Invalid step.</p>;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="bg-brand-white p-0 border-0 shadow-none">
          {renderStepContent()}

          <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-8 border-t mt-6 p-6 md:p-10">
            <div className="flex w-full sm:w-auto gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || isBusy}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isBusy}
                  className="text-muted-foreground"
                >
                  {isSkipping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Skip for now
                </Button>
              )}
            </div>

            <Button
              type="submit"
              disabled={isBusy}
              className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isFinalStep ? 'Finish' : 'Continue'}
              {isFinalStep ? (
                <CheckCircle className="ml-2 h-4 w-4" />
              ) : (
                <ArrowRight className="ml-2 h-4 w-4" />
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
