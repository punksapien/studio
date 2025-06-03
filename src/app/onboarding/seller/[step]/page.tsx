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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Loader2, Building2 } from 'lucide-react';
import { updateOnboardingStatus, uploadOnboardingDocument, updateUserProfile } from '@/hooks/use-current-user';

// --- Schemas ---
// Step 1: Welcome & Business Overview (Seller) - Enhanced with required fields
const Step1SellerSchema = z.object({
  registeredBusinessName: z.string().min(2, "Business name must be at least 2 characters.").max(100, "Business name too long."),
  businessWebsiteUrl: z.string().url("Please enter a valid URL, e.g., https://example.com").optional().or(z.literal('')),
  yearEstablished: z.coerce.number().optional().refine(val => val === undefined || (val >= 1800 && val <= new Date().getFullYear()), "Invalid year."),
  countryOfOperation: z.string().min(2, "Country is required."),
  briefBusinessSummary: z.string().min(20, "Summary must be at least 20 characters.").max(500, "Summary too long (max 500 characters)."),
});

const Step2SellerSchema = z.object({
  sellerIdentityFile: z.instanceof(File, { message: "Identity document is required." })
    .refine(file => file.size <= 5 * 1024 * 1024, "File size must be 5MB or less.")
    .refine(file => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type), "Invalid file type. JPG, PNG, PDF only."),
});

const Step3SellerSchema = z.object({
  businessRegistrationFile: z.instanceof(File, { message: "Business registration document is required." })
    .refine(file => file.size <= 5 * 1024 * 1024, "File size must be 5MB or less.")
    .refine(file => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type), "Invalid file type. JPG, PNG, PDF only."),
  proofOfOwnershipFile: z.instanceof(File, { message: "Proof of ownership document is required." })
    .refine(file => file.size <= 5 * 1024 * 1024, "File size must be 5MB or less.")
    .refine(file => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type), "Invalid file type. JPG, PNG, PDF only.")
    .optional(),
});

const Step4SellerSchema = z.object({
  profitAndLossFile: z.instanceof(File, { message: "Profit & Loss statement is required." })
    .refine(file => file.size <= 5 * 1024 * 1024, "File size must be 5MB or less.")
    .refine(file => ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'].includes(file.type), "Invalid file type. PDF, XLSX, CSV only."),
  balanceSheetFile: z.instanceof(File, { message: "Balance sheet is required." })
    .refine(file => file.size <= 5 * 1024 * 1024, "File size must be 5MB or less.")
    .refine(file => ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'].includes(file.type), "Invalid file type. PDF, XLSX, CSV only."),
});

const Step5SellerSchema = z.object({
  confirmAccuracy: z.boolean().refine(val => val === true, { message: "You must confirm the accuracy of the information." }),
});

type FormValues = Partial<z.infer<typeof Step1SellerSchema>> &
                  Partial<z.infer<typeof Step2SellerSchema>> &
                  Partial<z.infer<typeof Step3SellerSchema>> &
                  Partial<z.infer<typeof Step4SellerSchema>> &
                  Partial<z.infer<typeof Step5SellerSchema>> &
                  { submitted_documents?: Record<string, boolean> };

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

  React.useEffect(() => { // Keep fileName in sync if currentFile prop changes
    setFileName(currentFile?.name || null);
  }, [currentFile]);

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
        <Button type="button" variant="outline" onClick={handleButtonClick} disabled={props.disabled}>
          <FileText className="mr-2 h-4 w-4" /> Choose File
        </Button>
        <input
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

  const getDefaultValues = (data: FormValues): FormValues => ({
    registeredBusinessName: data.registeredBusinessName || "",
    businessWebsiteUrl: data.businessWebsiteUrl || "",
    yearEstablished: data.yearEstablished || undefined,
    countryOfOperation: data.countryOfOperation || "",
    briefBusinessSummary: data.briefBusinessSummary || "",
    sellerIdentityFile: data.sellerIdentityFile || undefined,
    businessRegistrationFile: data.businessRegistrationFile || undefined,
    proofOfOwnershipFile: data.proofOfOwnershipFile || undefined,
    profitAndLossFile: data.profitAndLossFile || undefined,
    balanceSheetFile: data.balanceSheetFile || undefined,
    confirmAccuracy: data.confirmAccuracy || false,
    submitted_documents: data.submitted_documents || {},
  });

  const currentSchema = stepSchemas[currentStep - 1] || z.object({});
  const methods = useForm<FormValues>({
    resolver: zodResolver(currentSchema as any),
    defaultValues: getDefaultValues(formData),
  });

  React.useEffect(() => {
    const loadedData = typeof window !== 'undefined' ? sessionStorage.getItem('sellerOnboardingData') : null;
    const parsedData = loadedData ? JSON.parse(loadedData) : {};
    methods.reset(getDefaultValues(parsedData)); // Reset form with potentially loaded data
    setFormData(parsedData); // Also update local state
  }, [currentStep, methods]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    const updatedData = { ...formData, ...data };
    setFormData(updatedData); // Persist current step data to local state

    let documentsToSubmitThisStep: Record<string, boolean> = updatedData.submitted_documents || {};

    try {
      if (currentStep === 1) {
        await updateUserProfile({
          initial_company_name: updatedData.registeredBusinessName!,
          country: updatedData.countryOfOperation!,
        });
        documentsToSubmitThisStep = {
          ...documentsToSubmitThisStep,
          business_overview: true
        };
      } else if (currentStep === 2 && updatedData.sellerIdentityFile instanceof File) {
        await uploadOnboardingDocument(updatedData.sellerIdentityFile, 'seller_identity');
        documentsToSubmitThisStep.seller_identity = true;
      } else if (currentStep === 3) {
        if (updatedData.businessRegistrationFile instanceof File) {
          await uploadOnboardingDocument(updatedData.businessRegistrationFile, 'business_registration');
          documentsToSubmitThisStep.business_registration = true;
        }
        if (updatedData.proofOfOwnershipFile instanceof File) {
          await uploadOnboardingDocument(updatedData.proofOfOwnershipFile, 'ownership_proof');
          documentsToSubmitThisStep.ownership_proof = true;
        }
      } else if (currentStep === 4) {
        if (updatedData.profitAndLossFile instanceof File) {
          await uploadOnboardingDocument(updatedData.profitAndLossFile, 'profit_loss');
          documentsToSubmitThisStep.profit_loss = true;
        }
        if (updatedData.balanceSheetFile instanceof File) {
          await uploadOnboardingDocument(updatedData.balanceSheetFile, 'balance_sheet');
          documentsToSubmitThisStep.balance_sheet = true;
        }
      }

      await updateOnboardingStatus({
        step_completed: currentStep,
        submitted_documents: documentsToSubmitThisStep,
        complete_onboarding: currentStep === totalSteps
      });

      updatedData.submitted_documents = documentsToSubmitThisStep;
      setFormData(updatedData);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sellerOnboardingData', JSON.stringify(updatedData));
      }

      toast({ title: `Step ${currentStep} Saved`, description: "Progress saved successfully." });

      if (currentStep < totalSteps) {
        router.push(`/onboarding/seller/${currentStep + 1}`);
      } else {
        router.push('/onboarding/seller/success');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during this step.';
      toast({ variant: "destructive", title: `Error in Step ${currentStep}`, description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };


  const handlePrevious = () => {
    if (currentStep > 1) {
      // Save current step data to session storage before navigating back
      if (typeof window !== 'undefined') {
        const currentValues = methods.getValues();
        const combinedData = { ...formData, ...currentValues };
        sessionStorage.setItem('sellerOnboardingData', JSON.stringify(combinedData));
      }
      router.push(`/onboarding/seller/${currentStep - 1}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2"><Building2 className="h-7 w-7 text-primary" /> Business Overview</CardTitle>
              <CardDescription>Tell us about your business. This information helps us understand your venture better.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={methods.control} name="registeredBusinessName" render={({ field }) => (<FormItem><FormLabel>Registered Business Name</FormLabel><FormControl><Input {...field} placeholder="Your Company Pte Ltd" disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="businessWebsiteUrl" render={({ field }) => (<FormItem><FormLabel>Business Website URL (Optional)</FormLabel><FormControl><Input {...field} placeholder="https://yourbusiness.com" disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="yearEstablished" render={({ field }) => (<FormItem><FormLabel>Year Business Established</FormLabel><FormControl><Input type="number" {...field} placeholder="YYYY" disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="countryOfOperation" render={({ field }) => (<FormItem><FormLabel>Primary Country of Operation</FormLabel><FormControl><Input {...field} placeholder="e.g., Singapore" disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="briefBusinessSummary" render={({ field }) => (<FormItem><FormLabel>Brief Business Summary/Pitch</FormLabel><FormControl><Textarea {...field} rows={4} placeholder="e.g., We are a leading SaaS provider in the logistics tech space for APAC, serving over 500 clients." disabled={isLoading} /></FormControl><FormDescription>Max 500 characters.</FormDescription><FormMessage /></FormItem>)} />
            </CardContent>
          </>
        );
      case 2:
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading">Seller Identity Verification</CardTitle>
              <CardDescription>Upload a clear copy of your government-issued photo ID (e.g., Passport, National ID). Max 5MB. JPG, PNG, PDF.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <FormField
                control={methods.control}
                name="sellerIdentityFile"
                render={({ field }) => (
                  <StyledFileInput
                    label="Proof of Identity"
                    helperText="E.g., Passport, National ID Card, Driver's License."
                    accept=".jpg, .jpeg, .png, .pdf"
                    currentFile={field.value instanceof File ? field.value : null}
                    onFileChange={(file) => field.onChange(file)}
                    disabled={isLoading}
                  />
                )}
              />
            </CardContent>
          </>
        );
      case 3:
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading">Business Legitimacy & Ownership</CardTitle>
              <CardDescription>Upload documents to verify your business registration and ownership. Max 5MB each. JPG, PNG, PDF.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={methods.control}
                name="businessRegistrationFile"
                render={({ field }) => (
                  <StyledFileInput
                    label="Proof of Business Registration/Incorporation"
                    helperText="E.g., Certificate of Incorporation, Business License."
                    accept=".pdf, .jpg, .jpeg, .png"
                    currentFile={field.value instanceof File ? field.value : null}
                    onFileChange={(file) => field.onChange(file)}
                    disabled={isLoading}
                  />
                )}
              />
              <FormField
                control={methods.control}
                name="proofOfOwnershipFile"
                render={({ field }) => (
                  <StyledFileInput
                    label="Proof of Ownership (Optional, but recommended)"
                    helperText="E.g., Shareholder Register, Partnership Agreement."
                    accept=".pdf, .jpg, .jpeg, .png"
                    currentFile={field.value instanceof File ? field.value : null}
                    onFileChange={(file) => field.onChange(file)}
                    disabled={isLoading}
                  />
                )}
              />
            </CardContent>
          </>
        );
      case 4:
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading">Business Financial Snapshot</CardTitle>
              <CardDescription>Provide basic financial documents. Detailed financials can be added to your listing's secure data room later. Max 5MB each. PDF, XLSX, CSV.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={methods.control}
                name="profitAndLossFile"
                render={({ field }) => (
                  <StyledFileInput
                    label="Profit & Loss Statement (Last Financial Year)"
                    helperText="Summarizes revenues, costs, and expenses during a specified period."
                    accept=".pdf, .xlsx, .csv"
                    currentFile={field.value instanceof File ? field.value : null}
                    onFileChange={(file) => field.onChange(file)}
                    disabled={isLoading}
                  />
                )}
              />
              <FormField
                control={methods.control}
                name="balanceSheetFile"
                render={({ field }) => (
                  <StyledFileInput
                    label="Balance Sheet (Latest)"
                    helperText="Reports a company's assets, liabilities, and shareholder equity at a specific point in time."
                    accept=".pdf, .xlsx, .csv"
                    currentFile={field.value instanceof File ? field.value : null}
                    onFileChange={(file) => field.onChange(file)}
                    disabled={isLoading}
                  />
                )}
              />
            </CardContent>
          </>
        );
      case 5:
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading">Review & Submit Your Information</CardTitle>
              <CardDescription>Please review all the information and documents you've provided for accuracy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <h3 className="font-semibold text-brand-dark-blue">Business Overview:</h3>
              <p>Website: {formData.businessWebsiteUrl || 'N/A'}</p>
              <p>Established: {formData.yearEstablished || 'N/A'}</p>
              <p>Summary: {formData.briefBusinessSummary || 'N/A'}</p>

              <h3 className="font-semibold text-brand-dark-blue mt-4">Uploaded Documents:</h3>
              <ul className="list-disc list-inside pl-5">
                <li>Seller Identity: {formData.submitted_documents?.seller_identity ? 'Uploaded' : (formData.sellerIdentityFile instanceof File ? formData.sellerIdentityFile.name : 'Not Uploaded')}</li>
                <li>Business Registration: {formData.submitted_documents?.business_registration ? 'Uploaded' : (formData.businessRegistrationFile instanceof File ? formData.businessRegistrationFile.name : 'Not Uploaded')}</li>
                <li>Proof of Ownership: {formData.submitted_documents?.ownership_proof ? 'Uploaded' : (formData.proofOfOwnershipFile instanceof File ? formData.proofOfOwnershipFile.name : 'Not Uploaded (Optional)')}</li>
                <li>Profit & Loss: {formData.submitted_documents?.profit_loss ? 'Uploaded' : (formData.profitAndLossFile instanceof File ? formData.profitAndLossFile.name : 'Not Uploaded')}</li>
                <li>Balance Sheet: {formData.submitted_documents?.balance_sheet ? 'Uploaded' : (formData.balanceSheetFile instanceof File ? formData.balanceSheetFile.name : 'Not Uploaded')}</li>
              </ul>

              <FormField control={methods.control} name="confirmAccuracy" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-6">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I confirm that the information and documents provided are accurate to the best of my knowledge.</FormLabel>
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
        <Card className="bg-brand-white p-0">
          {renderStepContent()}
          <CardFooter className="flex justify-between pt-8 border-t mt-6 p-6 md:p-10">
            <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isLoading}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentStep < totalSteps ? 'Save & Next Step' : 'Submit for Verification'}
              {currentStep < totalSteps ? <ArrowRight className="ml-2 h-4 w-4" /> : <CheckCircle className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
