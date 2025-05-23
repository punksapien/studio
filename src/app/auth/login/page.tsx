
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter

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
import { useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter(); // Initialize useRouter
  const { toast } = useToast();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");

    startTransition(async () => {
      console.log("Login values:", values);
      // Placeholder for actual primary login server action (e.g., call to /api/auth/login)
      // This action would validate credentials and then trigger OTP sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (values.email === "error@example.com" || values.password === "wrong") { // Simulate incorrect primary credentials
        setError("Invalid email or password.");
        toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password."});
      } else {
        // Simulate successful primary credential check (OTP sent by backend)
        toast({ title: "Credentials Verified", description: "Please check your email for an OTP to complete login."});
        router.push(`/auth/verify-otp?email=${encodeURIComponent(values.email)}&type=login`);
      }
    });
  };

  return (
    <AuthCardWrapper
      headerLabel="Welcome back! Please login to your account."
      backButtonLabel="Don't have an account? Register here."
      backButtonHref="/auth/register"
      showSocial 
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="you@example.com" 
                    type="email" 
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="********" 
                    type="password" 
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
                <Button size="sm" variant="link" asChild className="px-0 font-normal">
                  <Link href="/auth/forgot-password">Forgot password?</Link>
                </Button>
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
            {isPending ? "Processing..." : "Login"}
          </Button>
        </form>
      </Form>
    </AuthCardWrapper>
  );
}

    