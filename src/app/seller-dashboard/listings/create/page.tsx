
'use client';

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
import { industries, asianCountries, revenueRanges, profitMarginRanges, askingPriceRanges, dealStructures, employeeCountRanges } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useTransition, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label"; // Added Label import

const ListingSchema = z.object({
  // Section 1: Basic Information (Anonymous)
  listingTitleAnonymous: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title too long."),
  industry: z.string().min(1, "Industry is required."),
  locationCountry: z.string().min(1, "Country is required."),
  locationCityRegionGeneral: z.string().min(2, "City/Region is required.").max(50, "City/Region too long."),
  
  // Section 2: Business Profile & Operations (Enhanced)
  anonymousBusinessDescription: z.string().min(50, "Description must be at least 50 characters.").max(2000, "Description too long (max 2000 chars)."),
  keyStrengthsAnonymous: z.array(z.string().min(1, "Strength cannot be empty.")).min(1, "At least one key strength is required.").max(5, "Maximum of 5 key strengths."),
  businessModel: z.string().optional(),
  yearEstablished: z.coerce.number().optional().refine(val => val === undefined || (val >= 1900 && val <= new Date().getFullYear()), {
    message: "Please enter a valid year.",
  }),
  registeredBusinessName: z.string().optional(), // Collected now, for later verified view
  businessWebsiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional(), // Collected now, for later verified view
  socialMediaLinks: z.string().optional(), // Textarea, one link per line
  numberOfEmployees: z.string().optional(), // Dropdown, EmployeeCountRange type
  technologyStack: z.string().optional(), // Textarea
  
  // Section 3: Financial Performance (Enhanced)
  annualRevenueRange: z.string().min(1, "Annual revenue range is required."),
  netProfitMarginRange: z.string().optional(),
  askingPriceRange: z.string().min(1, "Asking price range is required."),
  specificAnnualRevenueLastYear: z.coerce.number().optional(), // Number input, for later verified view
  specificNetProfitLastYear: z.coerce.number().optional(), // Number input, for later verified view
  financialsExplanation: z.string().optional(), // Textarea
  
  // Section 4: Deal & Seller Information (Enhanced)
  dealStructureLookingFor: z.array(z.string()).optional(),
  reasonForSellingAnonymous: z.string().max(500, "Reason too long (max 500 chars).").optional(),
  detailedReasonForSelling: z.string().optional(), // Textarea, for later verified view
  sellerRoleAndTimeCommitment: z.string().optional(), // Textarea
  postSaleTransitionSupport: z.string().optional(), // Textarea
  
  // Section 5: Growth & Future Potential
  growthPotentialNarrative: z.string().optional(), // Large textarea / rich text editor placeholder
  specificGrowthOpportunities: z.string().optional(), // Textarea, bullet points
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
      askingPriceRange: "",
      specificAnnualRevenueLastYear: undefined,
      specificNetProfitLastYear: undefined,
      financialsExplanation: "",
      dealStructureLookingFor: [],
      reasonForSellingAnonymous: "",
      detailedReasonForSelling: "",
      sellerRoleAndTimeCommitment: "",
      postSaleTransitionSupport: "",
      growthPotentialNarrative: "",
      specificGrowthOpportunities: "",
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
    const cleanedValues = {
      ...values,
      keyStrengthsAnonymous: values.keyStrengthsAnonymous.filter(strength => strength && strength.trim() !== "")
    };

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
      <h1 className="text-3xl font-bold tracking-tight">Create New Business Listing</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Section 1: Basic Information (Anonymous)</CardTitle>
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

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Section 2: Business Profile &amp; Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="anonymousBusinessDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anonymous Business Description</FormLabel>
                    <FormControl><Textarea {...field} rows={6} placeholder="Describe your business, products/services, market position, and growth potential without revealing identifying details." disabled={isPending} /></FormControl>
                    <FormDescription>Max 2000 characters. Be descriptive but maintain anonymity.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keyStrengthsAnonymous"
                render={() => ( 
                  <FormItem>
                    <FormLabel>Key Strengths (Anonymous)</FormLabel>
                    <FormDescription>List 1-5 key strengths of your business.</FormDescription>
                    {keyStrengthsFields.map((strength, index) => (
                       <div key={index} className="flex items-center gap-2">
                          <Input
                            value={strength}
                            onChange={(e) => handleStrengthChange(index, e.target.value)}
                            placeholder={`Strength ${index + 1}`}
                            disabled={isPending}
                            className="flex-grow"
                          />
                          {keyStrengthsFields.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStrength(index)} disabled={isPending}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                    ))}
                    {keyStrengthsFields.length < 5 && (
                       <Button type="button" variant="outline" size="sm" onClick={handleAddStrength} disabled={isPending}>
                          <PlusCircle className="h-4 w-4 mr-2" /> Add Strength
                        </Button>
                    )}
                    <FormMessage>{form.formState.errors.keyStrengthsAnonymous?.message || form.formState.errors.keyStrengthsAnonymous?.[0]?.message}</FormMessage>
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="businessModel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Model</FormLabel>
                  <FormControl><Textarea {...field} placeholder="e.g., SaaS, E-commerce (dropshipping/inventory), Service-based, Lead Generation, Content Site (Adsense/Affiliate), etc." disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="yearEstablished" render={({ field }) => (
                <FormItem>
                  <FormLabel>Year Business Established</FormLabel>
                  <FormControl><Input type="number" {...field} placeholder="YYYY" disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="registeredBusinessName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Official Registered Business Name (for verification)</FormLabel>
                  <FormControl><Input {...field} placeholder="Your Company Pte Ltd" disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="businessWebsiteUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Business Website</FormLabel>
                  <FormControl><Input type="url" {...field} placeholder="https://yourbusiness.com" disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="socialMediaLinks" render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Social Media Profiles (one per line)</FormLabel>
                  <FormControl><Textarea {...field} rows={3} placeholder="https://linkedin.com/company/yourbusiness\nhttps://facebook.com/yourbusiness" disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="numberOfEmployees" render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Employees (Full-time equivalents)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select number of employees" /></SelectTrigger></FormControl>
                    <SelectContent>{employeeCountRanges.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="technologyStack" render={({ field }) => (
                <FormItem>
                  <FormLabel>Technology Stack / Key Operational Assets</FormLabel>
                  <FormControl><Textarea {...field} rows={3} placeholder="Briefly describe the core technology, software, or unique operational assets (e.g., Custom CRM, Proprietary Algorithm, Shopify Plus, AWS Infrastructure, Key Supplier Contracts)." disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Section 3: Financial Performance (Anonymous &amp; Verified)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="annualRevenueRange" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Annual Revenue Range (Anonymous)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select revenue range" /></SelectTrigger></FormControl>
                                <SelectContent>{revenueRanges.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="netProfitMarginRange" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Net Profit Margin Range (Anonymous, Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select profit margin" /></SelectTrigger></FormControl>
                                <SelectContent>{profitMarginRanges.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="askingPriceRange" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Asking Price Range (Anonymous)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select asking price range" /></SelectTrigger></FormControl>
                            <SelectContent>{askingPriceRanges.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>
                <Separator />
                <h3 className="text-md font-medium text-muted-foreground">Specific Financials (For Verified View)</h3>
                 <FormField control={form.control} name="specificAnnualRevenueLastYear" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Annual Revenue (TTM, in USD)</FormLabel>
                      <FormControl><Input type="number" {...field} placeholder="e.g., 750000" disabled={isPending} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="specificNetProfitLastYear" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Net Profit (TTM, in USD)</FormLabel>
                      <FormControl><Input type="number" {...field} placeholder="e.g., 180000" disabled={isPending} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="financialsExplanation" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brief Explanation of Financials</FormLabel>
                      <FormControl><Textarea {...field} rows={3} placeholder="Provide context for your financials (e.g., major growth drivers, one-off expenses, seasonality)." disabled={isPending} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                <div className="space-y-2">
                    <Label className="text-md font-medium text-muted-foreground">Supporting Financial Documents (For Verified Buyers Only)</Label>
                    <FormItem>
                        <Label htmlFor="financialStatements">Upload Financial Statements (e.g., P&amp;L, Balance Sheet)</Label>
                        <Input id="financialStatements" type="file" disabled={isPending} />
                        <FormDescription>PDF, XLSX accepted.</FormDescription>
                    </FormItem>
                    <FormItem>
                        <Label htmlFor="keyMetricsReport">Upload Key Metrics Report (e.g., SaaS Metrics, Analytics Summary)</Label>
                        <Input id="keyMetricsReport" type="file" disabled={isPending} />
                         <FormDescription>PDF, XLSX accepted.</FormDescription>
                    </FormItem>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Section 4: Deal &amp; Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="dealStructureLookingFor"
                    render={() => ( // Use form.watch or Controller if needed for complex array logic
                        <FormItem>
                        <FormLabel>Looking for (Deal Structure - Anonymous):</FormLabel>
                        <FormDescription>Select all that apply.</FormDescription>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                        {dealStructures.map((item) => (
                            <FormField
                            key={item}
                            control={form.control}
                            name="dealStructureLookingFor"
                            render={({ field }) => { 
                                return (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), item])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== item
                                                )
                                            );
                                        }}
                                        disabled={isPending}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal">{item}</FormLabel>
                                </FormItem>
                                );
                            }}
                            />
                        ))}
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField control={form.control} name="reasonForSellingAnonymous" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Selling (Anonymous Summary, Optional)</FormLabel>
                    <FormControl><Textarea {...field} rows={3} placeholder="Briefly state your reason for selling (e.g., Retirement, Other ventures)." disabled={isPending} /></FormControl>
                    <FormDescription>Max 500 characters.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <h3 className="text-md font-medium text-muted-foreground">Additional Seller Information (For Verified View)</h3>
               <FormField control={form.control} name="detailedReasonForSelling" render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Reason for Selling</FormLabel>
                  <FormControl><Textarea {...field} rows={3} placeholder="Provide more context for verified buyers." disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="sellerRoleAndTimeCommitment" render={({ field }) => (
                <FormItem>
                  <FormLabel>Seller&apos;s Current Role &amp; Time Commitment</FormLabel>
                  <FormControl><Textarea {...field} rows={3} placeholder="Describe your current day-to-day role and weekly time commitment to the business." disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="postSaleTransitionSupport" render={({ field }) => (
                <FormItem>
                  <FormLabel>Post-Sale Transition Support Offered</FormLabel>
                  <FormControl><Textarea {...field} rows={3} placeholder="What level of training or transition support are you willing to provide the buyer?" disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="space-y-2">
                  <Label className="text-md font-medium text-muted-foreground">Ownership &amp; Legal Documents (For Admin Verification &amp; Verified Buyers Only)</Label>
                  <FormItem>
                      <Label htmlFor="ownershipDocs">Upload Proof of Ownership / Incorporation Documents</Label>
                      <Input id="ownershipDocs" type="file" disabled={isPending} />
                      <FormDescription>PDF accepted.</FormDescription>
                  </FormItem>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Section 5: Growth &amp; Future Potential</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="growthPotentialNarrative" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narrative on Potential for Growth</FormLabel>
                    <FormControl><Textarea {...field} rows={5} placeholder="Explain the key opportunities and potential for future growth of the business." disabled={isPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="specificGrowthOpportunities" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Growth Opportunities (Use bullet points)</FormLabel>
                    <FormControl><Textarea {...field} rows={5} placeholder="- Expand to new markets (e.g., Region X)\n- Launch new product line (e.g., Product Y)\n- Optimize marketing spend by Z%" disabled={isPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            </CardContent>
          </Card>
          
          <Separator />
          
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isPending}>
                Reset Form
            </Button>
            <Button type="submit" className="min-w-[150px]" disabled={isPending}>
                {isPending ? "Submitting..." : "Create Listing"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

        