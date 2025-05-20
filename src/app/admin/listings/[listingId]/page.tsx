import { sampleListings, sampleUsers } from "@/lib/placeholder-data";
import type { Listing, User } from "@/lib/types";
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, DollarSign, Briefcase, ShieldCheck, ShieldAlert, CalendarDays, Users, Info, TrendingUp, Tag, HandCoins, Edit, Trash2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getListingDetails(id: string): Promise<Listing | undefined> {
  return sampleListings.find(listing => listing.id === id);
}

async function getSellerDetails(sellerId: string): Promise<User | undefined> {
  return sampleUsers.find(user => user.id === sellerId && user.role === 'seller');
}

export default async function AdminListingDetailPage({ params }: { params: { listingId: string } }) {
  const listing = await getListingDetails(params.listingId);

  if (!listing) {
    notFound();
  }

  const seller = await getSellerDetails(listing.sellerId);
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Briefcase className="h-8 w-8 mr-3 text-primary" /> Listing Details: {listing.listingTitleAnonymous}
        </h1>
        <div className="flex gap-2 mt-2 md:mt-0">
            <Button variant="outline"><Edit className="h-4 w-4 mr-2"/> Edit Listing (Not Implemented)</Button>
            <Button variant={listing.status === 'active' ? 'destructive' : 'default'}>
                {listing.status === 'active' ? <Trash2 className="h-4 w-4 mr-2"/> : <ShieldCheck className="h-4 w-4 mr-2"/>}
                {listing.status === 'active' ? 'Deactivate' : 'Activate'} Listing
            </Button>
        </div>
      </div>
      
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="p-0 relative">
            <Image
              src={listing.imageUrl || "https://placehold.co/1200x400.png"}
              alt={listing.listingTitleAnonymous}
              width={1200}
              height={400}
              className="w-full h-64 md:h-80 object-cover"
              data-ai-hint="business operations factory"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">{listing.listingTitleAnonymous}</h2>
                <div className="mt-2 flex gap-2">
                {listing.isSellerVerified ? (
                    <Badge variant="secondary" className="bg-green-500 text-white border-green-600">
                        <ShieldCheck className="h-4 w-4 mr-1" /> Platform Verified Seller
                    </Badge>
                ) : (
                    <Badge variant="destructive" className="bg-yellow-500 text-white border-yellow-600">
                        <ShieldAlert className="h-4 w-4 mr-1" /> Seller Not Verified
                    </Badge>
                )}
                 <Badge variant={listing.status === 'active' ? 'default' : 'secondary'} className={`capitalize ${listing.status === 'active' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>Status: {listing.status}</Badge>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <section>
                    <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center"><Info className="h-5 w-5 mr-2 text-primary"/>Anonymous Business Overview</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.anonymousBusinessDescription}</p>
                </section>
                
                <Separator />

                <section>
                    <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center"><TrendingUp className="h-5 w-5 mr-2 text-primary"/>Key Strengths (Anonymous)</h3>
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
                            <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center"><Tag className="h-5 w-5 mr-2 text-primary"/>Reason for Selling (Anonymous)</h3>
                            <p className="text-muted-foreground leading-relaxed">{listing.reasonForSellingAnonymous}</p>
                        </section>
                    </>
                )}
                
                {(listing.actualCompanyName || listing.fullBusinessAddress) && (
                    <>
                    <Separator/>
                    <section className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h3 className="text-xl font-semibold text-primary mb-2 flex items-center"><ShieldCheck className="h-5 w-5 mr-2"/>Verified Seller Information (Admin View)</h3>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium text-foreground">Actual Company Name:</span> {listing.actualCompanyName || 'N/A'}</p>
                            <p><span className="font-medium text-foreground">Full Business Address:</span> {listing.fullBusinessAddress || 'N/A'}</p>
                            <p><span className="font-medium text-foreground">Specific Annual Revenue (Last Year):</span> {listing.specificAnnualRevenueLastYear ? `$${listing.specificAnnualRevenueLastYear.toLocaleString()} USD` : 'N/A'}</p>
                            <p><span className="font-medium text-foreground">Specific Net Profit (Last Year):</span> {listing.specificNetProfitLastYear ? `$${listing.specificNetProfitLastYear.toLocaleString()} USD` : 'N/A'}</p>
                            {listing.secureDataRoomLink && (
                                <p><span className="font-medium text-foreground">Secure Data Room:</span> <a href={listing.secureDataRoomLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Access Link (Admin Only)</a></p>
                            )}
                        </div>
                    </section>
                    </>
                )}
            </div>
            <aside className="space-y-6">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Listing Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p><span className="font-medium text-foreground">Industry:</span> {listing.industry}</p>
                        <p><span className="font-medium text-foreground">Location:</span> {listing.locationCityRegionGeneral}, {listing.locationCountry}</p>
                        <p><span className="font-medium text-foreground">Annual Revenue:</span> {listing.annualRevenueRange}</p>
                        {listing.netProfitMarginRange && <p><span className="font-medium text-foreground">Net Profit Margin:</span> {listing.netProfitMarginRange}</p>}
                        <p><span className="font-medium text-foreground">Asking Price:</span> {listing.askingPriceRange}</p>
                        {listing.dealStructureLookingFor && <p><span className="font-medium text-foreground">Deal Structure:</span> {listing.dealStructureLookingFor.join(', ')}</p>}
                        <p><span className="font-medium text-foreground">Listed On:</span> {new Date(listing.createdAt).toLocaleDateString()}</p>
                        {seller && (
                            <p><span className="font-medium text-foreground">Seller:</span> <Link href={`/admin/users/${seller.id}`} className="text-primary hover:underline">{seller.fullName}</Link> ({listing.isSellerVerified ? 'Verified' : 'Not Verified'})</p>
                        )}
                    </CardContent>
                </Card>
                 <Card className="shadow-md">
                    <CardHeader><CardTitle className="text-lg">Admin Actions on Listing</CardTitle></CardHeader>
                    <CardContent className="flex flex-col space-y-2">
                        <Button variant="outline"><Edit className="h-4 w-4 mr-2"/> Edit Listing Details</Button>
                        <Button variant="outline">View Associated Inquiries</Button>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                            <Trash2 className="h-4 w-4 mr-2"/> Remove Listing (Permanent)
                        </Button>
                    </CardContent>
                 </Card>
            </aside>
        </CardContent>
      </Card>
    </div>
  );
}
