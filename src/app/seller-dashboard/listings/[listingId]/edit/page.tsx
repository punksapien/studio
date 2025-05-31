
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
import { industries, asianCountries, revenueRanges, profitMarginRanges, dealStructures, Listing, User, employeeCountRanges } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useTransition, useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { sampleListings, sampleUsers } from "@/lib/placeholder-data";
import { PlusCircle, Trash2, ImagePlus } from "lucide-react";
import { notFound, useRouter, useParams } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { NobridgeIcon, NobridgeIconType } from '@/components/ui/nobridge-icon';

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

  imageUrl1: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  imageUrl2: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  imageUrl3: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  imageUrl4: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  imageUrl5: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
});

type ListingFormValues = z.infer<typeof ListingSchema>;

const currentSellerId = 'user1';
const currentUser: User | undefined = sampleUsers.find(u => u.id === currentSellerId && u.role === 'seller');

export default function EditSellerListingPage() {
  const params = useParams();
  const listingId = typeof params.listingId === 'string' ? params.listingId : '';

  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [listing, setListing] = useState<Listing | null>(null);
  const [keyStrengthsFields, setKeyStrengthsFields] = useState<string[]>(['']);

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
      imageUrl1: "", imageUrl2: "", imageUrl3: "", imageUrl4: "", imageUrl5: "",
    },
  });

  useEffect(() => {
    const fetchedListing = sampleListings.find(l => l.id === listingId && l.sellerId === currentUser?.id);
    if (fetchedListing) {
      setListing(fetchedListing);
      const initialImageUrls = fetchedListing.imageUrls || [];
      form.reset({
        listingTitleAnonymous: fetchedListing.listingTitleAnonymous || "",
        industry: fetchedListing.industry || "",
        locationCountry: fetchedListing.locationCountry || "",
        locationCityRegionGeneral: fetchedListing.locationCityRegionGeneral || "",
        anonymousBusinessDescription: fetchedListing.anonymousBusinessDescription || "",
        keyStrengthsAnonymous: fetchedListing.keyStrengthsAnonymous?.length > 0 ? fetchedListing.keyStrengthsAnonymous : [''],
        businessModel: fetchedListing.businessModel || "",
        yearEstablished: fetchedListing.yearEstablished || undefined,
        registeredBusinessName: fetchedListing.registeredBusinessName || "",
        businessWebsiteUrl: fetchedListing.businessWebsiteUrl || "",
        socialMediaLinks: fetchedListing.socialMediaLinks || "",
        numberOfEmployees: fetchedListing.numberOfEmployees || undefined,
        technologyStack: fetchedListing.technologyStack || "",
        annualRevenueRange: fetchedListing.annualRevenueRange || "",
        netProfitMarginRange: fetchedListing.netProfitMarginRange || "",
        askingPrice: fetchedListing.askingPrice === undefined ? undefined : Number(fetchedListing.askingPrice),
        specificAnnualRevenueLastYear: fetchedListing.specificAnnualRevenueLastYear === undefined ? undefined : Number(fetchedListing.specificAnnualRevenueLastYear),
        specificNetProfitLastYear: fetchedListing.specificNetProfitLastYear === undefined ? undefined : Number(fetchedListing.specificNetProfitLastYear),
        adjustedCashFlow: fetchedListing.adjustedCashFlow === undefined ? undefined : Number(fetchedListing.adjustedCashFlow),
        adjustedCashFlowExplanation: fetchedListing.adjustedCashFlowExplanation || "",
        dealStructureLookingFor: fetchedListing.dealStructureLookingFor || [],
        reasonForSellingAnonymous: fetchedListing.reasonForSellingAnonymous || "",
        detailedReasonForSelling: fetchedListing.detailedReasonForSelling || "",
        sellerRoleAndTimeCommitment: fetchedListing.sellerRoleAndTimeCommitment || "",
        postSaleTransitionSupport: fetchedListing.postSaleTransitionSupport || "",
        specificGrowthOpportunities: fetchedListing.specificGrowthOpportunities || "",
        imageUrl1: initialImageUrls[0] || "",
        imageUrl2: initialImageUrls[1] || "",
        imageUrl3: initialImageUrls[2] || "",
        imageUrl4: initialImageUrls[3] || "",
        imageUrl5: initialImageUrls[4] || "",
      });
      setKeyStrengthsFields(fetchedListing.keyStrengthsAnonymous?.length > 0 ? fetchedListing.keyStrengthsAnonymous : ['']);
    } else {
      notFound();
    }
  }, [listingId, form, currentUser?.id]);


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


  const onSubmit = (values: ListingFormValues) => {
    const imageUrls = [values.imageUrl1, values.imageUrl2, values.imageUrl3, values.imageUrl4, values.imageUrl5].filter(url => url && url.trim() !== "") as string[];
     const cleanedValues = {
      ...values,
      keyStrengthsAnonymous: values.keyStrengthsAnonymous.filter(strength => strength && strength.trim() !== ""),
      imageUrls: imageUrls,
    };
    delete (cleanedValues as any).imageUrl1;
    delete (cleanedValues as any).imageUrl2;
    delete (cleanedValues as any).imageUrl3;
    delete (cleanedValues as any).imageUrl4;
    delete (cleanedValues as any).imageUrl5;

    startTransition(async () => {
      console.log("Update listing values:", cleanedValues);
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({ title: "Listing Updated", description: "Your business listing has been successfully updated." });
    });
  };

  if (!currentUser) {
    return (
      <div className="container py-8 text-center">
        Please login as a seller to edit listings.
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container py-8 text-center">
        Loading listing data or listing not found...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-brand-dark-blue font-heading">Edit Listing: {listing.listingTitleAnonymous}</h1>
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
                    <FormItem><FormLabel>Industry</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
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
              <div className="space-y-2"><Label className="text-md font-medium text-muted-foreground flex items-center gap-2"><NobridgeIcon icon="documents" size="sm"/>Supporting Financial Documents</Label><FormItem><Label htmlFor="financialStatements">Financial Statements</Label><Input id="financialStatements" type="file" disabled={isPending} /><FormDescription>PDF, XLSX accepted.</FormDescription></FormItem><FormItem><Label htmlFor="keyMetricsReport">Key Metrics Report</Label><Input id="keyMetricsReport" type="file" disabled={isPending} /><FormDescription>PDF, XLSX accepted.</FormDescription></FormItem></div>
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
              <div className="space-y-2"><Label className="text-md font-medium text-muted-foreground flex items-center gap-2"><NobridgeIcon icon="secure-docs" size="sm"/>Ownership &amp; Legal Documents</Label><FormItem><Label htmlFor="ownershipDocs">Proof of Ownership / Incorporation</Label><Input id="ownershipDocs" type="file" disabled={isPending} /><FormDescription>PDF accepted.</FormDescription></FormItem></div>
            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center gap-2"><NobridgeIcon icon="growth" size="sm"/>Growth &amp; Future Potential</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="specificGrowthOpportunities" render={({ field }) => (<FormItem><FormLabel>Specific Growth Opportunities (Use bullet points)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={5} placeholder="- Expand to new markets (e.g., Region X)\n- Launch new product line (e.g., Product Y)\n- Optimize marketing spend by Z%" disabled={isPending} /></FormControl><FormDescription>List 3-5 specific, actionable growth opportunities.</FormMessage><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Separator />
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => {
                const initialImageUrls = listing?.imageUrls || [];
                form.reset({
                  listingTitleAnonymous: listing?.listingTitleAnonymous || "",
                  industry: listing?.industry || "",
                  locationCountry: listing?.locationCountry || "",
                  locationCityRegionGeneral: listing?.locationCityRegionGeneral || "",
                  anonymousBusinessDescription: listing?.anonymousBusinessDescription || "",
                  keyStrengthsAnonymous: listing?.keyStrengthsAnonymous?.length ? listing.keyStrengthsAnonymous : [''],
                  businessModel: listing?.businessModel || "",
                  yearEstablished: listing?.yearEstablished || undefined,
                  registeredBusinessName: listing?.registeredBusinessName || "",
                  businessWebsiteUrl: listing?.businessWebsiteUrl || "",
                  socialMediaLinks: listing?.socialMediaLinks || "",
                  numberOfEmployees: listing?.numberOfEmployees || undefined,
                  technologyStack: listing?.technologyStack || "",
                  annualRevenueRange: listing?.annualRevenueRange || "",
                  netProfitMarginRange: listing?.netProfitMarginRange || "",
                  askingPrice: listing?.askingPrice === undefined ? undefined : Number(listing.askingPrice),
                  specificAnnualRevenueLastYear: listing?.specificAnnualRevenueLastYear === undefined ? undefined : Number(listing.specificAnnualRevenueLastYear),
                  specificNetProfitLastYear: listing?.specificNetProfitLastYear === undefined ? undefined : Number(listing.specificNetProfitLastYear),
                  adjustedCashFlow: listing?.adjustedCashFlow === undefined ? undefined : Number(listing.adjustedCashFlow),
                  adjustedCashFlowExplanation: listing?.adjustedCashFlowExplanation || "",
                  dealStructureLookingFor: listing?.dealStructureLookingFor || [],
                  reasonForSellingAnonymous: listing?.reasonForSellingAnonymous || "",
                  detailedReasonForSelling: listing?.detailedReasonForSelling || "",
                  sellerRoleAndTimeCommitment: listing?.sellerRoleAndTimeCommitment || "",
                  postSaleTransitionSupport: listing?.postSaleTransitionSupport || "",
                  specificGrowthOpportunities: listing?.specificGrowthOpportunities || "",
                  imageUrl1: initialImageUrls[0] || "",
                  imageUrl2: initialImageUrls[1] || "",
                  imageUrl3: initialImageUrls[2] || "",
                  imageUrl4: initialImageUrls[3] || "",
                  imageUrl5: initialImageUrls[4] || "",
                });
                setKeyStrengthsFields(listing?.keyStrengthsAnonymous?.length ? listing.keyStrengthsAnonymous : ['']);
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
