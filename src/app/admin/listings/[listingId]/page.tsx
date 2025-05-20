
import { sampleListings, sampleUsers } from "@/lib/placeholder-data";
import type { Listing, User } from "@/lib/types";
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, DollarSign, Briefcase, ShieldCheck, ShieldAlert, CalendarDays, Users, Info, TrendingUp, Tag, HandCoins, Edit, Trash2, MessageSquare, Building, Brain, FileText, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const getListingStatusBadge = (status: Listing['status'], isSellerVerified: boolean) => {
    if (status === 'verified_public') return <Badge className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 border-green-300 dark:border-green-600"><ShieldCheck className="h-3 w-3 mr-1" /> Verified Public</Badge>;
    if (status === 'verified_anonymous') return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600"><ShieldCheck className="h-3 w-3 mr-1" /> Verified (Anon)</Badge>;
    if (status === 'pending_verification') return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" /> Pending Verification</Badge>;
    if (status === 'active' && !isSellerVerified) return <Badge variant="outline">Active (Anonymous)</Badge>;
    if (status === 'inactive') return <Badge variant="destructive">Inactive</Badge>;
    return <Badge variant="outline" className="capitalize">{status}</Badge>;
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Briefcase className="h-8 w-8 mr-3 text-primary" /> Listing Details: {listing.listingTitleAnonymous}
        </h1>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            <Button variant="outline"><Edit className="h-4 w-4 mr-2"/> Edit Listing</Button>
            <Button variant={(listing.status === 'active' || listing.status === 'verified_public' || listing.status === 'verified_anonymous') ? 'destructive' : 'default'}>
                {(listing.status === 'active' || listing.status === 'verified_public' || listing.status === 'verified_anonymous') ? <Trash2 className="h-4 w-4 mr-2"/> : <ShieldCheck className="h-4 w-4 mr-2"/>}
                {(listing.status === 'active' || listing.status === 'verified_public' || listing.status === 'verified_anonymous') ? 'Deactivate' : 'Activate'} Listing
            </Button>
             {listing.status === 'pending_verification' && (
                <Button variant="default" className="bg-green-600 hover:bg-green-700"><ShieldCheck className="h-4 w-4 mr-2"/> Approve & Mark Verified</Button>
             )}
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
                <div className="mt-2 flex gap-2 flex-wrap">
                {getListingStatusBadge(listing.status, listing.isSellerVerified)}
                {seller && (
                  <Badge variant={seller.isPaid ? "default" : "secondary"} className={seller.isPaid ? 'bg-accent text-accent-foreground' : ''}>
                    Seller: {seller.isPaid ? "Paid" : "Free"}
                  </Badge>
                )}
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                    <TabsTrigger value="operations">Operations & Growth</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="grid md:grid-cols-3 gap-8">
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
                            <><Separator /><section>
                                <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center"><Tag className="h-5 w-5 mr-2 text-primary"/>Reason for Selling (Anonymous)</h3>
                                <p className="text-muted-foreground leading-relaxed">{listing.reasonForSellingAnonymous}</p>
                            </section></>
                        )}
                    </div>
                    <aside className="space-y-6 md:sticky md:top-24 h-fit">
                        <Card className="shadow-md">
                            <CardHeader><CardTitle className="text-lg">Listing Summary</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <p><span className="font-medium text-foreground">Industry:</span> {listing.industry}</p>
                                <p><span className="font-medium text-foreground">Location:</span> {listing.locationCityRegionGeneral}, {listing.locationCountry}</p>
                                <p><span className="font-medium text-foreground">Annual Revenue:</span> {listing.annualRevenueRange}</p>
                                {listing.netProfitMarginRange && <p><span className="font-medium text-foreground">Net Profit Margin:</span> {listing.netProfitMarginRange}</p>}
                                <p><span className="font-medium text-foreground">Asking Price:</span> {listing.askingPriceRange}</p>
                                {listing.dealStructureLookingFor && <p><span className="font-medium text-foreground">Deal Structure:</span> {listing.dealStructureLookingFor.join(', ')}</p>}
                                <p><span className="font-medium text-foreground">Listed On:</span> {new Date(listing.createdAt).toLocaleDateString()}</p>
                                {seller && (
                                    <p><span className="font-medium text-foreground">Seller:</span> <Link href={`/admin/users/${seller.id}`} className="text-primary hover:underline">{seller.fullName}</Link> ({listing.isSellerVerified ? 'Platform Verified' : 'Not Platform Verified'})</p>
                                )}
                            </CardContent>
                        </Card>
                    </aside>
                </TabsContent>

                <TabsContent value="financials" className="space-y-6">
                    <h3 className="text-xl font-semibold text-primary mb-2 flex items-center"><DollarSign className="h-5 w-5 mr-2"/>Financial Details (Admin View)</h3>
                    <div className="grid md:grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20 text-sm">
                        <p><span className="font-medium text-foreground">Specific Annual Revenue (TTM):</span> {listing.specificAnnualRevenueLastYear ? `$${listing.specificAnnualRevenueLastYear.toLocaleString()} USD` : 'N/A'}</p>
                        <p><span className="font-medium text-foreground">Specific Net Profit (TTM):</span> {listing.specificNetProfitLastYear ? `$${listing.specificNetProfitLastYear.toLocaleString()} USD` : 'N/A'}</p>
                        <p className="md:col-span-2"><span className="font-medium text-foreground">Financials Explanation:</span> {listing.financialsExplanation || 'N/A'}</p>
                    </div>
                </TabsContent>

                <TabsContent value="operations" className="space-y-6">
                     <h3 className="text-xl font-semibold text-primary mb-2 flex items-center"><Building className="h-5 w-5 mr-2"/>Operations & Growth (Admin View)</h3>
                     <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-4 text-sm">
                        <p><span className="font-medium text-foreground">Business Model:</span> {listing.businessModel || 'N/A'}</p>
                        <p><span className="font-medium text-foreground">Year Established:</span> {listing.yearEstablished || 'N/A'}</p>
                        <p><span className="font-medium text-foreground">Registered Business Name:</span> {listing.registeredBusinessName || 'N/A'}</p>
                        <p><span className="font-medium text-foreground">Actual Company Name:</span> {listing.actualCompanyName || 'N/A'}</p>
                        <p><span className="font-medium text-foreground">Full Business Address:</span> {listing.fullBusinessAddress || 'N/A'}</p>
                        <p><span className="font-medium text-foreground">Business Website:</span> {listing.businessWebsiteUrl ? <Link href={listing.businessWebsiteUrl} target="_blank" className="text-primary hover:underline">{listing.businessWebsiteUrl}</Link> : 'N/A'}</p>
                        <div><span className="font-medium text-foreground">Social Media:</span> <pre className="text-muted-foreground whitespace-pre-wrap text-xs">{listing.socialMediaLinks || 'N/A'}</pre></div>
                        <p><span className="font-medium text-foreground">Number of Employees:</span> {listing.numberOfEmployees || 'N/A'}</p>
                        <div><span className="font-medium text-foreground">Technology Stack:</span> <p className="text-muted-foreground whitespace-pre-wrap text-xs">{listing.technologyStack || 'N/A'}</p></div>
                        <Separator/>
                        <div><h4 className="font-semibold text-foreground">Detailed Reason for Selling:</h4> <p className="text-muted-foreground whitespace-pre-wrap text-xs">{listing.detailedReasonForSelling || 'N/A'}</p></div>
                        <div><h4 className="font-semibold text-foreground">Seller Role & Time Commitment:</h4> <p className="text-muted-foreground whitespace-pre-wrap text-xs">{listing.sellerRoleAndTimeCommitment || 'N/A'}</p></div>
                        <div><h4 className="font-semibold text-foreground">Post-Sale Transition Support:</h4> <p className="text-muted-foreground whitespace-pre-wrap text-xs">{listing.postSaleTransitionSupport || 'N/A'}</p></div>
                        <Separator/>
                        <div><h4 className="font-semibold text-foreground">Potential for Growth Narrative:</h4> <p className="text-muted-foreground whitespace-pre-wrap text-xs">{listing.growthPotentialNarrative || 'N/A'}</p></div>
                        <div><h4 className="font-semibold text-foreground">Specific Growth Opportunities:</h4> <p className="text-muted-foreground whitespace-pre-wrap text-xs">{listing.specificGrowthOpportunities || 'N/A'}</p></div>
                     </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-6">
                    <h3 className="text-xl font-semibold text-primary mb-2 flex items-center"><FileText className="h-5 w-5 mr-2"/>Uploaded Documents (Placeholders)</h3>
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                        <div className="flex justify-between items-center p-2 border-b">
                            <p className="font-medium">Financial Statements (P&L.pdf)</p>
                            <Button variant="outline" size="sm">View Document</Button>
                        </div>
                         <div className="flex justify-between items-center p-2 border-b">
                            <p className="font-medium">Key Metrics Report (Metrics.xlsx)</p>
                            <Button variant="outline" size="sm">View Document</Button>
                        </div>
                         <div className="flex justify-between items-center p-2">
                            <p className="font-medium">Proof of Ownership (Incorporation.pdf)</p>
                            <Button variant="outline" size="sm">View Document</Button>
                        </div>
                         {listing.secureDataRoomLink && (
                            <div className="flex justify-between items-center p-2 border-t mt-2 pt-3">
                                <p className="font-medium">Secure Data Room:</p>
                                <Button variant="default" size="sm" asChild>
                                    <Link href={listing.secureDataRoomLink} target="_blank">Access Link</Link>
                                </Button>
                            </div>
                        )}
                         {!listing.financialDocumentsUrl && !listing.keyMetricsReportUrl && !listing.ownershipDocumentsUrl && (
                            <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded for this listing yet.</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
