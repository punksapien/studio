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
import { InlineEditField } from '@/components/onboarding/inline-edit-field';
import { allCountries, BuyerPersonaTypes, PreferredInvestmentSizes } from '@/lib/types';
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

export default function BuyerOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoading, refreshAuth } = useAuth();
  const { toast } = useToast();
  const [isSavingContact, startSavingContact] = useTransition();

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

  // Prefill the contact form from the saved profile once it loads. Keyed on
  // profile.id so the 60s refreshAuth poll — which yields a new profile object but
  // the same id — never re-runs this and never wipes in-progress edits. The
  // finish-off rows read straight from `profile`, so they need no reset here.
  useEffect(() => {
    if (!profile) return;
    contactForm.reset({
      additional_email: profile.additional_email || '',
      additional_phone: profile.additional_phone || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Save a single finish-off field to its user_profiles column. Trims and coerces
  // empty strings to null. Re-throws on failure so the InlineEditField reverts.
  const saveField = async (column: string, value: string) => {
    try {
      await updateUserProfile({ [column]: value.trim() || null });
      await refreshAuth();
      toast({ title: 'Saved', description: 'Your details have been updated.' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Could not save',
        description: e instanceof Error ? e.message : 'Please try again.',
      });
      throw e; // let the field revert to display on failure
    }
  };

  // Persona is special: switching away from 'Other' must also clear the free-text
  // "other" value. When it stays 'Other', the newly-shown row saves it on its own.
  const savePersona = async (value: string) => {
    const v = value.trim();
    try {
      const update: Record<string, string | null> =
        v !== 'Other'
          ? { buyer_persona_type: v || null, buyer_persona_other: null }
          : { buyer_persona_type: v };
      await updateUserProfile(update);
      await refreshAuth();
      toast({ title: 'Saved', description: 'Your details have been updated.' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Could not save',
        description: e instanceof Error ? e.message : 'Please try again.',
      });
      throw e; // let the field revert to display on failure
    }
  };

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
      <Card className="bg-brand-light-gray">
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
          <div className="border-l-2 border-primary bg-white p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Nothing else is required from you right now.</span>{' '}
              Please wait 72 hours and check your email. We&apos;ll be in touch.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact card */}
      <Card className="bg-brand-light-gray">
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

      {/* Clean break between the concierge welcome and the optional details form.
          Caption centered on the line so it has equal spacing above and below. */}
      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Optional — while you wait
        </span>
        <Separator className="flex-1" />
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
        <CardContent className="space-y-6">
          <InlineEditField
            label="Full Name"
            value={profile?.full_name || ''}
            type="text"
            placeholder="Your full name"
            onSave={(v) => saveField('full_name', v)}
          />
          <InlineEditField
            label="Country"
            value={profile?.country || ''}
            type="select"
            options={allCountries}
            placeholder="Select your country"
            onSave={(v) => saveField('country', v)}
          />
          <InlineEditField
            label="Company Name"
            value={profile?.initial_company_name || ''}
            type="text"
            placeholder="Your company name"
            onSave={(v) => saveField('initial_company_name', v)}
          />
          <InlineEditField
            label="I am a/an: (Primary Role / Buyer Type)"
            value={profile?.buyer_persona_type || ''}
            type="select"
            options={BuyerPersonaTypes}
            placeholder="Select your primary role"
            onSave={savePersona}
          />
          {profile?.buyer_persona_type === 'Other' && (
            <InlineEditField
              label="Please Specify Role"
              value={profile?.buyer_persona_other || ''}
              type="text"
              placeholder="Your specific role"
              onSave={(v) => saveField('buyer_persona_other', v)}
            />
          )}
          <InlineEditField
            label="Investment Focus or What You're Looking For"
            value={profile?.investment_focus_description || ''}
            type="textarea"
            placeholder="e.g., SaaS businesses in Southeast Asia with $100k-$1M ARR, turnarounds in manufacturing, e-commerce brands for scaling."
            onSave={(v) => saveField('investment_focus_description', v)}
          />
          <InlineEditField
            label="Preferred Investment Size (Approximate)"
            value={profile?.preferred_investment_size || ''}
            type="select"
            options={PreferredInvestmentSizes}
            placeholder="Select preferred investment size"
            onSave={(v) => saveField('preferred_investment_size', v)}
          />
          <InlineEditField
            label="Key Industries of Interest"
            value={profile?.key_industries_of_interest || ''}
            type="textarea"
            placeholder="e.g., Technology, E-commerce, Healthcare, Manufacturing, B2B Services. Please list a few."
            onSave={(v) => saveField('key_industries_of_interest', v)}
          />
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
