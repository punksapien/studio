'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { allCountries, employeeCountRanges, revenueRanges } from "@/lib/types";
import { useTransition, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { updateUserProfile } from "@/hooks/use-current-user";
import { useUserSettings } from "@/hooks/use-user-settings";
import { DashboardPageShell } from "@/components/shared/dashboard-page-shell";

const PrefsSchema = z.object({
  country: z.string().min(1, { message: "Country is required." }),
  initialCompanyName: z.string().optional(),
  companySizeRange: z.string().optional(),
  annualRevenueRange: z.string().optional(),
});

const defaultPrefsValues: z.infer<typeof PrefsSchema> = {
  country: "",
  initialCompanyName: "",
  companySizeRange: "",
  annualRevenueRange: "",
};

export default function SellerProfilePreferencesPage() {
  const { toast } = useToast();
  const router = useRouter();

  const { profile, isLoading, refreshAuth } = useAuth();

  const [isPrefsPending, startPrefsTransition] = useTransition();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Notification preferences (real, wired to the user settings API)
  const { settings, updateSettings } = useUserSettings();
  const [isSaving, setIsSaving] = useState(false);

  const prefsForm = useForm<z.infer<typeof PrefsSchema>>({
    resolver: zodResolver(PrefsSchema),
    defaultValues: defaultPrefsValues,
  });

  // Prefill the form from the profile once it's available
  useEffect(() => {
    if (profile && !hasInitialized) {
      prefsForm.reset({
        country: profile.country || "",
        initialCompanyName: profile.initial_company_name || "",
        companySizeRange: profile.company_size_range || "",
        annualRevenueRange: profile.annual_revenue_range || "",
      });
      setHasInitialized(true);
    }
  }, [profile, prefsForm, hasInitialized]);

  // Seller role guard
  useEffect(() => {
    if (profile && profile.role !== 'seller') {
      router.replace('/dashboard');
    }
  }, [profile, router]);

  const handleNotificationToggle = async (key: string, value: boolean) => {
    setIsSaving(true);
    try {
      const success = await updateSettings({ [key]: value });
      if (success) {
        toast({
          title: "Settings Updated",
          description: "Your notification preferences have been saved."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update settings. Please try again."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update settings. Please try again."
      });
    }
    setIsSaving(false);
  };

  const onPrefsSubmit = (values: z.infer<typeof PrefsSchema>) => {
    startPrefsTransition(async () => {
      try {
        await updateUserProfile({
          country: values.country,
          initial_company_name: values.initialCompanyName,
          company_size_range: values.companySizeRange,
          annual_revenue_range: values.annualRevenueRange,
        });
        toast({
          title: "Preferences Updated",
          description: "Your business profile preferences have been successfully updated."
        });
        await refreshAuth();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update preferences. Please try again."
        });
      }
    });
  };

  const backToSettings = (
    <Button asChild variant="outline" size="sm" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
      <Link href="/seller-dashboard/settings"><ArrowLeft className="h-4 w-4 mr-2" />Back to Settings</Link>
    </Button>
  );

  // Loading state. Also hold the spinner until the profile has been applied to the
  // forms (hasInitialized): the Radix Selects must mount AFTER reset or they render
  // stuck on their placeholder instead of the saved value.
  if (isLoading || (profile && !hasInitialized)) {
    return (
      <DashboardPageShell scrollable headerActions={backToSettings} title="Profile Preferences" description="Your business profile and notification preferences.">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your preferences...</p>
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell scrollable headerActions={backToSettings} title="Profile Preferences" description="Your business profile and notification preferences.">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Business Profile</CardTitle>
          <CardDescription>Update your business details used across your listings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...prefsForm}>
            <form onSubmit={prefsForm.handleSubmit(onPrefsSubmit)} className="space-y-6">
              <FormField
                control={prefsForm.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPrefsPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allCountries.map(country => (
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

              <FormField
                control={prefsForm.control}
                name="initialCompanyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name (for listing purposes)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Your Company Pte Ltd" disabled={isPrefsPending} />
                    </FormControl>
                    <FormDescription>This can be your registered business name or a trading name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={prefsForm.control}
                name="companySizeRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size (Number of Employees)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isPrefsPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employeeCountRanges.map(range => (
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
                control={prefsForm.control}
                name="annualRevenueRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Revenue Range</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isPrefsPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select annual revenue range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {revenueRanges.map(range => (
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

              <Button type="submit" disabled={isPrefsPending}>
                {isPrefsPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile Preferences"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive notifications related to your listings and inquiries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="email-general" className="font-medium">General Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive general updates and announcements from Nobridge.</p>
            </div>
            <Switch
              id="email-general"
              checked={settings?.email_notifications_general ?? true}
              onCheckedChange={(checked) => handleNotificationToggle('email_notifications_general', checked)}
              disabled={isSaving}
              aria-label="Toggle general email notifications"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="email-new-inquiry" className="font-medium">New Inquiry Emails</Label>
              <p className="text-sm text-muted-foreground">Receive an email when a buyer makes an inquiry on one of your listings.</p>
            </div>
            <Switch
              id="email-new-inquiry"
              checked={settings?.email_notifications_inquiries ?? true}
              onCheckedChange={(checked) => handleNotificationToggle('email_notifications_inquiries', checked)}
              disabled={isSaving}
              aria-label="Toggle new inquiry email notifications"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="email-listing-updates" className="font-medium">Listing Status Emails</Label>
              <p className="text-sm text-muted-foreground">Get notified via email about changes to your listing status (e.g., verification approved, deactivated).</p>
            </div>
            <Switch
              id="email-listing-updates"
              checked={settings?.email_notifications_listing_updates ?? true}
              onCheckedChange={(checked) => handleNotificationToggle('email_notifications_listing_updates', checked)}
              disabled={isSaving}
              aria-label="Toggle listing status email notifications"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="email-system" className="font-medium">System &amp; Security Emails</Label>
              <p className="text-sm text-muted-foreground">Important system notifications, security alerts, and policy updates.</p>
            </div>
            <Switch
              id="email-system"
              checked={settings?.email_notifications_system ?? true}
              onCheckedChange={(checked) => handleNotificationToggle('email_notifications_system', checked)}
              disabled={isSaving}
              aria-label="Toggle system email notifications"
            />
          </div>

          {isSaving && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Saving...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
