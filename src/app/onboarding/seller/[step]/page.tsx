'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
// Removed asianCountries as it's not used in the streamlined Step 1
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { updateUserProfile, updateOnboardingStatus, uploadOnboardingDocument } from '@/hooks/use-current-user';

// --- Schemas ---
// Step 1: Welcome & Business Overview (Seller) - Streamlined
const Step1SellerSchema = z.object({
  businessWebsiteUrl: z.string().url("Please enter a valid URL or leave blank.").optional().or(z.literal('')),
  yearEstablished: z.coerce.number().optional().refine(val => val === undefined || (val >= 1900 && val <= new Date().getFullYear()), "Invalid year."),
  briefBusinessSummary: z.string().min(20, "Summary must be at least 20 characters.").max(300, "Summary too long (max 300 characters)."),
});

const Step2SellerSchema = z.object({
  sellerIdentityFile: z.any().refine(file => file instanceof File || file === undefined, "File upload is required.").optional(),
  sellerIdentityFile: z.any().refine(file => file instanceof File || file === undefined, "File upload is required.").optional(),
});

const Step3SellerSchema = z.object({
  businessRegistrationFile: z.any().optional(),
  proofOfOwnershipFile: z.any().optional(),
});

const Step4SellerSchema = z.object({
  profitAndLossFile: z.any().optional(),
  balanceSheetFile: z.any().optional(),
});

const Step5SellerSchema = z.object({
  confirmAccuracy: z.boolean().refine(val => val === true, { message: "You must confirm the accuracy of the information." }),
});

type FormValues = Partial<z.infer<typeof Step1SellerSchema>> &
                  Partial<z.infer<typeof Step2SellerSchema>> &
                  Partial<z.infer<typeof Step3SellerSchema>> &
                  Partial<z.infer<typeof Step4SellerSchema>> &
                  Partial<z.infer<typeof Step5SellerSchema>>;

const stepSchemas = [Step1SellerSchema, Step2SellerSchema, Step3SellerSchema, Step4SellerSchema, Step5SellerSchema];

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  currentFile?: File | null;
  onFileChange: (file: File | null) => void;
}

const StyledFileInput: React.FC<FileInputProps> = ({ label, helperText, currentFile, onFileChange, accept, ...props }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(currentFile?.name || null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFileName(file?.name || null);
    onFileChange(file);
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="flex items-center space-x-2">
        <Button type="button" variant="outline" onClick={handleButtonClick}>
          <FileText className="mr-2 h-4 w-4" /> Choose File
        </Button>
        <Input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleChange}
          accept={accept}
          {...props}
        />
        {fileName && <span className="text-sm text-muted-foreground truncate max-w-[200px]">{fileName}</span>}
      </div>
      {helperText && <FormDescription>{helperText}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};


export default function SellerOnboardingStepPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const currentStep = parseInt(params.step as string, 10);
  const totalSteps = 5;

  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<FormValues>(() => {
    if (typeof window !== 'undefined') {
      const savedData = sessionStorage.getItem('sellerOnboardingData');
      return savedData ? JSON.parse(savedData) : {};
    }
    return {};
  });

  // Ensure all form values are properly initialized to prevent controlled/uncontrolled issues
  const getDefaultValues = (data: FormValues): FormValues => {
    return {
      registeredBusinessName: data.registeredBusinessName || "",
      businessWebsiteUrl: data.businessWebsiteUrl || "",
      yearEstablished: data.yearEstablished || "",
      countryOfOperation: data.countryOfOperation || "",
      briefBusinessSummary: data.briefBusinessSummary || "",
      sellerIdentityFile: data.sellerIdentityFile || undefined,
      businessRegistrationFile: data.businessRegistrationFile || undefined,
      proofOfOwnershipFile: data.proofOfOwnershipFile || undefined,
      profitAndLossFile: data.profitAndLossFile || undefined,
      balanceSheetFile: data.balanceSheetFile || undefined,
      submitted_documents: data.submitted_documents || {},
    };
  };

  const currentSchema = stepSchemas[currentStep - 1] || z.object({});
  const methods = useForm<FormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: getDefaultValues(formData),
  });

  React.useEffect(() => {
    methods.reset(getDefaultValues(formData));
  }, [currentStep, formData, methods]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    try {
      if (currentStep === 1) {
        // Step 1: Update basic business profile information
        await updateUserProfile({
          initial_company_name: updatedData.registeredBusinessName!,
          country: updatedData.countryOfOperation!,
        });

        // Update onboarding step
        await updateOnboardingStatus({
          step_completed: currentStep,
          submitted_documents: {
            business_overview: {
              registered_business_name: updatedData.registeredBusinessName,
              business_website_url: updatedData.businessWebsiteUrl,
              year_established: updatedData.yearEstablished,
              country_of_operation: updatedData.countryOfOperation,
              brief_business_summary: updatedData.briefBusinessSummary,
            }
          }
        });

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sellerOnboardingData', JSON.stringify(updatedData));
        }

        toast({
          title: "Business Information Saved",
          description: "Your business overview has been saved."
        });

        router.push(`/onboarding/seller/${currentStep + 1}`);

      } else if (currentStep === 2) {
        // Step 2: Upload seller identity document
        let documentUploaded = false;

        if (updatedData.sellerIdentityFile instanceof File) {
          await uploadOnboardingDocument(updatedData.sellerIdentityFile, 'identity');
          documentUploaded = true;
        }

        await updateOnboardingStatus({
          step_completed: currentStep,
          submitted_documents: {
            ...updatedData.submitted_documents,
            identity: documentUploaded
          }
        });

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sellerOnboardingData', JSON.stringify(updatedData));
        }

        toast({
          title: "Identity Document Uploaded",
          description: "Your identity verification document has been uploaded."
        });

        router.push(`/onboarding/seller/${currentStep + 1}`);

      } else if (currentStep === 3) {
        // Step 3: Upload business documents
        let businessRegUploaded = false;
        let ownershipUploaded = false;

        if (updatedData.businessRegistrationFile instanceof File) {
          await uploadOnboardingDocument(updatedData.businessRegistrationFile, 'business_registration');
          businessRegUploaded = true;
        }

        if (updatedData.proofOfOwnershipFile instanceof File) {
          await uploadOnboardingDocument(updatedData.proofOfOwnershipFile, 'ownership_proof');
          ownershipUploaded = true;
        }

        await updateOnboardingStatus({
          step_completed: currentStep,
          submitted_documents: {
            ...updatedData.submitted_documents,
            business_registration: businessRegUploaded,
            ownership_proof: ownershipUploaded
          }
        });

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sellerOnboardingData', JSON.stringify(updatedData));
        }

        toast({
          title: "Business Documents Uploaded",
          description: "Your business registration and ownership documents have been uploaded."
        });

        router.push(`/onboarding/seller/${currentStep + 1}`);

      } else if (currentStep === 4) {
        // Step 4: Upload financial documents
        let profitLossUploaded = false;
        let balanceSheetUploaded = false;

        if (updatedData.profitAndLossFile instanceof File) {
          await uploadOnboardingDocument(updatedData.profitAndLossFile, 'financial_statement');
          profitLossUploaded = true;
        }

        if (updatedData.balanceSheetFile instanceof File) {
          await uploadOnboardingDocument(updatedData.balanceSheetFile, 'financial_statement');
          balanceSheetUploaded = true;
        }

        await updateOnboardingStatus({
          step_completed: currentStep,
          submitted_documents: {
            ...updatedData.submitted_documents,
            profit_loss: profitLossUploaded,
            balance_sheet: balanceSheetUploaded
          }
        });

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sellerOnboardingData', JSON.stringify(updatedData));
        }

    setTimeout(() => { 
      setIsLoading(false);
      if (currentStep < totalSteps) {
        router.push(`/onboarding/seller/${currentStep + 1}`);
      } else {
        console.log("Seller Onboarding Submitted:", updatedData);
        toast({ title: "Verification Submitted", description: "Your information is being reviewed." });
        // sessionStorage.removeItem('sellerOnboardingData'); // Keep for success page if needed
        router.push('/onboarding/seller/success');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      router.push(`/onboarding/seller/${currentStep - 1}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Welcome & Business Overview
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading">Welcome & Business Overview</CardTitle>
              <CardDescription>Let&apos;s get your business ready. Please provide some key details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Removed Registered Business Name and Country of Operation */}
              <FormField control={methods.control} name="businessWebsiteUrl" render={({ field }) => (<FormItem><FormLabel>Business Website URL (Optional)</FormLabel><FormControl><Input {...field} placeholder="https://yourbusiness.com" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="yearEstablished" render={({ field }) => (<FormItem><FormLabel>Year Business Established</FormLabel><FormControl><Input type="number" {...field} placeholder="YYYY" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="briefBusinessSummary" render={({ field }) => (<FormItem><FormLabel>Brief Business Summary/Pitch (1-2 sentences)</FormLabel><FormControl><Textarea {...field} rows={3} placeholder="e.g., We are a leading SaaS provider in the logistics tech space for APAC." /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </>
        );
      case 2: // Seller Identity Verification
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading">Seller Identity Verification</CardTitle>
              <CardDescription>To ensure a secure marketplace, please upload a clear copy of your government-issued photo ID (e.g., Passport, National ID).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <FormField
                control={methods.control}
                name="sellerIdentityFile"
                render={({ field }) => (
                  <StyledFileInput
                    label="Upload Proof of Identity"
                    helperText="Max 5MB. Accepts: .jpg, .png, .pdf"
                    accept=".jpg, .jpeg, .png, .pdf"
                    currentFile={field.value instanceof File ? field.value : null}
                    onFileChange={(file) => field.onChange(file)}
                  />
                )}
              />
            </CardContent>
          </>
        );
      case 3: // Business Documentation
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading">Business Legitimacy & Ownership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={methods.control}
                name="businessRegistrationFile"
                render={({ field }) => (
                  <StyledFileInput
                    label="Proof of Business Registration/Incorporation"
                    helperText="e.g., Certificate of Incorporation, Business License. Accepts: .pdf, .jpg, .png"
                    accept=".pdf, .jpg, .jpeg, .png"
                    currentFile={field.value instanceof File ? field.value : null}
                    onFileChange={(file) => field.onChange(file)}
                  />
                )}
              />
              <FormField
                control={methods.control}
                name="proofOfOwnershipFile"
                render={({ field }) => (
                  <StyledFileInput
                    label="Proof of Ownership (Optional, but recommended)"
                    helperText="e.g., Shareholder Register, Partnership Agreement. Accepts: .pdf, .jpg, .png"
                    accept=".pdf, .jpg, .jpeg, .png"
                    currentFile={field.value instanceof File ? field.value : null}
                    onFileChange={(file) => field.onChange(file)}
                  />
                )}
              />
            </CardContent>
          </>
        );
      case 4: // Financial Overview
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading">Business Financial Snapshot</CardTitle>
              <CardDescription>Provide basic financial documents. Detailed financials can be added to your listing's secure data room later.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={methods.control}
                name="profitAndLossFile"
                render={({ field }) => (
                  <StyledFileInput
                    label="Profit & Loss Statement (Last Financial Year)"
                    helperText="Accepts: .pdf, .xlsx, .csv"
                    accept=".pdf, .xlsx, .csv"
                    currentFile={field.value instanceof File ? field.value : null}
                    onFileChange={(file) => field.onChange(file)}
                  />
                )}
              />
              <FormField
                control={methods.control}
                name="balanceSheetFile"
                render={({ field }) => (
                  <StyledFileInput
                    label="Balance Sheet (Latest)"
                    helperText="Accepts: .pdf, .xlsx, .csv"
                    accept=".pdf, .xlsx, .csv"
                    currentFile={field.value instanceof File ? field.value : null}
                    onFileChange={(file) => field.onChange(file)}
                  />
                )}
              />
            </CardContent>
          </>
        );
      case 5: // Review & Submit
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading">Review Your Information</CardTitle>
              <CardDescription>Please review all the information you've provided.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <h3 className="font-semibold text-brand-dark-blue">Business Overview:</h3>
              <p>Website: {formData.businessWebsiteUrl || 'N/A'}</p>
              <p>Established: {formData.yearEstablished || 'N/A'}</p>
              <p>Summary: {formData.briefBusinessSummary || 'N/A'}</p>

              <h3 className="font-semibold text-brand-dark-blue mt-4">Seller Identity:</h3>
              <p>ID File: {formData.sellerIdentityFile instanceof File ? formData.sellerIdentityFile.name : 'Not Uploaded'}</p>

              <h3 className="font-semibold text-brand-dark-blue mt-4">Business Docs:</h3>
              <p>Registration File: {formData.businessRegistrationFile instanceof File ? formData.businessRegistrationFile.name : 'Not Uploaded'}</p>
              <p>Ownership File: {formData.proofOfOwnershipFile instanceof File ? formData.proofOfOwnershipFile.name : 'Not Uploaded'}</p>

              <h3 className="font-semibold text-brand-dark-blue mt-4">Financial Snapshot:</h3>
              <p>P&L File: {formData.profitAndLossFile instanceof File ? formData.profitAndLossFile.name : 'Not Uploaded'}</p>
              <p>Balance Sheet File: {formData.balanceSheetFile instanceof File ? formData.balanceSheetFile.name : 'Not Uploaded'}</p>

              <FormField control={methods.control} name="confirmAccuracy" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-6">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I confirm that the information provided is accurate to the best of my knowledge.</FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </>
        );
      default:
        return <p>Invalid step.</p>;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Card className="bg-brand-white p-0"> {/* Removed card padding, will be in Header/Content */}
          {renderStepContent()}
          <CardFooter className="flex justify-between pt-8 border-t mt-6 p-6 md:p-10"> {/* Standardized padding */}
            <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isLoading}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentStep < totalSteps ? 'Save & Next Step' : 'Submit for Verification'}
              {currentStep < totalSteps && <ArrowRight className="ml-2 h-4 w-4" />}
              {currentStep === totalSteps && <CheckCircle className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
