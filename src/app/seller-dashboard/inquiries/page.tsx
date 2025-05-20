
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, MessageSquare, Users, Eye, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { Inquiry, User } from "@/lib/types";
import { sampleSellerInquiries, sampleUsers, sampleListings } from "@/lib/placeholder-data";
import { useToast } from "@/hooks/use-toast";

// Placeholder for current seller - in a real app, this would come from session/auth
const currentSellerId = 'user1'; // Or 'user3'
const currentUser: User | undefined = sampleUsers.find(u => u.id === currentSellerId && u.role === 'seller');

const sellerInquiries: Inquiry[] = sampleSellerInquiries.filter(inq => inq.sellerId === currentUser?.id);


export default function SellerInquiriesPage() {
  const { toast } = useToast();

  const handleEngage = (inquiryId: string, listingTitle: string, buyerName: string) => {
    console.log(`Engaging with ${buyerName} for listing ${listingTitle} (Inquiry ID: ${inquiryId})`);
    // Placeholder: Update inquiry status in backend/state
    // Trigger notifications based on verification statuses
    toast({ 
      title: "Engagement Initiated", 
      description: `You've chosen to engage with ${buyerName} for '${listingTitle}'. Next steps depend on verification statuses.` 
    });
    // Further logic would involve checking verification status and updating UI/status accordingly
  };

  const getStatusBadgeVariant = (status: Inquiry["statusSellerPerspective"]) => {
    if (status === "New Inquiry") return "destructive"; 
    if (status?.includes("Pending")) return "destructive";
    if (status === "Ready for Admin Connection" || status === "Connection Facilitated by Admin") return "default";
    return "outline";
  };
   const getStatusBadgeClass = (status: Inquiry["statusSellerPerspective"]) => {
    if (status === "Ready for Admin Connection" || status === "Connection Facilitated by Admin") return "bg-accent text-accent-foreground";
    if (status?.includes("Pending")) return "bg-amber-500 text-white";
    return "";
  };


  if (!currentUser) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground">You must be logged in as a seller to view this page.</p>
        <Button asChild><Link href="/auth/login">Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">My Inquiries</h1>
      <p className="text-muted-foreground">
        Manage inquiries from potential buyers for your business listings.
      </p>

      {sellerInquiries.length === 0 ? (
        <Card className="shadow-md text-center py-12">
          <CardContent>
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">No inquiries received yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Inquiries from interested buyers will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sellerInquiries.map((inquiry) => (
            <Card key={inquiry.id} id={inquiry.id} className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                  <CardTitle className="text-xl">
                    Inquiry for: <Link href={`/listings/${inquiry.listingId}`} className="text-primary hover:underline">{inquiry.listingTitleAnonymous}</Link>
                  </CardTitle>
                  <Badge 
                    variant={getStatusBadgeVariant(inquiry.statusSellerPerspective)}
                    className={getStatusBadgeClass(inquiry.statusSellerPerspective)}
                  >
                    {inquiry.statusSellerPerspective}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Received on: {new Date(inquiry.inquiryTimestamp).toLocaleDateString()} at {new Date(inquiry.inquiryTimestamp).toLocaleTimeString()}
                  <br/>
                  From: <span className="font-medium">{inquiry.buyerName || 'Anonymous Buyer'}</span> (Status: {inquiry.buyerVerificationStatus || 'Unknown'})
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-0">
                <Button size="sm" variant="outline" asChild>
                   <Link href={`/listings/${inquiry.listingId}`} target="_blank"><Eye className="mr-2 h-4 w-4" />View Listing</Link>
                </Button>
                {inquiry.statusSellerPerspective === "New Inquiry" && (
                   <Button 
                     size="sm" 
                     variant="default"
                     onClick={() => handleEngage(inquiry.id, inquiry.listingTitleAnonymous, inquiry.buyerName || 'Buyer')}
                    >
                     <CheckCircle2 className="mr-2 h-4 w-4" /> Engage in Conversation
                   </Button>
                )}
                {inquiry.statusSellerPerspective === "You Engaged - Your Listing Verification Pending" && (
                   <Button size="sm" variant="default" asChild className="bg-amber-500 hover:bg-amber-600 text-white">
                     <Link href={`/seller-dashboard/verification?listingId=${inquiry.listingId}`}>
                        <ShieldAlert className="mr-2 h-4 w-4" />Verify Your Listing to Proceed
                     </Link>
                   </Button>
                )}
                 {inquiry.statusSellerPerspective === "Ready for Admin Connection" && (
                   <Button size="sm" variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled>
                     Admin Connecting <Users className="ml-2 h-4 w-4" />
                   </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
