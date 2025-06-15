'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import {
  MapPin, DollarSign, Briefcase, ShieldCheck, MessageSquare, CalendarDays, UserCircle,
  Info, TrendingUp, Tag, HandCoins, FileText, Link as LinkIconLucide, Building, Brain, Globe,
  BookOpen, ExternalLink, Users2 as UsersIcon, Images as ImagesIcon, Banknote, Eye,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Type definitions for the listing data
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
  images?: string[];
  status: string;
  verification_status: string;
  seller_id: string;
  annual_revenue_range?: string;
  net_profit_margin_range?: string;
  verified_annual_revenue?: number;
  verified_net_profit?: number;
  verified_cash_flow?: number;
  key_strength_1?: string;
  key_strength_2?: string;
  key_strength_3?: string;
  growth_opportunity_1?: string;
  growth_opportunity_2?: string;
  growth_opportunity_3?: string;
  key_strengths_anonymous?: string[];
  specific_growth_opportunities?: string;

  // Additional fields from the complete listing
  business_model?: string;
  deal_structure_looking_for?: string[];
  reason_for_selling_anonymous?: string;
  detailed_reason_for_selling?: string;
  adjusted_cash_flow?: number;
  social_media_links?: string;
  registered_business_name?: string;

  // Seller verification info
  is_seller_verified?: boolean;

  // Document URLs
  financial_documents_url?: string;
  key_metrics_report_url?: string;
  ownership_documents_url?: string;
  financial_snapshot_url?: string;
  ownership_details_url?: string;
  location_real_estate_info_url?: string;
  web_presence_info_url?: string;
  secure_data_room_link?: string;
}

// Helper to format currency
const formatCurrency = (amount?: number) => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Contact for Price';
  return `$${amount.toLocaleString()} USD`;
};

// Default image placeholders for listings
const DEFAULT_LISTING_IMAGES = [
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=600&fit=crop', // Business meeting
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', // Office space
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Business data
  'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&h=600&fit=crop', // Money/finance
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop'  // Business planning
];

// Client component for Image Gallery
function ImageGallery({ imageUrls, listingTitle }: { imageUrls?: string[]; listingTitle: string }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const validImageUrls = React.useMemo(() => {
    const urls = (imageUrls || []).filter(url => url && url.trim() !== "");
    // Use default images if no valid images provided
    return urls.length > 0 ? urls : [DEFAULT_LISTING_IMAGES[0]];
  }, [imageUrls]);

  React.useEffect(() => {
    if (currentIndex >= validImageUrls.length && validImageUrls.length > 0) {
      setCurrentIndex(0);
    } else if (validImageUrls.length === 0) {
      setCurrentIndex(0);
    }
  }, [validImageUrls, currentIndex]);

  const mainImage = validImageUrls.length > 0 ? validImageUrls[currentIndex] : DEFAULT_LISTING_IMAGES[0];

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
    <div className="w-full">
      <div className={cn(
        "rounded-lg overflow-hidden shadow-lg bg-muted aspect-[16/9] flex items-center justify-center relative",
        "max-h-[400px] sm:max-h-[500px] md:max-h-[450px] lg:max-h-[500px]",
        validImageUrls.length > 1 ? "mb-2" : "mb-0"
      )}>
        <Image
          src={mainImage}
          alt={`Main image for ${listingTitle} (${currentIndex + 1} of ${validImageUrls.length})`}
          width={1200}
          height={675}
          className="w-full h-full object-contain"
          priority
          key={mainImage}
          onError={(e) => {
            const target = e.currentTarget;
            const fallbackIndex = DEFAULT_LISTING_IMAGES.findIndex(img => !target.dataset.triedUrls?.includes(img));
            if (fallbackIndex !== -1) {
              target.dataset.triedUrls = (target.dataset.triedUrls || '') + mainImage + ',';
              target.src = DEFAULT_LISTING_IMAGES[fallbackIndex];
            }
          }}
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
                "flex-shrink-0 w-20 h-16 sm:w-24 sm:h-20 rounded-md overflow-hidden focus:outline-none transition-opacity cursor-pointer",
                index === currentIndex ? "ring-2 ring-primary ring-offset-2 opacity-100" : "opacity-70 hover:opacity-100"
              )}
              aria-label={`View image ${index + 1} for ${listingTitle}`}
            >
              <Image
                src={url}
                alt={`Thumbnail ${index + 1} for ${listingTitle}`}
                width={100}
                height={80}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedFallback) {
                    target.dataset.triedFallback = 'true';
                    target.src = DEFAULT_LISTING_IMAGES[index % DEFAULT_LISTING_IMAGES.length];
                  }
                }}
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
  const { toast } = useToast();
  const listingId = typeof params.listingId === 'string' ? params.listingId : '';

  const [listing, setListing] = React.useState<ListingData | null | undefined>(undefined);
  const [currentUser, setCurrentUser] = React.useState<any | null | undefined>(undefined);
  const [inquirySent, setInquirySent] = React.useState(false);
  const [isSubmittingInquiry, setIsSubmittingInquiry] = React.useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = React.useState(false);
  const [isCheckingInquiry, setIsCheckingInquiry] = React.useState(false);

  // Check if user has already inquired about this listing
  const checkExistingInquiry = React.useCallback(async () => {
    if (!currentUser || currentUser.role !== 'buyer' || !listingId) return;

    setIsCheckingInquiry(true);
    try {
      const response = await fetch(`/api/inquiries/check?listing_id=${listingId}`);
      if (response.ok) {
        const data = await response.json();
        setInquirySent(data.has_inquired);
      }
    } catch (error) {
      console.error('Error checking inquiry status:', error);
    } finally {
      setIsCheckingInquiry(false);
    }
  }, [currentUser, listingId]);

  // Fetch current user data
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/current-user');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.profile ? {
            id: data.user.id,
            email: data.user.email,
            fullName: data.profile.full_name || data.profile.first_name + ' ' + data.profile.last_name,
            role: data.profile.role,
            verificationStatus: data.profile.verification_status,
            isPaid: data.profile.is_paid || false
          } : null);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setCurrentUser(null);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch listing data from API
  React.useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${listingId}`);
        if (response.ok) {
          const data = await response.json();
          setListing(data);
        } else if (response.status === 404) {
          setListing(null);
        } else {
          console.error('Error fetching listing:', response.statusText);
          setListing(null);
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
        setListing(null);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  // Check existing inquiry when user and listing are loaded
  React.useEffect(() => {
    if (currentUser && listing) {
      checkExistingInquiry();
    }
  }, [currentUser, listing, checkExistingInquiry]);

  // Parse key strengths and growth opportunities - MUST be before any conditional returns
  const keyStrengths = React.useMemo(() => {
    if (!listing) return [];

    const strengths = [];
    if (listing.key_strength_1) strengths.push(listing.key_strength_1);
    if (listing.key_strength_2) strengths.push(listing.key_strength_2);
    if (listing.key_strength_3) strengths.push(listing.key_strength_3);

    // Fallback to legacy format if individual fields are empty
    if (strengths.length === 0 && listing.key_strengths_anonymous) {
      return listing.key_strengths_anonymous;
    }

    return strengths;
  }, [listing]);

  const growthOpportunities = React.useMemo(() => {
    if (!listing) return [];

    const opportunities = [];
    if (listing.growth_opportunity_1) opportunities.push(listing.growth_opportunity_1);
    if (listing.growth_opportunity_2) opportunities.push(listing.growth_opportunity_2);
    if (listing.growth_opportunity_3) opportunities.push(listing.growth_opportunity_3);

    // Fallback to legacy format if individual fields are empty
    if (opportunities.length === 0 && listing.specific_growth_opportunities) {
      return listing.specific_growth_opportunities.split('\n').filter((line: string) => line.trim() !== '');
    }

    return opportunities;
  }, [listing]);

  const cfMultiple = React.useMemo(() => {
    if (!listing) return 'N/A';
    return (listing.asking_price && listing.adjusted_cash_flow && listing.adjusted_cash_flow > 0)
      ? (listing.asking_price / listing.adjusted_cash_flow).toFixed(2) + 'x'
      : 'N/A';
  }, [listing]);

  if (listing === undefined || currentUser === undefined || isCheckingInquiry) {
    return <div className="container py-8 text-center min-h-screen flex items-center justify-center"><p>Loading listing details...</p></div>;
  }

  if (!listing) {
    notFound();
    return null;
  }

  // Sellers should always be able to view their own listings with full details
  // Buyers need to be paid and verified to view verified seller details
  const canViewVerifiedDetails =
    listing.is_seller_verified &&
    currentUser &&
    (
      // Seller viewing their own listing
      (currentUser.id === listing.seller_id) ||
      // Paid, verified buyer viewing verified seller's listing
      (currentUser.verificationStatus === 'verified' && currentUser.isPaid)
    );

  const handleInquire = async () => {
    if (!currentUser || currentUser.role === 'seller') {
      toast({
        title: '⚠️ Action not available',
        description: currentUser?.role === 'seller' ? 'Sellers cannot inquire about other businesses.' : 'Please login as a buyer to inquire.',
        className: 'border-yellow-200 bg-yellow-50 text-yellow-800'
      });
      return;
    }

    if (inquirySent) {
      toast({
        title: 'Already inquired',
        description: 'You have already sent an inquiry for this listing.',
      });
      return;
    }

    setIsSubmittingInquiry(true);

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listingId,
          message: 'I am interested in learning more about this business opportunity.'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setInquirySent(true);
        toast({
          title: 'Inquiry Sent!',
          description: `Your inquiry for "${listing.title}" has been submitted.`
        });
      } else if (response.status === 409) {
        // User already has an inquiry
        setInquirySent(true);
        toast({
          title: 'Already inquired',
          description: 'You have already sent an inquiry for this listing.',
        });
      } else {
        throw new Error(data.error || 'Failed to send inquiry');
      }
    } catch (error) {
      console.error('Error sending inquiry:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send inquiry. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const handleOpenConversation = () => {
    if (!currentUser || currentUser.role === 'seller') {
      toast({
        title: '⚠️ Action not available',
        description: currentUser?.role === 'seller' ? 'Sellers cannot start conversations.' : 'Please login as a buyer.',
        className: 'border-yellow-200 bg-yellow-50 text-yellow-800'
      });
      return;
    }

    // Check if the business (seller) is verified
    if (!listing.is_seller_verified) {
      setShowVerificationPopup(true);
    } else {
      // Logic to open conversation (e.g., navigate to chat page)
      console.log("Open conversation clicked for listing:", listing.id);
      toast({
        title: "Opening Conversation...",
        description: `Connecting you with the seller of "${listing.title}".`
      });
      // Example: router.push(`/messages/conversation_id_here`);
    }
  };

  const DocumentLink = ({ href, children, docType }: { href?: string; children: React.ReactNode, docType?: string }) => {
    if (!canViewVerifiedDetails) {
        return <p className="text-sm text-muted-foreground italic">Details available to paid, verified buyers.</p>;
    }
    if (!href || href.trim() === "" || href.trim() === "#") {
        return <p className="text-sm text-slate-600">Document not provided by seller.</p>;
    }
    return (
        <Link href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1">
            <FileText className="h-4 w-4"/>{children}
        </Link>
    );
  };

  return (
    <div className="container py-8 md:py-12 bg-brand-light-gray">
      <Card className="shadow-xl overflow-hidden bg-brand-white">
        <CardHeader className="p-4 md:p-6">
            <div className="flex justify-center">
                <ImageGallery imageUrls={listing.images} listingTitle={listing.title}/>
            </div>
            <div className="mt-4">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-brand-dark-blue tracking-tight">{listing.title}</h1>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-brand-dark-blue/10 text-brand-dark-blue">{listing.industry}</Badge>
                  {listing.is_seller_verified ? (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-700 border border-green-500/30">
                      <ShieldCheck className="h-4 w-4 mr-1.5" /> Verified - Due Diligence Completed
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border border-amber-500/30">
                        <Info className="h-4 w-4 mr-1.5" /> Unverified
                    </Badge>
                  )}
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 pt-0 grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
                {listing.is_seller_verified && !currentUser && (
                    <Card className="bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700">
                        <CardHeader><CardTitle className="text-blue-700 dark:text-blue-300 flex items-center"><UserCircle className="h-5 w-5 mr-2"/>Access Verified Information</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-blue-600 dark:text-blue-400">This listing is from a Seller who completed Due Diligence. <Link href={`/auth/login?redirect=/listings/${listing.id}`} className="font-semibold underline hover:text-blue-700">Login</Link> or <Link href={`/auth/register?redirect=/listings/${listing.id}`} className="font-semibold underline hover:text-blue-700">Register</Link> as a paid, verified buyer to view detailed company information and documents.</p></CardContent>
                    </Card>
                )}
                {listing.is_seller_verified && currentUser && currentUser.role === 'buyer' && !canViewVerifiedDetails && !currentUser.isPaid && (
                    <Card className="bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700">
                        <CardHeader><CardTitle className="text-amber-700 dark:text-amber-300 flex items-center"><Info className="h-5 w-5 mr-2"/>Unlock Full Details</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-amber-600 dark:text-amber-400">This listing is from a Seller who completed Due Diligence. To view specific company details, financials, and documents, please <Link href="/dashboard/subscription" className="font-semibold underline hover:text-amber-700">upgrade to a paid buyer plan</Link>.</p></CardContent>
                    </Card>
                )}

                {listing.is_seller_verified && currentUser && currentUser.id === listing.seller_id && (
                    <Card className="bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700">
                        <CardHeader><CardTitle className="text-green-700 dark:text-green-300 flex items-center"><Eye className="h-5 w-5 mr-2"/>Your Verified Listing</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-green-600 dark:text-green-400">You are viewing your own verified listing. All details and documents are visible to you. Buyers will need to be paid and verified to see this level of detail.</p></CardContent>
                    </Card>
                )}

                <section id="business-overview">
                    <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 flex items-center"><BookOpen className="h-6 w-6 mr-2 text-primary"/>Business Overview</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.short_description}</p>
                </section>

                <Separator />

                {keyStrengths.length > 0 && (
                  <>
                    <section id="key-strengths">
                        <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 flex items-center"><TrendingUp className="h-6 w-6 mr-2 text-primary"/>Key Strengths</h2>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-5">
                            {keyStrengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                            ))}
                        </ul>
                    </section>
                    <Separator />
                  </>
                )}

                {listing.reason_for_selling_anonymous && (
                    <>
                        <section id="reason-for-selling">
                            <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 flex items-center"><Tag className="h-6 w-6 mr-2 text-primary"/>Reason for Selling</h2>
                            <p className="text-muted-foreground leading-relaxed">{listing.reason_for_selling_anonymous}</p>
                        </section>
                        <Separator />
                    </>
                )}

                {(listing.adjusted_cash_flow || listing.verified_cash_flow) && (
                  <>
                    <section id="adjusted-cash-flow">
                      <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 flex items-center"><Banknote className="h-6 w-6 mr-2 text-primary" />Financial Highlights</h2>
                      {(listing.adjusted_cash_flow || listing.verified_cash_flow) && <p className="text-lg text-primary mb-1"><span className="font-medium">Adjusted Cash Flow:</span> {formatCurrency(listing.adjusted_cash_flow || listing.verified_cash_flow)} <span className="text-sm text-muted-foreground">(Annual)</span></p>}
                      {cfMultiple !== 'N/A' && <p className="text-lg text-primary mb-1"><span className="font-medium">C.F. Multiple:</span> {cfMultiple}</p>}
                    </section>
                    <Separator />
                  </>
                )}

                {growthOpportunities.length > 0 && (
                  <>
                    <section id="growth-potential">
                        <h2 className="text-2xl font-semibold text-brand-dark-blue mb-3 flex items-center"><Brain className="h-6 w-6 mr-2 text-primary"/>Specific Growth Opportunities</h2>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-5">
                          {growthOpportunities.map((opportunity, index) => (
                            <li key={index}>{opportunity.replace(/^[•\-]\s*/, '')}</li>
                          ))}
                        </ul>
                    </section>
                    <Separator />
                  </>
                )}

                <section id="verified-details" className={`p-6 rounded-lg border ${canViewVerifiedDetails ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-muted/50'}`}>
                    <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center">
                      <ShieldCheck className="h-6 w-6 mr-2"/>
                      {canViewVerifiedDetails ? "Verified Seller Information & Documents" : "Verified Seller Information (Restricted Access)"}
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-2"><Building className="h-5 w-5"/>Company Details</h3>
                            {canViewVerifiedDetails ? (
                              <div className="space-y-1">
                                <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">Registered Business Name:</span> {listing.registered_business_name || 'N/A'}</p>
                                <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">Year Established:</span> {listing.established_year || 'N/A'}</p>
                                <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">Number of Employees:</span> {listing.number_of_employees || 'N/A'}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Visible to paid, verified buyers.</p>
                            )}
                        </div>
                         <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-2"><Globe className="h-5 w-5"/>Web Presence</h3>
                             {canViewVerifiedDetails ? (
                              <div className="space-y-1">
                                <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">Business Website:</span> {listing.website_url ? <Link href={listing.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">{listing.website_url}</Link> : 'N/A'}</p>
                                {listing.social_media_links && <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">Social Media:</span> <span className="whitespace-pre-wrap">{listing.social_media_links}</span></p>}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Visible to paid, verified buyers.</p>
                            )}
                        </div>
                         <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5"/>Specific Financials</h3>
                             {canViewVerifiedDetails ? (
                              <div className="space-y-1">
                                <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">Specific Annual Revenue (TTM):</span> {listing.verified_annual_revenue ? `${formatCurrency(listing.verified_annual_revenue)}` : 'N/A'}</p>
                                <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">Specific Net Profit (TTM):</span> {listing.verified_net_profit ? `${formatCurrency(listing.verified_net_profit)}` : 'N/A'}</p>
                                {listing.net_profit_margin_range && <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">Net Profit Margin Range:</span> {listing.net_profit_margin_range}</p>}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Visible to paid, verified buyers.</p>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-2"><UsersIcon className="h-5 w-5"/>Seller & Deal Information</h3>
                             {canViewVerifiedDetails ? (
                              <div className="space-y-1">
                                <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">Detailed Reason for Selling:</span> <span className="whitespace-pre-wrap">{listing.detailed_reason_for_selling || 'N/A'}</span></p>
                                {listing.deal_structure_looking_for && listing.deal_structure_looking_for.length > 0 && (
                                  <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">Deal Structure Preferences:</span> {listing.deal_structure_looking_for.join(', ')}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Visible to paid, verified buyers.</p>
                            )}
                        </div>

                        <div>
                            <h3 className="font-semibold text-brand-dark-blue flex items-center gap-2 mb-2"><FileText className="h-5 w-5"/>Supporting Documents</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-medium text-slate-800 mb-1">Financial Documents</p>
                                    <DocumentLink href={listing.financial_documents_url}>Financial Statements (P&L, Balance Sheet)</DocumentLink>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-800 mb-1">Business Metrics</p>
                                    <DocumentLink href={listing.key_metrics_report_url}>Key Performance Indicators Report</DocumentLink>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-800 mb-1">Ownership Documents</p>
                                    <DocumentLink href={listing.ownership_documents_url}>Company Registration & Certificates</DocumentLink>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-800 mb-1">Financial Summary</p>
                                    <DocumentLink href={listing.financial_snapshot_url}>Recent Financial Summary</DocumentLink>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-800 mb-1">Ownership Details</p>
                                    <DocumentLink href={listing.ownership_details_url}>Detailed Ownership Structure</DocumentLink>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-800 mb-1">Location & Assets</p>
                                    <DocumentLink href={listing.location_real_estate_info_url}>Real Estate & Location Info</DocumentLink>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-800 mb-1">Digital Presence</p>
                                    <DocumentLink href={listing.web_presence_info_url}>Website Analytics & SEO Data</DocumentLink>
                                </div>
                                {listing.secure_data_room_link && (
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-medium text-slate-800 mb-1">Additional Documents</p>
                                        <DocumentLink href={listing.secure_data_room_link}>Secure Data Room Access</DocumentLink>
                                    </div>
                                )}
                            </div>
                        </div>
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
                            <div><p className="font-medium text-brand-dark-blue">Location</p><p className="text-muted-foreground">{listing.location_city}, {listing.location_country}</p></div>
                        </div>
                         <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-brand-dark-blue">Annual Revenue</p><p className="text-muted-foreground">{listing.annual_revenue_range || 'Not Specified'}</p></div>
                        </div>
                         <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div><p className="font-medium text-brand-dark-blue">Asking Price</p><p className="text-muted-foreground">{formatCurrency(listing.asking_price)}</p></div>
                        </div>
                         {(listing.adjusted_cash_flow || listing.verified_cash_flow) && (
                          <div className="flex items-center">
                              <Banknote className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                              <div><p className="font-medium text-brand-dark-blue">Adjusted Cash Flow</p><p className="text-muted-foreground">{formatCurrency(listing.adjusted_cash_flow || listing.verified_cash_flow)} (Annual)</p></div>
                          </div>
                        )}
                         {cfMultiple !== 'N/A' && (
                          <div className="flex items-center">
                              <Info className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                              <div><p className="font-medium text-brand-dark-blue">Est. C.F. Multiple</p><p className="text-muted-foreground">{cfMultiple}</p></div>
                          </div>
                        )}
                        {listing.deal_structure_looking_for && listing.deal_structure_looking_for.length > 0 && (
                             <div className="flex items-start">
                                <HandCoins className="h-5 w-5 mr-3 text-primary flex-shrink-0 mt-0.5" />
                                <div><p className="font-medium text-brand-dark-blue">Deal Structure</p><p className="text-muted-foreground">{listing.deal_structure_looking_for.join(', ')}</p></div>
                            </div>
                        )}
                        <div className="flex items-center">
                            <UserCircle className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-medium text-brand-dark-blue">Seller Status</p>
                                <p className="text-muted-foreground">
                                  {listing.is_seller_verified ? 'Verified - Due Diligence Completed' : 'Unverified'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!currentUser || currentUser.role === 'seller' || inquirySent || isSubmittingInquiry}
                            onClick={handleInquire}
                        >
                            <MessageSquare className="h-4 w-4 mr-2"/>
                            {isSubmittingInquiry ? 'Sending...' : inquirySent ? 'Inquiry Sent' : 'Inquire About Business'}
                        </Button>
                        {inquirySent && (
                           <Button
                             variant="outline"
                             className="w-full border-primary text-primary hover:bg-primary/10"
                             onClick={handleOpenConversation}
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
                 {currentUser && currentUser.role === 'buyer' && !currentUser.isPaid && listing.is_seller_verified && (
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
      <AlertDialog open={showVerificationPopup} onOpenChange={setShowVerificationPopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Business Verification Pending</AlertDialogTitle>
            <AlertDialogDescription>
              This business is currently undergoing our verification due diligence process.
              We&apos;ll notify you once they are ready for direct communication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>OK</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
