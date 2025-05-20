'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Placeholder for current user's verification status
type VerificationStatus = 'anonymous' | 'pending_verification' | 'verified' | 'rejected';
const currentUserStatus: VerificationStatus = 'anonymous'; // or 'pending_verification', 'verified', 'rejected'
const currentUserRole = 'seller'; // or 'buyer'
const associatedListingId = currentUserRole === 'seller' ? 'listing123' : undefined; // Example

export default function VerificationPage() {
  const [formSubmitted, setFormSubmitted] = useState(currentUserStatus === 'pending_verification');
  const { toast } = useToast();

  // Placeholder for server action
  const handleRequestVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const bestTimeToCall = formData.get('bestTimeToCall') as string;
    const notes = formData.get('notes') as string;

    console.log("Verification request submitted:", { bestTimeToCall, notes, associatedListingId });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFormSubmitted(true);
    toast({
      title: "Verification Request Sent",
      description: "Our team has received your request and will be in touch shortly to schedule a call.",
    });
  };

  const renderStatusCard = () => {
    switch (currentUserStatus) {
      case 'verified':
        return (
          <Card className="shadow-lg bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-7 w-7" /> You are Verified!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 dark:text-green-400">
                Congratulations! Your account and {currentUserRole === 'seller' ? 'listings are' : 'profile is'} fully verified. 
                You have access to all platform features, including viewing detailed information on verified listings and engaging with other verified users.
              </p>
            </CardContent>
          </Card>
        );
      case 'pending_verification':
      case formSubmitted && currentUserStatus !== 'verified' && currentUserStatus !== 'rejected': // Show pending if form was just submitted
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
      case 'rejected':
        return (
          <Card className="shadow-lg bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="h-7 w-7" /> Verification Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 dark:text-red-400">
                There was an issue with your previous verification attempt. Please check your email for details from our team, or contact support for assistance.
              </p>
              <Button variant="outline" className="mt-4 border-red-500 text-red-600 hover:bg-red-100 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-800">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        );
      case 'anonymous':
      default:
        return (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-7 w-7 text-primary" /> Become a Verified {currentUserRole === 'seller' ? 'Seller' : 'Buyer'}
              </CardTitle>
              <CardDescription>
                Unlock full platform access by verifying your {currentUserRole === 'seller' ? 'business listing' : 'profile'}. 
                Verified users gain trust and can view detailed information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                The verification process typically involves a short call with our team to confirm your details. 
                Please provide some information to help us schedule this call.
              </p>
              <form onSubmit={handleRequestVerification} className="space-y-4">
                <div>
                  <Label htmlFor="bestTimeToCall">Best Time to Call (Optional)</Label>
                  <Input id="bestTimeToCall" name="bestTimeToCall" placeholder="e.g., Weekdays 2-4 PM SGT" />
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea id="notes" name="notes" placeholder="Any specific information or questions for our team?" />
                </div>
                 {currentUserRole === 'seller' && associatedListingId && (
                   <p className="text-sm text-muted-foreground">This request is for listing ID: {associatedListingId}</p>
                 )}
                <Button type="submit" className="w-full md:w-auto">Request Verification Call</Button>
              </form>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Account Verification</h1>
      {renderStatusCard()}
    </div>
  );
}
