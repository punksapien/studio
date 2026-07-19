'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import {
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Loader2,
  XCircle,
  FileText,
  Clock,
  AlertCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
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

export default function ManageSellerListingsPage() {
  const { toast } = useToast();
  const { profile } = useCurrentUser();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Appeal dialog state
  const [appealDialog, setAppealDialog] = useState<{
    isOpen: boolean;
    listing: ListingData | null;
  }>({
    isOpen: false,
    listing: null,
  });
  const [appealMessage, setAppealMessage] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

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

  const handleDeactivate = async (listingId: string, listingTitle: string) => {
    setIsUpdating(listingId);
    try {
      console.log(`[DEACTIVATE] Attempting to deactivate listing ${listingId}: "${listingTitle}"`);

      const response = await fetch(`/api/listings/${listingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' }), // Use 'inactive' for soft delete
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[DEACTIVATE] Success:`, result);

        // Update local state with the new status
        setListings(prev => prev.map(listing =>
          listing.id === listingId ? { ...listing, status: 'inactive' } : listing
        ));

        toast({
          title: "✅ Listing Deactivated",
          description: result.message || `'${listingTitle}' has been deactivated and withdrawn from the marketplace.`
        });
      } else {
        // Enhanced error handling with specific status codes
        let errorMessage = 'Failed to deactivate listing';

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;

          // Handle specific error cases
          if (response.status === 401) {
            errorMessage = 'You are not authorized to perform this action. Please log in again.';
          } else if (response.status === 403) {
            errorMessage = 'You do not have permission to deactivate this listing.';
          } else if (response.status === 404) {
            errorMessage = 'Listing not found. It may have already been removed.';
          }

          console.error(`[DEACTIVATE] Error ${response.status}:`, errorData);
        } catch (parseError) {
          console.error(`[DEACTIVATE] Failed to parse error response:`, parseError);
          errorMessage = `Server error (${response.status}). Please try again.`;
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('[DEACTIVATE] Error:', error);
      toast({
        title: "❌ Deactivation Failed",
        description: error instanceof Error ? error.message : "Failed to deactivate listing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleReactivate = async (listingId: string, listingTitle: string) => {
    setIsUpdating(listingId);
    try {
      console.log(`[REACTIVATE] Attempting to reactivate listing ${listingId}: "${listingTitle}"`);

      const response = await fetch(`/api/listings/${listingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }), // Reactivate to active status
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[REACTIVATE] Success:`, result);

        // Update local state with the new status
        setListings(prev => prev.map(listing =>
          listing.id === listingId ? { ...listing, status: 'active' } : listing
        ));

        toast({
          title: "✅ Listing Reactivated",
          description: result.message || `'${listingTitle}' is now active and visible to buyers.`
        });
      } else {
        // Enhanced error handling with specific status codes
        let errorMessage = 'Failed to reactivate listing';

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;

          // Handle specific error cases
          if (response.status === 401) {
            errorMessage = 'You are not authorized to perform this action. Please log in again.';
          } else if (response.status === 403) {
            errorMessage = 'You do not have permission to reactivate this listing.';
          } else if (response.status === 404) {
            errorMessage = 'Listing not found. It may have been removed.';
          }

          console.error(`[REACTIVATE] Error ${response.status}:`, errorData);
        } catch (parseError) {
          console.error(`[REACTIVATE] Failed to parse error response:`, parseError);
          errorMessage = `Server error (${response.status}). Please try again.`;
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('[REACTIVATE] Error:', error);
      toast({
        title: "❌ Reactivation Failed",
        description: error instanceof Error ? error.message : "Failed to reactivate listing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleAppealSubmission = async () => {
    if (!appealDialog.listing || !appealMessage.trim()) {
      toast({
        title: "Appeal Message Required",
        description: "Please provide a detailed message explaining why this listing should be reconsidered.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmittingAppeal(true);
      console.log(`[APPEAL] Submitting appeal for listing ${appealDialog.listing.id}`);

      const response = await fetch(`/api/listings/${appealDialog.listing.id}/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appealMessage: appealMessage.trim(),
          originalRejectionReason: appealDialog.listing.admin_notes,
          originalRejectionCategory: appealDialog.listing.rejection_category
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[APPEAL] Success:`, result);

        // Update local state to show appeal submitted
        setListings(prev => prev.map(listing =>
          listing.id === appealDialog.listing!.id
            ? {
                ...listing,
                status: 'appealing_rejection',
                appeal_status: 'pending',
                appeal_message: appealMessage.trim(),
                appeal_created_at: new Date().toISOString()
              }
            : listing
        ));

        toast({
          title: "✅ Appeal Submitted",
          description: "Your appeal has been submitted and will be reviewed by our admin team. You'll be notified of the decision."
        });

        // Close dialog and reset form
        setAppealDialog({ isOpen: false, listing: null });
        setAppealMessage('');

      } else {
        let errorMessage = 'Failed to submit appeal';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error(`[APPEAL] Failed to parse error response:`, parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('[APPEAL] Error:', error);
      toast({
        title: "❌ Appeal Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit appeal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const openAppealDialog = (listing: ListingData) => {
    setAppealDialog({ isOpen: true, listing });
    setAppealMessage('');
  };

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

  // Function to determine if listing can be edited
  const canEditListing = (status: string) => {
    return !['rejected_by_admin', 'appealing_rejection', 'under_review'].includes(status);
  };

  // Function to determine if listing can be appealed
  const canAppealListing = (listing: ListingData) => {
    return listing.status === 'rejected_by_admin' && !listing.appeal_status;
  };

  if (isLoading) {
    return (
      <DashboardPageShell
        title="My Listings"
        description="Manage your business listings, track their status, and respond to inquiries."
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
      description="Manage your business listings, track their status, and respond to inquiries."
      headerActions={listings.length > 0 ? (
        <Button asChild variant="outline" size="sm" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
          <Link href="/seller-dashboard/listings/create"><PlusCircle className="h-4 w-4 mr-2" />Create New Listing</Link>
        </Button>
      ) : undefined}
    >
      {listings.length === 0 ? (
        <div className="flex flex-1 h-full flex-col items-center justify-center text-center border border-dashed border-border p-8">
          <NobridgeIcon icon="business-listing" size="xl" className="mb-6 text-muted-foreground opacity-70" />
          <h2 className="text-lg font-semibold text-foreground mb-2 font-heading">No Listings Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Showcase your business to motivated buyers. Create your first listing to get started.
          </p>
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/seller-dashboard/listings/create">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Your First Listing
            </Link>
          </Button>
        </div>
      ) : (
        <>
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

                {/* Action row — equal-width columns, single row */}
                <div className="shrink-0 grid grid-flow-col auto-cols-fr gap-2 pt-1">
                    {/* Public View - Always available */}
                    <Button variant="outline" asChild className="w-full border-input hover:bg-accent/50 hover:text-accent-foreground">
                        <Link href={`/listings/${listing.id}`} target="_blank">
                        <Eye className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Public View</span>
                        </Link>
                    </Button>

                    {/* Edit - Only if listing can be edited */}
                    {canEditListing(listing.status) ? (
                      <Button variant="outline" asChild className="w-full border-input hover:bg-accent/50 hover:text-accent-foreground">
                          <Link href={`/seller-dashboard/listings/${listing.id}/edit`}>
                          <Edit3 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
                          </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" disabled className="w-full border-input opacity-50">
                          <Edit3 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
                      </Button>
                    )}

                    {/* Inquiries - Always available */}
                    <Button variant="outline" asChild className="w-full border-input hover:bg-accent/50 hover:text-accent-foreground">
                        <Link href={`/seller-dashboard/inquiries?listingId=${listing.id}`}>
                        <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" /> Inquiries
                        </Link>
                    </Button>

                    {/* Status-specific action button */}
                    {listing.status === 'active' ? (
                        <Button
                          variant="outline"
                          onClick={() => handleDeactivate(listing.id, listing.title)}
                          disabled={isUpdating === listing.id}
                          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          {isUpdating === listing.id ? (
                            <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                          )}
                          Deactivate
                        </Button>
                    ) : (listing.status === 'inactive' || listing.status === 'withdrawn') && listing.approved_at ? (
                         /* Reactivation is only offered for listings that were previously
                          * approved by an admin. Never-approved listings must go through
                          * the admin review queue instead. */
                         <Button
                           variant="outline"
                           onClick={() => handleReactivate(listing.id, listing.title)}
                           disabled={isUpdating === listing.id}
                           className="w-full border-green-500/50 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                         >
                           {isUpdating === listing.id ? (
                             <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                           ) : (
                             <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" />
                           )}
                           Reactivate
                        </Button>
                    ) : canAppealListing(listing) ? (
                        <Button
                          variant="outline"
                          onClick={() => openAppealDialog(listing)}
                          className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                        >
                          <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                          Appeal
                        </Button>
                                        ) : listing.status === 'verified_anonymous' || listing.status === 'verified_public' ? (
                        /* VERIFIED LISTINGS - Admin approved, seller can deactivate if needed
                         *
                         * STATUS EXPLANATION:
                         * - verified_anonymous: Admin approved listing, shows basic business info publicly
                         *   but hides detailed financials (annual revenue, net profit, cash flow, seller_id)
                         * - verified_public: Admin approved listing, shows full verified details including
                         *   all financial information and seller identification
                         *
                         * Both statuses indicate successful admin review and marketplace visibility.
                         * Sellers can deactivate verified listings if they no longer want them active.
                         * TODO: Consider renaming for clarity - "verified_limited" vs "verified_full"
                         */
                        <Button
                          variant="outline"
                          onClick={() => handleDeactivate(listing.id, listing.title)}
                          disabled={isUpdating === listing.id}
                          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          {isUpdating === listing.id ? (
                            <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                          )}
                          Deactivate
                        </Button>
                    ) : (
                        <Button variant="outline" disabled className="w-full border-input opacity-50">
                          <Clock className="h-4 w-4 mr-1 sm:mr-2" />
                          {listing.status === 'pending_approval' ? 'Pending Review' :
                           listing.status === 'under_review' ? 'Reviewing' :
                           listing.status === 'appealing_rejection' ? 'Appealing' :
                           (listing.status === 'inactive' || listing.status === 'withdrawn') && !listing.approved_at ? 'Awaiting Approval' : 'Processing'}
                        </Button>
                    )}

                    {/* Get Verified - joins the action row when applicable */}
                    {profile?.verification_status !== 'verified' && listing.verification_status !== 'pending' && (
                      <Button variant="secondary" className="w-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-700/20 dark:text-yellow-300" asChild>
                          <Link href="/seller-dashboard/verification">
                              <ShieldCheck className="h-4 w-4 mr-2" /> Get Verified
                          </Link>
                      </Button>
                    )}
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

      {/* Appeal Dialog */}
      <Dialog open={appealDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setAppealDialog({ isOpen: false, listing: null });
          setAppealMessage('');
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-amber-600" />
              Appeal Listing Rejection
            </DialogTitle>
            <DialogDescription>
              Submit an appeal for "{appealDialog.listing?.title}". Please provide a detailed explanation of why this listing should be reconsidered.
            </DialogDescription>
          </DialogHeader>

          {appealDialog.listing && (
            <div className="space-y-4">
              {/* Show original rejection details */}
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="font-medium text-red-800 dark:text-red-200 mb-1">
                    Original Rejection: {getRejectionReasonDisplay(appealDialog.listing.rejection_category)}
                  </div>
                  {appealDialog.listing.admin_notes && (
                    <div className="text-red-700 dark:text-red-300 text-sm">
                      Admin Notes: {appealDialog.listing.admin_notes}
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {/* Appeal message input */}
              <div className="space-y-2">
                <label htmlFor="appeal-message" className="text-sm font-medium">
                  Your Appeal Message *
                </label>
                <Textarea
                  id="appeal-message"
                  placeholder="Please explain why you believe this listing should be approved. Include any additional information or corrections that address the rejection reason..."
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <div className="text-xs text-muted-foreground">
                  {appealMessage.length}/1000 characters
                </div>
              </div>

              {/* Guidelines */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <div className="font-medium mb-1">Appeal Guidelines:</div>
                  <ul className="text-xs space-y-1 ml-4 list-disc">
                    <li>Be specific about what changes you've made or why the rejection was incorrect</li>
                    <li>Provide additional context or documentation if relevant</li>
                    <li>Appeals are typically reviewed within 2-3 business days</li>
                    <li>You can only submit one appeal per listing</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAppealDialog({ isOpen: false, listing: null });
                setAppealMessage('');
              }}
              disabled={isSubmittingAppeal}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAppealSubmission}
              disabled={isSubmittingAppeal || !appealMessage.trim() || appealMessage.length > 1000}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmittingAppeal ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Appeal...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Submit Appeal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
