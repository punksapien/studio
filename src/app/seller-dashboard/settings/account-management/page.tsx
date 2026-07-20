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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransition, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, KeyRound, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useSellerProfile } from "@/hooks/use-seller-profile";
import { updateUserProfile } from "@/hooks/use-current-user";
import { DashboardPageShell } from "@/components/shared/dashboard-page-shell";

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

export default function SellerAccountManagementPage() {
  const { toast } = useToast();
  const router = useRouter();

  const { user, profile, isLoading, refreshAuth } = useAuth();
  const { changePassword } = useSellerProfile();

  const [isAccountPending, startAccountTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [hasInitialized, setHasInitialized] = useState(false);

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

  // Prefill the account form from the profile once it's available
  useEffect(() => {
    if (profile && !hasInitialized) {
      accountForm.reset({
        fullName: profile.full_name || "",
        phoneNumber: profile.phone_number || "",
      });
      setHasInitialized(true);
    }
  }, [profile, accountForm, hasInitialized]);

  // Seller role guard
  useEffect(() => {
    if (profile && profile.role !== 'seller') {
      router.replace('/dashboard');
    }
  }, [profile, router]);

  const onAccountSubmit = (values: z.infer<typeof AccountSchema>) => {
    startAccountTransition(async () => {
      try {
        await updateUserProfile({
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
      try {
        await changePassword(values.currentPassword, values.newPassword);
        toast({
          title: "Password Changed",
          description: "Your password has been successfully updated."
        });
        passwordForm.reset();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to change password";
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
        });
      }
    });
  };

  const backToSettings = (
    <Button asChild variant="outline" size="sm" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
      <Link href="/seller-dashboard/settings"><ArrowLeft className="h-4 w-4 mr-2" />Back to Settings</Link>
    </Button>
  );

  if (isLoading || (profile && !hasInitialized)) {
    return (
      <DashboardPageShell scrollable headerActions={backToSettings} title="Account Management" description="Your name, phone, password, and account status.">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your account...</p>
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell scrollable headerActions={backToSettings} title="Account Management" description="Your name, phone, password, and account status.">
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
                    <FormLabel>Current Password</FormLabel>
                    <FormControl><Input {...field} type="password" disabled={isPasswordPending} /></FormControl>
                    <FormDescription>Note: The current password field is for verification only.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><Input {...field} type="password" disabled={isPasswordPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl><Input {...field} type="password" disabled={isPasswordPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPasswordPending}>
                {isPasswordPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
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
              Deactivating your account will temporarily hide your profile and all your listings. You can reactivate it later by contacting support.
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
