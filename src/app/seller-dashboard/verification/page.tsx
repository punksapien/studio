
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, CheckCircle2, FileText, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User, Listing, VerificationStatus } from "@/lib/types";
import { sampleUsers, sampleListings } from "@/lib/placeholder-data";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Placeholder for current seller - in a real app, this would come from session/auth
const currentSellerId = 'user3'; // Or 'user1'
const currentUser: User | undefined = sampleUsers.find(u => u.id === currentSellerId && u.role === 'seller');
const sellerListings: Listing[] = sampleListings.filter(l => l.sellerId === currentUser?.id && !l.isSellerVerified && l.status !== 'pending_verification');


export default function SellerVerificationPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [verificationType, setVerificationType] = useState<'profile' | 'listing'>('profile');
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>(searchParams.get('listingId') || undefined);

  useEffect(() => {
    const initialListingId = searchParams.get('listingId');
    if (initialListingId && sellerListings.find(l => l.id === initialListingId)) {
      setVerificationType('listing');
      setSelectedListingId(initialListingId);
    }
  }, [searchParams]);

  if (!currentUser) {
    return (
        <div className="space-y-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
            <p className="text-muted-foreground">You must be logged in as a seller to view this page.</p>
            <Button asChild><Link href="/auth/login">Login</Link></Button>
        </div>
    );
  }

  const handleRequestVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const bestTimeToCall = formData.get('bestTimeToCall') as string;
    const notes = formData.get('notes') as string;
    const listingToVerify = verificationType === 'listing' ? selectedListingId : undefined;

    console.log("Seller verification request submitted:", { 
        sellerId: currentUser.id, 
        sellerName: currentUser.fullName,
        verificationType,
        listingId: listingToVerify,
        bestTimeToCall, 
        notes 
    });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFormSubmitted(true); 
    toast({
      title: "Verification Request Sent",
      description: `Our team has received your ${verificationType} verification request and will be in touch shortly.`,
    });
  };

  const getCurrentVerificationStatus = () => {
    if (verificationType === 'listing' && selectedListingId) {
      const listing = sampleListings.find(l => l.id === selectedListingId);
      if (listing?.status === 'pending_verification') return 'pending_verification';
      if (listing?.isSellerVerified) return 'verified'; // Assume listing verification means seller also gets verified for simplicity
    }
    return currentUser.verificationStatus;
  };

  const effectiveStatus = formSubmitted ? 'pending_verification' : getCurrentVerificationStatus();
  const selectedListingDetails = sellerListings.find(l => l.id === selectedListingId);

  const renderStatusCard = () => {
    switch (effectiveStatus) {
      case 'verified':
        return (
          <Card className="shadow-lg bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-7 w-7" /> 
                {verificationType === 'listing' && selectedListingDetails ? `Listing '${selectedListingDetails.listingTitleAnonymous}' is Verified!` : 'You are a Verified Seller!'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 dark:text-green-400">
                {verificationType === 'listing' && selectedListingDetails 
                  ? `Congratulations! Your listing is verified and will display full details to verified buyers.`
                  : `Congratulations! Your seller profile is fully verified. Your verified listings will display full details to verified buyers.`
                }
              </p>
            </CardContent>
          </Card>
        );
      case 'pending_verification':
        return (
          <Card className="shadow-lg bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <FileText className="h-7 w-7" /> Verification Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-600 dark:text-blue-400">
                Your {verificationType} verification request for {verificationType === 'listing' && selectedListingDetails ? `'${selectedListingDetails.listingTitleAnonymous}'` : 'your profile'} has been submitted. Our team is reviewing it and will contact you soon.
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
                There was an issue with your previous verification attempt for {verificationType === 'listing' && selectedListingDetails ? `'${selectedListingDetails.listingTitleAnonymous}'` : 'your profile'}. Please check your email for details or contact support.
              </p>
              {/* Fall through to show form again */}
              {renderVerificationForm()}
            </CardContent>
          </Card>
        );
      case 'anonymous':
      default:
        return renderVerificationForm();
    }
  };
  
  const renderVerificationForm = () => (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Become a Verified Seller / Verify Listing
            </CardTitle>
            <CardDescription>
            Unlock full platform access and build trust by verifying your profile and listings. Verified sellers can show detailed information to interested buyers.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleRequestVerification} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
                <FormItemDisabled label="Full Name" value={currentUser.fullName} />
                <FormItemDisabled label="Email" value={currentUser.email} />
            </div>
            <FormItemDisabled label="Phone Number" value={currentUser.phoneNumber} />

            <div>
                <Label htmlFor="verificationType">What would you like to verify?</Label>
                <Select value={verificationType} onValueChange={(value) => {setVerificationType(value as 'profile' | 'listing'); if (value === 'profile') setSelectedListingId(undefined);}}>
                    <SelectTrigger id="verificationType">
                        <SelectValue placeholder="Select verification type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="profile">General Profile Verification</SelectItem>
                        <SelectItem value="listing">Specific Listing Verification</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {verificationType === 'listing' && (
                <div>
                <Label htmlFor="listingToVerify">Select Listing to Verify</Label>
                {sellerListings.length > 0 ? (
                    <Select value={selectedListingId} onValueChange={setSelectedListingId}>
                        <SelectTrigger id="listingToVerify">
                            <SelectValue placeholder="Select listing" />
                        </SelectTrigger>
                        <SelectContent>
                            {sellerListings.map(listing => (
                            <SelectItem key={listing.id} value={listing.id}>{listing.listingTitleAnonymous}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <p className="text-sm text-muted-foreground p-2 border rounded-md">You have no anonymous listings to verify. Please create a listing first.</p>
                )}
                </div>
            )}

            <div>
                <Label htmlFor="bestTimeToCall">Best Time to Call (Optional)</Label>
                <Input id="bestTimeToCall" name="bestTimeToCall" placeholder="e.g., Weekdays 2-4 PM SGT" />
            </div>
            <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea id="notes" name="notes" placeholder="Any specific information or questions for our team?" />
            </div>
            <Button type="submit" className="w-full md:w-auto" disabled={verificationType === 'listing' && !selectedListingId && sellerListings.length > 0}>Request Verification Call</Button>
            </form>
        </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Seller Account & Listing Verification</h1>
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
