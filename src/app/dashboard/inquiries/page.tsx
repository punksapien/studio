
'use client';

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, MessageSquare, Mail, Eye, ShieldAlert, Info } from "lucide-react";
import type { Inquiry, User, InquiryStatusBuyerPerspective } from "@/lib/types";
import { sampleBuyerInquiries, sampleUsers } from "@/lib/placeholder-data";

const currentBuyerId = 'user6'; 
const currentUser: User | undefined = sampleUsers.find(u => u.id === currentBuyerId && u.role === 'buyer');

function FormattedTimestamp({ timestamp }: { timestamp: Date | string }) {
  const [formattedDate, setFormattedDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (timestamp) {
      const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      if (!isNaN(dateObj.getTime())) {
        setFormattedDate(dateObj.toLocaleString());
      } else {
        setFormattedDate('Invalid Date');
      }
    } else {
      setFormattedDate('N/A');
    }
  }, [timestamp]);

  if (timestamp && !formattedDate) {
    return <span className="italic text-xs">Loading date...</span>;
  }
  return <>{formattedDate || 'N/A'}</>;
}

export default function InquiriesPage() {
  const getStatusBadgeVariant = (status?: InquiryStatusBuyerPerspective) => {
    if (!status) return "outline";
    if (status.includes("New") || status.includes("Sent")) return "default";
    if (status.includes("Pending") || status.includes("Required")) return "destructive"; 
    if (status.includes("Ready") || status.includes("Facilitated")) return "default"; 
    return "outline";
  };

  const getStatusBadgeClass = (status?: InquiryStatusBuyerPerspective) => {
    if (!status) return "";
    if (status.includes("Ready") || status.includes("Facilitated")) return "bg-green-500 text-white"; 
    if (status.includes("Required") || status.includes("Pending")) return "bg-amber-500 text-white"; 
    if (status === 'Inquiry Sent') return "bg-blue-500 text-white";
    return "";
  };

  if (typeof window !== 'undefined' && !currentUser) {
    return (
      <div className="space-y-8 text-center p-8">
        <h1 className="text-3xl font-bold tracking-tight text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">You must be logged in as a buyer to view this page.</p>
        <Button asChild><Link href="/auth/login">Login</Link></Button>
      </div>
    );
  }

  const buyerInquiries: Inquiry[] = sampleBuyerInquiries.filter(inq => inq.buyerId === currentUser?.id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-brand-dark-blue">My Inquiries</h1>
      <p className="text-muted-foreground">
        Track your inquiries sent to sellers about their businesses.
      </p>

      {buyerInquiries.length === 0 ? (
        <Card className="shadow-md text-center py-12 bg-brand-white">
          <CardContent>
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">No inquiries yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your inquiries to sellers will be shown here once you make them.
            </p>
            <Button asChild className="mt-4 bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
                <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {buyerInquiries.map((inquiry) => (
            <Card key={inquiry.id} id={inquiry.id} className="shadow-lg bg-brand-white">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                  <CardTitle className="text-xl text-brand-dark-blue">
                    Inquiry for: <Link href={`/listings/${inquiry.listingId}`} className="text-brand-sky-blue hover:underline">{inquiry.listingTitleAnonymous}</Link>
                  </CardTitle>
                  <Badge
                    variant={getStatusBadgeVariant(inquiry.statusBuyerPerspective)}
                    className={getStatusBadgeClass(inquiry.statusBuyerPerspective)}
                  >
                    {inquiry.statusBuyerPerspective || 'Status Unknown'}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  Inquired on: <FormattedTimestamp timestamp={inquiry.inquiryTimestamp} />
                  <br/>
                  Seller Status: <span className="font-medium">{inquiry.sellerStatus}</span>
                </CardDescription>
              </CardHeader>
              {inquiry.statusBuyerPerspective === "Seller Engaged - Your Verification Required" && (
                <CardContent className="pt-0 pb-4 border-t mt-2">
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700 flex flex-col sm:flex-row items-start gap-3">
                    <Info className="h-6 w-6 flex-shrink-0 mt-0.5 text-amber-600"/>
                    <div className="flex-grow space-y-2">
                      <p className="font-semibold">Action Required: Verify Your Profile</p>
                      <p>
                        You have requested to open a conversation with a seller for this listing. To access their private data and for our team to facilitate the connection, you need to become a Verified Buyer. Please verify your profile so our team can proceed.
                      </p>
                       <Button size="sm" asChild className="bg-amber-500 hover:bg-amber-600 text-white">
                        <Link href="/dashboard/verification">
                          <ShieldAlert className="mr-2 h-4 w-4" /> Verify Profile Now
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button size="sm" variant="outline" asChild className="border-brand-dark-blue/50 text-brand-dark-blue hover:bg-brand-light-gray/70">
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
                   <Button size="sm" variant="default" className="bg-green-500 text-white hover:bg-green-600" disabled>
                     Admin Connecting <Mail className="ml-2 h-4 w-4" />
                   </Button>
                )}
                {inquiry.status === 'connection_facilitated' && (
                   <Button size="sm" variant="outline" disabled className="border-brand-dark-blue/50 text-brand-dark-blue hover:bg-brand-light-gray/70">
                     View Messages (Coming Soon)
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
