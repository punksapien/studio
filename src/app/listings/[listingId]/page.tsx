'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  MapPin, DollarSign, Briefcase, ShieldCheck, MessageSquare, CalendarDays, UserCircle,
  Info, TrendingUp, Tag, HandCoins, FileText, Link as LinkIconLucide, Building, Brain, Globe,
  BookOpen, ExternalLink, Users2 as UsersIcon, Images as ImagesIcon, Banknote, Eye,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sampleListings, sampleUsers } from '@/lib/placeholder-data';
import type { Listing, User } from '@/lib/types';

// Helper to format currency
const formatCurrency = (amount?: number) => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Contact for Price';
  return `$${amount.toLocaleString()} USD`;
};

// Client component for Image Gallery
function ImageGallery({ imageUrls, listingTitle }: { imageUrls?: string[]; listingTitle: string }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const validImageUrls = React.useMemo(() => {
    return (imageUrls || []).filter(url => url && url.trim() !== "");
  }, [imageUrls]);

  React.useEffect(() => {
    if (currentIndex >= validImageUrls.length && validImageUrls.length > 0) {
      setCurrentIndex(0);
    } else if (validImageUrls.length === 0) {
      setCurrentIndex(0);
    }
  }, [validImageUrls, currentIndex]);

  const mainImage = validImageUrls.length > 0 ? validImageUrls[currentIndex] : "https://placehold.co/1200x675.png?text=No+Image+Available";

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleNextImage = () => {
    if (validImageUrls.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % validImageUrls.length);
    }
  };

  const handlePrevImage = () => {
    if (validImageUrls.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + validImageUrls.length) % validImageUrls.length);
    }
  };

  return (
    <div className="w-full"> {/* Outer gallery div */}
      <div className={cn(
        "rounded-lg overflow-hidden shadow-lg bg-muted aspect-[16/9] flex items-center justify-center relative",
        validImageUrls.length > 1 ? "mb-2" : "mb-0" // Reduce margin if thumbnails are present
      )}>
        <Image
          src={mainImage}
          alt={`Main image for ${listingTitle} (${currentIndex + 1} of ${validImageUrls.length})`}
          width={1200}
          height={675}
          className="w-full h-full object-contain max-h-[40vh] sm:max-h-[50vh] md:max-h-[450px] lg:max-h-[500px]"
          data-ai-hint="business operations product"
          priority
          key={mainImage}
          onError={(e) => (e.currentTarget.src = "https://placehold.co/1200x675.png?text=Image+Error")}
        />
        {validImageUrls.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white border-none rounded-full h-8 w-8 sm:h-10 sm:w-10"
              onClick={handlePrevImage}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white border-none rounded-full h-8 w-8 sm:h-10 sm:w-10"
              onClick={handleNextImage}
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </>
        )}
      </div>
      {validImageUrls.length > 1 && (
        <div className="flex overflow-x-auto space-x-2 py-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent scrollbar-thumb-rounded-full">
          {validImageUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                "flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden focus:outline-none transition-opacity cursor-pointer",
                index === currentIndex ? "ring-2 ring-primary ring-offset-2 opacity-100" : "opacity-70 hover:opacity-100"
              )}
              aria-label={`View image ${index + 1} for ${listingTitle}`}
            >
              <Image
                src={url}
                alt={`Thumbnail ${index + 1} for ${listingTitle}`}
                width={100} height={100}
                className="w-full h-full object-cover"
                data-ai-hint="business detail product"
                onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100.png?text=Error")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = typeof params.listingId === 'string' ? params.listingId : '';

  const [listing, setListing] = React.useState<Listing | null | undefined>(undefined);
  const [seller, setSeller] = React.useState<User | null | undefined>(undefined);

  const [currentUser, setCurrentUser] = React.useState<User | null | undefined>(undefined);

  React.useEffect(() => {
    const storedUserId = 'user2';
    const user = sampleUsers.find(u => u.id === storedUserId);
    setCurrentUser(user || null);

    const fetchedListing = sampleListings.find(l => l.id === listingId);
    setListing(fetchedListing || null);

    if (fetchedListing) {
      const fetchedSeller = sampleUsers.find(u => u.id === fetchedListing.sellerId && u.role === 'seller');
      setSeller(fetchedSeller || null);
    } else {
      setSeller(null);
    }
  }, [listingId]);

  if (listing === undefined || currentUser === undefined) {
    return <div className="container py-8 text-center min-h-screen flex items-center justify-center"><p>Loading listing details...</p></div>;
  }

  if (!listing) {
    notFound();
    return null;
  }

  const canViewVerifiedDetails =
    listing.isSellerVerified &&
    currentUser &&
    currentUser.verificationStatus === 'verified' &&
    currentUser.isPaid;

  const DocumentLink = ({ href, children, docType }: { href?: string; children: React.ReactNode, docType?: string }) => {
    if (!canViewVerifiedDetails) {
        return <p className="text-sm text-muted-foreground italic">Details available to paid, verified buyers.</p>;
    }
    if (!href || href.trim() === "" || href.trim() === "#") {
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
        <CardHeader className="p-4 md:p-6">
            <ImageGallery imageUrls={listing.imageUrls} listingTitle={listing.listingTitleAnonymous}/>
            <div className="mt-4">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-brand-dark-blue tracking-tight">{listing.listingTitleAnonymous}</h1>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-brand-dark-blue/10 text-brand-dark-blue">{listing.industry}</Badge>
                  {listing.isSellerVerified && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-700 border border-green-500/30">
                      <ShieldCheck className="h-4 w-4 mr-1.5" /> Platform Verified Seller
                    </Badge>
                  )}
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 pt-0 grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
                {listing.isSellerVerified && !currentUser && (
                    <Card className="bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700">
                        <CardHeader><CardTitle className="text-blue-700 dark:text-blue-300 flex items-center"><UserCircle className="h-5 w-5 mr-2"/>Access Verified Information</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-blue-600 dark:text-blue-400">This listing is from a Platform Verified Seller. <Link href={`/auth/login?redirect=/listings/${listing.id}`} className="font-semibold underline hover:text-blue-700">Login</Link> or <Link href={`/auth/register?redirect=/listings/${listing.id}`} className="font-semibold underline hover:text-blue-700">Register</Link> as a paid, verified buyer to view detailed company information and documents.</p></CardContent>
                    </Card>
                )}
                {listing.isSellerVerified && currentUser && currentUser.role === 'buyer' && !canViewVerifiedDetails && !currentUser.isPaid && (
                    <Card className="bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700">
                        <CardHeader><CardTitle className="text-amber-700 dark:text-amber-300 flex items-center"><Info className="h-5 w-5 mr-2"/>Unlock Full Details</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-amber-600 dark:text-amber-400">This listing is from a Platform Verified Seller. To view specific company details, financials, and documents, please <Link href="/dashboard/subscription" className="font-semibold underline hover:text-amber-700">upgrade to a paid buyer plan</Link>.</p></CardContent>
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
                        {(listing.keyStrengthsAnonymous || []).map((strength, index) => (
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

                {(listing.adjustedCashFlow || listing.adjustedCashFlowExplanation) && (
                  <>
                    <Separator />
                    <section id="adjusted-cash-flow">
                      <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 flex items-center"><Banknote className="h-6 w-6 mr-2 text-primary" />Adjusted Cash Flow</h2>
                      {listing.adjustedCashFlow !== undefined && <p className="text-xl font-semibold text-primary mb-1">{formatCurrency(listing.adjustedCashFlow)} <span className="text-sm text-muted-foreground">(Annual)</span></p>}
                      {listing.adjustedCashFlowExplanation && <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{listing.adjustedCashFlowExplanation}</p>}
                    </section>
                  </>
                )}

                {listing.specificGrowthOpportunities && (
                  <>
                    <Separator />
                    <section id="growth-potential">
                        <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 flex items-center"><Brain className="h-6 w-6 mr-2 text-primary"/>Specific Growth Opportunities</h2>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-5">
                          {(listing.specificGrowthOpportunities || "").split('\n').filter(line => line.trim() !== "").map((line, index) => (
                            <li key={index}>{line.trim().replace(/^- /, '')}</li>
                          ))}
                        </ul>
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
                              <p className="text-sm text-muted-foreground italic">Visible to paid, verified buyers.</p>
                            )}
                        </div>
                         <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-1"><Globe className="h-5 w-5"/>Web Presence</h3>
                             {canViewVerifiedDetails ? (
                              <>
                                <p className="text-sm"><span className="font-medium">Business Website:</span> {listing.businessWebsiteUrl ? <Link href={listing.businessWebsiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{listing.businessWebsiteUrl}</Link> : 'N/A'}</p>
                                {listing.socialMediaLinks && <p className="text-sm"><span className="font-medium">Social Media:</span> <span className="whitespace-pre-wrap">{listing.socialMediaLinks}</span></p>}
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Visible to paid, verified buyers.</p>
                            )}
                            <DocumentLink href={listing.webPresenceInfoUrl} docType="web">Web & Analytics Report</DocumentLink>
                        </div>
                         <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-1"><DollarSign className="h-5 w-5"/>Specific Financials</h3>
                             {canViewVerifiedDetails ? (
                              <>
                                <p className="text-sm"><span className="font-medium">Specific Annual Revenue (TTM):</span> {listing.specificAnnualRevenueLastYear ? `${formatCurrency(listing.specificAnnualRevenueLastYear)}` : 'N/A'}</p>
                                <p className="text-sm"><span className="font-medium">Specific Net Profit (TTM):</span> {listing.specificNetProfitLastYear ? `${formatCurrency(listing.specificNetProfitLastYear)}` : 'N/A'}</p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Visible to paid, verified buyers.</p>
                            )}
                            <DocumentLink href={listing.financialSnapshotUrl || listing.financialDocumentsUrl} docType="financials">Financial Snapshot / Statements</DocumentLink>
                            <DocumentLink href={listing.keyMetricsReportUrl} docType="metrics">Key Metrics Report</DocumentLink>
                        </div>
                        <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-1"><UsersIcon className="h-5 w-5"/>Seller & Deal Information</h3>
                             {canViewVerifiedDetails ? (
                              <>
                                <p className="text-sm"><span className="font-medium">Detailed Reason for Selling:</span> <span className="whitespace-pre-wrap">{listing.detailedReasonForSelling || 'N/A'}</span></p>
                                <p className="text-sm"><span className="font-medium">Seller Role & Time Commitment:</span> <span className="whitespace-pre-wrap">{listing.sellerRoleAndTimeCommitment || 'N/A'}</span></p>
                                <p className="text-sm"><span className="font-medium">Post-Sale Transition Support:</span> <span className="whitespace-pre-wrap">{listing.postSaleTransitionSupport || 'N/A'}</span></p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Visible to paid, verified buyers.</p>
                            )}
                        </div>
                         <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-1"><FileText className="h-5 w-5"/>Other Documents</h3>
                            <DocumentLink href={listing.ownershipDetailsUrl || listing.ownershipDocumentsUrl} docType="ownership">Ownership Documents</DocumentLink>
                            <DocumentLink href={listing.locationRealEstateInfoUrl} docType="location">Location/Real Estate Info</DocumentLink>
                         </div>
                         {canViewVerifiedDetails && listing.secureDataRoomLink && (
                            <div><h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-1"><LinkIconLucide className="h-5 w-5"/>Secure Data Room</h3><DocumentLink href={listing.secureDataRoomLink} docType="dataroom">Access Data Room</DocumentLink></div>
                        )}
                    </div>
                </section>
            </div>

            <aside className="lg:col-span-4 space-y-6 md:sticky md:top-24 h-fit">
                <Card className="shadow-md">
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
                            <div><p className="font-medium text-brand-dark-blue">Asking Price</p><p className="text-muted-foreground">{formatCurrency(listing.askingPrice)}</p></div>
                        </div>
                        {listing.dealStructureLookingFor && listing.dealStructureLookingFor.length > 0 && (
                             <div className="flex items-start">
                                <HandCoins className="h-5 w-5 mr-3 text-primary flex-shrink-0 mt-0.5" />
                                <div><p className="font-medium text-brand-dark-blue">Deal Structure</p><p className="text-muted-foreground">{(listing.dealStructureLookingFor || []).join(', ')}</p></div>
                            </div>
                        )}
                        <div className="flex items-center">
                            <CalendarDays className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-brand-dark-blue">First Listed</p><p className="text-muted-foreground">{new Date(listing.createdAt).toLocaleDateString()}</p></div>
                        </div>
                        {seller && (
                             <div className="flex items-center">
                                <UserCircle className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
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
                        <Button
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={!currentUser || currentUser.role !== 'buyer'}
                            onClick={() => console.log("Inquire about business clicked for listing:", listing.id)}
                        >
                            <MessageSquare className="h-4 w-4 mr-2"/>
                            Inquire About Business
                        </Button>
                        {canViewVerifiedDetails && (listing.status === 'verified_public' || listing.status === 'verified_anonymous') && (
                           <Button
                             variant="outline"
                             className="w-full border-primary text-primary hover:bg-primary/10"
                             onClick={() => console.log("Open conversation clicked for listing:", listing.id)}
                            >
                             <ExternalLink className="h-4 w-4 mr-2" />
                             Open Conversation
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
