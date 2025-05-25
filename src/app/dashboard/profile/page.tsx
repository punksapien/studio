
'use client';

import * as React from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  asianCountries,
  User,
  BuyerPersonaTypes,
  PreferredInvestmentSizes
} from "@/lib/types";
import { useState, useTransition, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { sampleUsers } from "@/lib/placeholder-data";
import Link from "next/link";

const currentBuyerId = 'user2'; // Example: Jane Smith (Verified Buyer)
const currentUserServerData: User | undefined = sampleUsers.find(u => u.id === currentBuyerId && u.role === 'buyer');

const ProfileSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  phoneNumber: z.string().min(1, { message: "Phone number is required." }),
  country: z.string().min(1, { message: "Country is required." }),
  role: z.enum(['seller', 'buyer'], { required_error: "Role is required." }),
  initialCompanyName: z.string().optional(),
  // Buyer Persona Fields
  buyerPersonaType: z.enum(BuyerPersonaTypes).optional(),
  buyerPersonaOther: z.string().optional(),
  investmentFocusDescription: z.string().optional(),
  preferredInvestmentSize: z.enum(PreferredInvestmentSizes).optional(),
  keyIndustriesOfInterest: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'seller') {
    if (!data.initialCompanyName || data.initialCompanyName.trim().length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Initial company name is required for sellers.",
        path: ["initialCompanyName"],
      });
    }
  } else if (data.role === 'buyer') {
    if (!data.buyerPersonaType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Buyer persona type is required for buyers.",
        path: ["buyerPersonaType"],
      });
    }
    if (data.buyerPersonaType === "Other" && (!data.buyerPersonaOther || data.buyerPersonaOther.trim().length < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify your role if 'Other' is selected for Buyer Persona.",
        path: ["buyerPersonaOther"],
      });
    }
  }
});

const defaultProfileValues: Partial<z.infer<typeof ProfileSchema>> = {
  fullName: "",
  phoneNumber: "",
  country: "",
  role: "buyer",
  initialCompanyName: "",
  buyerPersonaType: undefined,
  buyerPersonaOther: "",
  investmentFocusDescription: "",
  preferredInvestmentSize: undefined,
  keyIndustriesOfInterest: "",
};

export default function ProfilePage() {
  const { toast } = useToast();
  const [isProfilePending, startProfileTransition] = useTransition();

  const profileForm = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: defaultProfileValues,
  });

  useEffect(() => {
    if (currentUserServerData) {
      profileForm.reset({
        fullName: currentUserServerData.fullName || "",
        phoneNumber: currentUserServerData.phoneNumber || "",
        country: currentUserServerData.country || "",
        role: currentUserServerData.role,
        initialCompanyName: currentUserServerData.role === 'seller' ? (currentUserServerData.initialCompanyName || "") : "",
        buyerPersonaType: currentUserServerData.role === 'buyer' ? (currentUserServerData.buyerPersonaType || undefined) : undefined,
        buyerPersonaOther: currentUserServerData.role === 'buyer' ? (currentUserServerData.buyerPersonaOther || "") : "",
        investmentFocusDescription: currentUserServerData.role === 'buyer' ? (currentUserServerData.investmentFocusDescription || "") : "",
        preferredInvestmentSize: currentUserServerData.role === 'buyer' ? (currentUserServerData.preferredInvestmentSize || undefined) : undefined,
        keyIndustriesOfInterest: currentUserServerData.role === 'buyer' ? (currentUserServerData.keyIndustriesOfInterest || "") : "",
      });
    }
  }, [profileForm, currentUserServerData]);


  const onProfileSubmit = (values: z.infer<typeof ProfileSchema>) => {
    startProfileTransition(async () => {
      console.log("Profile update values:", values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: "Profile Updated", description: "Your profile information has been successfully updated." });
    });
  };

  const watchedRole = profileForm.watch("role");
  const watchedBuyerPersonaType = profileForm.watch("buyerPersonaType");

  useEffect(() => {
    if (watchedRole === 'buyer') {
      profileForm.setValue('initialCompanyName', '');
    } else if (watchedRole === 'seller') {
      profileForm.setValue('buyerPersonaType', undefined);
      profileForm.setValue('buyerPersonaOther', '');
      profileForm.setValue('investmentFocusDescription', '');
      profileForm.setValue('preferredInvestmentSize', undefined);
      profileForm.setValue('keyIndustriesOfInterest', '');
    }
  }, [watchedRole, profileForm]);

  if (!currentUserServerData) {
    return <div className="container py-8 text-center">Loading profile or user not found...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Personal Information & Role</CardTitle>
          <CardDescription>Update your personal details. Your email ({currentUserServerData.email}) cannot be changed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <FormField control={profileForm.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} disabled={isProfilePending} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <FormField control={profileForm.control} name="phoneNumber" render={({ field }) => (
                  <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} type="tel" disabled={isProfilePending} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <FormField control={profileForm.control} name="country" render={({ field }) => (
                  <FormItem><FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isProfilePending}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select your country"/></SelectTrigger></FormControl>
                      <SelectContent>{asianCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )}
              />
               <FormField control={profileForm.control} name="role" render={({ field }) => (
                  <FormItem><FormLabel>Your Role on Nobridge</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} disabled={isProfilePending || true }>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="buyer">Buyer / Investor</SelectItem><SelectItem value="seller">Business Seller</SelectItem></SelectContent>
                    </Select>
                    <FormDescription>Changing your role might impact your access to certain features. Contact support for assistance.</FormDescription><FormMessage />
                  </FormItem>
                )}
              />

              {/* Buyer Specific Fields */}
              {watchedRole === 'buyer' && (
                <>
                  <FormField control={profileForm.control} name="buyerPersonaType" render={({ field }) => (
                      <FormItem><FormLabel>I am a/an: (Primary Role / Buyer Type)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isProfilePending}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select your primary role" /></SelectTrigger></FormControl>
                          <SelectContent>{BuyerPersonaTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchedBuyerPersonaType === "Other" && (
                    <FormField control={profileForm.control} name="buyerPersonaOther" render={({ field }) => (
                        <FormItem><FormLabel>Please Specify Role</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Your specific role" disabled={isProfilePending} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                  )}
                  <FormField control={profileForm.control} name="investmentFocusDescription" render={({ field }) => (
                      <FormItem><FormLabel>Investment Focus or What You&apos;re Looking For</FormLabel>
                        <FormControl><Textarea {...field} value={field.value || ""} placeholder="e.g., SaaS businesses in Southeast Asia with $100k-$1M ARR..." disabled={isProfilePending} rows={3}/></FormControl><FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={profileForm.control} name="preferredInvestmentSize" render={({ field }) => (
                      <FormItem><FormLabel>Preferred Investment Size (Approximate)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isProfilePending}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select preferred investment size" /></SelectTrigger></FormControl>
                          <SelectContent>{PreferredInvestmentSizes.map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={profileForm.control} name="keyIndustriesOfInterest" render={({ field }) => (
                      <FormItem><FormLabel>Key Industries of Interest</FormLabel>
                        <FormControl><Textarea {...field} value={field.value || ""} placeholder="e.g., Technology, E-commerce, Healthcare..." disabled={isProfilePending} rows={3}/></FormControl><FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <Button type="submit" disabled={isProfilePending}>{isProfilePending ? "Saving..." : "Save Profile Changes"}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Manage your account security.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="outline" asChild>
                <Link href="/dashboard/settings">Go to Security Settings (Change Password)</Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
