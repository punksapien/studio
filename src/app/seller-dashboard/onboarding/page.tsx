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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Loader2, Mail, Phone, Sparkles } from 'lucide-react';
import { DashboardPageShell } from '@/components/shared/dashboard-page-shell';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/hooks/use-current-user';

const ONBOARDING_DESCRIPTION = "Welcome to Nobridge. Here's what happens next.";

// Loose phone pattern shared with the verification request API.
const PHONE_REGEX = /^[+]?[\d\s\-().]{5,24}$/;

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

export default function SellerOnboardingPage() {
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

  // This page is pre-verification only — verified sellers get bounced to the dashboard.
  useEffect(() => {
    if (!previewStatus && profile?.verification_status === 'verified') {
      router.replace('/seller-dashboard');
    }
  }, [previewStatus, profile?.verification_status, router]);

  // The SWR 'auth' cache only refreshes every ~10 min, so a seller verified by the
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

  const form = useForm<ContactValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      additional_email: '',
      additional_phone: '',
    },
  });

  // Prefill from profile once it loads.
  const additionalEmailValue = profile?.additional_email ?? '';
  const additionalPhoneValue = profile?.additional_phone ?? '';
  useEffect(() => {
    form.reset({
      additional_email: additionalEmailValue,
      additional_phone: additionalPhoneValue,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [additionalEmailValue, additionalPhoneValue]);

  const onSubmit = (values: ContactValues) => {
    startSaving(async () => {
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
            You&apos;ve taken the first steps toward selling your business. From here, our team does the
            heavy lifting. You won&apos;t have to fill out long forms or upload documents on your own.
          </p>
          <div>
            <h4 className="mb-3 font-semibold text-foreground">What happens next</h4>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                  1
                </span>
                <span className="text-muted-foreground">
                  Our team will be in touch soon, within the next 72 hours, to review your account
                  and help you complete verification.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                  2
                </span>
                <span className="text-muted-foreground">
                  Once you&apos;re verified, we&apos;ll build and publish an optimized listing for you.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                  3
                </span>
                <span className="text-muted-foreground">
                  Buyers will start sending you inquiries, and you&apos;ll respond right here in your
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save contact details
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
