'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Loader2, Mail, Plus, Sparkles } from 'lucide-react';
import { DashboardPageShell } from '@/components/shared/dashboard-page-shell';
import { CollapsibleField } from '@/components/onboarding/collapsible-field';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/hooks/use-current-user';
import { allCountries, BuyerPersonaTypes, PreferredInvestmentSizes } from '@/lib/types';

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
  additionalEmail: z.string().optional(),
  additionalPhone: z.string().optional(),
}).refine(
  data => data.buyerPersonaType !== 'Other' || (data.buyerPersonaOther && data.buyerPersonaOther.trim() !== ''),
  { message: "Please specify your role if 'Other' is selected.", path: ['buyerPersonaOther'] }
);

type DetailsValues = z.infer<typeof DetailsSchema>;
type FieldName = keyof DetailsValues;

// Finish-off fields, in display order (buyerPersonaOther is a conditional child of buyerPersonaType).
const DETAIL_FIELDS: FieldName[] = [
  'fullName',
  'phoneNumber',
  'country',
  'companyName',
  'buyerPersonaType',
  'investmentFocusDescription',
  'preferredInvestmentSize',
  'keyIndustriesOfInterest',
];

// Alternative contact fields, handled with the same reveal pattern.
const CONTACT_FIELDS: FieldName[] = ['additionalEmail', 'additionalPhone'];

// camelCase form name → user_profiles column.
const COLUMN_MAP: Record<FieldName, string> = {
  fullName: 'full_name',
  phoneNumber: 'phone_number',
  country: 'country',
  companyName: 'initial_company_name',
  buyerPersonaType: 'buyer_persona_type',
  buyerPersonaOther: 'buyer_persona_other',
  investmentFocusDescription: 'investment_focus_description',
  preferredInvestmentSize: 'preferred_investment_size',
  keyIndustriesOfInterest: 'key_industries_of_interest',
  additionalEmail: 'additional_email',
  additionalPhone: 'additional_phone',
};

// Short labels used by the "+ Add <label>" buttons.
const FIELD_LABELS: Record<FieldName, string> = {
  fullName: 'Full Name',
  phoneNumber: 'Phone Number',
  country: 'Country',
  companyName: 'Company Name',
  buyerPersonaType: 'Primary Role / Buyer Type',
  buyerPersonaOther: 'Role',
  investmentFocusDescription: 'Investment Focus',
  preferredInvestmentSize: 'Preferred Investment Size',
  keyIndustriesOfInterest: 'Key Industries of Interest',
  additionalEmail: 'another email',
  additionalPhone: 'another phone',
};

export default function BuyerOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoading, refreshAuth } = useAuth();
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();

  // Fields the user has explicitly revealed via a "+ Add" button.
  const [revealed, setRevealed] = useState<Set<FieldName>>(new Set());
  // Gate the form's controls until the profile has been applied via form.reset().
  // Radix Selects must mount AFTER the reset so they reflect their saved value;
  // mounting them empty and resetting afterward leaves them stuck on the placeholder.
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
      additionalEmail: '',
      additionalPhone: '',
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
      additionalEmail: profile.additional_email || '',
      additionalPhone: profile.additional_phone || '',
    });
    // Mount the controls now that values are applied (batched with reset above so
    // Selects first render WITH their saved value). Keyed on profile.id so the 60s
    // refreshAuth poll — which yields a new profile object but the same id — never
    // re-runs this and never wipes in-progress edits.
    setIsPrefilled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // A field is "initial" if the loaded profile already holds a value for it.
  const initialValues = useMemo<Record<FieldName, string>>(() => ({
    fullName: profile?.full_name || '',
    phoneNumber: profile?.phone_number || '',
    country: profile?.country || '',
    companyName: profile?.initial_company_name || '',
    buyerPersonaType: profile?.buyer_persona_type || '',
    buyerPersonaOther: profile?.buyer_persona_other || '',
    investmentFocusDescription: profile?.investment_focus_description || '',
    preferredInvestmentSize: profile?.preferred_investment_size || '',
    keyIndustriesOfInterest: profile?.key_industries_of_interest || '',
    additionalEmail: profile?.additional_email || '',
    additionalPhone: profile?.additional_phone || '',
  }), [profile]);

  const hasInitial = (name: FieldName) => Boolean(initialValues[name] && initialValues[name].trim() !== '');
  // A field is shown if it was pre-filled or has been revealed. Pre-filled fields
  // are always visible with no remove control; revealed ones get a ✕ to collapse.
  const isShown = (name: FieldName) => hasInitial(name) || revealed.has(name);

  const buyerPersonaType = form.watch('buyerPersonaType');

  const handleReveal = (name: FieldName) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  };

  const handleRemove = (name: FieldName) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
    form.setValue(name, '');
    // The persona "Other" free-text is a child of the persona field — clear it too.
    if (name === 'buyerPersonaType') {
      form.setValue('buyerPersonaOther', '');
    }
  };

  const renderField = (name: FieldName) => {
    switch (name) {
      case 'fullName':
        return (
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="John Doe" autoComplete="name" disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'phoneNumber':
        return (
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" placeholder="+1 555 123 4567" autoComplete="tel" disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'country':
        return (
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''} disabled={isSaving}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {allCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'companyName':
        return (
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Company Name" autoComplete="organization" disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'buyerPersonaType':
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="buyerPersonaType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>I am a/an: (Primary Role / Buyer Type)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={isSaving}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your primary role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BuyerPersonaTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {buyerPersonaType === 'Other' && (
              <FormField
                control={form.control}
                name="buyerPersonaOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please Specify Role</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your specific role" disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        );
      case 'investmentFocusDescription':
        return (
          <FormField
            control={form.control}
            name="investmentFocusDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Investment Focus or What You&apos;re Looking For</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="e.g., SaaS businesses in Southeast Asia with $100k-$1M ARR, turnarounds in manufacturing, e-commerce brands for scaling."
                    disabled={isSaving}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>Briefly describe your primary investment criteria or the types of businesses you are seeking.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'preferredInvestmentSize':
        return (
          <FormField
            control={form.control}
            name="preferredInvestmentSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Investment Size (Approximate)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''} disabled={isSaving}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred investment size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PreferredInvestmentSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'keyIndustriesOfInterest':
        return (
          <FormField
            control={form.control}
            name="keyIndustriesOfInterest"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key Industries of Interest</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="e.g., Technology, E-commerce, Healthcare, Manufacturing, B2B Services. Please list a few."
                    disabled={isSaving}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'additionalEmail':
        return (
          <FormField
            control={form.control}
            name="additionalEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isSaving}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'additionalPhone':
        return (
          <FormField
            control={form.control}
            name="additionalPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Phone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+1 555 123 4567"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isSaving}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      default:
        return null;
    }
  };

  const hiddenDetailFields = DETAIL_FIELDS.filter((name) => !isShown(name));
  const hiddenContactFields = CONTACT_FIELDS.filter((name) => !isShown(name));

  // Render the form once prefill has run. When there's no profile at all (e.g. the
  // dev preview override with no session) there's nothing to prefill, so it's ready.
  const detailsReady = isPrefilled || !profile;

  const onSubmit = (values: DetailsValues) => {
    startSaving(async () => {
      try {
        // Only persist fields that are shown and non-empty → their snake_case columns.
        const update: Record<string, string> = {};
        for (const name of [...DETAIL_FIELDS, ...CONTACT_FIELDS]) {
          if (!isShown(name)) continue;
          const value = values[name];
          if (value && value.trim() !== '') {
            update[COLUMN_MAP[name]] = value.trim();
          }
        }
        // Persona "Other" free-text only when the persona field is shown and set to Other.
        if (isShown('buyerPersonaType') && values.buyerPersonaType === 'Other') {
          const other = values.buyerPersonaOther;
          if (other && other.trim() !== '') {
            update[COLUMN_MAP.buyerPersonaOther] = other.trim();
          }
        }

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Editable list: pre-filled fields (no remove) + revealed fields (with ✕) */}
              <div className="space-y-6">
                {DETAIL_FIELDS.map((name) => (
                  <CollapsibleField
                    key={name}
                    label={FIELD_LABELS[name]}
                    shown={isShown(name)}
                    removable={!hasInitial(name)}
                    onRemove={() => handleRemove(name)}
                  >
                    {renderField(name)}
                  </CollapsibleField>
                ))}
              </div>

              {/* Add anything you skipped */}
              {hiddenDetailFields.length > 0 && (
                <div className="space-y-3 border-t pt-6">
                  <p className="text-sm font-medium text-foreground">Add anything you skipped</p>
                  <div className="flex flex-wrap gap-2">
                    {hiddenDetailFields.map((name) => (
                      <Button
                        key={name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleReveal(name)}
                        disabled={isSaving}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add {FIELD_LABELS[name]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative contact methods */}
              <div className="space-y-4 border-t pt-6">
                <div>
                  <h4 className="font-semibold text-foreground">Alternative contact methods</h4>
                  <p className="text-sm text-muted-foreground">
                    Here are the details we have on file. If there&apos;s another email or phone
                    number where we can reach you, add it below.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Account Email
                  </p>
                  <p className="flex items-center gap-2 text-sm text-foreground">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {profile?.email || 'Not provided'}
                  </p>
                </div>

                {CONTACT_FIELDS.map((name) => (
                  <CollapsibleField
                    key={name}
                    label={FIELD_LABELS[name]}
                    shown={isShown(name)}
                    removable={!hasInitial(name)}
                    onRemove={() => handleRemove(name)}
                  >
                    {renderField(name)}
                  </CollapsibleField>
                ))}

                {hiddenContactFields.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hiddenContactFields.map((name) => (
                      <Button
                        key={name}
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary"
                        onClick={() => handleReveal(name)}
                        disabled={isSaving}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add {FIELD_LABELS[name]}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
