'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AuthCardWrapper } from "@/components/auth/auth-card-wrapper";
import { CommonRegistrationFields } from "@/components/auth/common-registration-fields";
import { useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const SellerRegisterSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  phoneNumber: z.string().min(1, { message: "Phone number is required." }),
  country: z.string().min(1, { message: "Country is required." }),
  initialCompanyName: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export default function SellerRegisterPage() {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof SellerRegisterSchema>>({
    resolver: zodResolver(SellerRegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      country: "",
      initialCompanyName: "",
    },
  });

  const onSubmit = (values: z.infer<typeof SellerRegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      // Placeholder for actual registration server action
      console.log("Seller Register values:", values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simulate success/error
      if (values.email === "existing@example.com") {
         setError("Email already in use.");
      } else {
        setSuccess("Registration successful! Please check your email to verify your account.");
        // In a real app, redirect or show message.
      }
    });
  };
  
  return (
    <AuthCardWrapper
      headerLabel="Create your Seller account to list your business."
      backButtonLabel="Already have an account? Login here."
      backButtonHref="/auth/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CommonRegistrationFields control={form.control} isPending={isPending} />
          <FormField
            control={form.control}
            name="initialCompanyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Company Name (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="My Awesome Business" disabled={isPending} />
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
            {isPending ? "Creating Account..." : "Create Seller Account"}
          </Button>
        </form>
      </Form>
    </AuthCardWrapper>
  );
}
