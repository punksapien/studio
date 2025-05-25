
'use client'; // For ImageGallery state

import * as React from 'react';
import { useState, useEffect } from 'react';
import { sampleListings, sampleUsers } from '@/lib/placeholder-data';
import type { Listing, User } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, DollarSign, Briefcase, ShieldCheck, MessageSquare, CalendarDays, Users, Info, TrendingUp, Tag, HandCoins, FileText, Link as LinkIcon, Building, Brain, BookOpen, ExternalLink, UserCircle, Globe, Users2, RadioTower, ImagesIcon, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

// Placeholder for current user - replace with actual auth logic
const currentUserId = 'user2'; // Example: Jane Smith (Verified & Paid Buyer)
const currentUser = sampleUsers.find(u => u.id === currentUserId);

interface ImageGalleryProps {
  imageUrls: string[];
  altText: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ imageUrls, altText }) => {
  const [mainImage, setMainImage] = useState(imageUrls[0] || "https://placehold.co/1200x600.png");

  useEffect(() => {
    if (imageUrls && imageUrls.length > 0) {
      setMainImage(imageUrls[0]);
    }
  }, [imageUrls]);

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <Image
        src="https://placehold.co/1200x600.png"
        alt="Placeholder Image"
        width={1200}
        height={600}
        className="w-full h-64 md:h-96 object-cover rounded-lg shadow-md"
        data-ai-hint="generic business building"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video relative overflow-hidden rounded-lg shadow-md bg-muted">
        <Image
          src={mainImage}
          alt={altText}
          fill
          className="object-contain" // Changed to object-contain for better main image display
          data-ai-hint={mainImage.includes('placehold.co') ? "generic business" : "business specific"}
        />
      </div>
      {imageUrls.length > 1 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {imageUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => setMainImage(url)}
              className={cn(
                "aspect-square relative overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-brand-sky-blue focus:ring-offset-2 transition-all",
                mainImage === url ? "ring-2 ring-brand-sky-blue ring-offset-2" : "opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={url}
                alt={`${altText} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                data-ai-hint="business detail product"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


export default function ListingDetailPage() {
  const params = useParams();
  const listingId = typeof params.listingId === 'string' ? params.listingId : '';
  
  const [listing, setListing] = useState<Listing | null | undefined>(undefined); // undefined for loading state

  useEffect(() => {
    // Simulate fetching listing data
    const fetchedListing = sampleListings.find(l => l.id === listingId);
    setListing(fetchedListing || null); // null if not found
  }, [listingId]);

  if (listing === undefined) {
    return <div className="container py-8 md:py-12 text-center">Loading listing details...</div>;
  }

  if (!listing) {
    notFound();
  }

  const seller = sampleUsers.find(user => user.id === listing.sellerId && user.role === 'seller');

  const canViewVerifiedDetails =
    listing.isSellerVerified &&
    currentUser &&
    currentUser.role === 'buyer' && // Ensure current user is a buyer
    currentUser.verificationStatus === 'verified' &&
    currentUser.isPaid;

  const DocumentLink = ({ href, children, docType }: { href?: string; children: React.ReactNode, docType: string }) => {
    if (!canViewVerifiedDetails) {
        return <p className="text-sm text-muted-foreground italic">Details available to paid, verified buyers.</p>;
    }
    if (!href) {
        return <p className="text-sm text-muted-foreground">Document not provided by seller.</p>;
    }
    return (
        <Link href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
            <FileText className="h-4 w-4"/>{children}
        </Link>
    );
  };

  return (
    <div className="container py-8 md:py-12 bg-brand-light-gray">
      <Card className="shadow-xl overflow-hidden bg-brand-white">
        <CardHeader className="p-0 relative">
            <ImageGallery imageUrls={listing.imageUrls || []} altText={listing.listingTitleAnonymous} />
            <div className="absolute bottom-0 left-0 p-6 md:p-8 bg-gradient-to-t from-black/70 to-transparent w-full">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-white tracking-tight">{listing.listingTitleAnonymous}</h1>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-brand-white/20 text-brand-white backdrop-blur-sm">{listing.industry}</Badge>
                  {listing.isSellerVerified && (
                    <Badge variant="secondary" className="bg-green-500/80 text-brand-white backdrop-blur-sm border-green-300">
                      <ShieldCheck className="h-4 w-4 mr-1.5" /> Platform Verified Seller
                    </Badge>
                  )}
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
                {listing.isSellerVerified && !canViewVerifiedDetails && currentUser && currentUser.role === 'buyer' && !currentUser.isPaid && (
                    <Card className="bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700">
                        <CardHeader><CardTitle className="text-amber-700 dark:text-amber-300 flex items-center"><Info className="h-5 w-5 mr-2"/>Unlock Full Details</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-amber-600 dark:text-amber-400">This listing is from a Platform Verified Seller. To view specific company details, financials, and documents, please <Link href="/dashboard/subscription" className="font-semibold underline hover:text-amber-700">upgrade to a paid buyer plan</Link>.</p></CardContent>
                    </Card>
                )}
                 {listing.isSellerVerified && !currentUser && (
                    <Card className="bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700">
                        <CardHeader><CardTitle className="text-blue-700 dark:text-blue-300 flex items-center"><UserCircle className="h-5 w-5 mr-2"/>Access Verified Information</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-blue-600 dark:text-blue-400">This listing is from a Platform Verified Seller. <Link href={`/auth/login?redirect=/listings/${listing.id}`} className="font-semibold underline hover:text-blue-700">Login</Link> or <Link href={`/auth/register/buyer?redirect=/listings/${listing.id}`} className="font-semibold underline hover:text-blue-700">Register</Link> as a paid, verified buyer to view detailed company information and documents.</p></CardContent>
                    </Card>
                )}

                <section id="business-overview">
                    <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 flex items-center"><BookOpen className="h-6 w-6 mr-2 text-primary"/>Business Overview</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.anonymousBusinessDescription}</p>
                </section>

                <Separator />

                <section id="key-strengths">
                    <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 flex items-center"><TrendingUp className="h-6 w-6 mr-2 text-primary"/>Key Strengths</h2>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-5">
                        {listing.keyStrengthsAnonymous.map((strength, index) => (
                        <li key={index}>{strength}</li>
                        ))}
                    </ul>
                </section>

                {listing.reasonForSellingAnonymous && (
                    <>
                        <Separator />
                        <section id="reason-for-selling">
                            <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 flex items-center"><Tag className="h-6 w-6 mr-2 text-primary"/>Reason for Selling</h2>
                            <p className="text-muted-foreground leading-relaxed">{listing.reasonForSellingAnonymous}</p>
                        </section>
                    </>
                )}
                
                {listing.specificGrowthOpportunities && (
                  <>
                    <Separator />
                    <section id="growth-potential">
                        <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 flex items-center"><Brain className="h-6 w-6 mr-2 text-primary"/>Specific Growth Opportunities</h2>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-5">
                          {listing.specificGrowthOpportunities.split('\n').map((line, index) => (
                            line.trim() && <li key={index}>{line.trim().replace(/^- /, '')}</li>
                          ))}
                        </ul>
                    </section>
                  </>
                )}

                {(listing.adjustedCashFlow || listing.adjustedCashFlowExplanation) && (
                  <>
                    <Separator />
                    <section id="adjusted-cash-flow">
                      <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 flex items-center"><Banknote className="h-6 w-6 mr-2 text-primary" />Adjusted Cash Flow</h2>
                      {listing.adjustedCashFlow && <p className="text-xl font-semibold text-primary mb-1">${listing.adjustedCashFlow.toLocaleString()} USD <span className="text-sm text-muted-foreground">(Annual)</span></p>}
                      {listing.adjustedCashFlowExplanation && <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{listing.adjustedCashFlowExplanation}</p>}
                    </section>
                  </>
                )}

                <Separator />
                <section id="verified-details" className={`p-6 rounded-lg ${canViewVerifiedDetails ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-muted/50'}`}>
                    <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center">
                      <ShieldCheck className="h-6 w-6 mr-2"/>
                      {canViewVerifiedDetails ? "Verified Seller Information & Documents" : "Verified Seller Information (Restricted Access)"}
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-1"><Building className="h-5 w-5"/>Company Details</h3>
                            {canViewVerifiedDetails ? (
                              <>
                                <p className="text-sm"><span className="font-medium">Actual Company Name:</span> {listing.actualCompanyName || 'N/A'}</p>
                                <p className="text-sm"><span className="font-medium">Registered Business Name:</span> {listing.registeredBusinessName || 'N/A'}</p>
                                <p className="text-sm"><span className="font-medium">Year Established:</span> {listing.yearEstablished || 'N/A'}</p>
                                <p className="text-sm"><span className="font-medium">Full Business Address:</span> {listing.fullBusinessAddress || 'N/A'}</p>
                                <p className="text-sm"><span className="font-medium">Number of Employees:</span> {listing.numberOfEmployees || 'N/A'}</p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Specific company details visible to paid, verified buyers.</p>
                            )}
                        </div>
                         <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-1"><Globe className="h-5 w-5"/>Web Presence</h3>
                             {canViewVerifiedDetails ? (
                              <>
                                <p className="text-sm"><span className="font-medium">Business Website:</span> {listing.businessWebsiteUrl ? <Link href={listing.businessWebsiteUrl} target="_blank" className="text-primary hover:underline">{listing.businessWebsiteUrl}</Link> : 'N/A'}</p>
                                <p className="text-sm"><span className="font-medium">Social Media:</span> {listing.socialMediaLinks ? <span className="whitespace-pre-wrap">{listing.socialMediaLinks}</span> : 'N/A'}</p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Web presence details visible to paid, verified buyers.</p>
                            )}
                            <DocumentLink href={listing.webPresenceInfoUrl} docType="web">Web &amp; Analytics Report</DocumentLink>
                        </div>
                         <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-1"><DollarSign className="h-5 w-5"/>Specific Financials</h3>
                             {canViewVerifiedDetails ? (
                              <>
                                <p className="text-sm"><span className="font-medium">Specific Annual Revenue (TTM):</span> {listing.specificAnnualRevenueLastYear ? `$${listing.specificAnnualRevenueLastYear.toLocaleString()} USD` : 'N/A'}</p>
                                <p className="text-sm"><span className="font-medium">Specific Net Profit (TTM):</span> {listing.specificNetProfitLastYear ? `$${listing.specificNetProfitLastYear.toLocaleString()} USD` : 'N/A'}</p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Specific financial figures visible to paid, verified buyers.</p>
                            )}
                            <DocumentLink href={listing.financialSnapshotUrl || listing.financialDocumentsUrl} docType="financials">Financial Snapshot / Statements</DocumentLink>
                            <DocumentLink href={listing.keyMetricsReportUrl} docType="metrics">Key Metrics Report</DocumentLink>
                        </div>
                        <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-1"><Users2 className="h-5 w-5"/>Seller &amp; Deal Information</h3>
                             {canViewVerifiedDetails ? (
                              <>
                                <p className="text-sm"><span className="font-medium">Detailed Reason for Selling:</span> <span className="whitespace-pre-wrap">{listing.detailedReasonForSelling || 'N/A'}</span></p>
                                <p className="text-sm"><span className="font-medium">Seller Role &amp; Time Commitment:</span> <span className="whitespace-pre-wrap">{listing.sellerRoleAndTimeCommitment || 'N/A'}</span></p>
                                <p className="text-sm"><span className="font-medium">Post-Sale Transition Support:</span> <span className="whitespace-pre-wrap">{listing.postSaleTransitionSupport || 'N/A'}</span></p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Detailed seller and deal info visible to paid, verified buyers.</p>
                            )}
                        </div>
                         <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-1"><FileText className="h-5 w-5"/>Other Documents</h3>
                            <DocumentLink href={listing.ownershipDetailsUrl || listing.ownershipDocumentsUrl} docType="ownership">Ownership Documents</DocumentLink>
                            <DocumentLink href={listing.locationRealEstateInfoUrl} docType="location">Location/Real Estate Info</DocumentLink>
                         </div>
                         {canViewVerifiedDetails && listing.secureDataRoomLink && (
                            <div><h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-1"><LinkIcon className="h-5 w-5"/>Secure Data Room</h3><DocumentLink href={listing.secureDataRoomLink} docType="dataroom">Access Data Room</DocumentLink></div>
                        )}
                    </div>
                </section>
            </div>

            <aside className="lg:col-span-4 space-y-6 md:sticky md:top-24 h-fit">
                <Card className="shadow-md bg-brand-white">
                    <CardHeader>
                        <CardTitle className="text-xl text-brand-dark-blue">Listing Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center">
                            <Briefcase className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-brand-dark-blue">Industry</p><p className="text-muted-foreground">{listing.industry}</p></div>
                        </div>
                        <div className="flex items-center">
                            <MapPin className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-brand-dark-blue">Location</p><p className="text-muted-foreground">{listing.locationCityRegionGeneral}, {listing.locationCountry}</p></div>
                        </div>
                         <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-brand-dark-blue">Annual Revenue</p><p className="text-muted-foreground">{listing.annualRevenueRange}</p></div>
                        </div>
                        {listing.netProfitMarginRange && (
                             <div className="flex items-center">
                                <DollarSign className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                                <div><p className="font-medium text-brand-dark-blue">Net Profit Margin</p><p className="text-muted-foreground">{listing.netProfitMarginRange}</p></div>
                            </div>
                        )}
                         <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-brand-dark-blue">Asking Price</p><p className="text-muted-foreground">{listing.askingPrice ? `$${listing.askingPrice.toLocaleString()} USD` : 'Contact for Price'}</p></div>
                        </div>
                        {listing.dealStructureLookingFor && listing.dealStructureLookingFor.length > 0 && (
                             <div className="flex items-start">
                                <HandCoins className="h-5 w-5 mr-3 text-primary flex-shrink-0 mt-0.5" />
                                <div><p className="font-medium text-brand-dark-blue">Deal Structure</p><p className="text-muted-foreground">{listing.dealStructureLookingFor.join(', ')}</p></div>
                            </div>
                        )}
                        <div className="flex items-center">
                            <CalendarDays className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-brand-dark-blue">First Listed On</p><p className="text-muted-foreground">{new Date(listing.createdAt).toLocaleDateString()}</p></div>
                        </div>
                        {seller && (
                             <div className="flex items-center">
                                <Users className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-brand-dark-blue">Seller Status</p>
                                    <p className="text-muted-foreground">
                                      {listing.isSellerVerified ?
                                        (canViewVerifiedDetails ? 'Verified (Full Details Visible)' : 'Verified (Details Restricted)')
                                        : 'Anonymous'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button className="w-full bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90" disabled={!currentUser || currentUser.role !== 'buyer'}>
                            <MessageSquare className="h-4 w-4 mr-2"/>
                            Inquire About Business
                        </Button>
                        {canViewVerifiedDetails && listing.status === 'verified_public' && ( 
                           <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                             <ExternalLink className="h-4 w-4 mr-2" />
                             Open Conversation (Placeholder)
                           </Button>
                        )}
                    </CardFooter>
                </Card>
                {!currentUser && (
                    <Card className="shadow-md bg-brand-sky-blue/10 border-brand-sky-blue/30">
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-brand-dark-blue mb-2">Want to learn more or see verified details?</p>
                            <Button variant="outline" asChild className="border-brand-dark-blue text-brand-dark-blue hover:bg-brand-dark-blue/5">
                                <Link href={`/auth/login?redirect=/listings/${listing.id}`}>Login or Register to Inquire</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
                 {currentUser && currentUser.role === 'buyer' && !currentUser.isPaid && listing.isSellerVerified && (
                    <Card className="shadow-md bg-amber-500/10 border-amber-500/30">
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">Upgrade to a paid plan to view full verified details and documents for this listing.</p>
                            <Button variant="outline" asChild className="border-amber-600 text-amber-700 hover:bg-amber-600/20">
                                <Link href="/dashboard/subscription">View Subscription Options</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </aside>
        </CardContent>
      </Card>
    </div>
  );
}

    