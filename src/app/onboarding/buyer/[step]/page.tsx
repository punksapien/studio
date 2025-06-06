'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { updateOnboardingStatus, uploadOnboardingDocument } from '@/hooks/use-current-user';

// --- Schemas ---
const Step1BuyerSchema = z.object({}); // Step 1 is informational, no form fields needed

const Step2BuyerSchema = z.object({
  buyerIdentityFile: z.instanceof(File, { message: "Identity document is required." })
    .refine(file => file.size <= 5 * 1024 * 1024, "File size must be 5MB or less.")
    .refine(file => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type), "Invalid file type. JPG, PNG, PDF only."),
});

type BuyerFormValues = Partial<z.infer<typeof Step1BuyerSchema>> &
                       Partial<z.infer<typeof Step2BuyerSchema>>;

const buyerStepSchemas = [Step1BuyerSchema, Step2BuyerSchema];

// Styled File Input (re-declared here for completeness, ideally in its own component file)
interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  currentFile?: File | null;
  onFileChange: (file: File | null) => void;
}

const StyledFileInput: React.FC<FileInputProps> = ({ label, helperText, currentFile, onFileChange, accept, ...props }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(currentFile?.name || null);

  React.useEffect(() => {
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


export default function BuyerOnboardingStepPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const currentStep = parseInt(params.step as string, 10);
  const totalSteps = 2; // Only 2 steps for buyer now

  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<BuyerFormValues>(() => {
    if (typeof window !== 'undefined') {
      const savedData = sessionStorage.getItem('buyerOnboardingData');
      return savedData ? JSON.parse(savedData) : {};
    }
    return {};
  });

  const getDefaultValues = (data: BuyerFormValues): BuyerFormValues => ({
    buyerIdentityFile: data.buyerIdentityFile || null,
  });

  const currentSchema = buyerStepSchemas[currentStep - 1] || z.object({});
  const methods = useForm<BuyerFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: formData,
  });

  React.useEffect(() => {
    const loadedData = typeof window !== 'undefined' ? sessionStorage.getItem('buyerOnboardingData') : null;
    const parsedData = loadedData ? JSON.parse(loadedData) : {};
    methods.reset(getDefaultValues(parsedData));
    setFormData(parsedData);
  }, [currentStep, methods]);

  const onSubmit = async (data: BuyerFormValues) => {
    setIsLoading(true);
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    try {
      if (currentStep === 1) { // Informational step
        await updateOnboardingStatus({ step_completed: currentStep });
      } else if (currentStep === 2) { // Document upload
        if (updatedData.buyerIdentityFile instanceof File) {
          await uploadOnboardingDocument(updatedData.buyerIdentityFile, 'buyer_identity');
          await updateOnboardingStatus({
            step_completed: currentStep,
            submitted_documents: { buyer_identity_uploaded: true },
            complete_onboarding: true // Mark onboarding complete after final step
          });
        } else {
          toast({ variant: "destructive", title: "Missing Document", description: "Please upload your identity document." });
          setIsLoading(false);
          return;
        }
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('buyerOnboardingData', JSON.stringify(updatedData));
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
      router.push(`/onboarding/buyer/${currentStep - 1}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2"><ShieldCheck className="h-7 w-7 text-primary" /> Buyer Verification Process</CardTitle>
              <CardDescription>Welcome to Nobridge! To access detailed business information and engage securely, please complete our simple verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">Verifying your identity helps us maintain a trusted marketplace by:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-5">
                <li>Ensuring genuine interactions between buyers and sellers.</li>
                <li>Allowing you to view sensitive data on verified listings.</li>
                <li>Enabling direct communication with sellers (post admin facilitation).</li>
              </ul>
              <p className="text-muted-foreground">The next step involves uploading a clear copy of your government-issued photo ID (e.g., Passport, National ID). This information is handled securely and is solely for verification purposes.</p>
            </CardContent>
          </>
        );
      case 2:
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading">Upload Identity Document</CardTitle>
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
              {currentStep < totalSteps ? 'Next Step' : 'Submit Verification'}
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
