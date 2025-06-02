
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation"; 
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
import { useToast } from "@/hooks/use-toast";
import { auth, type RegisterData } from "@/lib/auth";

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
  const [isPending, startTransition] = useTransition();
  const router = useRouter(); 
  const { toast } = useToast();

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

    startTransition(async () => {
      console.log("Seller Register values:", values);

      try {
        const registerData: RegisterData = {
          email: values.email,
          password: values.password,
          full_name: values.fullName,
          phone_number: values.phoneNumber,
          country: values.country,
          role: 'seller',
          initial_company_name: values.initialCompanyName || undefined,
        };

        const result = await auth.signUp(registerData);
        
        if (result.user) {
          toast({
            title: "Registration Successful!",
            description: "Please check your email to verify your account and then complete onboarding."
          });
          router.push(`/verify-email?email=${encodeURIComponent(values.email)}&type=register`);
        } else {
           toast({
            title: "Registration Incomplete",
            description: "Something went wrong, but please check your email for a verification link."
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

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Processing..." : "Register as Seller"}
          </Button>
        </form>
      </Form>
    </AuthCardWrapper>
  );
}
