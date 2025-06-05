
'use client';

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
// import Link from "next/link"; // Not typically used for admin login back button

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import { useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/auth";

const AdminLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function AdminLoginPage() {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/admin';

  const form = useForm<z.infer<typeof AdminLoginSchema>>({
    resolver: zodResolver(AdminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof AdminLoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        console.log("Admin Login attempt:", { email: values.email, redirectTo });

        // Use existing auth system
        const result = await auth.signIn(values.email, values.password);
        console.log("Admin auth.signIn result:", result);

        // Check if user's email is verified
        const user = await auth.getCurrentUser();
        console.log("Admin current user:", user);

        if (user && !user.email_confirmed_at) {
          setError("Please verify your email before logging in to the admin panel.");
          return;
        }

        // Get user profile and verify admin role
        const userProfile = await auth.getCurrentUserProfile();
        console.log("Admin user profile:", userProfile);

        if (!userProfile) {
          setError("User profile not found. Please contact support.");
          return;
        }

        if (userProfile.role !== 'admin') {
          setError("Access denied. Admin privileges required.");
          return;
        }

        setSuccess("Login successful! Redirecting to admin dashboard...");

        // Small delay to show success message, then redirect
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);

      } catch (error) {
        console.error("Admin login error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        setError(`Login failed: ${errorMessage}`);
      }
    });
  };

  return (
    <Card className="w-[400px] shadow-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo size="2xl" forceTheme="light" />
        </div>
        <CardTitle className="text-2xl font-semibold font-heading">Admin Panel Login</CardTitle>
        <CardDescription>Please enter your administrator credentials.</CardDescription>
      </CardHeader>
      <CardContent>
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
                      placeholder="admin@nobridge.com"
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
                </FormItem>
              )}
            />

            {error && (
                <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
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
              {isPending ? "Logging in..." : "Login to Admin Panel"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
            Access to this panel is restricted to authorized personnel only.
        </p>
      </CardFooter>
    </Card>
  );
}
