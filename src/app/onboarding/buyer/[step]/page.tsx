
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
import { asianCountries, BuyerPersonaTypes, PreferredInvestmentSizes } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Loader2 } from 'lucide-react';

// --- Schemas ---
const Step1BuyerSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  country: z.string().min(1, "Country is required."),
  phoneNumber: z.string().min(1, "Phone number is required."),
  buyerPersonaType: z.enum(BuyerPersonaTypes, { required_error: "Buyer persona type is required."}),
  buyerPersonaOther: z.string().optional(),
  investmentFocusDescription: z.string().min(10, "Please describe your investment focus (min 10 characters)."),
  preferredInvestmentSize: z.enum(PreferredInvestmentSizes).optional(),
  keyIndustriesOfInterest: z.string().optional(),
}).refine(data => data.buyerPersonaType !== "Other" || (data.buyerPersonaType === "Other" && data.buyerPersonaOther && data.buyerPersonaOther.trim() !== ""), {
  message: "Please specify your role if 'Other' is selected.",
  path: ["buyerPersonaOther"],
});

const Step2BuyerSchema = z.object({
  buyerIdentityFile: z.any().refine(file => file instanceof File || file === undefined, "File upload is required.").optional(),
});

type BuyerFormValues = Partial<z.infer<typeof Step1BuyerSchema>> &
                       Partial<z.infer<typeof Step2BuyerSchema>>;

const buyerStepSchemas = [Step1BuyerSchema, Step2BuyerSchema];

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


export default function BuyerOnboardingStepPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const currentStep = parseInt(params.step as string, 10);
  const totalSteps = 2;

  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<BuyerFormValues>(() => {
    if (typeof window !== 'undefined') {
      const savedData = sessionStorage.getItem('buyerOnboardingData');
      return savedData ? JSON.parse(savedData) : {};
    }
    return {};
  });

  const currentSchema = buyerStepSchemas[currentStep - 1] || z.object({});
  const methods = useForm<BuyerFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: formData, // Pre-fill with data from session storage or default
  });

  React.useEffect(() => {
    methods.reset(formData);
  }, [currentStep, formData, methods]);

  const watchedBuyerPersonaType = methods.watch("buyerPersonaType");

  const onSubmit = (data: BuyerFormValues) => {
    setIsLoading(true);
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);
     if (typeof window !== 'undefined') {
      sessionStorage.setItem('buyerOnboardingData', JSON.stringify(updatedData));
    }

    setTimeout(() => { // Simulate API call
      setIsLoading(false);
      if (currentStep < totalSteps) {
        router.push(`/onboarding/buyer/${currentStep + 1}`);
      } else {
        console.log("Buyer Onboarding Submitted:", updatedData);
        toast({ title: "Verification Submitted", description: "Your information is being reviewed." });
        sessionStorage.removeItem('buyerOnboardingData');
        router.push('/onboarding/buyer/success');
      }
    }, 700);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      router.push(`/onboarding/buyer/${currentStep - 1}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Welcome & Profile Completion
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading">Welcome & Profile Completion</CardTitle>
              <CardDescription>Welcome, [Buyer Name]! Complete your profile to unlock full access to detailed business information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={methods.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} placeholder="Your Full Name" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country of Residence</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger></FormControl><SelectContent>{asianCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="phoneNumber" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} placeholder="+65 1234 5678" /></FormControl><FormMessage /></FormItem>)} />
              
              <FormField control={methods.control} name="buyerPersonaType" render={({ field }) => (<FormItem><FormLabel>I am a/an: (Primary Role / Buyer Type)</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select your primary role" /></SelectTrigger></FormControl><SelectContent>{BuyerPersonaTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              {watchedBuyerPersonaType === "Other" && (<FormField control={methods.control} name="buyerPersonaOther" render={({ field }) => (<FormItem><FormLabel>Please Specify Role</FormLabel><FormControl><Input {...field} placeholder="Your specific role" /></FormControl><FormMessage /></FormItem>)} />)}
              
              <FormField control={methods.control} name="investmentFocusDescription" render={({ field }) => (<FormItem><FormLabel>Investment Focus or What You&apos;re Looking For</FormLabel><FormControl><Textarea {...field} rows={3} placeholder="e.g., SaaS businesses in Southeast Asia with $100k-$1M ARR." /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="preferredInvestmentSize" render={({ field }) => (<FormItem><FormLabel>Preferred Investment Size (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select preferred investment size" /></SelectTrigger></FormControl><SelectContent>{PreferredInvestmentSizes.map((size) => (<SelectItem key={size} value={size}>{size}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="keyIndustriesOfInterest" render={({ field }) => (<FormItem><FormLabel>Key Industries of Interest (Optional)</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="e.g., Technology, E-commerce, Healthcare" /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </>
        );
      case 2: // Buyer Identity Verification
        return (
          <>
            <CardHeader>
              <CardTitle className="font-heading">Buyer Identity Verification</CardTitle>
              <CardDescription>To maintain a trusted community, please upload a clear copy of your government-issued photo ID.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={methods.control}
                name="buyerIdentityFile"
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
      default:
        return <p>Invalid step.</p>;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Card>
          {renderStepContent()}
          <CardFooter className="flex justify-between pt-8 border-t">
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
