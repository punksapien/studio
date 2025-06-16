'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

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
import { AuthPageGuard } from "@/components/auth/auth-page-guard";
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
      buyerPersonaType: "" as any,
      buyerPersonaOther: "",
      investmentFocusDescription: "",
      preferredInvestmentSize: "" as any,
      keyIndustriesOfInterest: "",
    },
  });

  const watchedBuyerPersonaType = form.watch("buyerPersonaType");

  const onSubmit = (values: z.infer<typeof BuyerRegisterSchema>) => {
    setError("");

    startTransition(async () => {
      console.log("Buyer Register values:", values);

      try {
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

        if (result.error === 'USER_EXISTS_LOGIN_FAILED') {
          setError("This email is already registered. The password you entered was incorrect. Please try logging in or reset your password.");
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: "This account already exists. Please check your password or use the 'Forgot Password' link to reset it."
          });
          return; // Stop execution
        }

        if (result.session) {
          toast({
            title: "Login Successful!",
            description: "You have been successfully logged in."
          });
          router.push('/dashboard?login_success=true');
          return; // Stop execution
        }

        if (result.user) {
           toast({
            title: "Registration Successful!",
            description: "Please check your email to verify your account."
          });
          // Include the verification token in the redirect URL if available
          const verifyEmailUrl = new URL(`/verify-email`, window.location.origin);
          verifyEmailUrl.searchParams.set('email', values.email);
          verifyEmailUrl.searchParams.set('type', 'register');
          verifyEmailUrl.searchParams.set('from', 'register');

          // Add the secure verification token if provided
          if (result.verificationToken) {
            verifyEmailUrl.searchParams.set('token', result.verificationToken);
          }

          router.push(verifyEmailUrl.toString());
        } else {
          setError(result.error || "An unknown error occurred during registration.");
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: result.error || "Something went wrong. Please try again."
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during registration.';
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
    <AuthPageGuard>
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
    </AuthPageGuard>
  );
}
