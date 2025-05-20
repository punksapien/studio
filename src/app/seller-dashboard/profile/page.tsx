
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { asianCountries, buyerTypes, UserRole, User, VerificationStatus } from "@/lib/types"; 
import { useState, useTransition, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { sampleUsers } from "@/lib/placeholder-data"; 

// Placeholder for current user data - assuming current seller 'user1' (John Doe) or 'user3' (Alex Tan)
const currentSellerId = 'user3'; 
const currentUserServerData: User | undefined = sampleUsers.find(u => u.id === currentSellerId && u.role === 'seller');


const ProfileSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  phoneNumber: z.string().min(1, { message: "Phone number is required." }),
  country: z.string().min(1, { message: "Country is required." }),
  role: z.enum(['seller', 'buyer'], { required_error: "Role is required." }),
  initialCompanyName: z.string().optional(), // Now optional at the base
  buyerType: z.enum(buyerTypes).optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'seller') {
    // For sellers, initialCompanyName becomes required.
    if (!data.initialCompanyName || data.initialCompanyName.trim().length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Initial company name is required for sellers.",
        path: ["initialCompanyName"],
      });
    }
  } else if (data.role === 'buyer') {
    if (!data.buyerType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Buyer type is required for buyers.",
        path: ["buyerType"],
      });
    }
  }
});


const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match.",
  path: ["confirmNewPassword"],
});

const defaultProfileValues: z.infer<typeof ProfileSchema> = {
  fullName: "",
  phoneNumber: "",
  country: "", 
  role: "seller", // Default for this seller dashboard
  initialCompanyName: "",
  buyerType: undefined, 
};

export default function SellerProfilePage() {
  const { toast } = useToast();
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  
  const profileForm = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: defaultProfileValues,
  });

  const passwordForm = useForm<z.infer<typeof PasswordChangeSchema>>({
    resolver: zodResolver(PasswordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (currentUserServerData) {
      profileForm.reset({
        fullName: currentUserServerData.fullName,
        phoneNumber: currentUserServerData.phoneNumber,
        country: currentUserServerData.country,
        role: currentUserServerData.role, // Should be 'seller'
        initialCompanyName: currentUserServerData.initialCompanyName || "",
        buyerType: undefined, // Not applicable for seller
      });
    }
  }, [profileForm, currentUserServerData]);


  const onProfileSubmit = (values: z.infer<typeof ProfileSchema>) => {
    startProfileTransition(async () => {
      console.log("Seller Profile update values:", values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: "Profile Updated", description: "Your profile information has been successfully updated." });
    });
  };

  const onPasswordSubmit = (values: z.infer<typeof PasswordChangeSchema>) => {
    startPasswordTransition(async () => {
      console.log("Password change values:", values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (values.currentPassword === "wrongpassword") {
        passwordForm.setError("currentPassword", { type: "manual", message: "Incorrect current password."});
        toast({ variant: "destructive", title: "Error", description: "Failed to change password. Incorrect current password." });
      } else {
        toast({ title: "Password Changed", description: "Your password has been successfully updated." });
        passwordForm.reset();
      }
    });
  };

  const watchedRole = profileForm.watch("role"); // This will be 'seller' for this page

  if (!currentUserServerData) {
    return <div className="container py-8 text-center">Loading profile or user not found...</div>;
  }


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">My Seller Profile</h1>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details. Your email ({currentUserServerData.email}) cannot be changed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <FormField
                control={profileForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} disabled={isProfilePending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input {...field} type="tel" disabled={isProfilePending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isProfilePending}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select your country"/></SelectTrigger></FormControl>
                      <SelectContent>
                        {asianCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Role is fixed to 'seller' for this dashboard */}
              <FormField
                control={profileForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="hidden"> {/* Hidden as role is fixed for this context */}
                    <FormLabel>Your Role</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} disabled={true}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="seller">Business Seller</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="initialCompanyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name (for listing purposes)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your Company Pte Ltd" disabled={isProfilePending} />
                    </FormControl>
                    <FormDescription>This can be your registered business name or a trading name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isProfilePending}>
                {isProfilePending ? "Saving..." : "Save Profile Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl><Input {...field} type="password" disabled={isPasswordPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><Input {...field} type="password" disabled={isPasswordPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl><Input {...field} type="password" disabled={isPasswordPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPasswordPending}>
                {isPasswordPending ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
