
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { User, VerificationStatus } from "@/lib/types";
import { sampleUsers } from "@/lib/placeholder-data";
import Link from "next/link";

// Placeholder for current user - in a real app, this would come from session/auth
// For Buyer Dashboard V1, assuming current user is user6 (Anna Tay - Anonymous Buyer)
// or user4 (Sarah Chen - Pending Verification)
const currentBuyerId = 'user6'; 
const currentUser: User | undefined = sampleUsers.find(u => u.id === currentBuyerId && u.role === 'buyer');


export default function VerificationPage() {
  // If user is not found or not a buyer, show an error or redirect
  // This check would typically be part of a higher-order component or middleware
  if (!currentUser) {
    return (
        <div className="space-y-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
            <p className="text-muted-foreground">You must be logged in as a buyer to view this page.</p>
            <Button asChild><Link href="/auth/login">Login</Link></Button>
        </div>
    );
  }
  
  // Determine initial form submission state based on user's current verification status
  const initialFormSubmitted = currentUser.verificationStatus === 'pending_verification';
  const [formSubmitted, setFormSubmitted] = useState(initialFormSubmitted);
  const { toast } = useToast();


  const handleRequestVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const bestTimeToCall = formData.get('bestTimeToCall') as string;
    const notes = formData.get('notes') as string;

    console.log("Buyer verification request submitted:", { 
        buyerId: currentUser.id, 
        buyerName: currentUser.fullName,
        bestTimeToCall, 
        notes 
    });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFormSubmitted(true); // Update state to show pending message
    // In a real app, you'd also update the currentUser's verificationStatus in your backend/state management
    // For demo, we'll assume this is 'pending_verification' after submission
    toast({
      title: "Verification Request Sent",
      description: "Our team has received your request and will be in touch shortly to schedule a call.",
    });
  };

  const renderStatusCard = () => {
    const effectiveStatus = formSubmitted ? 'pending_verification' : currentUser.verificationStatus;

    switch (effectiveStatus) {
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
                Your verification request has been submitted. Our team is reviewing your information and will contact you soon to complete the process. 
                This usually involves a brief call. Please check your email for updates.
              </p>
            </CardContent>
          </Card>
        );
      case 'rejected': // Assuming 'rejected' means they can try again
        return (
          <Card className="shadow-lg border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-7 w-7" /> Verification Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive/90 mb-4">
                There was an issue with your previous verification attempt. Please check your email for details from our team, or contact support for assistance.
              </p>
              {/* Optionally, allow re-submission of the form here or direct to support */}
               <h3 className="font-semibold mb-2">Request a New Verification Call:</h3>
                <form onSubmit={handleRequestVerification} className="space-y-4">
                <div>
                  <Label htmlFor="bestTimeToCall">Best Time to Call (Optional)</Label>
                  <Input id="bestTimeToCall" name="bestTimeToCall" defaultValue={currentUser.phoneNumber} placeholder="e.g., Weekdays 2-4 PM SGT" />
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea id="notes" name="notes" placeholder="Any specific information or questions for our team?" />
                </div>
                <Button type="submit" className="w-full md:w-auto">Re-submit Verification Request</Button>
              </form>
            </CardContent>
          </Card>
        );
      case 'anonymous':
      default:
        return (
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
              <form onSubmit={handleRequestVerification} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormItemDisabled label="Full Name" value={currentUser.fullName} />
                  <FormItemDisabled label="Email" value={currentUser.email} />
                </div>
                 <FormItemDisabled label="Phone Number" value={currentUser.phoneNumber} />
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
    }
  };

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
