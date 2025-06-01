
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, CheckCircle2, Mail, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User, Listing, VerificationStatus, VerificationRequestItem } from "@/lib/types";
import { sampleUsers, sampleListings, sampleVerificationRequests } from "@/lib/placeholder-data";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Placeholder for current seller
let currentSellerId = 'user3'; // Can be 'user1' (verified) or 'user3' (anonymous)
let currentUser: User | undefined = sampleUsers.find(u => u.id === currentSellerId && u.role === 'seller');

export default function SellerVerificationPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [userState, setUserState] = useState<User | undefined>(currentUser);
  const [sellerListings, setSellerListings] = useState<Listing[]>([]);
  
  const [formSubmitted, setFormSubmitted] = useState(false); // Tracks if a request was made in this session
  const [verificationType, setVerificationType] = useState<'profile' | 'listing'>('profile');
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>(searchParams.get('listingId') || undefined);

  useEffect(() => {
    if (userState) {
      const listingsForSeller = sampleListings.filter(
        l => l.sellerId === userState.id && !l.isSellerVerified && l.status !== 'pending_verification' && l.status !== 'rejected_by_admin'
      );
      setSellerListings(listingsForSeller);

      const initialListingId = searchParams.get('listingId');
      if (initialListingId && listingsForSeller.find(l => l.id === initialListingId)) {
        setVerificationType('listing');
        setSelectedListingId(initialListingId);
      } else if (listingsForSeller.length > 0) {
        // If no specific listing in query param, but unverified listings exist, default to listing verification
        setVerificationType('listing');
        // setSelectedListingId(listingsForSeller[0].id); // Optionally auto-select first
      } else {
        setVerificationType('profile'); // Default to profile if no unverified listings
      }
    }
  }, [searchParams, userState]);

  if (!userState) {
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
    if (!userState) return;

    const formData = new FormData(event.currentTarget);
    const bestTimeToCall = formData.get('bestTimeToCall') as string;
    const notes = formData.get('notes') as string;
    const listingToVerify = verificationType === 'listing' ? selectedListingId : undefined;

    console.log("Seller/Listing verification request submitted:", { 
        sellerId: userState.id, 
        sellerName: userState.fullName,
        verificationType,
        listingId: listingToVerify,
        bestTimeToCall, 
        notes 
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update user's status in placeholder data if it's a profile verification or first listing verification
    if (verificationType === 'profile' || (listingToVerify && userState.verificationStatus === 'anonymous')) {
      const userIndex = sampleUsers.findIndex(u => u.id === userState.id);
      if (userIndex !== -1) {
        sampleUsers[userIndex].verificationStatus = 'pending_verification';
        sampleUsers[userIndex].updatedAt = new Date();
      }
      setUserState(prev => prev ? {...prev, verificationStatus: 'pending_verification'} : undefined);
    }

    // Update listing status if it's a listing verification
    if (listingToVerify) {
        const listingIndex = sampleListings.findIndex(l => l.id === listingToVerify);
        if (listingIndex !== -1) {
            sampleListings[listingIndex].status = 'pending_verification';
            sampleListings[listingIndex].updatedAt = new Date();
        }
        // Refresh listings for select dropdown if needed
        setSellerListings(sampleListings.filter(l => l.sellerId === userState.id && !l.isSellerVerified && l.status !== 'pending_verification'));
    }

    sampleVerificationRequests.push({
        id: `vr_new_${Date.now()}`,
        timestamp: new Date(),
        userId: userState.id,
        userName: userState.fullName,
        userRole: 'seller',
        listingId: listingToVerify,
        listingTitle: listingToVerify ? sampleListings.find(l=>l.id === listingToVerify)?.listingTitleAnonymous : undefined,
        reason: `User requested ${verificationType} verification.`,
        operationalStatus: 'New Request',
        profileStatus: 'pending_verification', 
        adminNotes: notes,
    });
    
    setFormSubmitted(true);
    toast({
      title: "Verification Request Sent",
      description: `Our team has received your ${verificationType} verification request and will be in touch shortly.`,
    });
  };

  const getCurrentVerificationStatus = (): VerificationStatus => {
    if (verificationType === 'listing' && selectedListingId) {
      const listing = sampleListings.find(l => l.id === selectedListingId);
      if (listing?.status === 'pending_verification') return 'pending_verification';
      if (listing?.isSellerVerified || listing?.status === 'verified_anonymous' || listing?.status === 'verified_public') return 'verified';
    }
    // Fallback to user's profile status or if it's a profile verification
    return userState.verificationStatus;
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
               {verificationType === 'profile' && sellerListings.length > 0 && (
                 <Button className="mt-4" onClick={() => {setVerificationType('listing'); setFormSubmitted(false);}}>Verify a Listing Now</Button>
               )}
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
            <ShieldCheck className="h-7 w-7 text-primary" /> Become a Verified Seller / Verify Listing
            </CardTitle>
            <CardDescription>
            Unlock full platform access and build trust. Verified sellers and listings gain more visibility and credibility.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleRequestVerification} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
                <FormItemDisabled label="Full Name" value={userState.fullName} />
                <FormItemDisabled label="Email" value={userState.email} />
            </div>
            <FormItemDisabled label="Phone Number" value={userState.phoneNumber} />

            <div>
                <Label htmlFor="verificationType">What would you like to verify?</Label>
                <Select value={verificationType} onValueChange={(value) => {setVerificationType(value as 'profile' | 'listing'); if (value === 'profile') setSelectedListingId(undefined); setFormSubmitted(false)}}>
                    <SelectTrigger id="verificationType">
                        <SelectValue placeholder="Select verification type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="profile">General Seller Profile Verification</SelectItem>
                        <SelectItem value="listing">Specific Listing Verification</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {verificationType === 'listing' && (
                <div>
                <Label htmlFor="listingToVerify">Select Listing to Verify</Label>
                {sellerListings.length > 0 ? (
                    <Select value={selectedListingId} onValueChange={(value) => {setSelectedListingId(value); setFormSubmitted(false);}}>
                        <SelectTrigger id="listingToVerify">
                            <SelectValue placeholder="Select an unverified listing" />
                        </SelectTrigger>
                        <SelectContent>
                            {sellerListings.map(listing => (
                            <SelectItem key={listing.id} value={listing.id}>{listing.listingTitleAnonymous} (Current Status: {listing.status})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <p className="text-sm text-muted-foreground p-2 border rounded-md">You have no listings that require verification at this time. <Link href="/seller-dashboard/listings/create" className="text-primary hover:underline">Create a listing</Link> or all your listings are already verified/pending.</p>
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
            <Button type="submit" className="w-full md:w-auto" disabled={(verificationType === 'listing' && !selectedListingId && sellerListings.length > 0)}>Request Verification Call</Button>
            </form>
        </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Seller & Listing Verification</h1>
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

    