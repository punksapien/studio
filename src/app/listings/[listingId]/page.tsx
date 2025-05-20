import { sampleListings, sampleUsers } from '@/lib/placeholder-data';
import type { Listing, User } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, DollarSign, Briefcase, ShieldCheck, MessageSquare, CalendarDays, Users, Info, TrendingUp, Tag, HandCoins } from 'lucide-react';
import Link from 'next/link';

async function getListingDetails(id: string): Promise<Listing | undefined> {
  return sampleListings.find(listing => listing.id === id);
}

async function getSellerDetails(sellerId: string): Promise<User | undefined> {
  return sampleUsers.find(user => user.id === sellerId && user.role === 'seller');
}

// Placeholder for current user - in a real app, this would come from session
const currentUserId = 'user2'; // Assume this is a verified buyer
const currentUser = sampleUsers.find(u => u.id === currentUserId);
const isCurrentUserVerifiedBuyer = currentUser?.role === 'buyer' && currentUser?.verificationStatus === 'verified';


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
  const showVerifiedDetails = listing.isSellerVerified && isCurrentUserVerifiedBuyer;

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
                {listing.isSellerVerified && (
                    <Badge variant="secondary" className="mt-2 bg-accent text-accent-foreground">
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        Platform Verified Seller
                    </Badge>
                )}
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
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
                
                {listing.reasonForSellingAnonymous && (
                    <>
                        <Separator />
                        <section>
                            <h2 className="text-2xl font-semibold text-foreground mb-3 flex items-center"><Tag className="h-6 w-6 mr-2 text-primary"/>Reason for Selling (Anonymous)</h2>
                            <p className="text-muted-foreground leading-relaxed">{listing.reasonForSellingAnonymous}</p>
                        </section>
                    </>
                )}

                {showVerifiedDetails && (
                  <>
                    <Separator />
                    <section className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h2 className="text-2xl font-semibold text-primary mb-3 flex items-center"><ShieldCheck className="h-6 w-6 mr-2"/>Verified Seller Information</h2>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium text-foreground">Actual Company Name:</span> {listing.actualCompanyName || 'N/A'}</p>
                            <p><span className="font-medium text-foreground">Full Business Address:</span> {listing.fullBusinessAddress || 'N/A'}</p>
                            <p><span className="font-medium text-foreground">Specific Annual Revenue (Last Year):</span> {listing.specificAnnualRevenueLastYear ? `$${listing.specificAnnualRevenueLastYear.toLocaleString()} USD` : 'N/A'}</p>
                            <p><span className="font-medium text-foreground">Specific Net Profit (Last Year):</span> {listing.specificNetProfitLastYear ? `$${listing.specificNetProfitLastYear.toLocaleString()} USD` : 'N/A'}</p>
                            {listing.secureDataRoomLink && (
                                <p><span className="font-medium text-foreground">Secure Data Room:</span> <a href={listing.secureDataRoomLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Access Link</a></p>
                            )}
                        </div>
                    </section>
                  </>
                )}

            </div>
            <aside className="space-y-6 md:sticky md:top-24 h-fit"> {/* md:top-24 to account for navbar height + some padding */}
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-xl">Listing Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center">
                            <Briefcase className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-medium text-foreground">Industry</p>
                                <p className="text-muted-foreground">{listing.industry}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <MapPin className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-medium text-foreground">Location</p>
                                <p className="text-muted-foreground">{listing.locationCityRegionGeneral}, {listing.locationCountry}</p>
                            </div>
                        </div>
                         <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-medium text-foreground">Annual Revenue</p>
                                <p className="text-muted-foreground">{listing.annualRevenueRange}</p>
                            </div>
                        </div>
                        {listing.netProfitMarginRange && (
                             <div className="flex items-center">
                                <DollarSign className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-foreground">Net Profit Margin</p>
                                    <p className="text-muted-foreground">{listing.netProfitMarginRange}</p>
                                </div>
                            </div>
                        )}
                         <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-medium text-foreground">Asking Price</p>
                                <p className="text-muted-foreground">{listing.askingPriceRange}</p>
                            </div>
                        </div>
                        {listing.dealStructureLookingFor && listing.dealStructureLookingFor.length > 0 && (
                             <div className="flex items-start">
                                <HandCoins className="h-5 w-5 mr-3 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground">Deal Structure</p>
                                    <p className="text-muted-foreground">{listing.dealStructureLookingFor.join(', ')}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center">
                            <CalendarDays className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-medium text-foreground">Listed On</p>
                                <p className="text-muted-foreground">{new Date(listing.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        {seller && (
                             <div className="flex items-center">
                                <Users className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-foreground">Seller Status</p>
                                    <p className="text-muted-foreground">{listing.isSellerVerified ? 'Verified' : 'Anonymous'}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" disabled={!currentUser}> {/* Enable if user is logged in */}
                            <MessageSquare className="h-4 w-4 mr-2"/>
                            Inquire About Business
                        </Button>
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
            </aside>
        </CardContent>
      </Card>
    </div>
  );
}
