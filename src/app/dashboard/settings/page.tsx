import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  // Placeholder states for settings
  // const [emailNotifications, setEmailNotifications] = useState(true);
  // const [smsNotifications, setSmsNotifications] = useState(false);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive notifications from BizMatch Asia.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates on new inquiries, verification status, etc., via email.</p>
            </div>
            <Switch id="email-notifications" defaultChecked={true} aria-label="Toggle email notifications" />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="sms-notifications" className="font-medium">SMS Notifications (Coming Soon)</Label>
              <p className="text-sm text-muted-foreground">Get critical alerts via SMS. (Feature not yet available)</p>
            </div>
            <Switch id="sms-notifications" disabled aria-label="Toggle SMS notifications" />
          </div>
           <Button>Save Notification Preferences</Button>
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
                    Deactivating your account will temporarily hide your profile and listings. You can reactivate it later.
                </p>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                    Deactivate My Account
                </Button>
            </div>
             <div>
                <h3 className="font-medium text-foreground">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-2">
                    Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive">
                    Delete My Account
                </Button>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
