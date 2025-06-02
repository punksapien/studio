'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation"; 

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { AuthCardWrapper } from "@/components/auth/auth-card-wrapper";
import { CommonRegistrationFields } from "@/components/auth/common-registration-fields";
import { BuyerPersonaTypes, PreferredInvestmentSizes, asianCountries } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, type RegisterData } from "@/lib/auth";


const BuyerRegisterSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  phoneNumber: z.string().min(1, { message: "Phone number is required." }),
  country: z.string().min(1, { message: "Country is required." }),
  buyerPersonaType: z.enum(BuyerPersonaTypes, { required_error: "Buyer persona type is required."}),
  buyerPersonaOther: z.string().optional(),
  investmentFocusDescription: z.string().optional(),
  preferredInvestmentSize: z.enum(PreferredInvestmentSizes, {errorMap: () => ({ message: "Please select a preferred investment size." }) }).optional(),
  keyIndustriesOfInterest: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
}).refine(data => data.buyerPersonaType !== "Other" || (data.buyerPersonaType === "Other" && data.buyerPersonaOther && data.buyerPersonaOther.trim() !== ""), {
  message: "Please specify your role if 'Other' is selected.",
  path: ["buyerPersonaOther"],
});

export default function BuyerRegisterPage() {
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter(); 
  const { toast } = useToast();

  const form = useForm<z.infer<typeof BuyerRegisterSchema>>({
    resolver: zodResolver(BuyerRegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      country: "",
      buyerPersonaType: undefined,
      buyerPersonaOther: "",
      investmentFocusDescription: "",
      preferredInvestmentSize: undefined,
      keyIndustriesOfInterest: "",
    },
  });

  const watchedBuyerPersonaType = form.watch("buyerPersonaType");

  const onSubmit = (values: z.infer<typeof BuyerRegisterSchema>) => {
    setError("");

    startTransition(async () => {
      console.log("Buyer Register values:", values);

      try {
        const emailStatus = await auth.checkEmailStatus(values.email);

        if (emailStatus.exists && !emailStatus.verified && emailStatus.canResend) {
          setError(
            `An account with this email already exists but isn't verified. ` +
            `Check your email for the verification link. If you need a new verification email, ` +
            `click the "Resend Verification" button below.`
          );
          toast({
            title: "Account Already Exists",
            description: "This email is already registered but unverified. Would you like to resend the verification email?",
            action: (
              <button
                onClick={async () => {
                  try {
                    await auth.resendVerificationForEmail(values.email);
                    toast({
                      title: "Verification Email Sent",
                      description: "Please check your email for the verification link."
                    });
                    router.push(`/verify-email?email=${encodeURIComponent(values.email)}&type=register`);
                  } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification';
                    toast({
                      variant: "destructive",
                      title: "Resend Failed",
                      description: errorMessage
                    });
                  }
                }}
                className="bg-white text-black px-3 py-1 rounded text-sm hover:bg-gray-100"
              >
                Resend Verification
              </button>
            )
          });
          return;
        }

        if (emailStatus.exists && emailStatus.verified) {
          setError("An account with this email already exists and is verified. Please try logging in instead.");
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        const registerData: RegisterData = {
          email: values.email,
          password: values.password,
          full_name: values.fullName,
          phone_number: values.phoneNumber,
          country: values.country,
          role: 'buyer',
          buyer_persona_type: values.buyerPersonaType,
          buyer_persona_other: values.buyerPersonaOther || undefined,
          investment_focus_description: values.investmentFocusDescription || undefined,
          preferred_investment_size: values.preferredInvestmentSize || undefined,
          key_industries_of_interest: values.keyIndustriesOfInterest || undefined,
        };

        const result = await auth.signUp(registerData);

        if (result.user) {
           toast({
            title: "Registration Successful!",
            description: "Please complete your onboarding to access all features."
          });
          router.push('/onboarding/buyer/1'); // Redirect to buyer onboarding
        } else {
          // Fallback to email verification if user somehow not created but no error
          // This case should ideally be handled by auth.signUp throwing an error
          toast({
            title: "Registration Incomplete",
            description: "Please check your email for a verification link."
          });
          router.push(`/verify-email?email=${encodeURIComponent(values.email)}&type=register`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: errorMessage
        });
      }
    });
  };

  return (
    <AuthCardWrapper
      headerLabel="Create your Buyer account to discover opportunities."
      backButtonLabel="Already have an account? Login here."
      backButtonHref="/auth/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CommonRegistrationFields control={form.control} isPending={isPending} />

          <FormField
            control={form.control}
            name="buyerPersonaType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>I am a/an: (Primary Role / Buyer Type)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your primary role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BuyerPersonaTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchedBuyerPersonaType === "Other" && (
            <FormField
              control={form.control}
              name="buyerPersonaOther"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Please Specify Role</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your specific role" disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="investmentFocusDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Investment Focus or What You&apos;re Looking For</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="e.g., SaaS businesses in Southeast Asia with $100k-$1M ARR, turnarounds in manufacturing, e-commerce brands for scaling."
                    disabled={isPending}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>Briefly describe your primary investment criteria or the types of businesses you are seeking.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredInvestmentSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Investment Size (Approximate)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred investment size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PreferredInvestmentSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="keyIndustriesOfInterest"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key Industries of Interest</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="e.g., Technology, E-commerce, Healthcare, Manufacturing, B2B Services. Please list a few."
                    disabled={isPending}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
             {isPending ? "Processing..." : "Register as Buyer"}
          </Button>
        </form>
      </Form>
    </AuthCardWrapper>
  );
}
