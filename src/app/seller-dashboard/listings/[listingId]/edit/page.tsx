
'use client';

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { industries, asianCountries, revenueRanges, profitMarginRanges, dealStructures, employeeCountRanges } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useTransition, useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, ArrowLeft, AlertCircle, CheckCircle2, PlusCircle, Trash2, ImagePlus } from "lucide-react";
import { notFound, useRouter, useParams } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { NobridgeIcon } from '@/components/ui/nobridge-icon';
import Link from "next/link";
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"];

const documentFileValidation = z.instanceof(File)
  .optional()
  .refine(file => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
  .refine(file => !file || ACCEPTED_DOCUMENT_TYPES.includes(file.type), 'Only PDF, XLSX, CSV formats are supported.');

const ListingSchema = z.object({
  listingTitleAnonymous: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title too long."),
  industry: z.string().min(1, "Industry is required."),
  locationCountry: z.string().min(1, "Country is required."),
  locationCityRegionGeneral: z.string().min(2, "City/Region is required.").max(50, "City/Region too long."),
  anonymousBusinessDescription: z.string().min(50, "Description must be at least 50 characters.").max(2000, "Description too long (max 2000 chars)."),
  keyStrengthsAnonymous: z.array(z.string().min(1, "Strength cannot be empty.")).min(1, "At least one key strength is required.").max(5, "Maximum of 5 key strengths."),

  businessModel: z.string().optional(),
  yearEstablished: z.coerce.number().optional().refine(val => val === undefined || (val >= 1900 && val <= new Date().getFullYear()), {
    message: "Please enter a valid year.",
  }),
  registeredBusinessName: z.string().optional(),
  businessWebsiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  socialMediaLinks: z.string().optional(),
  numberOfEmployees: z.string().optional(),
  technologyStack: z.string().optional(),
  actualCompanyName: z.string().optional(),
  fullBusinessAddress: z.string().optional(),

  annualRevenueRange: z.string().min(1, "Annual revenue range is required."),
  netProfitMarginRange: z.string().optional(),
  askingPrice: z.coerce.number({invalid_type_error: "Asking price must be a number."}).positive({message: "Asking price must be positive."}).optional(),

  specificAnnualRevenueLastYear: z.coerce.number({invalid_type_error: "Specific annual revenue must be a number."}).optional(),
  specificNetProfitLastYear: z.coerce.number({invalid_type_error: "Specific net profit must be a number."}).optional(),
  adjustedCashFlow: z.coerce.number({invalid_type_error: "Adjusted cash flow must be a number."}).optional(),
  adjustedCashFlowExplanation: z.string().optional(),

  dealStructureLookingFor: z.array(z.string()).optional(),
  reasonForSellingAnonymous: z.string().max(500, "Reason too long (max 500 chars).").optional(),
  detailedReasonForSelling: z.string().optional(),
  sellerRoleAndTimeCommitment: z.string().optional(),
  postSaleTransitionSupport: z.string().optional(),

  specificGrowthOpportunities: z.string().optional(),

  // Document uploads
  financialDocuments: documentFileValidation,
  keyMetricsReport: documentFileValidation,
  ownershipDocuments: documentFileValidation,
  financialSnapshot: documentFileValidation,
  ownershipDetails: documentFileValidation,
  locationRealEstateInfo: documentFileValidation,
  webPresenceInfo: documentFileValidation,
  secureDataRoomLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),

  imageUrl1: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  imageUrl2: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  imageUrl3: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  imageUrl4: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  imageUrl5: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
});

type ListingFormValues = z.infer<typeof ListingSchema>;

export default function EditSellerListingPage() {
  const params = useParams();
  const listingId = typeof params.listingId === 'string' ? params.listingId : '';

  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyStrengthsFields, setKeyStrengthsFields] = useState<string[]>(['']);

  // Use cached auth context
  const { profile, isLoading: authLoading } = useAuth();

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(ListingSchema),
    defaultValues: {
      listingTitleAnonymous: "",
      industry: "",
      locationCountry: "",
      locationCityRegionGeneral: "",
      anonymousBusinessDescription: "",
      keyStrengthsAnonymous: [""],
      businessModel: "",
      yearEstablished: undefined,
      registeredBusinessName: "",
      businessWebsiteUrl: "",
      socialMediaLinks: "",
      numberOfEmployees: undefined,
      technologyStack: "",
      actualCompanyName: "",
      fullBusinessAddress: "",
      annualRevenueRange: "",
      netProfitMarginRange: "",
      askingPrice: undefined,
      specificAnnualRevenueLastYear: undefined,
      specificNetProfitLastYear: undefined,
      adjustedCashFlow: undefined,
      adjustedCashFlowExplanation: "",
      dealStructureLookingFor: [],
      reasonForSellingAnonymous: "",
      detailedReasonForSelling: "",
      sellerRoleAndTimeCommitment: "",
      postSaleTransitionSupport: "",
      specificGrowthOpportunities: "",

      // Document uploads
      financialDocuments: undefined,
      keyMetricsReport: undefined,
      ownershipDocuments: undefined,
      financialSnapshot: undefined,
      ownershipDetails: undefined,
      locationRealEstateInfo: undefined,
      webPresenceInfo: undefined,
      secureDataRoomLink: "",

      imageUrl1: "", imageUrl2: "", imageUrl3: "", imageUrl4: "", imageUrl5: "",
    },
  });

  // Fetch listing data from API
  useEffect(() => {
    if (authLoading || !profile) return;

    const fetchListing = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('[EDIT-PAGE] Fetching listing:', listingId);
        const response = await fetch(`/api/listings/${listingId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Listing not found');
          }
          throw new Error(`Failed to fetch listing: ${response.status}`);
        }

                const listing = await response.json();
        console.log('[EDIT-PAGE] Listing fetched:', listing);

        // Verify ownership
        if (listing.seller_id !== profile.id) {
          throw new Error('You do not have permission to edit this listing');
        }

        setListing(listing);

        // Populate form with fetched data
        const keyStrengths = [
          listing.key_strength_1,
          listing.key_strength_2,
          listing.key_strength_3
        ].filter(Boolean);

              // The API returns different field names than the database
        // Map API response fields to form fields
        form.reset({
          listingTitleAnonymous: listing.title || "",
          industry: listing.industry || "",
          locationCountry: listing.location_country || "",
          locationCityRegionGeneral: listing.location_city || "",
          anonymousBusinessDescription: listing.short_description || "",
          keyStrengthsAnonymous: keyStrengths.length > 0 ? keyStrengths : [''],
          businessModel: listing.business_model || "",
          yearEstablished: listing.established_year || undefined,
          registeredBusinessName: listing.registered_business_name || "",
          businessWebsiteUrl: listing.website_url || "",
          socialMediaLinks: listing.social_media_links || "",
          numberOfEmployees: listing.number_of_employees || undefined,
          technologyStack: listing.technology_stack || "",
          actualCompanyName: listing.actual_company_name || "",
          fullBusinessAddress: listing.full_business_address || "",
          annualRevenueRange: listing.annual_revenue_range || "",
          netProfitMarginRange: listing.net_profit_margin_range || "",
          askingPrice: listing.asking_price || undefined,
          specificAnnualRevenueLastYear: listing.verified_annual_revenue || undefined,
          specificNetProfitLastYear: listing.verified_net_profit || undefined,
          adjustedCashFlow: listing.adjusted_cash_flow || undefined,
          adjustedCashFlowExplanation: listing.adjusted_cash_flow_explanation || "",
          dealStructureLookingFor: listing.deal_structure_looking_for || [],
          reasonForSellingAnonymous: listing.reason_for_selling_anonymous || "",
          detailedReasonForSelling: listing.detailed_reason_for_selling || "",
          sellerRoleAndTimeCommitment: listing.seller_role_and_time_commitment || "",
          postSaleTransitionSupport: listing.post_sale_transition_support || "",
          specificGrowthOpportunities: listing.specific_growth_opportunities || "",
          secureDataRoomLink: listing.secure_data_room_link || "",
          imageUrl1: listing.image_url_1 || "",
          imageUrl2: listing.image_url_2 || "",
          imageUrl3: listing.image_url_3 || "",
          imageUrl4: listing.image_url_4 || "",
          imageUrl5: listing.image_url_5 || "",
        });

        setKeyStrengthsFields(keyStrengths.length > 0 ? keyStrengths : ['']);

      } catch (err) {
        console.error('[EDIT-PAGE] Error fetching listing:', err);
        setError(err instanceof Error ? err.message : 'Failed to load listing');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [listingId, form, profile, authLoading]);


  const handleAddStrength = () => {
    if (keyStrengthsFields.length < 5) {
      const newFields = [...keyStrengthsFields, ''];
      setKeyStrengthsFields(newFields);
      form.setValue("keyStrengthsAnonymous", newFields);
    }
  };

  const handleRemoveStrength = (index: number) => {
    if (keyStrengthsFields.length > 1) {
      const newFields = keyStrengthsFields.filter((_, i) => i !== index);
      setKeyStrengthsFields(newFields);
       form.setValue("keyStrengthsAnonymous", newFields);
    }
  };

  const handleStrengthChange = (index: number, value: string) => {
    const newFields = [...keyStrengthsFields];
    newFields[index] = value;
    setKeyStrengthsFields(newFields);
    form.setValue("keyStrengthsAnonymous", newFields);
  };


  const onSubmit = async (values: ListingFormValues) => {
    console.log('[EDIT-PAGE] Starting update with values:', Object.keys(values));

    try {
      await startTransition(async () => {
        // Upload new documents if provided
        const documentUploads: Record<string, string> = {};
        const documentFields = [
          'financialDocuments', 'keyMetricsReport', 'ownershipDocuments',
          'financialSnapshot', 'ownershipDetails', 'locationRealEstateInfo', 'webPresenceInfo'
        ];

        try {
          for (const fieldName of documentFields) {
            const file = values[fieldName as keyof ListingFormValues] as File | undefined;
            if (file) {
              console.log(`[EDIT-PAGE] Uploading ${fieldName}:`, file.name);

              const formData = new FormData();
              formData.append('file', file);
              formData.append('document_type', fieldName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''));

              const session = await supabase.auth.getSession();
              const accessToken = session.data.session?.access_token;

              if (!accessToken) {
                throw new Error('Authentication required for document upload');
              }

              const uploadResponse = await fetch('/api/listings/upload', {
                method: 'POST',
                body: formData,
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });

              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.error || `Failed to upload ${fieldName}`);
              }

              const uploadResult = await uploadResponse.json();
              documentUploads[`${fieldName}Url`] = uploadResult.signedUrl;
              console.log(`[EDIT-PAGE] Successfully uploaded ${fieldName}`);
            }
          }
        } catch (uploadError) {
          console.error('[EDIT-PAGE] Document upload failed:', uploadError);
          toast({
            title: "❌ Document Upload Failed",
            description: `Error uploading documents: ${uploadError.message}`,
            variant: "destructive"
          });
          return;
        }

                        // Prepare update payload - use database field names (snake_case)
        const keyStrengths = values.keyStrengthsAnonymous.filter(strength => strength && strength.trim() !== "");

        // Convert growth opportunities to individual fields
        const growthOpportunitiesArray = values.specificGrowthOpportunities
          ? values.specificGrowthOpportunities.split('\n').map(opp => opp.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
          : [];

        const updatePayload = {
          // Core fields
          listing_title_anonymous: values.listingTitleAnonymous,
          industry: values.industry,
          location_country: values.locationCountry,
          location_city_region_general: values.locationCityRegionGeneral,
          anonymous_business_description: values.anonymousBusinessDescription,

          // Key strengths
          key_strength_1: keyStrengths[0] || null,
          key_strength_2: keyStrengths[1] || null,
          key_strength_3: keyStrengths[2] || null,

          // Business details
          business_model: values.businessModel || null,
          year_established: values.yearEstablished || null,
          registered_business_name: values.registeredBusinessName || null,
          business_website_url: values.businessWebsiteUrl || null,
          social_media_links: values.socialMediaLinks || null,
          number_of_employees: values.numberOfEmployees || null,
          technology_stack: values.technologyStack || null,
          actual_company_name: values.actualCompanyName || null,
          full_business_address: values.fullBusinessAddress || null,

          // Financial data
          annual_revenue_range: values.annualRevenueRange,
          net_profit_margin_range: values.netProfitMarginRange || null,
          asking_price: values.askingPrice || null,
          specific_annual_revenue_last_year: values.specificAnnualRevenueLastYear || null,
          specific_net_profit_last_year: values.specificNetProfitLastYear || null,
          adjusted_cash_flow: values.adjustedCashFlow || null,
          adjusted_cash_flow_explanation: values.adjustedCashFlowExplanation || null,

          // Deal structure and seller info
          deal_structure_looking_for: values.dealStructureLookingFor || [],
          reason_for_selling_anonymous: values.reasonForSellingAnonymous || null,
          detailed_reason_for_selling: values.detailedReasonForSelling || null,
          seller_role_and_time_commitment: values.sellerRoleAndTimeCommitment || null,
          post_sale_transition_support: values.postSaleTransitionSupport || null,

          // Growth opportunities
          specific_growth_opportunities: values.specificGrowthOpportunities || null,
          growth_opportunity_1: growthOpportunitiesArray[0] || null,
          growth_opportunity_2: growthOpportunitiesArray[1] || null,
          growth_opportunity_3: growthOpportunitiesArray[2] || null,

          // Images and documents
          secure_data_room_link: values.secureDataRoomLink || null,
          image_url_1: values.imageUrl1 || null,
          image_url_2: values.imageUrl2 || null,
          image_url_3: values.imageUrl3 || null,
          image_url_4: values.imageUrl4 || null,
          image_url_5: values.imageUrl5 || null,

          // Include any newly uploaded documents
          ...Object.fromEntries(
            Object.entries(documentUploads).map(([key, value]) => [
              key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/_url$/, '_url'),
              value
            ])
          )
        };

        console.log('[EDIT-PAGE] Updating listing with payload:', updatePayload);

        const response = await fetch(`/api/listings/${listingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update listing');
        }

        const result = await response.json();
        console.log('[EDIT-PAGE] Listing updated successfully:', result);

        toast({
          title: "✅ Listing Updated",
          description: "Your business listing has been successfully updated.",
        });

        // Redirect to listings page
        router.push('/seller-dashboard/listings');
      });
    } catch (error) {
      console.error('[EDIT-PAGE] Update failed:', error);
      toast({
        title: "❌ Update Failed",
        description: error instanceof Error ? error.message : "Failed to update listing. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Loading and error states
  if (authLoading || isLoading) {
    return (
      <div className="container py-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading listing data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Listing</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button asChild>
                <Link href="/seller-dashboard/listings">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Listings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== 'seller') {
    return (
      <div className="container py-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You must be logged in as a seller to edit listings.</p>
            <Button asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container py-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h2 className="text-xl font-semibold text-destructive mb-2">Listing Not Found</h2>
            <p className="text-muted-foreground mb-4">The listing you're trying to edit could not be found.</p>
            <Button asChild>
              <Link href="/seller-dashboard/listings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Listings
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/seller-dashboard/listings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-brand-dark-blue font-heading">
            Edit Listing: {listing.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            Update your business listing information and documents
          </p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Basic Information */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading">Section 1: Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="listingTitleAnonymous" render={({ field }) => (
                  <FormItem><FormLabel>Listing Title (Anonymous)</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="industry" render={({ field }) => (
                    <FormItem><FormLabel>Industry</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{industries.map(i => <SelectItem key={i} value={i.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>{i}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )}
                />
                <FormField control={form.control} name="locationCountry" render={({ field }) => (
                    <FormItem><FormLabel>Location (Country)</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{asianCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )}
                />
              </div>
              <FormField control={form.control} name="locationCityRegionGeneral" render={({ field }) => (
                  <FormItem><FormLabel>Location (General City/Region)</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 2: Business Profile & Operations */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading">Section 2: Business Profile &amp; Operations</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="anonymousBusinessDescription" render={({ field }) => (
                  <FormItem><FormLabel>Business Description</FormLabel><FormControl><Textarea {...field} rows={6} disabled={isPending} /></FormControl><FormDescription>Max 2000 characters.</FormDescription><FormMessage /></FormItem>
                )}
              />
               <FormField control={form.control} name="keyStrengthsAnonymous" render={() => (
                  <FormItem><FormLabel>Key Strengths</FormLabel><FormDescription>List 1-5 key strengths.</FormDescription>
                    {keyStrengthsFields.map((strength, index) => (
                       <div key={index} className="flex items-center gap-2">
                          <Input value={strength} onChange={(e) => handleStrengthChange(index, e.target.value)} placeholder={`Strength ${index + 1}`} disabled={isPending} className="flex-grow"/>
                          {keyStrengthsFields.length > 1 && (<Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStrength(index)} disabled={isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button>)}
                        </div>
                    ))}
                    {keyStrengthsFields.length < 5 && (<Button type="button" variant="outline" size="sm" onClick={handleAddStrength} disabled={isPending}><PlusCircle className="h-4 w-4 mr-2" /> Add Strength</Button>)}
                    <FormMessage>{form.formState.errors.keyStrengthsAnonymous?.message || (form.formState.errors.keyStrengthsAnonymous as any)?.[0]?.message}</FormMessage>
                  </FormItem>)}
              />
              <FormField control={form.control} name="businessModel" render={({ field }) => (<FormItem><FormLabel>Business Model</FormLabel><FormControl><Textarea {...field} value={field.value || ""} placeholder="e.g., SaaS, E-commerce..." disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="yearEstablished" render={({ field }) => (<FormItem><FormLabel>Year Established</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} placeholder="YYYY" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="registeredBusinessName" render={({ field }) => (<FormItem><FormLabel>Registered Business Name</FormLabel><FormControl><Input {...field} value={field.value || ""} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="businessWebsiteUrl" render={({ field }) => (<FormItem><FormLabel>Website URL</FormLabel><FormControl><Input type="url" {...field} value={field.value || ""} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="socialMediaLinks" render={({ field }) => (<FormItem><FormLabel>Social Media (one per line)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="numberOfEmployees" render={({ field }) => (<FormItem><FormLabel>Number of Employees</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger></FormControl><SelectContent>{employeeCountRanges.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="technologyStack" render={({ field }) => (<FormItem><FormLabel>Technology Stack</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><ImagePlus className="h-5 w-5 text-primary"/>Business Images</CardTitle><CardDescription>Provide up to 5 image URLs for your listing.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (<FormField key={`imageUrl${i}`} control={form.control} name={`imageUrl${i}` as `imageUrl1`} render={({ field }) => (<FormItem><FormLabel>Image URL {i}</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="https://example.com/image.jpg" disabled={isPending} /></FormControl><FormMessage /></FormItem>)}/>))}
            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><NobridgeIcon icon="calculator" size="sm"/>Financial Performance</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="annualRevenueRange" render={({ field }) => (<FormItem><FormLabel>Annual Revenue Range (Anonymous)</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{revenueRanges.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="netProfitMarginRange" render={({ field }) => (<FormItem><FormLabel>Net Profit Margin Range (Anonymous, Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select profit margin"/></SelectTrigger></FormControl><SelectContent>{profitMarginRanges.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>
              <FormField control={form.control} name="askingPrice" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><NobridgeIcon icon="revenue" size="sm" className="mr-1 opacity-80"/>Asking Price (USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 750000" disabled={isPending} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="adjustedCashFlow" render={({ field }) => (<FormItem><FormLabel>Adjusted Cash Flow / SDE (TTM, USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 220000" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="adjustedCashFlowExplanation" render={({ field }) => (<FormItem><FormLabel>Adj. Cash Flow Explanation (Optional)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Explain any adjustments made (e.g., owner's salary, non-recurring expenses)." disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <Separator/>
              <h3 className="text-md font-medium text-muted-foreground font-heading">Specific Financials (For Verified View)</h3>
              <FormField control={form.control} name="specificAnnualRevenueLastYear" render={({ field }) => (<FormItem><FormLabel>Actual Annual Revenue (TTM, USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="specificNetProfitLastYear" render={({ field }) => (<FormItem><FormLabel>Actual Net Profit (TTM, USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          {/* Supporting Documents Section */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader>
              <CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Supporting Documents & Information
              </CardTitle>
              <CardDescription>
                Update supporting documents to build buyer trust and provide transparency. All documents are optional but highly recommended for verified listings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="financialDocuments" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financial Documents (P&L, Balance Sheet)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                        accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>PDF, XLSX, or CSV format. Max 5MB.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="keyMetricsReport" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Business Metrics Report</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                        accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>KPIs, analytics, performance metrics. PDF, XLSX, or CSV format.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="ownershipDocuments" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ownership Documents</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                        accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>Company registration, shareholding certificates, etc.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="financialSnapshot" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financial Snapshot</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                        accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>Recent financial summary or cash flow statement.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="ownershipDetails" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Ownership Information</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                        accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>Detailed ownership structure and stakeholder information.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="locationRealEstateInfo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location & Real Estate Information</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                        accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>Lease agreements, property details, location information.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="webPresenceInfo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Web Presence Information</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                        accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>Website analytics, SEO reports, digital marketing data.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Separator />

              <FormField control={form.control} name="secureDataRoomLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>Secure Data Room Link (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      {...field}
                      value={field.value || ""}
                      placeholder="https://dataroom.example.com/your-listing"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to external secure data room with additional business documents.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><NobridgeIcon icon="deal-structure" size="sm"/>Deal &amp; Seller Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="dealStructureLookingFor" render={() => (<FormItem><FormLabel>Looking for (Deal Structure):</FormLabel><FormDescription>Select all that apply.</FormDescription><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">{dealStructures.map((item) => (<FormField key={item} control={form.control} name="dealStructureLookingFor" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter(v => v !== item))} disabled={isPending}/></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}/>))}</div><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="reasonForSellingAnonymous" render={({ field }) => (<FormItem><FormLabel>Reason for Selling (Public Summary, Optional)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} disabled={isPending} /></FormControl><FormDescription>Max 500 characters.</FormDescription><FormMessage /></FormItem>)}/>
              <Separator/>
              <h3 className="text-md font-medium text-muted-foreground font-heading">Additional Seller Information (For Verified View)</h3>
              <FormField control={form.control} name="detailedReasonForSelling" render={({ field }) => (<FormItem><FormLabel>Detailed Reason for Selling</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="sellerRoleAndTimeCommitment" render={({ field }) => (<FormItem><FormLabel>Seller&apos;s Current Role &amp; Time Commitment</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="postSaleTransitionSupport" render={({ field }) => (<FormItem><FormLabel>Post-Sale Transition Support Offered</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />

            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><NobridgeIcon icon="growth" size="sm"/>Growth &amp; Future Potential</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="specificGrowthOpportunities" render={({ field }) => (<FormItem><FormLabel>Specific Growth Opportunities (Use bullet points)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={5} placeholder="- Expand to new markets (e.g., Region X)\n- Launch new product line (e.g., Product Y)\n- Optimize marketing spend by Z%" disabled={isPending} /></FormControl><FormDescription>List 3-5 specific, actionable growth opportunities.</FormDescription><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Separator />
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => {
                // Re-populate form with original listing data
                const keyStrengths = [
                  listing?.key_strength_1,
                  listing?.key_strength_2,
                  listing?.key_strength_3
                ].filter(Boolean);

                form.reset({
                  listingTitleAnonymous: listing?.title || "",
                  industry: listing?.industry || "",
                  locationCountry: listing?.location_country || "",
                  locationCityRegionGeneral: listing?.location_city || "",
                  anonymousBusinessDescription: listing?.short_description || "",
                  keyStrengthsAnonymous: keyStrengths.length > 0 ? keyStrengths : [''],
                  businessModel: listing?.business_model || "",
                  yearEstablished: listing?.established_year || undefined,
                  registeredBusinessName: listing?.registered_business_name || "",
                  businessWebsiteUrl: listing?.website_url || "",
                  socialMediaLinks: listing?.social_media_links || "",
                  numberOfEmployees: listing?.number_of_employees || undefined,
                  technologyStack: listing?.technology_stack || "",
                  actualCompanyName: listing?.actual_company_name || "",
                  fullBusinessAddress: listing?.full_business_address || "",
                  annualRevenueRange: listing?.annual_revenue_range || "",
                  netProfitMarginRange: listing?.net_profit_margin_range || "",
                  askingPrice: listing?.asking_price || undefined,
                  specificAnnualRevenueLastYear: listing?.verified_annual_revenue || undefined,
                  specificNetProfitLastYear: listing?.verified_net_profit || undefined,
                  adjustedCashFlow: listing?.adjusted_cash_flow || undefined,
                  adjustedCashFlowExplanation: listing?.adjusted_cash_flow_explanation || "",
                  dealStructureLookingFor: listing?.deal_structure_looking_for || [],
                  reasonForSellingAnonymous: listing?.reason_for_selling_anonymous || "",
                  detailedReasonForSelling: listing?.detailed_reason_for_selling || "",
                  sellerRoleAndTimeCommitment: listing?.seller_role_and_time_commitment || "",
                  postSaleTransitionSupport: listing?.post_sale_transition_support || "",
                  specificGrowthOpportunities: listing?.specific_growth_opportunities || "",
                  secureDataRoomLink: listing?.secure_data_room_link || "",
                  imageUrl1: listing?.image_url_1 || "",
                  imageUrl2: listing?.image_url_2 || "",
                  imageUrl3: listing?.image_url_3 || "",
                  imageUrl4: listing?.image_url_4 || "",
                  imageUrl5: listing?.image_url_5 || "",

                  // Reset file inputs to undefined (can't populate existing files)
                  financialDocuments: undefined,
                  keyMetricsReport: undefined,
                  ownershipDocuments: undefined,
                  financialSnapshot: undefined,
                  ownershipDetails: undefined,
                  locationRealEstateInfo: undefined,
                  webPresenceInfo: undefined,
                });

                setKeyStrengthsFields(keyStrengths.length > 0 ? keyStrengths : ['']);
              }}
              disabled={isPending}>
                Reset Changes
            </Button>
            <Button type="submit" className="min-w-[150px] bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
