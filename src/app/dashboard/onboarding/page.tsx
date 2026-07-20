'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import { useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2, Sparkles } from 'lucide-react';
import { DashboardPageShell } from '@/components/shared/dashboard-page-shell';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/hooks/use-current-user';
import { ContactStepFields } from '@/components/onboarding/steps/contact-step';
import { CompanyStepFields } from '@/components/onboarding/steps/company-step';
import { BuyerDetailsStepFields } from '@/components/onboarding/steps/buyer-details-step';

const ONBOARDING_DESCRIPTION = "Welcome to Nobridge. Here's what happens next.";

// Catch-up / edit form: mirrors the buyer wizard's fields but everything is optional.
const DetailsSchema = z.object({
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
  country: z.string().optional(),
  companyName: z.string().optional(),
  buyerPersonaType: z.string().optional(),
  buyerPersonaOther: z.string().optional(),
  investmentFocusDescription: z.string().optional(),
  preferredInvestmentSize: z.string().optional(),
  keyIndustriesOfInterest: z.string().optional(),
}).refine(
  data => data.buyerPersonaType !== 'Other' || (data.buyerPersonaOther && data.buyerPersonaOther.trim() !== ''),
  { message: "Please specify your role if 'Other' is selected.", path: ['buyerPersonaOther'] }
);

type DetailsValues = z.infer<typeof DetailsSchema>;

export default function BuyerOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoading, refreshAuth } = useAuth();
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();

  // TEMPORARY DEV PREVIEW — dev-only state override
  // (?preview_status=anonymous|pending_verification|verified|rejected). Forces the
  // pre-verification view even when unauthenticated so the page can be previewed.
  const previewStatus =
    process.env.NODE_ENV === 'development' ? searchParams.get('preview_status') : null;

  const effectiveStatus = previewStatus ?? profile?.verification_status ?? null;
  const isVerified = effectiveStatus === 'verified';

  // This page is pre-verification only — verified buyers get bounced to the dashboard.
  useEffect(() => {
    if (!previewStatus && profile?.verification_status === 'verified') {
      router.replace('/dashboard');
    }
  }, [previewStatus, profile?.verification_status, router]);

  // The SWR 'auth' cache only refreshes every ~10 min, so a buyer verified by the
  // team while sitting here could stay locked for that long. Refresh auth on window
  // focus and on a 60s interval so the nav/dashboard unlocks within ~1 min without a
  // manual reload. Skipped under the dev preview override (no polling in preview).
  useEffect(() => {
    if (previewStatus) return;
    if (typeof refreshAuth !== 'function') return;

    const handleFocus = () => {
      refreshAuth();
    };
    window.addEventListener('focus', handleFocus);
    const intervalId = setInterval(() => {
      refreshAuth();
    }, 60_000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [previewStatus, refreshAuth]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  const form = useForm<DetailsValues>({
    resolver: zodResolver(DetailsSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      country: '',
      companyName: '',
      buyerPersonaType: '',
      buyerPersonaOther: '',
      investmentFocusDescription: '',
      preferredInvestmentSize: '',
      keyIndustriesOfInterest: '',
    },
  });

  // Prefill from the saved profile once it loads.
  useEffect(() => {
    if (!profile) return;
    form.reset({
      fullName: profile.full_name || '',
      phoneNumber: profile.phone_number || '',
      country: profile.country || '',
      companyName: profile.initial_company_name || '',
      buyerPersonaType: profile.buyer_persona_type || '',
      buyerPersonaOther: profile.buyer_persona_other || '',
      investmentFocusDescription: profile.investment_focus_description || '',
      preferredInvestmentSize: profile.preferred_investment_size || '',
      keyIndustriesOfInterest: profile.key_industries_of_interest || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const onSubmit = (values: DetailsValues) => {
    startSaving(async () => {
      try {
        // Map camelCase → user_profiles columns, omitting empty strings.
        const candidates: Record<string, string | undefined> = {
          full_name: values.fullName,
          phone_number: values.phoneNumber,
          country: values.country,
          initial_company_name: values.companyName,
          buyer_persona_type: values.buyerPersonaType,
          buyer_persona_other: values.buyerPersonaType === 'Other' ? values.buyerPersonaOther : undefined,
          investment_focus_description: values.investmentFocusDescription,
          preferred_investment_size: values.preferredInvestmentSize,
          key_industries_of_interest: values.keyIndustriesOfInterest,
        };
        const update = Object.fromEntries(
          Object.entries(candidates).filter(([, v]) => v && v.trim() !== '')
        ) as Record<string, string>;

        if (Object.keys(update).length > 0) {
          await updateUserProfile(update);
        }
        await refreshAuth();
        toast({
          title: 'Details saved',
          description: "Thanks. We've updated your profile.",
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Could not save',
          description:
            error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        });
      }
    });
  };

  // While we resolve auth (and no preview override), show the spinner.
  if (isLoading && !previewStatus) {
    return (
      <DashboardPageShell title="Onboarding" description={ONBOARDING_DESCRIPTION} scrollable>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading...</span>
        </div>
      </DashboardPageShell>
    );
  }

  // Verified users are being redirected — avoid flashing the onboarding content.
  if (isVerified && !previewStatus) {
    return (
      <DashboardPageShell title="Onboarding" description={ONBOARDING_DESCRIPTION} scrollable>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Redirecting to your dashboard...</span>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell title="Onboarding" description={ONBOARDING_DESCRIPTION} scrollable>
      {/* Welcome card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" /> Hey {firstName} 👋
          </CardTitle>
          <CardDescription>
            Thank you for signing up on Nobridge. We&apos;re glad you&apos;re here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            You&apos;ve taken the first step toward finding your next business. From here, our team
            takes a quick look to verify your account. You won&apos;t have to jump through hoops to
            get started.
          </p>
          <div>
            <h4 className="mb-3 font-semibold text-foreground">What happens next</h4>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                  1
                </span>
                <span className="text-muted-foreground">
                  Our team will review your account and complete your verification, usually within
                  the next 72 hours.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                  2
                </span>
                <span className="text-muted-foreground">
                  Once you&apos;re verified, you&apos;ll be able to browse full listing details and
                  contact sellers directly.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                  3
                </span>
                <span className="text-muted-foreground">
                  Your inquiries and conversations with sellers all happen right here in your
                  dashboard.
                </span>
              </li>
            </ol>
          </div>
          <div className="border-l-2 border-primary bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Nothing else is required from you right now.</span>{' '}
              Please wait 72 hours and check your email. We&apos;ll be in touch.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Finish off your details card */}
      <Card>
        <CardHeader>
          <CardTitle>Finish off your details</CardTitle>
          <CardDescription>
            Filled something out already? Great. Anything you skipped during sign-up you can complete
            or edit here while we verify you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <ContactStepFields control={form.control} isPending={isSaving} />
              <CompanyStepFields control={form.control} isPending={isSaving} />
              <BuyerDetailsStepFields control={form.control} isPending={isSaving} />
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save my details
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
