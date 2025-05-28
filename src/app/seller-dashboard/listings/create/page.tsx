
'use client';

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { PlusCircle, Trash2, DollarSign, ImagePlus } from "lucide-react";
import { Label } from "@/components/ui/label";

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

export default function CreateSellerListingPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
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
      imageUrl1: "",
      imageUrl2: "",
      imageUrl3: "",
      imageUrl4: "",
      imageUrl5: "",
    },
  });

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
      console.log("Create listing values:", cleanedValues);
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({ title: "Listing Created", description: "Your business listing has been successfully created and is pending review/verification." });
      form.reset();
      setKeyStrengthsFields(['']);
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-brand-dark-blue">Create New Business Listing</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Basic Information */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader>
              <CardTitle className="text-brand-dark-blue">Section 1: Basic Information (Anonymous)</CardTitle>
              <CardDescription>Provide the essential details for your listing. This information will be displayed anonymously initially.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="listingTitleAnonymous" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listing Title (Anonymous)</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., Profitable E-commerce Store in Southeast Asia" disabled={isPending} /></FormControl>
                    <FormDescription>A catchy, anonymous title for your business.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="industry" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger></FormControl>
                        <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="locationCountry" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Country)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger></FormControl>
                        <SelectContent>{asianCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField control={form.control} name="locationCityRegionGeneral" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (General City/Region)</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., Metro Manila, Bangkok Area" disabled={isPending} /></FormControl>
                    <FormDescription>Keep this general for anonymity (e.g., "Nationwide" or a major metro area).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 2: Business Profile & Operations */}
          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue">Section 2: Business Profile &amp; Operations</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="anonymousBusinessDescription" render={({ field }) => (
                  <FormItem><FormLabel>Business Description</FormLabel><FormControl><Textarea {...field} rows={6} placeholder="Describe your business, products/services, market position, and growth potential without revealing identifying details." disabled={isPending} /></FormControl><FormDescription>Max 2000 characters.</FormDescription><FormMessage /></FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keyStrengthsAnonymous"
                render={() => (
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
              <FormField control={form.control} name="businessModel" render={({ field }) => (<FormItem><FormLabel>Business Model</FormLabel><FormControl><Textarea {...field} value={field.value || ""} placeholder="e.g., SaaS, E-commerce (dropshipping/inventory), Service-based, Lead Generation, Content Site (Adsense/Affiliate), etc." disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="yearEstablished" render={({ field }) => (<FormItem><FormLabel>Year Business Established</FormLabel><FormControl><Input type="number" {...field} value={field.value === undefined ? '' : field.value} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} placeholder="YYYY" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="registeredBusinessName" render={({ field }) => (<FormItem><FormLabel>Official Registered Business Name (for verification)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Your Company Pte Ltd" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="businessWebsiteUrl" render={({ field }) => (<FormItem><FormLabel>Primary Business Website</FormLabel><FormControl><Input type="url" {...field} value={field.value || ""} placeholder="https://yourbusiness.com" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="socialMediaLinks" render={({ field }) => (<FormItem><FormLabel>Key Social Media Profiles (one per line)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="https://linkedin.com/company/yourbusiness\nhttps://facebook.com/yourbusiness" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="numberOfEmployees" render={({ field }) => (<FormItem><FormLabel>Number of Employees (Full-time equivalents)</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select number of employees" /></SelectTrigger></FormControl><SelectContent>{employeeCountRanges.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="technologyStack" render={({ field }) => (<FormItem><FormLabel>Technology Stack / Key Operational Assets</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Briefly describe the core technology, software, or unique operational assets (e.g., Custom CRM, Proprietary Algorithm, Shopify Plus, AWS Infrastructure, Key Supplier Contracts)." disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue flex items-center gap-2"><ImagePlus className="h-5 w-5"/>Business Images</CardTitle><CardDescription>Provide up to 5 image URLs for your listing (e.g., logo, storefront, product shots). These will be shown to buyers.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (<FormField key={`imageUrl${i}`} control={form.control} name={`imageUrl${i}` as `imageUrl1`} render={({ field }) => (<FormItem><FormLabel>Image URL {i}</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="https://example.com/image.jpg" disabled={isPending} /></FormControl><FormMessage /></FormItem>)}/>))}
            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue">Section 3: Financial Performance</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="annualRevenueRange" render={({ field }) => (<FormItem><FormLabel>Annual Revenue Range (Anonymous)</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select revenue range" /></SelectTrigger></FormControl><SelectContent>{revenueRanges.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="netProfitMarginRange" render={({ field }) => (<FormItem><FormLabel>Net Profit Margin Range (Anonymous, Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select profit margin"/></SelectTrigger></FormControl><SelectContent>{profitMarginRanges.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                </div>
                 <FormField control={form.control} name="askingPrice" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><DollarSign className="h-4 w-4 mr-1 text-muted-foreground"/>Asking Price (USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value === undefined ? '' : field.value} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 750000" disabled={isPending} /></FormControl><FormDescription>Enter the specific asking price for your business.</FormDescription><FormMessage /></FormItem>)}/>
                 <FormField control={form.control} name="adjustedCashFlow" render={({ field }) => (<FormItem><FormLabel>Adjusted Cash Flow / SDE (TTM, USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value === undefined ? '' : field.value} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 220000" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="adjustedCashFlowExplanation" render={({ field }) => (<FormItem><FormLabel>Brief Explanation of Adjusted Cash Flow (Optional)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Explain any adjustments made (e.g., owner's salary, non-recurring expenses)." disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                <Separator/>
                <h3 className="text-md font-medium text-muted-foreground">Specific Financials (For Verified View)</h3>
                 <FormField control={form.control} name="specificAnnualRevenueLastYear" render={({ field }) => (<FormItem><FormLabel>Actual Annual Revenue (TTM, in USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value === undefined ? '' : field.value} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 750000" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="specificNetProfitLastYear" render={({ field }) => (<FormItem><FormLabel>Actual Net Profit (TTM, in USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value === undefined ? '' : field.value} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 180000" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                <div className="space-y-2"><Label className="text-md font-medium text-muted-foreground">Supporting Financial Documents (For Verified Buyers Only)</Label><FormItem><Label htmlFor="financialStatements">Upload Financial Statements (e.g., P&amp;L, Balance Sheet)</Label><Input id="financialStatements" type="file" disabled={isPending} /><FormDescription>PDF, XLSX accepted.</FormDescription></FormItem><FormItem><Label htmlFor="keyMetricsReport">Upload Key Metrics Report (e.g., SaaS Metrics, Analytics Summary)</Label><Input id="keyMetricsReport" type="file" disabled={isPending} /><FormDescription>PDF, XLSX accepted.</FormDescription></FormItem></div>
            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue">Section 4: Deal &amp; Seller Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="dealStructureLookingFor"
                    render={() => (<FormItem><FormLabel>Looking for (Deal Structure):</FormLabel><FormDescription>Select all that apply.</FormDescription><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">{dealStructures.map((item) => (<FormField key={item} control={form.control} name="dealStructureLookingFor" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter(v => v !== item))} disabled={isPending}/></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}/>))}</div><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="reasonForSellingAnonymous" render={({ field }) => (<FormItem><FormLabel>Reason for Selling (Public Summary, Optional)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Briefly state your reason for selling (e.g., Retirement, Other ventures)." disabled={isPending} /></FormControl><FormDescription>Max 500 characters. This may be shown publicly.</FormDescription><FormMessage /></FormItem>)}/>
              <Separator />
              <h3 className="text-md font-medium text-muted-foreground">Additional Seller Information (For Verified View)</h3>
               <FormField control={form.control} name="detailedReasonForSelling" render={({ field }) => (<FormItem><FormLabel>Detailed Reason for Selling</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Provide more context for verified buyers." disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="sellerRoleAndTimeCommitment" render={({ field }) => (<FormItem><FormLabel>Seller&apos;s Current Role &amp; Time Commitment</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Describe your current day-to-day role and weekly time commitment to the business." disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="postSaleTransitionSupport" render={({ field }) => (<FormItem><FormLabel>Post-Sale Transition Support Offered</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="What level of training or transition support are you willing to provide the buyer?" disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <div className="space-y-2"><Label className="text-md font-medium text-muted-foreground">Ownership &amp; Legal Documents (For Admin Verification &amp; Verified Buyers Only)</Label><FormItem><Label htmlFor="ownershipDocs">Upload Proof of Ownership / Incorporation Documents</Label><Input id="ownershipDocs" type="file" disabled={isPending} /><FormDescription>PDF accepted.</FormDescription></FormItem></div>
            </CardContent>
          </Card>

          <Card className="shadow-md bg-brand-white">
            <CardHeader><CardTitle className="text-brand-dark-blue">Section 5: Growth &amp; Future Potential</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="specificGrowthOpportunities" render={({ field }) => (<FormItem><FormLabel>Specific Growth Opportunities (Use bullet points)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={5} placeholder="- Expand to new markets (e.g., Region X)\n- Launch new product line (e.g., Product Y)\n- Optimize marketing spend by Z%" disabled={isPending} /></FormControl><FormDescription>List 3-5 specific, actionable growth opportunities.</FormMessage><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => { form.reset(); setKeyStrengthsFields(['']); }} disabled={isPending}>
                Reset Form
            </Button>
            <Button type="submit" className="min-w-[150px] bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90" disabled={isPending}>
                {isPending ? "Submitting..." : "Create Listing"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
