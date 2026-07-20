'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Phone, Sparkles } from 'lucide-react';
import { DashboardPageShell } from '@/components/shared/dashboard-page-shell';
import { ContactStepFields } from '@/components/onboarding/steps/contact-step';
import { CompanyStepFields } from '@/components/onboarding/steps/company-step';
import { BuyerDetailsStepFields } from '@/components/onboarding/steps/buyer-details-step';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/hooks/use-current-user';

const ONBOARDING_DESCRIPTION = "Welcome to Nobridge. Here's what happens next.";

// Loose phone pattern shared with the verification request API.
const PHONE_REGEX = /^[+]?[\d\s\-().]{5,24}$/;

// Alternative contact methods form — mirrors the seller onboarding page.
const ContactSchema = z.object({
  additional_email: z
    .string()
    .trim()
    .max(255, { message: 'Email must be 255 characters or fewer.' })
    .email({ message: 'Please enter a valid email address.' })
    .optional()
    .or(z.literal('')),
  additional_phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, { message: 'Please enter a valid phone number.' })
    .optional()
    .or(z.literal('')),
});

type ContactValues = z.infer<typeof ContactSchema>;

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

// Map the finish-off form's camelCase values → user_profiles columns, omitting empty
// values. Mirrors the buyer wizard's profileUpdateForStep mapping/omit-empty logic.
function detailsProfileUpdate(values: DetailsValues): Record<string, string> {
  const pick = (obj: Record<string, string | undefined>) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v && v.trim() !== '')) as Record<string, string>;

  return pick({
    full_name: values.fullName,
    phone_number: values.phoneNumber,
    country: values.country,
    initial_company_name: values.companyName,
    buyer_persona_type: values.buyerPersonaType,
    buyer_persona_other: values.buyerPersonaType === 'Other' ? values.buyerPersonaOther : undefined,
    investment_focus_description: values.investmentFocusDescription,
    preferred_investment_size: values.preferredInvestmentSize,
    key_industries_of_interest: values.keyIndustriesOfInterest,
  });
}

export default function BuyerOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoading, refreshAuth } = useAuth();
  const { toast } = useToast();
  const [isSavingContact, startSavingContact] = useTransition();
  const [isSavingDetails, startSavingDetails] = useTransition();

  // Gate the finish-off form's controls until the profile has been applied via
  // form.reset(). Radix Selects must mount AFTER the reset so they reflect their
  // saved value; mounting them empty and resetting afterward leaves them stuck on
  // the placeholder.
  const [isPrefilled, setIsPrefilled] = useState(false);

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

  const contactForm = useForm<ContactValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      additional_email: '',
      additional_phone: '',
    },
  });

  const detailsForm = useForm<DetailsValues>({
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

  // Prefill both forms from the saved profile once it loads. Keyed on profile.id so
  // the 60s refreshAuth poll — which yields a new profile object but the same id —
  // never re-runs this and never wipes in-progress edits. The details form's Selects
  // are mounted only after this reset (see detailsReady) so they show saved values.
  useEffect(() => {
    if (!profile) return;
    contactForm.reset({
      additional_email: profile.additional_email || '',
      additional_phone: profile.additional_phone || '',
    });
    detailsForm.reset({
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
    setIsPrefilled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Render the finish-off form once prefill has run. When there's no profile at all
  // (e.g. the dev preview override with no session) there's nothing to prefill, so
  // it's ready.
  const detailsReady = isPrefilled || !profile;

  const onContactSubmit = (values: ContactValues) => {
    startSavingContact(async () => {
      try {
        await updateUserProfile({
          additional_email: values.additional_email?.trim() || null,
          additional_phone: values.additional_phone?.trim() || null,
        });
        toast({
          title: 'Contact details saved',
          description: "Thanks. We'll use these to reach you if we need to.",
        });
        await refreshAuth();
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

  const onDetailsSubmit = (values: DetailsValues) => {
    startSavingDetails(async () => {
      try {
        const update = detailsProfileUpdate(values);
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

      {/* Contact card */}
      <Card>
        <CardHeader>
          <CardTitle>Let us know if you have any alternative contact methods</CardTitle>
          <CardDescription>
            Here are the details we have on file. If there&apos;s another email or phone number where
            we can reach you, add it below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Account Email
              </p>
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                {profile?.email || 'Not provided'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Phone Number
              </p>
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                {profile?.phone_number || 'Not provided'}
              </p>
            </div>
          </div>

          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={contactForm.control}
                  name="additional_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="additional_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1 555 123 4567"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription>
                Leave a field blank to clear it. This is entirely optional.
              </FormDescription>
              <Button type="submit" disabled={isSavingContact}>
                {isSavingContact && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save contact details
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Clean break between the concierge welcome and the optional details form */}
      <div className="space-y-2">
        <Separator />
        <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Optional — while you wait
        </p>
      </div>

      {/* Finish off your details card */}
      <Card>
        <CardHeader>
          <CardTitle>Finish off your details</CardTitle>
          <CardDescription>
            Edit anything you&apos;ve already submitted below, and add anything you skipped during
            sign-up. It all helps our team verify you faster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!detailsReady ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading your details...</span>
            </div>
          ) : (
            <Form {...detailsForm}>
              <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)} className="space-y-6">
                <ContactStepFields control={detailsForm.control} isPending={isSavingDetails} />
                <CompanyStepFields control={detailsForm.control} isPending={isSavingDetails} />
                <BuyerDetailsStepFields control={detailsForm.control} isPending={isSavingDetails} />

                <Button type="submit" disabled={isSavingDetails}>
                  {isSavingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save my details
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
