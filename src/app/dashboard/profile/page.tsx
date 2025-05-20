
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { asianCountries, buyerTypes, UserRole } from "@/lib/types"; 
import { useState, useTransition, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// Placeholder for current user data - in a real app, this would come from session/auth
const currentUserServerData = {
  fullName: "John Doe",
  email: "john.doe@example.com",
  phoneNumber: "+6591234567",
  country: "Singapore",
  role: "seller" as UserRole,
  initialCompanyName: "JD Web Solutions", 
  buyerType: undefined as (typeof buyerTypes[number] | undefined),
  isPaid: true,
  verificationStatus: "verified" as const,
};

const ProfileSchemaBase = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  phoneNumber: z.string().min(1, { message: "Phone number is required." }),
  country: z.string().min(1, { message: "Country is required." }),
  role: z.enum(['seller', 'buyer'], { required_error: "Role is required." }),
});

// Conditional fields based on role
const ProfileSchema = ProfileSchemaBase.superRefine((data, ctx) => {
  if (data.role === 'seller') {
    if (!data.initialCompanyName || data.initialCompanyName.length < 1) {
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
}).extend({
    initialCompanyName: z.string().optional(),
    buyerType: z.enum(buyerTypes).optional(),
});


const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match.",
  path: ["confirmNewPassword"],
});


export default function ProfilePage() {
  const { toast } = useToast();
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  
  const profileForm = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      fullName: currentUserServerData.fullName,
      phoneNumber: currentUserServerData.phoneNumber,
      country: currentUserServerData.country,
      role: currentUserServerData.role,
      initialCompanyName: currentUserServerData.role === 'seller' ? currentUserServerData.initialCompanyName : "",
      buyerType: currentUserServerData.role === 'buyer' ? currentUserServerData.buyerType : undefined,
    },
  });

  const passwordForm = useForm<z.infer<typeof PasswordChangeSchema>>({
    resolver: zodResolver(PasswordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onProfileSubmit = (values: z.infer<typeof ProfileSchema>) => {
    startProfileTransition(async () => {
      console.log("Profile update values:", values);
      // Placeholder for server action to update profile and role
      // This would involve more complex logic if role changes, e.g., clearing irrelevant fields.
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: "Profile Updated", description: "Your profile information has been successfully updated." });
    });
  };

  const onPasswordSubmit = (values: z.infer<typeof PasswordChangeSchema>) => {
    startPasswordTransition(async () => {
      console.log("Password change values:", values);
      // Placeholder for server action
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

  const watchedRole = profileForm.watch("role");

  useEffect(() => {
    // When role changes, clear the other role's specific fields
    if (watchedRole === 'buyer') {
      profileForm.setValue('initialCompanyName', '');
    } else if (watchedRole === 'seller') {
      profileForm.setValue('buyerType', undefined);
    }
  }, [watchedRole, profileForm]);


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Personal Information & Role</CardTitle>
          <CardDescription>Update your personal details and role. Your email ({currentUserServerData.email}) cannot be changed here.</CardDescription>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isProfilePending}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {asianCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={profileForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Role on BizMatch Asia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isProfilePending}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer / Investor</SelectItem>
                        <SelectItem value="seller">Business Seller</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedRole === 'seller' && (
                <FormField
                  control={profileForm.control}
                  name="initialCompanyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Company Name (Sellers)</FormLabel>
                      <FormControl><Input {...field} placeholder="Your Company Pte Ltd" disabled={isProfilePending} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {watchedRole === 'buyer' && (
                <FormField
                  control={profileForm.control}
                  name="buyerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buyer Type (Buyers)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isProfilePending}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select buyer type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {buyerTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
