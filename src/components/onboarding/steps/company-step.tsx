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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { allCountries } from '@/lib/types';

interface CompanyStepProps {
  control: Control<any>;
  isPending: boolean;
}

/** Onboarding step 2 (both roles): country + company name. All optional — the step is skippable. */
export function CompanyStepFields({ control, isPending }: CompanyStepProps) {
  return (
    <>
      <FormField
        control={control}
        name="country"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''} disabled={isPending}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {allCountries.map((country) => (
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
      <FormField
        control={control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Company Name" autoComplete="organization" disabled={isPending} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
