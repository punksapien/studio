'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import * as React from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { allCountries, BuyerPersonaTypes, PreferredInvestmentSizes } from "@/lib/types";
import { useTransition, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { DashboardPageShell } from "@/components/shared/dashboard-page-shell";

const PrefsSchema = z.object({
  country: z.string().min(1, { message: "Country is required." }),
  buyerPersonaType: z.enum(BuyerPersonaTypes, { required_error: "Buyer persona type is required." }),
  buyerPersonaOther: z.string().optional(),
  investmentFocusDescription: z.string().optional(),
  preferredInvestmentSize: z.enum(PreferredInvestmentSizes).optional(),
  keyIndustriesOfInterest: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.buyerPersonaType === "Other" && (!data.buyerPersonaOther || data.buyerPersonaOther.trim().length < 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify your role if 'Other' is selected for Buyer Persona.",
      path: ["buyerPersonaOther"],
    });
  }
});

const AccountSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  phoneNumber: z.string().min(1, { message: "Phone number is required." }),
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match.",
  path: ["confirmNewPassword"],
});

const defaultPrefsValues: Partial<z.infer<typeof PrefsSchema>> = {
  country: "",
  buyerPersonaType: undefined,
  buyerPersonaOther: "",
  investmentFocusDescription: "",
  preferredInvestmentSize: undefined,
  keyIndustriesOfInterest: "",
};

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const { user, profile, isLoading, refreshAuth } = useAuth();

  const [isPrefsPending, startPrefsTransition] = useTransition();
  const [isAccountPending, startAccountTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Notification preferences (local-state stub — not wired to an API)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newInquiryAlerts, setNewInquiryAlerts] = useState(true);
  const [listingStatusAlerts, setListingStatusAlerts] = useState(true);

  const prefsForm = useForm<z.infer<typeof PrefsSchema>>({
    resolver: zodResolver(PrefsSchema),
    defaultValues: defaultPrefsValues,
  });

  const accountForm = useForm<z.infer<typeof AccountSchema>>({
    resolver: zodResolver(AccountSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof PasswordChangeSchema>>({
    resolver: zodResolver(PasswordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Prefill both forms from the profile once it's available
  useEffect(() => {
    if (profile && !hasInitialized) {
      prefsForm.reset({
        country: profile.country || "",
        buyerPersonaType: (profile.buyer_persona_type as any) || undefined,
        buyerPersonaOther: profile.buyer_persona_other || "",
        investmentFocusDescription: profile.investment_focus_description || "",
        preferredInvestmentSize: (profile.preferred_investment_size as any) || undefined,
        keyIndustriesOfInterest: profile.key_industries_of_interest || "",
      });
      accountForm.reset({
        fullName: profile.full_name || "",
        phoneNumber: profile.phone_number || "",
      });
      setHasInitialized(true);
    }
  }, [profile, prefsForm, accountForm, hasInitialized]);

  // Buyer role guard
  useEffect(() => {
    if (profile && profile.role !== 'buyer') {
      router.replace('/seller-dashboard');
    }
  }, [profile, router]);

  const updateProfile = async (payload: Record<string, unknown>) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      let accessToken = session?.access_token;

      if (sessionError || !accessToken) {
        // Try to refresh the session
        await refreshAuth();
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (!newSession?.access_token) {
          throw new Error('Session expired. Please log in again.');
        }
        accessToken = newSession.access_token;
      }

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      return true;
    } catch (error) {
      console.error('[SETTINGS] Update error:', error);
      throw error;
    }
  };

  const onPrefsSubmit = (values: z.infer<typeof PrefsSchema>) => {
    startPrefsTransition(async () => {
      try {
        await updateProfile({
          country: values.country,
          buyer_persona_type: values.buyerPersonaType,
          buyer_persona_other: values.buyerPersonaOther,
          investment_focus_description: values.investmentFocusDescription,
          preferred_investment_size: values.preferredInvestmentSize,
          key_industries_of_interest: values.keyIndustriesOfInterest,
        });
        toast({
          title: "Preferences Updated",
          description: "Your buyer profile preferences have been successfully updated."
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

  const onAccountSubmit = (values: z.infer<typeof AccountSchema>) => {
    startAccountTransition(async () => {
      try {
        await updateProfile({
          full_name: values.fullName,
          phone_number: values.phoneNumber,
        });
        toast({
          title: "Account Details Updated",
          description: "Your account details have been successfully updated."
        });
        await refreshAuth();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update account details. Please try again."
        });
      }
    });
  };

  const onPasswordSubmit = (values: z.infer<typeof PasswordChangeSchema>) => {
    startPasswordTransition(async () => {
      console.log("Password change values:", values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (values.currentPassword === "wrongpassword") {
        passwordForm.setError("currentPassword", { type: "manual", message: "Incorrect current password."});
        toast({ variant: "destructive", title: "Error", description: "Failed to change password. Incorrect current password." });
      } else {
        toast({ title: "Password Changed", description: "Your password has been successfully updated." });
        passwordForm.reset();
      }
    });
  };

  const handleNotificationPreferenceSave = () => {
    console.log("Notification preferences saved:", { emailNotifications, newInquiryAlerts, listingStatusAlerts });
    toast({ title: "Preferences Saved", description: "Your notification preferences have been updated."});
  };

  const watchedBuyerPersonaType = prefsForm.watch("buyerPersonaType");

  // Loading state. Also hold the spinner until the profile has been applied to the
  // forms (hasInitialized): the Radix Selects must mount AFTER reset or they render
  // stuck on their placeholder instead of the saved value.
  if (isLoading || (profile && !hasInitialized)) {
    return (
      <DashboardPageShell scrollable title="Settings" description="Manage your profile preferences and account.">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your settings...</p>
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell scrollable title="Settings" description="Manage your profile preferences and account.">
      {/* ---------- Profile Preferences ---------- */}
      <h2 className="text-xl font-semibold">Profile Preferences</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Buyer Profile & Investment Focus</CardTitle>
          <CardDescription>Update your buyer persona and what you're looking to invest in.</CardDescription>
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
                name="buyerPersonaType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a/an: (Primary Role / Buyer Type)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isPrefsPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your primary role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BuyerPersonaTypes.map(type => (
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

              {watchedBuyerPersonaType === "Other" && (
                <FormField
                  control={prefsForm.control}
                  name="buyerPersonaOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please Specify Role</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Your specific role" disabled={isPrefsPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={prefsForm.control}
                name="investmentFocusDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Focus or What You're Looking For</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g., SaaS businesses in Southeast Asia with $100k-$1M ARR..."
                        disabled={isPrefsPending}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what types of businesses or investments you're interested in
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={prefsForm.control}
                name="preferredInvestmentSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Investment Size (Approximate)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isPrefsPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preferred investment size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PreferredInvestmentSizes.map(size => (
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

              <FormField
                control={prefsForm.control}
                name="keyIndustriesOfInterest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Industries of Interest</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g., Technology, E-commerce, Healthcare, Manufacturing..."
                        disabled={isPrefsPending}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      List the industries you're most interested in investing in or acquiring businesses from
                    </FormDescription>
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
          <CardDescription>Manage how you receive notifications from Nobridge.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="email-notifications-general" className="font-medium">General Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive important account updates, system announcements, and newsletters.</p>
            </div>
            <Switch
              id="email-notifications-general"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              aria-label="Toggle general email notifications"
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="email-new-inquiry" className="font-medium">New Inquiry Emails</Label>
              <p className="text-sm text-muted-foreground">Receive an email when a buyer makes an inquiry on one of your listings (for sellers) or when a seller engages (for buyers).</p>
            </div>
            <Switch
              id="email-new-inquiry"
              checked={newInquiryAlerts}
              onCheckedChange={setNewInquiryAlerts}
              aria-label="Toggle new inquiry email notifications"
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="email-listing-updates" className="font-medium">Listing &amp; Verification Status Emails</Label>
              <p className="text-sm text-muted-foreground">Get notified via email about changes to your listing status or verification progress.</p>
            </div>
            <Switch
              id="email-listing-updates"
              checked={listingStatusAlerts}
              onCheckedChange={setListingStatusAlerts}
              aria-label="Toggle listing status email notifications"
            />
          </div>
          <Button onClick={handleNotificationPreferenceSave}>Save Notification Preferences</Button>
        </CardContent>
      </Card>

      {/* ---------- Account Management ---------- */}
      <h2 className="text-xl font-semibold">Account Management</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Account Details</CardTitle>
          <CardDescription>
            Your email ({user?.email}) cannot be changed here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...accountForm}>
            <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-6">
              <FormField
                control={accountForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isAccountPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={accountForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" disabled={isAccountPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isAccountPending}>
                {isAccountPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Account Details"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center"><KeyRound className="mr-2 h-5 w-5"/>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="currentPassword">Current Password</FormLabel>
                    <FormControl><Input id="currentPassword" {...field} type="password" disabled={isPasswordPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="newPassword">New Password</FormLabel>
                    <FormControl><Input id="newPassword" {...field} type="password" disabled={isPasswordPending} /></FormControl>
                    <FormDescription className="text-xs">Must be at least 8 characters.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="confirmNewPassword">Confirm New Password</FormLabel>
                    <FormControl><Input id="confirmNewPassword" {...field} type="password" disabled={isPasswordPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPasswordPending}>
                {isPasswordPending ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Deactivate Account
          </CardTitle>
          <CardDescription>Manage sensitive account actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium text-foreground">Deactivate Account</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Deactivating your account will temporarily hide your profile and listings. You can reactivate it later.
            </p>
            <Button variant="outline" disabled className="border-destructive text-destructive hover:bg-destructive/10">
              Deactivate My Account
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
          </div>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
