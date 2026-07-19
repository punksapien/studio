'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Link from "next/link";
import { DashboardPageShell } from "@/components/shared/dashboard-page-shell";

export default function SellerSettingsPage() {
  const { settings, isLoading, error, updateSettings } = useUserSettings();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

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

  if (error) {
    return (
      <DashboardPageShell title="Settings" description="Manage your notification preferences and account.">
        <div className="flex flex-1 flex-col items-center justify-center text-center space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-red-600">Error Loading Settings</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </DashboardPageShell>
    );
  }

  if (isLoading) {
    return (
      <DashboardPageShell title="Settings" description="Manage your notification preferences and account.">
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
    <DashboardPageShell scrollable title="Settings" description="Manage your notification preferences and account.">
      <Card>
        <CardHeader>
          <CardTitle>Profile & Account Management</CardTitle>
          <CardDescription>Links to manage your public profile and account security.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button variant="outline" asChild>
                <Link href="/seller-dashboard/profile">Edit My Seller Profile</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
                To change your password, please go to your profile page.
            </p>
        </CardContent>
      </Card>

      <Separator/>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
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
              <Label htmlFor="email-system" className="font-medium">System & Security Emails</Label>
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

      <Separator/>

      <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Danger Zone
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
             <div>
                <h3 className="font-medium text-foreground">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-2">
                    Permanently delete your account and all associated data, including your listings and inquiries. This action cannot be undone.
                </p>
                <Button variant="destructive" disabled>
                    Delete My Account
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
            </div>
          </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
