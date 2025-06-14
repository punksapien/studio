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
import { useTransition, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { ImagePlus, AlertCircle, ShieldCheck, Save, RotateCcw, FileText, Building } from "lucide-react";
import { Label } from "@/components/ui/label";
import { NobridgeIcon, NobridgeIconType } from '@/components/ui/nobridge-icon';
import Link from "next/link";
import { useFormPersistence } from '@/hooks/use-form-persistence';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"];

const fileValidation = z.instanceof(File)
  .optional()
  .refine(file => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
  .refine(file => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), 'Only .jpg, .jpeg, .png, .webp formats are supported.');

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

  keyStrength1: z.string().min(5, "Strength must be at least 5 characters.").max(150, "Strength too long (max 150 chars).optional()").optional(),
  keyStrength2: z.string().min(5, "Strength must be at least 5 characters.").max(150, "Strength too long (max 150 chars).").optional(),
  keyStrength3: z.string().min(5, "Strength must be at least 5 characters.").max(150, "Strength too long (max 150 chars).").optional(),

  businessModel: z.string().optional(),
  yearEstablished: z.coerce.number().optional().refine(val => val === undefined || (val >= 1900 && val <= new Date().getFullYear()), {
    message: "Please enter a valid year.",
  }),
  registeredBusinessName: z.string().optional(), // "Legal Registered Business Name"
  businessWebsiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  socialMediaLinks: z.string().optional(),
  numberOfEmployees: z.string().optional(), // Label description "Full-time"

  annualRevenueRange: z.string().min(1, "Annual revenue range is required."),
  netProfitMarginRange: z.string().optional(),
  askingPrice: z.coerce.number({invalid_type_error: "Asking price must be a number."}).positive({message: "Asking price must be positive."}).optional(),

  specificAnnualRevenueLastYear: z.coerce.number({invalid_type_error: "Specific annual revenue must be a number."}).optional(),
  specificNetProfitLastYear: z.coerce.number({invalid_type_error: "Specific net profit must be a number."}).optional(),
  adjustedCashFlow: z.coerce.number({invalid_type_error: "Adjusted cash flow must be a number."}).optional(),

  dealStructureLookingFor: z.array(z.string()).optional(),
  reasonForSellingAnonymous: z.string().max(500, "Reason too long (max 500 chars).").optional(),
  detailedReasonForSelling: z.string().optional(),

  growthOpportunity1: z.string().min(5, "Growth opportunity must be at least 5 characters.").max(200, "Opportunity too long (max 200 chars).").optional(),
  growthOpportunity2: z.string().min(5, "Growth opportunity must be at least 5 characters.").max(200, "Opportunity too long (max 200 chars).").optional(),
  growthOpportunity3: z.string().min(5, "Growth opportunity must be at least 5 characters.").max(200, "Opportunity too long (max 200 chars).").optional(),

  imageFile1: fileValidation,
  imageFile2: fileValidation,
  imageFile3: fileValidation,
  imageFile4: fileValidation,
  imageFile5: fileValidation,

  // Document Upload Fields (matching database schema)
  financialDocuments: documentFileValidation,
  keyMetricsReport: documentFileValidation,
  ownershipDocuments: documentFileValidation,
  financialSnapshot: documentFileValidation,
  ownershipDetails: documentFileValidation,
  locationRealEstateInfo: documentFileValidation,
  webPresenceInfo: documentFileValidation,
  secureDataRoomLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),

  // Additional Missing Fields
  technologyStack: z.string().optional(),
  actualCompanyName: z.string().optional(),
  fullBusinessAddress: z.string().optional(),
  adjustedCashFlowExplanation: z.string().optional(),
  sellerRoleAndTimeCommitment: z.string().optional(),
  postSaleTransitionSupport: z.string().optional(),


}).refine(data => {
  const strengths = [data.keyStrength1, data.keyStrength2, data.keyStrength3].filter(s => s && s.trim() !== "");
  return strengths.length >= 1;
}, {
  message: "At least one key strength is required.",
  path: ["keyStrength1"], // Attach error to the first strength field for simplicity
});


type ListingFormValues = z.infer<typeof ListingSchema>;

export default function CreateSellerListingPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Use cached auth context instead of fetching
  const { profile, isLoading: authLoading } = useAuth();
  const isSellerVerified = profile?.verification_status === 'verified';

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(ListingSchema),
    defaultValues: {
      listingTitleAnonymous: "",
      industry: "",
      locationCountry: "",
      locationCityRegionGeneral: "",
      anonymousBusinessDescription: "",
      keyStrength1: "",
      keyStrength2: "",
      keyStrength3: "",
      businessModel: "",
      yearEstablished: undefined,
      registeredBusinessName: "",
      businessWebsiteUrl: "",
      socialMediaLinks: "",
      numberOfEmployees: undefined,
      annualRevenueRange: "",
      netProfitMarginRange: "",
      askingPrice: undefined,
      specificAnnualRevenueLastYear: undefined,
      specificNetProfitLastYear: undefined,
      adjustedCashFlow: undefined,
      dealStructureLookingFor: [],
      reasonForSellingAnonymous: "",
      detailedReasonForSelling: "",
      growthOpportunity1: "",
      growthOpportunity2: "",
      growthOpportunity3: "",
      imageFile1: undefined,
      imageFile2: undefined,
      imageFile3: undefined,
      imageFile4: undefined,
      imageFile5: undefined,

      // Document upload fields
      financialDocuments: undefined,
      keyMetricsReport: undefined,
      ownershipDocuments: undefined,
      financialSnapshot: undefined,
      ownershipDetails: undefined,
      locationRealEstateInfo: undefined,
      webPresenceInfo: undefined,
      secureDataRoomLink: "",

      // Additional fields
      technologyStack: "",
      actualCompanyName: "",
      fullBusinessAddress: "",
      adjustedCashFlowExplanation: "",
      sellerRoleAndTimeCommitment: "",
      postSaleTransitionSupport: "",
    },
  });

  // Add form persistence
  const { clearSavedData, saveNow } = useFormPersistence(form, {
    storageKey: 'create-listing-draft',
    debounceMs: 2000, // Save every 2 seconds of inactivity
    excludeFields: [
      'imageFile1', 'imageFile2', 'imageFile3', 'imageFile4', 'imageFile5',
      'financialDocuments', 'keyMetricsReport', 'ownershipDocuments',
      'financialSnapshot', 'ownershipDetails', 'locationRealEstateInfo', 'webPresenceInfo'
    ], // Don't persist file inputs
  });

  const onSubmit = async (values: ListingFormValues) => {
    console.log('[FORM-SUBMIT] Starting submission with values:', Object.keys(values));

    try {
      await startTransition(async () => {
        // Validate required fields client-side before submission
        const requiredFields = {
          listingTitleAnonymous: 'Listing Title',
          anonymousBusinessDescription: 'Business Description',
          askingPrice: 'Asking Price',
          industry: 'Industry',
          locationCountry: 'Country',
          locationCityRegionGeneral: 'City/Region'
        };

        const missingFields = Object.entries(requiredFields)
          .filter(([key]) => !values[key as keyof ListingFormValues])
          .map(([, label]) => label);

        if (missingFields.length > 0) {
          toast({
            title: "❌ Missing Required Information",
            description: `Please fill in: ${missingFields.join(', ')}`,
            variant: "destructive"
          });
          return;
        }

        // Validate asking price
        if (!values.askingPrice || values.askingPrice <= 0) {
          toast({
            title: "❌ Invalid Asking Price",
            description: "Please enter a valid asking price greater than 0.",
            variant: "destructive"
          });
          return;
        }

        console.log('[FORM-SUBMIT] Client validation passed, uploading documents if provided');

        // Upload documents first if provided
        const documentUploads: Record<string, string> = {};
        const documentFields = [
          'financialDocuments', 'keyMetricsReport', 'ownershipDocuments',
          'financialSnapshot', 'ownershipDetails', 'locationRealEstateInfo', 'webPresenceInfo'
        ];

        try {
          for (const fieldName of documentFields) {
            const file = values[fieldName as keyof ListingFormValues] as File | undefined;
            if (file) {
              console.log(`[FORM-SUBMIT] Uploading ${fieldName}:`, file.name);

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
              console.log(`[FORM-SUBMIT] Successfully uploaded ${fieldName}`);
            }
          }
        } catch (uploadError) {
          console.error('[FORM-SUBMIT] Document upload failed:', uploadError);
          toast({
            title: "❌ Document Upload Failed",
            description: `Error uploading documents: ${uploadError.message}`,
            variant: "destructive"
          });
          return;
        }

        console.log('[FORM-SUBMIT] Document uploads completed, preparing submission data');

        // Prepare submission data with proper field mapping and validation
        const submissionData = {
          // Required fields
          listingTitleAnonymous: String(values.listingTitleAnonymous).trim(),
          anonymousBusinessDescription: String(values.anonymousBusinessDescription).trim(),
          askingPrice: Number(values.askingPrice),
          industry: String(values.industry).trim(),
          locationCountry: String(values.locationCountry).trim(),
          locationCityRegionGeneral: String(values.locationCityRegionGeneral).trim(),

          // Optional basic info
          yearEstablished: values.yearEstablished || undefined,
          registeredBusinessName: values.registeredBusinessName ? String(values.registeredBusinessName).trim() : undefined,
          businessWebsiteUrl: values.businessWebsiteUrl ? String(values.businessWebsiteUrl).trim() : undefined,
          socialMediaLinks: values.socialMediaLinks ? String(values.socialMediaLinks).trim() : undefined,
          numberOfEmployees: values.numberOfEmployees || undefined,

          // Business details
          businessModel: values.businessModel ? String(values.businessModel).trim() : undefined,
          annualRevenueRange: values.annualRevenueRange || undefined,
          netProfitMarginRange: values.netProfitMarginRange || undefined,
          specificAnnualRevenueLastYear: values.specificAnnualRevenueLastYear || undefined,
          specificNetProfitLastYear: values.specificNetProfitLastYear || undefined,
          adjustedCashFlow: values.adjustedCashFlow || undefined,

          // Key strengths
          keyStrength1: values.keyStrength1 ? String(values.keyStrength1).trim() : undefined,
          keyStrength2: values.keyStrength2 ? String(values.keyStrength2).trim() : undefined,
          keyStrength3: values.keyStrength3 ? String(values.keyStrength3).trim() : undefined,

          // Growth opportunities
          growthOpportunity1: values.growthOpportunity1 ? String(values.growthOpportunity1).trim() : undefined,
          growthOpportunity2: values.growthOpportunity2 ? String(values.growthOpportunity2).trim() : undefined,
          growthOpportunity3: values.growthOpportunity3 ? String(values.growthOpportunity3).trim() : undefined,

          // Deal information
          dealStructureLookingFor: Array.isArray(values.dealStructureLookingFor) ? values.dealStructureLookingFor : [],
          reasonForSellingAnonymous: values.reasonForSellingAnonymous ? String(values.reasonForSellingAnonymous).trim() : undefined,
          detailedReasonForSelling: values.detailedReasonForSelling ? String(values.detailedReasonForSelling).trim() : undefined,

          // Additional business details
          technologyStack: values.technologyStack ? String(values.technologyStack).trim() : undefined,
          actualCompanyName: values.actualCompanyName ? String(values.actualCompanyName).trim() : undefined,
          fullBusinessAddress: values.fullBusinessAddress ? String(values.fullBusinessAddress).trim() : undefined,
          adjustedCashFlowExplanation: values.adjustedCashFlowExplanation ? String(values.adjustedCashFlowExplanation).trim() : undefined,
          sellerRoleAndTimeCommitment: values.sellerRoleAndTimeCommitment ? String(values.sellerRoleAndTimeCommitment).trim() : undefined,
          postSaleTransitionSupport: values.postSaleTransitionSupport ? String(values.postSaleTransitionSupport).trim() : undefined,
          secureDataRoomLink: values.secureDataRoomLink ? String(values.secureDataRoomLink).trim() : undefined,

          // Document URLs from uploads
          ...documentUploads,

          // File uploads (Note: Images will be handled separately in future implementation)
          imageUrls: [] // Placeholder for future image upload functionality
        };

        console.log('[FORM-SUBMIT] Prepared submission data:', {
          title: submissionData.listingTitleAnonymous,
          industry: submissionData.industry,
          askingPrice: submissionData.askingPrice,
          fieldCount: Object.keys(submissionData).length
        });

        // Submit to API with enhanced error handling
        let response: Response;
        try {
          response = await fetch('/api/listings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData),
          });
        } catch (networkError) {
          console.error('[FORM-SUBMIT] Network error:', networkError);
          throw new Error('Network error. Please check your internet connection and try again.');
        }

        // Handle response with specific error messages
        if (!response.ok) {
          let errorMessage = 'Failed to create listing';

          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;

            // Log detailed error information
            console.error('[FORM-SUBMIT] API error response:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            });
          } catch (parseError) {
            console.error('[FORM-SUBMIT] Could not parse error response:', parseError);
            errorMessage = `Server error (${response.status}). Please try again.`;
          }

          // Provide specific guidance based on error type
          if (response.status === 401) {
            errorMessage = 'Authentication expired. Please refresh the page and try again.';
          } else if (response.status === 403) {
            errorMessage = 'Permission denied. Please ensure you are logged in as a seller.';
          } else if (response.status === 400) {
            // Keep the specific validation error from server
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again in a few moments.';
          }

          throw new Error(errorMessage);
        }

        // Parse successful response
        let result;
        try {
          result = await response.json();
          console.log('[FORM-SUBMIT] Success response:', result);
        } catch (parseError) {
          console.error('[FORM-SUBMIT] Could not parse success response:', parseError);
          throw new Error('Listing may have been created but response was unclear. Please check your listings.');
        }

        // Clear saved draft after successful submission
        try {
          clearSavedData();
          console.log('[FORM-SUBMIT] Cleared saved draft data');
        } catch (clearError) {
          console.warn('[FORM-SUBMIT] Could not clear saved data:', clearError);
          // Don't fail submission for this
        }

        // Show success message with detailed feedback
        toast({
          title: "✅ Listing Created Successfully!",
          description: `"${submissionData.listingTitleAnonymous}" has been created and is now ${result.listing?.status || 'active'}. You can view it in 'My Listings'.`,
          variant: "default"
        });

        // Reset form after successful submission
        try {
          form.reset();
          console.log('[FORM-SUBMIT] Form reset successfully');
        } catch (resetError) {
          console.warn('[FORM-SUBMIT] Could not reset form:', resetError);
          // Don't fail for this
        }

        // Redirect to listings page with success state
        try {
          router.push('/seller-dashboard/listings?created=true');
          console.log('[FORM-SUBMIT] Redirecting to listings page');
        } catch (redirectError) {
          console.warn('[FORM-SUBMIT] Could not redirect:', redirectError);
          // Don't fail for this
        }
      });
    } catch (error) {
      console.error('[FORM-SUBMIT] Submission failed:', error);

      // Provide user-friendly error messages
      const userMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';

      toast({
        title: "❌ Error Creating Listing",
        description: userMessage,
        variant: "destructive"
      });

      // Don't clear form data on error so user doesn't lose their work
      console.log('[FORM-SUBMIT] Keeping form data due to error');
    }
  };

  // Save form data before unload
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveNow();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveNow]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark-blue font-heading">Create New Business Listing</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Save className="h-4 w-4" />
          <span>Form auto-saves as you type</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Basic Information */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader>
              <CardTitle className="text-brand-dark-blue font-heading">Section 1: Basic Information (Anonymous)</CardTitle>
              <CardDescription>Provide the essential details for your listing. This information will be displayed anonymously initially.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="listingTitleAnonymous" render={({ field }) => (
                  <FormItem><FormLabel>Listing Title (Anonymous)</FormLabel><FormControl><Input {...field} placeholder="e.g., Profitable E-commerce Store in Southeast Asia" disabled={isPending} /></FormControl><FormDescription>A catchy, anonymous title for your business.</FormDescription><FormMessage /></FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="industry" render={({ field }) => (
                    <FormItem><FormLabel>Industry</FormLabel><Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger></FormControl><SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )}
                />
                <FormField control={form.control} name="locationCountry" render={({ field }) => (
                    <FormItem><FormLabel>Location (Country)</FormLabel><Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger></FormControl><SelectContent>{asianCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )}
                />
              </div>
              <FormField control={form.control} name="locationCityRegionGeneral" render={({ field }) => (
                  <FormItem><FormLabel>Location (General City/Region)</FormLabel><FormControl><Input {...field} placeholder="e.g., Metro Manila, Bangkok Area" disabled={isPending} /></FormControl><FormDescription>Keep this general for anonymity (e.g., "Nationwide" or a major metro area).</FormDescription><FormMessage /></FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 2: Business Profile & Operations */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading">Section 2: Business Profile &amp; Operations</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="anonymousBusinessDescription" render={({ field }) => (
                  <FormItem><FormLabel>Business Description</FormLabel><FormControl><Textarea {...field} rows={6} placeholder="Describe your business, products/services, market position, and growth potential without revealing identifying details." disabled={isPending} /></FormControl><FormDescription>Max 2000 characters.</FormDescription><FormMessage /></FormItem>
                )}
              />
              <div className="space-y-2">
                <Label className="text-brand-dark-blue">Key Strengths (1-3 points)</Label>
                <FormDescription>Highlight the main advantages of your business.</FormDescription>
                <FormField control={form.control} name="keyStrength1" render={({ field }) => (<FormItem><FormControl><Input {...field} placeholder="Strength 1 (e.g., Strong recurring revenue)" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="keyStrength2" render={({ field }) => (<FormItem><FormControl><Input {...field} placeholder="Strength 2 (Optional)" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="keyStrength3" render={({ field }) => (<FormItem><FormControl><Input {...field} placeholder="Strength 3 (Optional)" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="businessModel" render={({ field }) => (<FormItem><FormLabel>Business Model</FormLabel><FormControl><Textarea {...field} value={field.value || ""} placeholder="e.g., SaaS, E-commerce (dropshipping/inventory), Service-based, Lead Generation, Content Site (Adsense/Affiliate), etc." disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="yearEstablished" render={({ field }) => (<FormItem><FormLabel>Year Business Established</FormLabel><FormControl><Input type="number" {...field} value={field.value === undefined ? '' : field.value} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} placeholder="YYYY" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="registeredBusinessName" render={({ field }) => (<FormItem><FormLabel>Legal Registered Business Name</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Your Company Pte Ltd" disabled={isPending} /></FormControl><FormDescription>This is for verification and won't be public initially.</FormDescription><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="businessWebsiteUrl" render={({ field }) => (<FormItem><FormLabel>Primary Business Website</FormLabel><FormControl><Input type="url" {...field} value={field.value || ""} placeholder="https://yourbusiness.com" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="socialMediaLinks" render={({ field }) => (<FormItem><FormLabel>Key Social Media Profiles (one per line)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="https://linkedin.com/company/yourbusiness\nhttps://facebook.com/yourbusiness" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="numberOfEmployees" render={({ field }) => (<FormItem><FormLabel>Number of Employees</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select number of employees" /></SelectTrigger></FormControl><SelectContent>{employeeCountRanges.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select><FormDescription>Full-time.</FormDescription><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><ImagePlus className="h-5 w-5 text-primary"/>Business Images</CardTitle><CardDescription>Upload up to 5 images for your listing (e.g., logo, storefront, product shots). Max 5MB each. JPG, PNG, WebP.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <FormField
                  key={`imageFile${i}`}
                  control={form.control}
                  name={`imageFile${i}` as `imageFile1`} // Type assertion
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image {i}</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                          accept={ACCEPTED_IMAGE_TYPES.join(",")}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><NobridgeIcon icon="calculator" size="sm" />Financial Performance</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="annualRevenueRange" render={({ field }) => (<FormItem><FormLabel>Annual Revenue Range</FormLabel><Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select revenue range" /></SelectTrigger></FormControl><SelectContent>{revenueRanges.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="netProfitMarginRange" render={({ field }) => (<FormItem><FormLabel>Net Profit Margin Range (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select profit margin"/></SelectTrigger></FormControl><SelectContent>{profitMarginRanges.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>
              <FormField control={form.control} name="askingPrice" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><NobridgeIcon icon="revenue" size="sm" className="mr-1 opacity-80"/>Asking Price (USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 750000" disabled={isPending} /></FormControl><FormDescription>Enter the specific asking price for your business.</FormDescription><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="adjustedCashFlow" render={({ field }) => (<FormItem><FormLabel>Adjusted Cash Flow (TTM, USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 220000" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <Separator/>
              <h3 className="text-md font-medium text-muted-foreground font-heading">Specific Financials (For Verified View)</h3>
              <FormField control={form.control} name="specificAnnualRevenueLastYear" render={({ field }) => (<FormItem><FormLabel>Actual Annual Revenue (TTM, in USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value === undefined ? '' : field.value} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 750000" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="specificNetProfitLastYear" render={({ field }) => (<FormItem><FormLabel>Actual Net Profit (TTM, in USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value === undefined ? '' : field.value} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 180000" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />

              {!isSellerVerified && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5"/>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Additional Financial Verification Available</p>
                      <p className="text-xs text-blue-600 mb-3">Get your seller profile verified to access enhanced listing features and build buyer trust.</p>
                      <Button type="button" variant="outline" size="sm" asChild className="border-blue-500 text-blue-700 hover:bg-blue-100">
                        <Link href="/seller-dashboard/verification">
                          <ShieldCheck className="h-4 w-4 mr-2"/> Get Verified
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><NobridgeIcon icon="deal-structure" size="sm" />Deal &amp; Seller Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="dealStructureLookingFor" render={() => (<FormItem><FormLabel>Looking for (Deal Structure):</FormLabel><FormDescription>Select all that apply.</FormDescription><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">{dealStructures.map((item) => (<FormField key={item} control={form.control} name="dealStructureLookingFor" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter(v => v !== item))} disabled={isPending}/></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}/>))}</div><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="reasonForSellingAnonymous" render={({ field }) => (<FormItem><FormLabel>Reason for Selling (Public Summary, Optional)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Briefly state your reason for selling (e.g., Retirement, Other ventures)." disabled={isPending} /></FormControl><FormDescription>Max 500 characters. This may be shown publicly.</FormDescription><FormMessage /></FormItem>)}/>
              <Separator/>
              <h3 className="text-md font-medium text-muted-foreground font-heading">Additional Seller Information (For Verified View)</h3>
              <FormField control={form.control} name="detailedReasonForSelling" render={({ field }) => (<FormItem><FormLabel>Detailed Reason for Selling</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Provide more context for verified buyers." disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><NobridgeIcon icon="growth" size="sm"/>Growth &amp; Future Potential</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-brand-dark-blue">Specific Growth Opportunities (1-3 points)</Label>
                <FormDescription>List 1-3 specific, actionable growth opportunities.</FormDescription>
                <FormField control={form.control} name="growthOpportunity1" render={({ field }) => (<FormItem><FormControl><Input {...field} placeholder="Opportunity 1 (e.g., Expand to new markets - Region X)" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="growthOpportunity2" render={({ field }) => (<FormItem><FormControl><Input {...field} placeholder="Opportunity 2 (Optional)" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="growthOpportunity3" render={({ field }) => (<FormItem><FormControl><Input {...field} placeholder="Opportunity 3 (Optional)" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </CardContent>
          </Card>

          {/* NEW SECTION: Additional Business Details */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><Building className="h-5 w-5" />Additional Business Details</CardTitle><CardDescription>Optional information to make your listing more comprehensive.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="technologyStack" render={({ field }) => (<FormItem><FormLabel>Technology Stack (for tech businesses)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="e.g., React, Node.js, AWS, PostgreSQL, etc." disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="actualCompanyName" render={({ field }) => (<FormItem><FormLabel>Actual Company Name (if different from registered name)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Brand name or trading name" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="fullBusinessAddress" render={({ field }) => (<FormItem><FormLabel>Full Business Address (for verification)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={2} placeholder="Complete business address including postal code" disabled={isPending} /></FormControl><FormDescription>This will be kept confidential and used for verification purposes only.</FormDescription><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="adjustedCashFlowExplanation" render={({ field }) => (<FormItem><FormLabel>Adjusted Cash Flow Explanation</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Explain how you calculated the adjusted cash flow (add-backs, one-time expenses, etc.)" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="sellerRoleAndTimeCommitment" render={({ field }) => (<FormItem><FormLabel>Seller Role & Time Commitment</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Describe your current role and time investment in the business" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="postSaleTransitionSupport" render={({ field }) => (<FormItem><FormLabel>Post-Sale Transition Support</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="What transition support are you willing to provide to the buyer?" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          {/* NEW SECTION: Document Uploads */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader>
              <CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Supporting Documents & Information
              </CardTitle>
              <CardDescription>Upload supporting documents to build buyer trust and provide transparency. All documents are optional but highly recommended for verified listings.</CardDescription>
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

              <FormField control={form.control} name="secureDataRoomLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>Secure Data Room Link (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      {...field}
                      value={field.value || ""}
                      placeholder="https://your-dataroom-provider.com/room/..."
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>Link to a secure data room containing additional documents (e.g., Dropbox, Google Drive, specialized data room provider).</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5"/>
                  <div>
                    <p className="text-sm font-medium text-green-700">Building Buyer Trust</p>
                    <p className="text-xs text-green-600">Providing comprehensive documentation significantly increases buyer confidence and can lead to faster sales at better valuations. Documents are securely stored and only shared with verified, interested buyers.</p>
                  </div>
                </div>
              </Card>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirm("Are you sure you want to clear all form data including saved draft?")) {
                  form.reset();
                  clearSavedData();
                  toast({
                    title: "Form Cleared",
                    description: "All form data has been cleared.",
                  });
                }
              }}
              disabled={isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear Form & Draft
            </Button>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  saveNow();
                  toast({
                    title: "Draft Saved",
                    description: "Your form data has been saved as a draft.",
                  });
                }}
                disabled={isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>

              <Button
                type="submit"
                className="min-w-[150px] bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90"
                disabled={isPending}
              >
                {isPending ? "Submitting..." : "Create Listing"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

