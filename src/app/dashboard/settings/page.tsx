'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { DashboardPageShell } from "@/components/shared/dashboard-page-shell";


export default function SettingsPage() {
  const { toast } = useToast();

  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [newInquiryAlerts, setNewInquiryAlerts] = React.useState(true);
  const [listingStatusAlerts, setListingStatusAlerts] = React.useState(true);

  const handleNotificationPreferenceSave = () => {
    console.log("Notification preferences saved:", { emailNotifications, newInquiryAlerts, listingStatusAlerts });
    toast({ title: "Preferences Saved", description: "Your notification preferences have been updated."});
  }


  return (
    <DashboardPageShell scrollable title="Settings" description="Manage your notification preferences and account.">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Profile & Account Management</CardTitle>
          <CardDescription>Links to manage your public profile and account security.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/profile">Edit My Buyer Profile</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            To change your password, please go to your profile page.
          </p>
        </CardContent>
      </Card>

      <Separator/>

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

      <Separator/>

      <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Danger Zone
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
             <div>
                <h3 className="font-medium text-foreground">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-2">
                    Permanently delete your account and all associated data. This action cannot be undone.
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
