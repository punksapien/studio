'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

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
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, ArrowLeft, AlertCircle, PlusCircle, ImagePlus, Building, Info, Shield, UploadCloud, XCircle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { NobridgeIcon } from '@/components/ui/nobridge-icon';
import Link from "next/link";
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { SellerPicker, type SellerOption } from '@/components/admin/seller-picker';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"];

const fileOrUrlValidation = z.union([
  z.string().url({ message: "Invalid URL" }).optional().nullable(),
  z.instanceof(File)
    .refine(file => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), 'Only .jpg, .jpeg, .png, .webp formats are supported.')
    .optional()
    .nullable(),
]).optional();

const documentFileOrUrlValidation = z.union([
  z.string().url({ message: "Invalid URL" }).optional().nullable(),
  z.instanceof(File)
    .refine(file => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(file => ACCEPTED_DOCUMENT_TYPES.includes(file.type), 'Only PDF, XLSX, CSV formats are supported.')
    .optional()
    .nullable(),
]).optional();

const ListingSchema = z.object({
  listingTitleAnonymous: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title too long."),
  industry: z.string().min(1, "Industry is required."),
  locationCountry: z.string().min(1, "Country is required."),
  locationCityRegionGeneral: z.string().min(2, "City/Region is required.").max(50, "City/Region too long."),
  anonymousBusinessDescription: z.string().min(50, "Description must be at least 50 characters.").max(2000, "Description too long (max 2000 chars)."),

  keyStrength1: z.string().min(5, "Strength must be at least 5 characters.").max(150, "Strength too long (max 150 chars).").optional(),
  keyStrength2: z.string().min(5, "Strength must be at least 5 characters.").max(150, "Strength too long (max 150 chars).").optional(),
  keyStrength3: z.string().min(5, "Strength must be at least 5 characters.").max(150, "Strength too long (max 150 chars).").optional(),

  businessModel: z.string().optional(),
  yearEstablished: z.coerce.number().optional().refine(val => val === undefined || (val >= 1900 && val <= new Date().getFullYear()), { message: "Please enter a valid year." }),
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
  ebitda: z.coerce.number({invalid_type_error: "EBITDA must be a number."}).optional(),
  adjustedCashFlowExplanation: z.string().optional(),

  dealStructureLookingFor: z.array(z.string()).optional(),
  reasonForSellingAnonymous: z.string().max(500, "Reason too long (max 500 chars).").optional(),
  detailedReasonForSelling: z.string().optional(),
  sellerRoleAndTimeCommitment: z.string().optional(),
  postSaleTransitionSupport: z.string().optional(),

  growthOpportunity1: z.string().min(5, "Growth opportunity must be at least 5 characters.").max(200, "Opportunity too long (max 200 chars).").optional(),
  growthOpportunity2: z.string().min(5, "Growth opportunity must be at least 5 characters.").max(200, "Opportunity too long (max 200 chars).").optional(),
  growthOpportunity3: z.string().min(5, "Growth opportunity must be at least 5 characters.").max(200, "Opportunity too long (max 200 chars).").optional(),

  imageFile1: fileOrUrlValidation,
  imageFile2: fileOrUrlValidation,
  imageFile3: fileOrUrlValidation,
  imageFile4: fileOrUrlValidation,
  imageFile5: fileOrUrlValidation,

  financialDocuments: documentFileOrUrlValidation,
  keyMetricsReport: documentFileOrUrlValidation,
  ownershipDocuments: documentFileOrUrlValidation,
  financialSnapshot: documentFileOrUrlValidation,
  ownershipDetails: documentFileOrUrlValidation,
  locationRealEstateInfo: documentFileOrUrlValidation,
  webPresenceInfo: documentFileOrUrlValidation,
  secureDataRoomLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),

  // Admin-specific fields
  adminReason: z.string().min(10, "Admin reason must be at least 10 characters.").max(500, "Admin reason too long (max 500 chars)."),
  notifySeller: z.boolean().default(false),
}).refine(data => {
  const strengths = [data.keyStrength1, data.keyStrength2, data.keyStrength3].filter(s => s && s.trim() !== "");
  return strengths.length >= 1;
}, { message: "At least one key strength is required.", path: ["keyStrength1"], });

type ListingFormValues = z.infer<typeof ListingSchema>;

interface ImageSlot {
  file?: File | null;
  previewUrl?: string | null;
}

const ADMIN_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function AdminCreateListingPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuth();

  const [sellerId, setSellerId] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<SellerOption | null>(null);
  const [listingStatus, setListingStatus] = useState<string>('pending_approval');
  const [sellerError, setSellerError] = useState<string | null>(null);

  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(Array(5).fill({ file: null, previewUrl: null }));

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(ListingSchema),
    defaultValues: {
      listingTitleAnonymous: '',
      industry: '',
      locationCountry: '',
      locationCityRegionGeneral: '',
      anonymousBusinessDescription: '',
      annualRevenueRange: '',
      dealStructureLookingFor: [],
      adminReason: '',
      notifySeller: false,
    }
  });

  const handleImageChange = (index: number, file: File | null) => {
    setImageSlots(prevSlots => {
      const newSlots = [...prevSlots];
      const oldPreviewUrl = newSlots[index]?.previewUrl;
      if (oldPreviewUrl && newSlots[index]?.file) {
        URL.revokeObjectURL(oldPreviewUrl);
      }
      if (file) {
        newSlots[index] = { file, previewUrl: URL.createObjectURL(file) };
      } else {
        newSlots[index] = { file: null, previewUrl: null };
      }
      form.setValue(`imageFile${index + 1}` as any, file);
      return newSlots;
    });
  };

  const handleRemoveImage = (index: number) => {
    setImageSlots(prevSlots => {
      const newSlots = [...prevSlots];
      const oldPreviewUrl = newSlots[index]?.previewUrl;
      if (oldPreviewUrl && newSlots[index]?.file) {
        URL.revokeObjectURL(oldPreviewUrl);
      }
      newSlots[index] = { file: null, previewUrl: null };
      form.setValue(`imageFile${index + 1}` as any, null);
      return newSlots;
    });
  };

  useEffect(() => {
    return () => {
      imageSlots.forEach(slot => {
        if (slot.previewUrl && slot.file) URL.revokeObjectURL(slot.previewUrl);
      });
    };
  }, []);

  const uploadFile = async (file: File, documentType: string, listingId: string, accessToken: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      formData.append('listing_id', listingId);

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result.signedUrl);
          } catch (e) {
            reject(new Error(`Failed to parse upload response for ${documentType}`));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error || `Upload failed for ${documentType}: ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Upload failed for ${documentType}: ${xhr.status}`));
          }
        }
      });
      xhr.addEventListener('error', () => reject(new Error(`Network error uploading ${documentType}`)));
      xhr.addEventListener('timeout', () => reject(new Error(`Timeout uploading ${documentType}`)));
      xhr.open('POST', '/api/listings/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.timeout = 60000;
      xhr.send(formData);
    });
  };

  const onSubmit = async (values: ListingFormValues) => {
    if (!sellerId) {
      setSellerError('Please select a listing owner (seller) before saving.');
      toast({
        title: "Seller required",
        description: "You must choose a seller who will own this listing.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "🚀 Creating Listing",
        description: "Saving the new listing...",
      });

      // Step 1: Create the listing (without file URLs; those are attached after upload).
      const createPayload: Record<string, any> = {
        seller_id: sellerId,
        status: listingStatus,
        adminReason: values.adminReason,
        notifySeller: values.notifySeller,
        listing_title_anonymous: values.listingTitleAnonymous,
        industry: values.industry,
        location_country: values.locationCountry,
        location_city_region_general: values.locationCityRegionGeneral,
        anonymous_business_description: values.anonymousBusinessDescription,
        key_strength_1: values.keyStrength1 || null,
        key_strength_2: values.keyStrength2 || null,
        key_strength_3: values.keyStrength3 || null,
        business_model: values.businessModel || null,
        year_established: values.yearEstablished || null,
        registered_business_name: values.registeredBusinessName || null,
        business_website_url: values.businessWebsiteUrl || null,
        social_media_links: values.socialMediaLinks || null,
        number_of_employees: values.numberOfEmployees || null,
        technology_stack: values.technologyStack || null,
        actual_company_name: values.actualCompanyName || null,
        full_business_address: values.fullBusinessAddress || null,
        annual_revenue_range: values.annualRevenueRange,
        net_profit_margin_range: values.netProfitMarginRange || null,
        asking_price: values.askingPrice || null,
        specific_annual_revenue_last_year: values.specificAnnualRevenueLastYear || null,
        specific_net_profit_last_year: values.specificNetProfitLastYear || null,
        adjusted_cash_flow: values.adjustedCashFlow || null,
        ebitda: values.ebitda || null,
        adjusted_cash_flow_explanation: values.adjustedCashFlowExplanation || null,
        deal_structure_looking_for: values.dealStructureLookingFor || [],
        reason_for_selling_anonymous: values.reasonForSellingAnonymous || null,
        detailed_reason_for_selling: values.detailedReasonForSelling || null,
        seller_role_and_time_commitment: values.sellerRoleAndTimeCommitment || null,
        post_sale_transition_support: values.postSaleTransitionSupport || null,
        growth_opportunity_1: values.growthOpportunity1 || null,
        growth_opportunity_2: values.growthOpportunity2 || null,
        growth_opportunity_3: values.growthOpportunity3 || null,
        secure_data_room_link: values.secureDataRoomLink || null,
      };

      const createResponse = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create listing');
      }

      const createResult = await createResponse.json();
      const newId: string = createResult?.data?.listing?.id;
      if (!newId) {
        throw new Error('Listing was created but no ID was returned.');
      }

      // Step 2: Upload any selected files against the new listing id.
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const hasImageFiles = imageSlots.some(slot => slot.file);
      const documentFields = ['financialDocuments', 'keyMetricsReport', 'ownershipDocuments', 'financialSnapshot', 'ownershipDetails', 'locationRealEstateInfo', 'webPresenceInfo'];
      const hasDocFiles = documentFields.some(f => values[f as keyof ListingFormValues] instanceof File);

      if (hasImageFiles || hasDocFiles) {
        if (!accessToken) throw new Error('Authentication required for file upload');

        toast({
          title: "📎 Uploading Files",
          description: "Attaching images and documents to the listing...",
        });

        // Images (preserve slot order).
        const imageUrls: string[] = [];
        for (let i = 0; i < 5; i++) {
          const slot = imageSlots[i];
          if (slot.file) {
            const url = await uploadFile(slot.file, `image_url_${i + 1}`, newId, accessToken);
            if (url) imageUrls.push(url);
          }
        }

        // Documents.
        const documentUploads: Record<string, string> = {};
        for (const fieldName of documentFields) {
          const fileOrUrl = values[fieldName as keyof ListingFormValues] as File | string | null | undefined;
          if (fileOrUrl instanceof File) {
            const docType = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
            const dbFieldName = `${docType}_url`;
            const url = await uploadFile(fileOrUrl, docType, newId, accessToken);
            documentUploads[dbFieldName] = url;
          }
        }

        // Step 3: Attach uploaded file URLs via admin PATCH.
        const patchPayload: Record<string, any> = {
          adminReason: 'Attach uploaded files (listing creation)',
          notifySeller: false,
          ...documentUploads,
        };
        if (imageUrls.length > 0) {
          patchPayload.image_urls = imageUrls;
        }

        const patchResponse = await fetch(`/api/admin/listings/${newId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchPayload),
        });

        if (!patchResponse.ok) {
          const errorData = await patchResponse.json().catch(() => ({}));
          // The listing exists; surface the failure but still navigate to it.
          toast({
            title: "⚠️ Files Not Fully Attached",
            description: errorData.error || 'The listing was created, but attaching files failed. You can re-upload from the edit page.',
            variant: "destructive",
            duration: 8000,
          });
        }
      }

      toast({
        title: "✅ Listing Created Successfully!",
        description: "The new listing has been created.",
        duration: 5000,
      });

      router.push(`/admin/listings/${newId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create listing. Please try again.";
      console.error('[ADMIN-CREATE-LISTING] Create failed:', err);

      toast({
        title: "❌ Creation Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  if (authLoading) {
    return (
      <div className="container py-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="container py-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You must be logged in as an admin to create listings.</p>
            <Button asChild><Link href="/admin">Admin Dashboard</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  const { isSubmitting } = form.formState;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild className="border-input hover:bg-accent/50">
          <Link href="/admin/listings"><ArrowLeft className="h-4 w-4 mr-2" />Back to Listings</Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-brand-dark-blue font-heading">
            <Shield className="inline h-7 w-7 mr-2 text-primary" />
            Admin Create Listing
          </h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Listing Owner Card */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader>
              <CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2">
                <Building className="h-5 w-5 text-primary"/>Listing Owner
              </CardTitle>
              <CardDescription>Select the seller who will own this listing. Required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-brand-dark-blue font-medium">Seller <span className="text-red-600">*</span></Label>
                <SellerPicker
                  value={sellerId}
                  onSelect={(id, seller) => {
                    setSellerId(id);
                    setSelectedSeller(seller);
                    setSellerError(null);
                  }}
                  disabled={isSubmitting}
                />
                {selectedSeller && (
                  <p className="text-sm text-muted-foreground">
                    Owner: <span className="font-medium">{selectedSeller.fullName}</span> ({selectedSeller.email})
                  </p>
                )}
                {sellerError && <p className="text-sm font-medium text-destructive">{sellerError}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-brand-dark-blue font-medium">Listing Status</Label>
                <Select value={listingStatus} onValueChange={setListingStatus} disabled={isSubmitting}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Defaults to Pending Approval. Choosing Active publishes the listing immediately.</FormDescription>
              </div>
            </CardContent>
          </Card>

          {/* Admin Controls Card */}
          <Card className="shadow-md bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600"/>Admin Controls
              </CardTitle>
              <CardDescription>Required information for audit trail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="adminReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-red-600">Admin Reason for Creation (Required) *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Explain why you're creating this listing (e.g., 'Onboarding new seller per signed agreement', etc.)"
                        disabled={isSubmitting}
                        className="border-amber-300"
                      />
                    </FormControl>
                    <FormDescription>This will be logged in the audit trail.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notifySeller"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Notify seller</FormLabel>
                      <FormDescription>Send a notification to the seller that this listing was created for them</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Basic Information Card */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><Info className="h-5 w-5 text-primary"/>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="listingTitleAnonymous" render={({ field }) => (<FormItem><FormLabel>Listing Title (Anonymous)</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)}/>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="industry" render={({ field }) => (<FormItem><FormLabel>Industry</FormLabel><Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select industry"/></SelectTrigger></FormControl><SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="locationCountry" render={({ field }) => (<FormItem><FormLabel>Location (Country)</FormLabel><Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select country"/></SelectTrigger></FormControl><SelectContent>{asianCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>
              <FormField control={form.control} name="locationCityRegionGeneral" render={({ field }) => (<FormItem><FormLabel>Location (General City/Region)</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)}/>
            </CardContent>
          </Card>

          {/* Business Profile & Operations Card */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><Building className="h-5 w-5 text-primary"/>Business Profile & Operations</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="anonymousBusinessDescription" render={({ field }) => (<FormItem><FormLabel>Business Description</FormLabel><FormControl><Textarea {...field} rows={6} disabled={isSubmitting} /></FormControl><FormDescription>Max 2000 characters.</FormDescription><FormMessage /></FormItem>)}/>
              <div className="space-y-2">
                <Label className="text-brand-dark-blue font-medium">Key Strengths (1-3 points)</Label><FormDescription>Highlight the main advantages. Each strength max 150 chars.</FormDescription>
                <FormField control={form.control} name="keyStrength1" render={({ field }) => (<FormItem><FormControl><Input {...field} value={field.value || ""} placeholder="Strength 1 (e.g., Strong recurring revenue)" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="keyStrength2" render={({ field }) => (<FormItem><FormControl><Input {...field} value={field.value || ""} placeholder="Strength 2 (Optional)" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="keyStrength3" render={({ field }) => (<FormItem><FormControl><Input {...field} value={field.value || ""} placeholder="Strength 3 (Optional)" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)}/>
              </div>
              <FormField control={form.control} name="businessModel" render={({ field }) => (<FormItem><FormLabel>Business Model</FormLabel><FormControl><Textarea {...field} value={field.value || ""} placeholder="e.g., SaaS, E-commerce..." disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="yearEstablished" render={({ field }) => (<FormItem><FormLabel>Year Established</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} placeholder="YYYY" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="registeredBusinessName" render={({ field }) => (<FormItem><FormLabel>Legal Registered Business Name</FormLabel><FormControl><Input {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="businessWebsiteUrl" render={({ field }) => (<FormItem><FormLabel>Website URL</FormLabel><FormControl><Input type="url" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="socialMediaLinks" render={({ field }) => (<FormItem><FormLabel>Social Media (one per line)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="numberOfEmployees" render={({ field }) => (<FormItem><FormLabel>Number of Employees</FormLabel><Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger></FormControl><SelectContent>{employeeCountRanges.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
            </CardContent>
          </Card>

          {/* Business Images Section */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader>
              <CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-primary"/>Business Images
              </CardTitle>
              <CardDescription>Upload up to 5 images. Max 5MB each. JPG, PNG, WebP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[0, 1, 2, 3, 4].map(i => (
                <FormItem key={`imageSlot${i}`}>
                  <FormLabel>Image Slot {i + 1}</FormLabel>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3 border rounded-md">
                    <div className="w-32 h-32 relative border rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                      {imageSlots[i]?.previewUrl ? (
                        <Image src={imageSlots[i].previewUrl!} alt={`Preview ${i + 1}`} layout="fill" objectFit="contain" />
                      ) : (
                        <UploadCloud className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-grow space-y-2 w-full">
                      <FormControl>
                        <Input
                          type="file"
                          id={`imageFile${i + 1}`}
                          onChange={(e) => handleImageChange(i, e.target.files ? e.target.files[0] : null)}
                          accept={ACCEPTED_IMAGE_TYPES.join(",")}
                          disabled={isSubmitting}
                          className="flex-grow"
                        />
                      </FormControl>
                      {imageSlots[i]?.previewUrl && (
                        <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveImage(i)} disabled={isSubmitting} className="text-destructive border-destructive hover:bg-destructive/10 w-full sm:w-auto">
                          <XCircle className="h-4 w-4 mr-1" /> Remove Image
                        </Button>
                      )}
                      <FormDescription className="text-xs">
                        {imageSlots[i]?.file ? `New: ${imageSlots[i].file!.name}` : 'No image selected'}
                      </FormDescription>
                    </div>
                  </div>
                  <FormMessage>{form.formState.errors[`imageFile${i+1}` as keyof ListingFormValues]?.message as React.ReactNode}</FormMessage>
                </FormItem>
              ))}
            </CardContent>
          </Card>

          {/* Financial Performance */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><NobridgeIcon icon="calculator" size="sm" />Financial Performance</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="annualRevenueRange" render={({ field }) => (<FormItem><FormLabel>Annual Revenue Range</FormLabel><Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select revenue range" /></SelectTrigger></FormControl><SelectContent>{revenueRanges.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="netProfitMarginRange" render={({ field }) => (<FormItem><FormLabel>Net Profit Margin Range (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select profit margin"/></SelectTrigger></FormControl><SelectContent>{profitMarginRanges.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>
              <FormField control={form.control} name="askingPrice" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><NobridgeIcon icon="revenue" size="sm" className="mr-1 opacity-80"/>Asking Price (USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 750000" disabled={isSubmitting} /></FormControl><FormDescription>Enter the specific asking price.</FormDescription><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="adjustedCashFlow" render={({ field }) => (<FormItem><FormLabel>Adjusted Cash Flow / SDE (TTM, USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 220000" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="ebitda" render={({ field }) => (<FormItem><FormLabel>EBITDA (TTM, USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 250000" disabled={isSubmitting} /></FormControl><FormDescription>Earnings Before Interest, Taxes, Depreciation, and Amortization</FormDescription><FormMessage /></FormItem>)} />
              <Separator/>
              <h3 className="text-md font-medium text-muted-foreground font-heading">Specific Financials (For Verified View)</h3>
              <FormField control={form.control} name="specificAnnualRevenueLastYear" render={({ field }) => (<FormItem><FormLabel>Actual Annual Revenue (TTM, in USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value === undefined ? '' : field.value} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 750000" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="specificNetProfitLastYear" render={({ field }) => (<FormItem><FormLabel>Actual Net Profit (TTM, in USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value === undefined ? '' : field.value} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 180000" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          {/* Supporting Documents Section */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>Supporting Documents & Information</CardTitle><CardDescription>Upload supporting documents. Max 5MB each. PDF, XLSX, CSV.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { name: "financialDocuments", label: "Financial Documents (P&L, Balance Sheet)" },
                  { name: "keyMetricsReport", label: "Key Business Metrics Report" },
                  { name: "ownershipDocuments", label: "Ownership Documents" },
                  { name: "financialSnapshot", label: "Financial Snapshot" },
                  { name: "ownershipDetails", label: "Detailed Ownership Information" },
                  { name: "locationRealEstateInfo", label: "Location & Real Estate Information" },
                  { name: "webPresenceInfo", label: "Web Presence Information" },
                ].map(doc => (
                  <FormField key={doc.name} control={form.control} name={doc.name as keyof ListingFormValues} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{doc.label}</FormLabel>
                      <FormControl><Input type="file" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} accept={ACCEPTED_DOCUMENT_TYPES.join(",")} disabled={isSubmitting} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}
              </div>
              <FormField control={form.control} name="secureDataRoomLink" render={({ field }) => (<FormItem><FormLabel>Secure Data Room Link (Optional)</FormLabel><FormControl><Input type="url" {...field} value={field.value || ""} placeholder="https://dataroom.example.com/your-listing" disabled={isSubmitting}/></FormControl><FormDescription>Link to external secure data room.</FormDescription><FormMessage /></FormItem>)}/>
            </CardContent>
          </Card>

          {/* Deal & Seller Information */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><NobridgeIcon icon="deal-structure" size="sm" />Deal & Seller Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="dealStructureLookingFor" render={() => (<FormItem><FormLabel>Looking for (Deal Structure):</FormLabel><FormDescription>Select all that apply.</FormDescription><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">{dealStructures.map((item) => (<FormField key={item} control={form.control} name="dealStructureLookingFor" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter(v => v !== item))} disabled={isSubmitting}/></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}/>))}</div><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="reasonForSellingAnonymous" render={({ field }) => (<FormItem><FormLabel>Reason for Selling (Public Summary, Optional)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Briefly state reason for selling" disabled={isSubmitting} /></FormControl><FormDescription>Max 500 characters.</FormDescription><FormMessage /></FormItem>)}/>
              <Separator/>
              <h3 className="text-md font-medium text-muted-foreground font-heading">Additional Seller Information (For Verified View)</h3>
              <FormField control={form.control} name="detailedReasonForSelling" render={({ field }) => (<FormItem><FormLabel>Detailed Reason for Selling</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Provide more context for verified buyers." disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          {/* Growth & Future Potential */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><NobridgeIcon icon="growth" size="sm"/>Growth & Future Potential</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-brand-dark-blue">Specific Growth Opportunities (1-3 points)</Label><FormDescription>List 1-3 specific, actionable growth opportunities.</FormDescription>
                <FormField control={form.control} name="growthOpportunity1" render={({ field }) => (<FormItem><FormControl><Input {...field} value={field.value || ""} placeholder="Opportunity 1" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="growthOpportunity2" render={({ field }) => (<FormItem><FormControl><Input {...field} value={field.value || ""} placeholder="Opportunity 2 (Optional)" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="growthOpportunity3" render={({ field }) => (<FormItem><FormControl><Input {...field} value={field.value || ""} placeholder="Opportunity 3 (Optional)" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </CardContent>
          </Card>

          {/* Additional Business Details */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><Building className="h-5 w-5" />Additional Business Details</CardTitle><CardDescription>Optional information for comprehensive listing.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="technologyStack" render={({ field }) => (<FormItem><FormLabel>Technology Stack (for tech businesses)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="e.g., React, Node.js, AWS, PostgreSQL" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="actualCompanyName" render={({ field }) => (<FormItem><FormLabel>Actual Company Name (if different from legal name)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Brand name or trading name" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="fullBusinessAddress" render={({ field }) => (<FormItem><FormLabel>Full Business Address (for verification)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={2} placeholder="Complete business address including postal code" disabled={isSubmitting} /></FormControl><FormDescription>Kept confidential.</FormDescription><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="adjustedCashFlowExplanation" render={({ field }) => (<FormItem><FormLabel>Adjusted Cash Flow Explanation</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Explain calculation (add-backs, one-time expenses, etc.)" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="sellerRoleAndTimeCommitment" render={({ field }) => (<FormItem><FormLabel>Seller Role & Time Commitment</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Describe current role and time investment" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="postSaleTransitionSupport" render={({ field }) => (<FormItem><FormLabel>Post-Sale Transition Support</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="What transition support is available?" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Separator />
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/listings')} disabled={isSubmitting} className="border-input hover:bg-accent/50">Cancel</Button>
            <Button type="submit" className="min-w-[150px] bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90" disabled={isSubmitting || !sellerId}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                {isSubmitting ? "Creating..." : "Create Listing"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
