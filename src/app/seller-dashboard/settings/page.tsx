
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function SellerSettingsPage() {
  // Placeholder states for settings
  // In a real app, these would come from user preferences or a backend.
  // const [emailNotifications, setEmailNotifications] = useState(true);
  // const [newInquiryAlerts, setNewInquiryAlerts] = useState(true);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Seller Account Settings</h1>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive notifications related to your listings and inquiries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="email-new-inquiry" className="font-medium">New Inquiry Emails</Label>
              <p className="text-sm text-muted-foreground">Receive an email when a buyer makes an inquiry on one of your listings.</p>
            </div>
            <Switch id="email-new-inquiry" defaultChecked={true} aria-label="Toggle new inquiry email notifications" />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="email-listing-updates" className="font-medium">Listing Status Emails</Label>
              <p className="text-sm text-muted-foreground">Get notified via email about changes to your listing status (e.g., verification approved, deactivated).</p>
            </div>
            <Switch id="email-listing-updates" defaultChecked={true} aria-label="Toggle listing status email notifications" />
          </div>
           <Button>Save Notification Preferences</Button>
        </CardContent>
      </Card>

      <Separator/>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Profile & Account Management</CardTitle>
          <CardDescription>Links to manage your public profile and account security.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button variant="outline" asChild>
                <a href="/seller-dashboard/profile">Edit My Seller Profile</a>
            </Button>
            <p className="text-sm text-muted-foreground">
                To change your password, please go to your profile page.
            </p>
        </CardContent>
      </Card>

      <Separator/>

      <Card className="shadow-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" /> Danger Zone
            </CardTitle>
            <CardDescription>Manage sensitive account actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <h3 className="font-medium text-foreground">Deactivate Account</h3>
                <p className="text-sm text-muted-foreground mb-2">
                    Deactivating your account will temporarily hide your profile and all your listings. You can reactivate it later by contacting support.
                </p>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                    Deactivate My Account (Placeholder)
                </Button>
            </div>
             <div>
                <h3 className="font-medium text-foreground">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-2">
                    Permanently delete your account and all associated data, including your listings and inquiries. This action cannot be undone.
                </p>
                <Button variant="destructive">
                    Delete My Account (Placeholder)
                </Button>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
