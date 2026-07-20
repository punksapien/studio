'use client';

import type { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface ContactStepProps {
  control: Control<any>;
  isPending: boolean;
}

/** Onboarding step 1 (both roles): full name + phone number. Both are required — this step cannot be skipped. */
export function ContactStepFields({ control, isPending }: ContactStepProps) {
  return (
    <>
      <FormField
        control={control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="John Doe" autoComplete="name" disabled={isPending} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input {...field} type="tel" placeholder="+1 555 123 4567" autoComplete="tel" disabled={isPending} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
