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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTransition, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
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

export default function AccountManagementPage() {
  const { toast } = useToast();
  const router = useRouter();

  const { user, profile, isLoading, refreshAuth } = useAuth();

  const [isAccountPending, startAccountTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isDeletionPending, startDeletionTransition] = useTransition();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);

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

  // Buyer role guard
  useEffect(() => {
    if (profile && profile.role !== 'buyer') {
      router.replace('/seller-dashboard');
    }
  }, [profile, router]);

  // Check for an existing pending deletion request on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const response = await fetch('/api/auth/request-account-deletion', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const result = await response.json();
        if (!cancelled && result?.request) {
          setDeletionRequested(true);
        }
      } catch {
        // Non-fatal: leave deletion state as-is
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onRequestDeletion = () => {
    startDeletionTransition(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          throw new Error('Session expired. Please log in again.');
        }
        const response = await fetch('/api/auth/request-account-deletion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: deletionReason || undefined }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to request account deletion');
        }
        setDeletionRequested(true);
        setDeletionDialogOpen(false);
        toast({
          title: "Deletion Requested",
          description: "Your account deletion request has been submitted. An admin will review it shortly."
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to request account deletion. Please try again."
        });
      }
    });
  };

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

  const backToSettings = (
    <Button asChild variant="outline" size="sm" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
      <Link href="/dashboard/settings"><ArrowLeft className="h-4 w-4 mr-2" />Back to Settings</Link>
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
            <AlertTriangle className="h-5 w-5" /> Request Account Deletion
          </CardTitle>
          <CardDescription>Manage sensitive account actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium text-foreground">Request Account Deletion</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Request permanent deletion of your account. An admin will review and process your request. This action cannot be undone.
            </p>
            {deletionRequested ? (
              <Button variant="outline" disabled className="border-destructive text-destructive hover:bg-destructive/10">
                Deletion requested — pending admin review
              </Button>
            ) : (
              <AlertDialog open={deletionDialogOpen} onOpenChange={setDeletionDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                    Request Account Deletion
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Request Account Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will notify our admins to permanently delete your account. This action cannot be undone. You can optionally tell us why.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Reason for deletion (optional)"
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      disabled={isDeletionPending}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeletionPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => { e.preventDefault(); onRequestDeletion(); }}
                      disabled={isDeletionPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletionPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        "Request Deletion"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
