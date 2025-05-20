
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useTransition } from "react";

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
import { BuyerPersonaTypes, PreferredInvestmentSizes, asianCountries } from "@/lib/types"; // Added asianCountries
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

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
  preferredInvestmentSize: z.enum(PreferredInvestmentSizes).optional(),
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
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

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
    setSuccess("");
    
    startTransition(async () => {
      console.log("Buyer Register values:", values);
      await new Promise(resolve => setTimeout(resolve, 1000));
       if (values.email === "existing@example.com") {
         setError("Email already in use.");
      } else {
        setSuccess("Registration successful! Please check your email to verify your account.");
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
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
                <FormLabel>Investment Focus or What You're Looking For</FormLabel>
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
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
          {success && (
             <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700">
               <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-700 dark:text-green-300">Success</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
             {isPending ? "Creating Account..." : "Create Buyer Account"}
          </Button>
        </form>
      </Form>
    </AuthCardWrapper>
  );
}

    