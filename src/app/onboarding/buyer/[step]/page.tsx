
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Loader2, ShieldCheck, UserCircle } from 'lucide-react';
import { updateOnboardingStatus, uploadOnboardingDocument } from '@/hooks/use-current-user';
import Image from 'next/image'; // Import Image for preview

// --- Schemas ---
const Step1BuyerSchema = z.object({});

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_ID_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const Step2BuyerSchema = z.object({
  buyerIdentityFile: z.instanceof(File, { message: "Identity document is required." })
    .refine(file => file.size <= MAX_FILE_SIZE, "File size must be 5MB or less.")
    .refine(file => ACCEPTED_ID_TYPES.includes(file.type), "Invalid file type. JPG, PNG, or PDF only."),
});

type BuyerFormValues = Partial<z.infer<typeof Step1BuyerSchema>> &
                       Partial<z.infer<typeof Step2BuyerSchema>> &
                       { submitted_documents?: Record<string, boolean | string> }; // Allow string for path

const buyerStepSchemas = [Step1BuyerSchema, Step2BuyerSchema];

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  currentFile?: File | null;
  onFileChange: (file: File | null) => void;
  previewUrl?: string | null;
}

const StyledFileInput: React.FC<FileInputProps> = ({ label, helperText, currentFile, onFileChange, previewUrl, accept, ...props }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileChange(file);
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button type="button" variant="outline" onClick={handleButtonClick} disabled={props.disabled} className="w-full sm:w-auto">
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
        {previewUrl && (
            <div className="mt-2 sm:mt-0 w-full sm:w-auto max-w-[150px] border p-1 rounded-md bg-muted/30">
                <Image src={previewUrl} alt="ID Preview" width={150} height={100} className="max-h-24 w-auto rounded object-contain" />
            </div>
        )}
         {currentFile && !previewUrl && <span className="text-sm text-muted-foreground truncate max-w-[200px] mt-2 sm:mt-0">{currentFile.name}</span>}
      </div>
       {currentFile && previewUrl && <p className="text-xs text-muted-foreground mt-1">{currentFile.name} ({(currentFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
      {helperText && <FormDescription className="mt-1">{helperText}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};


export default function BuyerOnboardingStepPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const currentStep = parseInt(params.step as string, 10);
  const totalSteps = 2;

  const [isLoading, setIsLoading] = React.useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<BuyerFormValues>(() => {
    if (typeof window !== 'undefined') {
      const savedData = sessionStorage.getItem('buyerOnboardingData');
      return savedData ? JSON.parse(savedData) : {};
    }
    return {};
  });

  const currentSchema = buyerStepSchemas[currentStep - 1] || z.object({});
  const methods = useForm<BuyerFormValues>({
    resolver: zodResolver(currentSchema as any),
    defaultValues: formData,
  });

  React.useEffect(() => {
    const loadedData = typeof window !== 'undefined' ? sessionStorage.getItem('buyerOnboardingData') : null;
    const parsedData = loadedData ? JSON.parse(loadedData) : {};
    const defaultVals: BuyerFormValues = { ...parsedData };
    delete defaultVals.buyerIdentityFile;
    methods.reset(defaultVals);
    setFormData(parsedData);

    // Check if there's a stored document path to show as preview
    if (currentStep === 2 && parsedData.submitted_documents?.buyer_identity && typeof parsedData.submitted_documents.buyer_identity === 'string') {
        // This would ideally be a public URL or a temporary signed URL if it's an existing doc.
        // For now, if it's just a path, we can't directly preview it without more logic.
        // If we stored full URL from upload, we could use it: setFilePreviewUrl(parsedData.submitted_documents.buyer_identity);
    }

  }, [currentStep, methods]);


  const handleFileChangeAndPreview = (file: File | null) => {
    methods.setValue('buyerIdentityFile', file as any);
    if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
    }
    if (file) {
        setFilePreviewUrl(URL.createObjectURL(file));
    } else {
        setFilePreviewUrl(null);
    }
  };

  React.useEffect(() => {
    return () => { if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl); };
  }, [filePreviewUrl]);


  const onSubmit = async (data: BuyerFormValues) => {
    setIsLoading(true);
    const updatedData = { ...formData, ...data };

    try {
      let documentsToSubmitThisStep: Record<string, string | boolean> = updatedData.submitted_documents || {};

      if (currentStep === 1) {
        await updateOnboardingStatus({ step_completed: currentStep });
      } else if (currentStep === 2) {
        const fileToUpload = methods.getValues('buyerIdentityFile') as File | undefined;
        if (fileToUpload instanceof File) {
          const uploadResult = await uploadOnboardingDocument(fileToUpload, 'buyer_identity');
          documentsToSubmitThisStep.buyer_identity = uploadResult.filePath; // Store path or URL
          await updateOnboardingStatus({
            step_completed: currentStep,
            submitted_documents: documentsToSubmitThisStep,
            complete_onboarding: true
          });
        } else if (formData.submitted_documents?.buyer_identity) {
          // File was already uploaded and stored in session/formData
          await updateOnboardingStatus({
            step_completed: currentStep,
            submitted_documents: documentsToSubmitThisStep, // Ensure existing doc path is saved
            complete_onboarding: true
          });
        } else {
          toast({ variant: "destructive", title: "Missing Document", description: "Please upload your identity document." });
          setIsLoading(false);
          return;
        }
      }
      
      updatedData.submitted_documents = documentsToSubmitThisStep;
      setFormData(updatedData);

      if (typeof window !== 'undefined') {
        const dataToStore = { ...updatedData };
        if (dataToStore.buyerIdentityFile instanceof File) {
          // Don't store File object, but indicate a file *was* selected or its path if uploaded
           dataToStore.buyerIdentityFile = documentsToSubmitThisStep.buyer_identity ? String(documentsToSubmitThisStep.buyer_identity) : ({ name: dataToStore.buyerIdentityFile.name, type: dataToStore.buyerIdentityFile.type } as any);
        }
        sessionStorage.setItem('buyerOnboardingData', JSON.stringify(dataToStore));
      }

      toast({ title: `Step ${currentStep} Saved`, description: "Progress saved successfully." });

      if (currentStep < totalSteps) {
        router.push(`/onboarding/buyer/${currentStep + 1}`);
      } else {
        router.push('/onboarding/buyer/success');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
       if (typeof window !== 'undefined') {
        const currentValues = methods.getValues();
        const dataToStore = { ...formData, ...currentValues };
         if (dataToStore.buyerIdentityFile instanceof File) {
            dataToStore.buyerIdentityFile = { name: dataToStore.buyerIdentityFile.name, type: dataToStore.buyerIdentityFile.type } as any;
        }
        sessionStorage.setItem('buyerOnboardingData', JSON.stringify(dataToStore));
      }
      router.push(`/onboarding/buyer/${currentStep - 1}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2"><UserCircle className="h-7 w-7 text-primary" /> Welcome to Buyer Verification!</CardTitle>
              <CardDescription>Verify your identity to access detailed business information, financials, and connect securely with sellers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Why Verify?</h3>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-blue-700 dark:text-blue-300">
                  <li>Gain access to sensitive listing details and documents.</li>
                  <li>Build trust with sellers for smoother transactions.</li>
                  <li>Enable direct communication via Nobridge messaging (after admin facilitation).</li>
                  <li>Ensure a secure and professional marketplace for all users.</li>
                </ul>
              </div>
              <p className="text-muted-foreground">
                The next step involves uploading a clear copy of your government-issued photo ID (e.g., Passport, National ID).
                This information is handled securely and is solely for identity verification purposes.
              </p>
            </CardContent>
          </>
        );
      case 2:
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2"><FileText className="h-7 w-7 text-primary"/>Upload Identity Document</CardTitle>
              <CardDescription>Please upload a clear copy of your government-issued photo ID. Max 5MB. Accepts: JPG, PNG, PDF.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={methods.control}
                name="buyerIdentityFile"
                render={({ field }) => (
                  <StyledFileInput
                    label="Proof of Identity"
                    helperText="E.g., Passport, National ID Card, Driver's License."
                    accept=".jpg,.jpeg,.png,.pdf"
                    currentFile={field.value instanceof File ? field.value : null}
                    previewUrl={filePreviewUrl}
                    onFileChange={handleFileChangeAndPreview}
                    disabled={isLoading}
                  />
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
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentStep < totalSteps ? 'Save & Next Step' : 'Submit Verification'}
              {currentStep < totalSteps ? (
                <ArrowRight className="ml-2 h-4 w-4" />
              ) : (
                <CheckCircle className="ml-2 h-4 w-4" />
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
