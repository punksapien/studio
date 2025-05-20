
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, MessageSquare, Mail, Eye, ShieldAlert } from "lucide-react";
import type { Inquiry, User } from "@/lib/types";
import { sampleBuyerInquiries, sampleUsers } from "@/lib/placeholder-data";

// Placeholder for current user role and ID
// For Buyer Dashboard V1, assuming current user is user2 (Jane Smith - Verified Buyer)
// or user6 (Anna Tay - Anonymous Buyer)
const currentBuyerId = 'user6'; 
const currentUser: User | undefined = sampleUsers.find(u => u.id === currentBuyerId && u.role === 'buyer');

// Filter inquiries for the current buyer
const buyerInquiries: Inquiry[] = sampleBuyerInquiries.filter(inq => inq.buyerId === currentBuyerId);


export default function InquiriesPage() {

  const getStatusBadgeVariant = (status: Inquiry["statusBuyerPerspective"]) => {
    if (status.includes("New") || status.includes("Sent")) return "default";
    if (status.includes("Pending") || status.includes("Required")) return "destructive"; // More prominent for action needed
    if (status.includes("Ready") || status.includes("Facilitated")) return "default"; 
    return "outline";
  };
  const getStatusBadgeClass = (status: Inquiry["statusBuyerPerspective"]) => {
    if (status.includes("Ready") || status.includes("Facilitated")) return "bg-accent text-accent-foreground";
    if (status.includes("Required")) return "bg-amber-500 text-white";
    return "";
  }

  if (!currentUser) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground">You must be logged in as a buyer to view this page.</p>
        <Button asChild><Link href="/auth/login">Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">My Inquiries</h1>
      <p className="text-muted-foreground">
        Track your inquiries sent to sellers about their businesses.
      </p>

      {buyerInquiries.length === 0 ? (
        <Card className="shadow-md text-center py-12">
          <CardContent>
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">No inquiries yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your inquiries to sellers will be shown here once you make them.
            </p>
            <Button asChild className="mt-4">
                <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {buyerInquiries.map((inquiry) => (
            <Card key={inquiry.id} id={inquiry.id} className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                  <CardTitle className="text-xl">
                    Inquiry for: <Link href={`/listings/${inquiry.listingId}`} className="text-primary hover:underline">{inquiry.listingTitleAnonymous}</Link>
                  </CardTitle>
                  <Badge 
                    variant={getStatusBadgeVariant(inquiry.statusBuyerPerspective)} 
                    className={getStatusBadgeClass(inquiry.statusBuyerPerspective)}
                  >
                    {inquiry.statusBuyerPerspective}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Inquired on: {new Date(inquiry.inquiryTimestamp).toLocaleDateString()} at {new Date(inquiry.inquiryTimestamp).toLocaleTimeString()}
                  <br/>
                  Seller Status: <span className="font-medium">{inquiry.sellerStatus}</span>
                </CardDescription>
              </CardHeader>
              {/* CardContent could include a snippet of the last message or next steps if applicable later */}
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-0">
                <Button size="sm" variant="outline" asChild>
                   <Link href={`/listings/${inquiry.listingId}`} target="_blank"><Eye className="mr-2 h-4 w-4" />View Listing</Link>
                </Button>
                 {inquiry.statusBuyerPerspective === "Seller Engaged - Your Verification Required" && (
                   <Button size="sm" variant="default" asChild className="bg-amber-500 hover:bg-amber-600 text-white">
                     <Link href="/dashboard/verification">
                        <ShieldAlert className="mr-2 h-4 w-4" />Proceed to Verification
                     </Link>
                   </Button>
                )}
                 {inquiry.statusBuyerPerspective === "Ready for Admin Connection" && (
                   <Button size="sm" variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled>
                     Admin Connecting <Mail className="ml-2 h-4 w-4" />
                   </Button>
                )}
                {/* Placeholder for other actions */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
