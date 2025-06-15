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
import { asianCountries, BuyerPersonaTypes, PreferredInvestmentSizes } from "@/lib/types";
import { useTransition, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/hooks/use-cached-profile";
import { Loader2, User } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ProfileSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  phoneNumber: z.string().min(1, { message: "Phone number is required." }),
  country: z.string().min(1, { message: "Country is required." }),
  buyerPersonaType: z.enum(BuyerPersonaTypes, { required_error: "Buyer persona type is required." }),
  buyerPersonaOther: z.string().optional(),
  investmentFocusDescription: z.string().optional(),
  preferredInvestmentSize: z.enum(PreferredInvestmentSizes).optional(),
  keyIndustriesOfInterest: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.buyerPersonaType === "Other" && (!data.buyerPersonaOther || data.buyerPersonaOther.trim().length < 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify your role if 'Other' is selected for Buyer Persona.",
      path: ["buyerPersonaOther"],
    });
  }
});



const defaultProfileValues: Partial<z.infer<typeof ProfileSchema>> = {
  fullName: "",
  phoneNumber: "",
  country: "",
  buyerPersonaType: undefined,
  buyerPersonaOther: "",
  investmentFocusDescription: "",
  preferredInvestmentSize: undefined,
  keyIndustriesOfInterest: "",
};

export default function BuyerProfilePage() {
  const { toast } = useToast();
  const [isProfilePending, startProfileTransition] = useTransition();

  const { user, profile, loading: isLoading, refreshAuth } = useCurrentUser();

  const profileForm = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: defaultProfileValues,
  });



  // Load profile data into form when available
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        fullName: profile.full_name || "",
        phoneNumber: profile.phone_number || "",
        country: profile.country || "",
        buyerPersonaType: profile.buyer_persona_type as any || undefined,
        buyerPersonaOther: profile.buyer_persona_other || "",
        investmentFocusDescription: profile.investment_focus_description || "",
        preferredInvestmentSize: profile.preferred_investment_size as any || undefined,
        keyIndustriesOfInterest: profile.key_industries_of_interest || "",
      });
    }
  }, [profile, profileForm]);

  const updateProfile = async (profileData: z.infer<typeof ProfileSchema>) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Not authenticated - please log in again');
      }

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          full_name: profileData.fullName,
          phone_number: profileData.phoneNumber,
          country: profileData.country,
          buyer_persona_type: profileData.buyerPersonaType,
          buyer_persona_other: profileData.buyerPersonaOther,
          investment_focus_description: profileData.investmentFocusDescription,
          preferred_investment_size: profileData.preferredInvestmentSize,
          key_industries_of_interest: profileData.keyIndustriesOfInterest,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };



  const onProfileSubmit = (values: z.infer<typeof ProfileSchema>) => {
    startProfileTransition(async () => {
      try {
        await updateProfile(values);
        toast({
          title: "Profile Updated",
          description: "Your profile information has been successfully updated."
        });
        // Refresh the auth data to get updated profile
        refreshAuth();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update profile. Please try again."
        });
      }
    });
  };



  const watchedBuyerPersonaType = profileForm.watch("buyerPersonaType");

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Profile Not Found</h1>
        <p className="text-muted-foreground">Unable to load your profile. Please try logging in again.</p>
        <Button asChild>
          <Link href="/auth/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (profile.role !== 'buyer') {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground">This page is only accessible to buyer accounts.</p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <User className="h-8 w-8" />
        <h1 className="text-3xl font-bold tracking-tight">My Buyer Profile</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details. Your email ({user.email}) cannot be changed here.
          </CardDescription>
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
                    <FormControl>
                      <Input {...field} disabled={isProfilePending} />
                    </FormControl>
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
                    <FormControl>
                      <Input {...field} type="tel" disabled={isProfilePending} />
                    </FormControl>
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
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {asianCountries.map(country => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />
              <h3 className="text-lg font-medium pt-2">Buyer Profile & Investment Focus</h3>

              <FormField
                control={profileForm.control}
                name="buyerPersonaType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a/an: (Primary Role / Buyer Type)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isProfilePending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your primary role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BuyerPersonaTypes.map(type => (
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
                  control={profileForm.control}
                  name="buyerPersonaOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please Specify Role</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Your specific role" disabled={isProfilePending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={profileForm.control}
                name="investmentFocusDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Focus or What You're Looking For</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g., SaaS businesses in Southeast Asia with $100k-$1M ARR..."
                        disabled={isProfilePending}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what types of businesses or investments you're interested in
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="preferredInvestmentSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Investment Size (Approximate)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isProfilePending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preferred investment size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PreferredInvestmentSizes.map(size => (
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
                control={profileForm.control}
                name="keyIndustriesOfInterest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Industries of Interest</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g., Technology, E-commerce, Healthcare, Manufacturing..."
                        disabled={isProfilePending}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      List the industries you're most interested in investing in or acquiring businesses from
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isProfilePending}>
                {isProfilePending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile Changes"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>



      <Separator />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Additional Settings</CardTitle>
          <CardDescription>Access additional account settings and security options.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">Go to Account Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
