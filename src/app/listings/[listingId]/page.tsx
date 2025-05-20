
import { sampleListings, sampleUsers } from '@/lib/placeholder-data';
import type { Listing, User } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, DollarSign, Briefcase, ShieldCheck, MessageSquare, CalendarDays, Users, Info, TrendingUp, Tag, HandCoins, FileText, LinkIcon, Building, Brain, BookOpen } from 'lucide-react';
import Link from 'next/link';

async function getListingDetails(id: string): Promise<Listing | undefined> {
  return sampleListings.find(listing => listing.id === id);
}

async function getSellerDetails(sellerId: string): Promise<User | undefined> {
  return sampleUsers.find(user => user.id === sellerId && user.role === 'seller');
}

const currentUserId = 'user2'; 
const currentUser = sampleUsers.find(u => u.id === currentUserId);


export default async function ListingDetailPage({ params }: { params: { listingId: string } }) {
  const listing = await getListingDetails(params.listingId);

  if (!listing) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-semibold">Listing not found</h1>
        <p className="text-muted-foreground">The business listing you are looking for does not exist or has been removed.</p>
        <Button asChild className="mt-4">
          <Link href="/">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  const seller = await getSellerDetails(listing.sellerId);
  const showVerifiedDetails = listing.isSellerVerified && currentUser && currentUser.verificationStatus === 'verified' && currentUser.isPaid;

  const DocumentLink = ({ href, children }: { href?: string; children: React.ReactNode }) => {
    if (!href) return <p className="text-sm text-muted-foreground">Not provided</p>;
    if (!showVerifiedDetails) return <p className="text-sm text-muted-foreground italic">Visible to paid, verified buyers</p>;
    return <Link href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><FileText className="h-4 w-4"/>{children}</Link>;
  };


  return (
    <div className="container py-8 md:py-12">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="p-0 relative">
            <Image
              src={listing.imageUrl || "https://placehold.co/1200x400.png"}
              alt={listing.listingTitleAnonymous}
              width={1200}
              height={400}
              className="w-full h-64 md:h-96 object-cover"
              data-ai-hint="business team presentation"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{listing.listingTitleAnonymous}</h1>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                {listing.isSellerVerified && (
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                      <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                        Platform Verified Seller
                      </h3>
                    </div>
                    {!currentUser?.isPaid && currentUser?.verificationStatus === 'verified' && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Full verified details are available to paid subscribers. <Link href="/dashboard/subscription" className="underline font-medium">Upgrade now</Link>.
                      </p>
                    )}
                  </div>
                )}

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-3 flex items-center"><Info className="h-6 w-6 mr-2 text-primary"/>Business Overview</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.anonymousBusinessDescription}</p>
                </section>
                
                <Separator />

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-3 flex items-center"><TrendingUp className="h-6 w-6 mr-2 text-primary"/>Key Strengths</h2>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {listing.keyStrengthsAnonymous.map((strength, index) => (
                        <li key={index}>{strength}</li>
                        ))}
                    </ul>
                </section>

                {(listing.potentialForGrowthNarrative || listing.specificGrowthOpportunities) && (
                  <>
                    <Separator />
                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-3 flex items-center"><Brain className="h-6 w-6 mr-2 text-primary"/>Potential for Growth</h2>
                        {listing.potentialForGrowthNarrative && (
                           <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mb-3">{listing.potentialForGrowthNarrative}</p>
                        )}
                        {listing.specificGrowthOpportunities && (
                          <>
                            <h3 className="text-lg font-medium text-foreground mb-1">Specific Opportunities:</h3>
                            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {/* Assuming specificGrowthOpportunities is a newline-separated string */}
                              {listing.specificGrowthOpportunities.split('\n').map((line, index) => (
                                line.trim() && <p key={index} className="ml-4 before:content-['•'] before:mr-2">{line.trim().replace(/^- /, '')}</p>
                              ))}
                            </div>
                          </>
                        )}
                    </section>
                  </>
                )}
                
                {listing.reasonForSellingAnonymous && (
                    <>
                        <Separator />
                        <section>
                            <h2 className="text-2xl font-semibold text-foreground mb-3 flex items-center"><Tag className="h-6 w-6 mr-2 text-primary"/>Reason for Selling (Anonymous)</h2>
                            <p className="text-muted-foreground leading-relaxed">{listing.reasonForSellingAnonymous}</p>
                        </section>
                    </>
                )}

                {listing.isSellerVerified && (
                  <>
                    <Separator />
                    <section className={`p-4 rounded-lg ${showVerifiedDetails ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-muted/50'}`}>
                        <h2 className="text-2xl font-semibold text-primary mb-3 flex items-center">
                          <ShieldCheck className="h-6 w-6 mr-2"/>
                          {showVerifiedDetails ? "Verified Seller Information & Documents" : "Verified Seller Information (Restricted Access)"}
                        </h2>
                        
                        {!showVerifiedDetails && currentUser && !currentUser.isPaid && (
                           <p className="text-sm text-muted-foreground mb-4">
                             Detailed company information and documents are available to <Link href="/dashboard/subscription" className="font-medium text-primary hover:underline">paid, verified subscribers</Link>.
                           </p>
                        )}
                        {!showVerifiedDetails && !currentUser && (
                           <p className="text-sm text-muted-foreground mb-4">
                             <Link href={`/auth/login?redirect=/listings/${listing.id}`} className="font-medium text-primary hover:underline">Login or Register</Link> as a paid, verified buyer to view detailed information and documents.
                           </p>
                        )}

                        <div className="space-y-3">
                            <div>
                                <h3 className="font-semibold text-foreground flex items-center gap-1"><Building className="h-4 w-4"/>Company Details</h3>
                                {showVerifiedDetails ? (
                                  <>
                                    <p className="text-sm"><span className="font-medium">Actual Company Name:</span> {listing.actualCompanyName || 'N/A'}</p>
                                    <p className="text-sm"><span className="font-medium">Full Business Address:</span> {listing.fullBusinessAddress || 'N/A'}</p>
                                  </>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">Restricted for free users.</p>
                                )}
                            </div>
                             <div>
                                <h3 className="font-semibold text-foreground flex items-center gap-1"><DollarSign className="h-4 w-4"/>Financials</h3>
                                 {showVerifiedDetails ? (
                                  <>
                                    <p className="text-sm"><span className="font-medium">Specific Annual Revenue (Last Year):</span> {listing.specificAnnualRevenueLastYear ? `$${listing.specificAnnualRevenueLastYear.toLocaleString()} USD` : 'N/A'}</p>
                                    <p className="text-sm"><span className="font-medium">Specific Net Profit (Last Year):</span> {listing.specificNetProfitLastYear ? `$${listing.specificNetProfitLastYear.toLocaleString()} USD` : 'N/A'}</p>
                                  </>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">Restricted for free users.</p>
                                )}
                                <DocumentLink href={listing.financialSnapshotUrl}>Financial Snapshot</DocumentLink>
                            </div>
                            <div><h3 className="font-semibold text-foreground">Ownership Details</h3><DocumentLink href={listing.ownershipDetailsUrl}>Ownership Documents</DocumentLink></div>
                            <div><h3 className="font-semibold text-foreground">Location & Real Estate</h3><DocumentLink href={listing.locationRealEstateInfoUrl}>Lease/Property Info</DocumentLink></div>
                            <div><h3 className="font-semibold text-foreground">Web Presence</h3><DocumentLink href={listing.webPresenceInfoUrl}>Website/Social Analytics</DocumentLink></div>
                             {showVerifiedDetails && listing.secureDataRoomLink && (
                                <div><h3 className="font-semibold text-foreground">Secure Data Room</h3><DocumentLink href={listing.secureDataRoomLink}>Access Data Room</DocumentLink></div>
                            )}
                        </div>
                    </section>
                  </>
                )}
            </div>

            <aside className="space-y-6 md:sticky md:top-24 h-fit">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-xl">Listing Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center">
                            <Briefcase className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-foreground">Industry</p><p className="text-muted-foreground">{listing.industry}</p></div>
                        </div>
                        <div className="flex items-center">
                            <MapPin className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-foreground">Location</p><p className="text-muted-foreground">{listing.locationCityRegionGeneral}, {listing.locationCountry}</p></div>
                        </div>
                         <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-foreground">Annual Revenue</p><p className="text-muted-foreground">{listing.annualRevenueRange}</p></div>
                        </div>
                        {listing.netProfitMarginRange && (
                             <div className="flex items-center">
                                <DollarSign className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                                <div><p className="font-medium text-foreground">Net Profit Margin</p><p className="text-muted-foreground">{listing.netProfitMarginRange}</p></div>
                            </div>
                        )}
                         <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-foreground">Asking Price</p><p className="text-muted-foreground">{listing.askingPriceRange}</p></div>
                        </div>
                        {listing.dealStructureLookingFor && listing.dealStructureLookingFor.length > 0 && (
                             <div className="flex items-start">
                                <HandCoins className="h-5 w-5 mr-3 text-primary flex-shrink-0 mt-0.5" />
                                <div><p className="font-medium text-foreground">Deal Structure</p><p className="text-muted-foreground">{listing.dealStructureLookingFor.join(', ')}</p></div>
                            </div>
                        )}
                        <div className="flex items-center">
                            <CalendarDays className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-foreground">Listed On</p><p className="text-muted-foreground">{new Date(listing.createdAt).toLocaleDateString()}</p></div>
                        </div>
                        {seller && (
                             <div className="flex items-center">
                                <Users className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-foreground">Seller Status</p>
                                    <p className="text-muted-foreground">
                                      {listing.isSellerVerified ? 
                                        (currentUser?.isPaid ? 'Verified (Full Details)' : 'Verified (Details Restricted)') 
                                        : 'Anonymous'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button className="w-full" disabled={!currentUser || currentUser.role !== 'buyer'}>
                            <MessageSquare className="h-4 w-4 mr-2"/>
                            Inquire About Business
                        </Button>
                        {listing.isSellerVerified && listing.status === 'active' && currentUser?.isPaid && currentUser.role === 'buyer' && (
                           <Button variant="outline" className="w-full">
                             <LinkIcon className="h-4 w-4 mr-2" />
                             Open Conversation (Placeholder)
                           </Button>
                        )}
                    </CardFooter>
                </Card>
                {!currentUser && (
                    <Card className="shadow-md bg-accent/10 border-accent/30">
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-accent-foreground mb-2">Want to learn more or see verified details?</p>
                            <Button variant="outline" asChild className="border-accent text-accent hover:bg-accent/20">
                                <Link href={`/auth/login?redirect=/listings/${listing.id}`}>Login or Register to Inquire</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
                 {currentUser && !currentUser.isPaid && listing.isSellerVerified && (
                    <Card className="shadow-md bg-amber-500/10 border-amber-500/30">
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">Upgrade to a paid plan to view full verified details and documents.</p>
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
