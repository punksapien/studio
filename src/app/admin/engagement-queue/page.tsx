
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleReadyToEngageItems } from "@/lib/placeholder-data";
import type { ReadyToEngageItem, VerificationStatus, ListingStatus } from "@/lib/types";
import Link from "next/link";
import { Eye, Mail, Archive, ShieldCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect } from "react"; // Added React import for useState, useEffect

const engagements: ReadyToEngageItem[] = sampleReadyToEngageItems;

// Helper component for client-side date formatting
function FormattedTimestamp({ timestamp }: { timestamp: Date | string }) {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    setFormattedDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);

  if (!formattedDate) {
    return <span className="italic text-xs">Loading...</span>; 
  }
  return <>{formattedDate}</>;
}

export default function AdminEngagementQueuePage() {
  const getVerificationBadge = (status: VerificationStatus) => {
    if (status === 'verified') return <Badge className="bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200 border-green-300 dark:border-green-500"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>;
    return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />{status}</Badge>;
  };

  const getListingVerificationBadge = (status: ListingStatus) => {
    if (status === 'verified_public' || status === 'verified_anonymous') return <Badge className="bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200 border-green-300 dark:border-green-500"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>;
    return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />{status.replace('_', ' ')}</Badge>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Engagement Queue: Ready for Connection</CardTitle>
          <CardDescription>Manage engagements where both buyer and seller are verified and have agreed to connect. Total pending: {engagements.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters could be added here: by date range, specific listing etc. */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date Ready</TableHead>
                  <TableHead className="whitespace-nowrap">Buyer Name</TableHead>
                  <TableHead className="whitespace-nowrap">Buyer Status</TableHead>
                  <TableHead className="whitespace-nowrap">Seller Name</TableHead>
                  <TableHead className="whitespace-nowrap">Seller Status</TableHead>
                  <TableHead className="whitespace-nowrap">Listing Title</TableHead>
                  <TableHead className="whitespace-nowrap">Listing Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engagements.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs whitespace-nowrap"><FormattedTimestamp timestamp={item.timestamp} /></TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                        <Link href={`/admin/users/${item.buyerId}`} className="hover:underline">{item.buyerName}</Link>
                    </TableCell>
                    <TableCell>{getVerificationBadge(item.buyerVerificationStatus)}</TableCell>
                     <TableCell className="font-medium whitespace-nowrap">
                        <Link href={`/admin/users/${item.sellerId}`} className="hover:underline">{item.sellerName}</Link>
                    </TableCell>
                    <TableCell>{getVerificationBadge(item.sellerVerificationStatus)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                        <Link href={`/admin/listings/${item.listingId}`} className="hover:underline">{item.listingTitle}</Link>
                    </TableCell>
                    <TableCell>{getListingVerificationBadge(item.listingVerificationStatus)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" title="Mark Connection Initiated">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </Button>
                       <Button variant="ghost" size="icon" title="Resolve/Archive Engagement">
                        <Archive className="h-4 w-4 text-green-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {engagements.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            The engagement queue is empty. All connections are up to date!
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
