'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import {
  Eye,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  AlertCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ExternalLink,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { NobridgeIcon } from "@/components/ui/nobridge-icon"; // Import NobridgeIcon
import { DashboardPageShell } from "@/components/shared/dashboard-page-shell";

interface ListingData {
  id: string;
  title: string;
  short_description: string;
  asking_price: number;
  industry: string;
  location_country: string;
  location_city: string;
  established_year?: number;
  number_of_employees?: string;
  website_url?: string;
  images: string[];
  status: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
  annual_revenue_range?: string;
  net_profit_margin_range?: string;
  key_strength_1?: string;
  key_strength_2?: string;
  key_strength_3?: string;
  growth_opportunity_1?: string;
  growth_opportunity_2?: string;
  growth_opportunity_3?: string;
  // Admin rejection fields
  admin_notes?: string;
  rejection_category?: string;
  admin_action_at?: string;
  approved_at?: string;
  // Appeal fields
  appeal_status?: string;
  appeal_message?: string;
  appeal_created_at?: string;
  admin_response?: string;
}

// Shared badge geometry so status + verification badges read as one system.
const BADGE_GEO = "text-xs font-medium py-1 px-2.5 inline-flex items-center gap-1.5 border";

// Listings that are live on the public marketplace and therefore safe to link to.
const PUBLICLY_VISIBLE_STATUSES = ['active', 'verified_anonymous', 'verified_public'];

export default function ManageSellerListingsPage() {
  const { toast } = useToast();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        const listingsResponse = await fetch('/api/user/listings?sort_by=updated_at&sort_order=desc');
        if (listingsResponse.ok) {
          const data = await listingsResponse.json();
          setListings(data.listings || []);
        } else {
          toast({
            title: "Error Loading Listings",
            description: "Failed to load your listings. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your connection.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, [toast]);

  // Enhanced status badge function with rejection handling
  const getStatusBadge = (listing: ListingData) => {
    const status = listing.status;

    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className={`${BADGE_GEO} bg-green-100 text-green-700 border-green-300 dark:bg-green-700/20 dark:text-green-300 dark:border-green-700`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active
          </Badge>
        );

      case 'inactive':
      case 'withdrawn':
        return (
          <Badge variant="outline" className={`${BADGE_GEO} bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700/20 dark:text-gray-300 dark:border-gray-700`}>
            <XCircle className="h-3.5 w-3.5" />
            {status === 'withdrawn' ? 'Withdrawn' : 'Inactive'}
          </Badge>
        );

      case 'pending_approval':
        return (
          <Badge variant="outline" className={`${BADGE_GEO} bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-700/20 dark:text-blue-300 dark:border-blue-700`}>
            <Clock className="h-3.5 w-3.5" />
            Pending Approval
          </Badge>
        );

      case 'under_review':
        return (
          <Badge variant="outline" className={`${BADGE_GEO} bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-700/20 dark:text-purple-300 dark:border-purple-700`}>
            <AlertCircle className="h-3.5 w-3.5" />
            Under Review
          </Badge>
        );

      case 'rejected_by_admin':
        return (
          <Badge variant="outline" className={`${BADGE_GEO} bg-red-100 text-red-700 border-red-300 dark:bg-red-700/20 dark:text-red-300 dark:border-red-700`}>
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </Badge>
        );

      case 'appealing_rejection':
        return (
          <Badge variant="outline" className={`${BADGE_GEO} bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-700/20 dark:text-amber-300 dark:border-amber-700`}>
            <MessageCircle className="h-3.5 w-3.5" />
            Appeal Submitted
          </Badge>
        );

      case 'draft':
        return (
          <Badge variant="outline" className={`${BADGE_GEO} bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/20 dark:text-slate-300 dark:border-slate-700`}>
            <FileText className="h-3.5 w-3.5" />
            Draft
          </Badge>
        );

      default:
        return (
          <Badge variant="outline" className={`${BADGE_GEO} bg-muted text-muted-foreground border-border`}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
          </Badge>
        );
    }
  };

  // Function to get rejection reason display
  const getRejectionReasonDisplay = (category?: string) => {
    const categoryMap: Record<string, string> = {
      'quality': 'Poor Quality',
      'compliance': 'Policy Violation',
      'incomplete': 'Incomplete Information',
      'fraud': 'Suspected Fraud',
      'duplicate': 'Duplicate Listing',
      'inappropriate': 'Inappropriate Content',
      'other': 'Other'
    };
    return category ? categoryMap[category] || category : 'Not specified';
  };

  if (isLoading) {
    return (
      <DashboardPageShell
        title="My Listings"
        description="View your business listings and their current status."
      >
        <Card className="flex-1 min-h-0 w-full flex flex-col overflow-hidden bg-card border">
          {/* Top band: half image + badge/title/quick-facts lines */}
          <div className="h-2/5 min-h-0 flex flex-row border-b">
            <Skeleton className="w-1/2 shrink-0 rounded-none" />
            <div className="w-1/2 flex flex-col justify-center gap-3 p-8">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          {/* Bottom band: two text columns + 3 tiles + button row */}
          <div className="flex-1 min-h-0 flex flex-col gap-5 p-8">
            <div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <div className="shrink-0 grid grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="shrink-0 flex flex-wrap gap-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </Card>
      </DashboardPageShell>
    );
  }

  // Guard against a shrinking array after a refetch, then render only this listing.
  const i = Math.min(currentIndex, listings.length - 1);
  const listing = listings[i];

  return (
    <DashboardPageShell
      title="My Listings"
      description="View your business listings and their current status."
    >
      {listings.length === 0 ? (
        <div className="flex flex-1 h-full flex-col items-center justify-center text-center border border-dashed border-border p-8">
          <NobridgeIcon icon="business-listing" size="xl" className="mb-6 text-muted-foreground opacity-70" />
          <h2 className="text-lg font-semibold text-foreground mb-2 font-heading">No Listings Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Our team will set up your listing once you&apos;re verified. There&apos;s nothing you need to do here yet — we&apos;ll be in touch.
          </p>
        </div>
      ) : (
        <>
          {/* Managed-by-team notice */}
          <Alert className="shrink-0">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your listing is managed by the Nobridge team. Contact us to request changes.
            </AlertDescription>
          </Alert>

          <Card className="flex-1 min-h-0 w-full flex flex-col overflow-hidden bg-card border">
              {/* TOP ROW: image (left half) + title & status (right half) */}
              <div className="h-2/5 min-h-0 flex flex-row border-b">
                {/* Image fills its half edge-to-edge, verification badge overlaid */}
                <div className="relative w-1/2 shrink-0">
                  <Image
                    src={listing.images?.[0] || "https://placehold.co/400x200.png"}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    data-ai-hint="business building city"
                  />
                  {listing.verification_status === 'verified' ? (
                    <Badge variant="outline" className={`${BADGE_GEO} absolute top-4 right-4 bg-green-100 text-green-700 border-green-300 dark:bg-green-700/20 dark:text-green-300 dark:border-green-700`}>
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified
                    </Badge>
                    ) : listing.verification_status === 'pending' ? (
                    <Badge variant="outline" className={`${BADGE_GEO} absolute top-4 right-4 bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-700/20 dark:text-yellow-300 dark:border-yellow-700`}>
                        <AlertTriangle className="h-3.5 w-3.5" /> Pending Verification
                    </Badge>
                    ) : (
                    <Badge variant="outline" className={`${BADGE_GEO} absolute top-4 right-4 bg-muted text-muted-foreground border-border`}>
                        <AlertTriangle className="h-3.5 w-3.5" /> Anonymous
                    </Badge>
                  )}
                </div>

                {/* Right half: title + location + quick facts, with the status badge
                    absolutely aligned to the same top offset as the image badge */}
                <div className="relative w-1/2 flex flex-col justify-center gap-3 p-8 pt-14">
                  {/* Enhanced status badge — top-4 mirrors the image's verification badge */}
                  <div className="absolute top-4 left-8">
                    {getStatusBadge(listing)}
                  </div>
                  <div>
                    <CardTitle className="text-2xl xl:text-3xl font-semibold text-foreground font-heading leading-tight line-clamp-2 hover:text-primary transition-colors">
                      <Link href={`/listings/${listing.id}`} target="_blank" title={`View public page for ${listing.title}`}>
                        {listing.title}
                      </Link>
                    </CardTitle>
                    <p className="mt-2 text-base text-muted-foreground truncate">{listing.industry} — {listing.location_city}, {listing.location_country}</p>
                  </div>
                  {/* Quick facts — only present parts, joined by · */}
                  {(listing.established_year || listing.number_of_employees || listing.website_url) && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                      {listing.established_year && <span>Est. {listing.established_year}</span>}
                      {listing.established_year && listing.number_of_employees && <span aria-hidden>·</span>}
                      {listing.number_of_employees && <span>{listing.number_of_employees} employees</span>}
                      {(listing.established_year || listing.number_of_employees) && listing.website_url && <span aria-hidden>·</span>}
                      {listing.website_url && (
                        <a href={listing.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                          <ExternalLink className="h-3.5 w-3.5" /> Website
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* BOTTOM ROW: the details */}
              <div className="flex-1 min-h-0 flex flex-col gap-5 p-8">
                {/* Detail grid: about (left) + strengths & growth (right) */}
                <div className="grid grid-cols-2 gap-8 flex-1 min-h-0 overflow-hidden">
                  {/* Left: about the business */}
                  <div className="min-h-0 overflow-hidden">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">About the Business</div>
                    {listing.short_description ? (
                      <p className="text-sm leading-relaxed line-clamp-[8]">{listing.short_description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No description provided.</p>
                    )}
                  </div>

                  {/* Right: key strengths + growth opportunities (each block omitted when empty) */}
                  <div className="min-h-0 overflow-hidden">
                    {(listing.key_strength_1 || listing.key_strength_2 || listing.key_strength_3) && (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Key Strengths</div>
                        <ul className="space-y-1.5">
                          {[listing.key_strength_1, listing.key_strength_2, listing.key_strength_3]
                            .filter(Boolean)
                            .map((s, idx) => (
                              <li key={idx} className="flex gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{s}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                    {(listing.growth_opportunity_1 || listing.growth_opportunity_2 || listing.growth_opportunity_3) && (
                      <div className="mt-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Growth Opportunities</div>
                        <ul className="space-y-1.5">
                          {[listing.growth_opportunity_1, listing.growth_opportunity_2, listing.growth_opportunity_3]
                            .filter(Boolean)
                            .map((g, idx) => (
                              <li key={idx} className="flex gap-2 text-sm">
                                <TrendingUp className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{g}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stat tiles */}
                <div className="shrink-0 grid grid-cols-3 gap-4">
                  <div className="border bg-brand-light-gray p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Revenue</div>
                    <div className="mt-1 text-lg font-semibold">{listing.annual_revenue_range || 'Not specified'}</div>
                  </div>
                  <div className="border bg-brand-light-gray p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Asking Price</div>
                    <div className="mt-1 text-lg font-semibold">${listing.asking_price?.toLocaleString() || 'Not specified'}</div>
                  </div>
                  <div className="border bg-brand-light-gray p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{listing.net_profit_margin_range ? 'Net Profit Margin' : 'Created'}</div>
                    <div className="mt-1 text-lg font-semibold">{listing.net_profit_margin_range || new Date(listing.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Rejection information */}
                {listing.status === 'rejected_by_admin' && (
                  <Alert className="mt-3 shrink-0 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-sm">
                      <div className="font-medium text-red-800 dark:text-red-200 mb-1">
                        Rejection Reason: {getRejectionReasonDisplay(listing.rejection_category)}
                      </div>
                      {listing.admin_notes && (
                        <div className="text-red-700 dark:text-red-300 text-xs">
                          {listing.admin_notes}
                        </div>
                      )}
                      {listing.admin_action_at && (
                        <div className="text-red-600 dark:text-red-400 text-xs mt-1">
                          Rejected on {new Date(listing.admin_action_at).toLocaleDateString()}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Appeal status information */}
                {listing.appeal_status && (
                  <Alert className="mt-3 shrink-0 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                    <MessageCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm">
                      <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Appeal Status: {listing.appeal_status.charAt(0).toUpperCase() + listing.appeal_status.slice(1)}
                      </div>
                      {listing.appeal_created_at && (
                        <div className="text-amber-700 dark:text-amber-300 text-xs">
                          Submitted on {new Date(listing.appeal_created_at).toLocaleDateString()}
                        </div>
                      )}
                      {listing.admin_response && (
                        <div className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                          Admin Response: {listing.admin_response}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action row — read-only: public view (when live) + inquiries */}
                <div className="shrink-0 grid grid-flow-col auto-cols-fr gap-2 pt-1">
                    {/* View public listing — only when the listing is live on the marketplace */}
                    {PUBLICLY_VISIBLE_STATUSES.includes(listing.status) && (
                      <Button variant="outline" asChild className="w-full border-input hover:bg-accent/50 hover:text-accent-foreground">
                          <Link href={`/listings/${listing.id}`} target="_blank">
                          <Eye className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">View public listing</span>
                          </Link>
                      </Button>
                    )}

                    {/* Inquiries - Always available */}
                    <Button variant="outline" asChild className="w-full border-input hover:bg-accent/50 hover:text-accent-foreground">
                        <Link href={`/seller-dashboard/inquiries?listingId=${listing.id}`}>
                        <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" /> Inquiries
                        </Link>
                    </Button>
                </div>
              </div>
          </Card>

          {listings.length > 1 && (
            <div className="shrink-0 flex items-center justify-center gap-4 pt-4">
              <Button variant="outline" size="sm" disabled={i === 0} onClick={() => setCurrentIndex(i - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Listing {i + 1} of {listings.length}</span>
              <Button variant="outline" size="sm" disabled={i === listings.length - 1} onClick={() => setCurrentIndex(i + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardPageShell>
  );
}
