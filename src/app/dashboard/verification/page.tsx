
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, CheckCircle2, Mail, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { User, VerificationStatus, VerificationRequestItem } from "@/lib/types";
import { sampleUsers, sampleVerificationRequests } from "@/lib/placeholder-data";
import Link from "next/link";

// Placeholder for current user
let currentBuyerId = 'user6'; // Can be 'user2' (verified), 'user4' (pending), 'user6' (anonymous)
let currentUser: User | undefined = sampleUsers.find(u => u.id === currentBuyerId && u.role === 'buyer');

export default function BuyerVerificationPage() {
  const { toast } = useToast();
  
  // Local state to manage if the current user has just submitted a request
  // This is to reflect immediate UI change before a full state refresh might occur
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Simulate user update if needed for demo, e.g., after request.
  const [userState, setUserState] = useState<User | undefined>(currentUser);

  useEffect(() => {
    // If a user makes a request, their sampleUser.verificationStatus would be updated
    // to 'pending_verification'. This effect simulates re-fetching or state update.
    if (justSubmitted && currentUser) {
        const updatedUser = sampleUsers.find(u => u.id === currentUser.id);
        setUserState(updatedUser);
    }
  }, [justSubmitted]);


  if (!userState) {
    return (
        <div className="space-y-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
            <p className="text-muted-foreground">You must be logged in as a buyer to view this page.</p>
            <Button asChild><Link href="/auth/login">Login</Link></Button>
        </div>
    );
  }

  const handleRequestVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userState) return;

    const formData = new FormData(event.currentTarget);
    const bestTimeToCall = formData.get('bestTimeToCall') as string;
    const notes = formData.get('notes') as string;

    console.log("Buyer verification request submitted:", { 
        buyerId: userState.id, 
        buyerName: userState.fullName,
        bestTimeToCall, 
        notes 
    });
    
    // Simulate API call & data update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update user's status in placeholder data
    const userIndex = sampleUsers.findIndex(u => u.id === userState.id);
    if (userIndex !== -1) {
      sampleUsers[userIndex].verificationStatus = 'pending_verification';
      sampleUsers[userIndex].updatedAt = new Date();
    }
    // Add to verification requests
    sampleVerificationRequests.push({
        id: `vr_new_${Date.now()}`,
        timestamp: new Date(),
        userId: userState.id,
        userName: userState.fullName,
        userRole: 'buyer',
        reason: 'User requested profile verification.',
        operationalStatus: 'New Request',
        profileStatus: 'pending_verification',
        adminNotes: notes,
        documentsSubmitted: [], // Assuming no docs uploaded initially via this simple form
    });
    
    setJustSubmitted(true); // Trigger re-render via useEffect or direct state update
    setUserState(prev => prev ? {...prev, verificationStatus: 'pending_verification'} : undefined);

    toast({
      title: "Verification Request Sent",
      description: "Our team has received your request and will be in touch shortly to schedule a call.",
    });
  };

  const renderStatusCard = () => {
    const currentProfileStatus = userState.verificationStatus;

    switch (currentProfileStatus) {
      case 'verified':
        return (
          <Card className="shadow-lg bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-7 w-7" /> You are a Verified Buyer!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 dark:text-green-400">
                Congratulations! Your buyer profile is fully verified. 
                You have access to all platform features, including viewing detailed information on verified listings and engaging with verified sellers.
              </p>
            </CardContent>
          </Card>
        );
      case 'pending_verification':
        return (
          <Card className="shadow-lg bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Mail className="h-7 w-7" /> Verification Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-600 dark:text-blue-400">
                Your verification request has been submitted or is being processed. Our team is reviewing your information and will contact you soon. 
                Please check your email for updates from our team.
              </p>
            </CardContent>
          </Card>
        );
      case 'rejected':
        return (
          <Card className="shadow-lg border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-7 w-7" /> Verification Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive/90 mb-4">
                There was an issue with your previous verification attempt. Please check your email for details from our team, or contact support for assistance. You can submit a new request below.
              </p>
              {renderVerificationFormContent()}
            </CardContent>
          </Card>
        );
      case 'anonymous':
      default:
        return renderVerificationFormContent();
    }
  };

  const renderVerificationFormContent = () => (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Become a Verified Buyer
            </CardTitle>
            <CardDescription>
            Unlock full platform access by verifying your profile. 
            Verified buyers gain trust and can view detailed information on verified listings and engage with verified sellers.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="mb-4 text-muted-foreground">
            The verification process typically involves a short call with our team to confirm your details. 
            Please provide some information to help us schedule this call.
            </p>
            <form onSubmit={handleRequestVerification} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
                <FormItemDisabled label="Full Name" value={userState.fullName} />
                <FormItemDisabled label="Email" value={userState.email} />
            </div>
            <FormItemDisabled label="Phone Number" value={userState.phoneNumber} />
            <div>
                <Label htmlFor="bestTimeToCall">Best Time to Call (Optional)</Label>
                <Input id="bestTimeToCall" name="bestTimeToCall" placeholder="e.g., Weekdays 2-4 PM SGT" />
            </div>
            <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea id="notes" name="notes" placeholder="Any specific information or questions for our team?" />
            </div>
            <Button type="submit" className="w-full md:w-auto">Request Verification Call</Button>
            </form>
        </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Buyer Account Verification</h1>
      {renderStatusCard()}
    </div>
  );
}


function FormItemDisabled({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <Input value={value || 'N/A'} disabled className="mt-1 bg-muted/50" />
    </div>
  );
}

    