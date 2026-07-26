'use client';

import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuyerPersonaTypes, PreferredInvestmentSizes } from '@/lib/types';

interface BuyerDetailsStepProps {
  control: Control<any>;
  isPending?: boolean;
}

/** Onboarding step 3 (buyer): investment profile. All optional — the step is skippable. */
export function BuyerDetailsStepFields({ control, isPending }: BuyerDetailsStepProps) {
  const buyerPersonaType = useWatch({ control, name: 'buyerPersonaType' });

  return (
    <>
      <FormField
        control={control}
        name="buyerPersonaType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>I am a/an: (Primary Role / Buyer Type)</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''} disabled={isPending}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select your primary role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {BuyerPersonaTypes.map((type) => (
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

      {buyerPersonaType === 'Other' && (
        <FormField
          control={control}
          name="buyerPersonaOther"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Please Specify Role</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Your specific role" disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="investmentFocusDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Investment Focus or What You&apos;re Looking For</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="e.g., SaaS businesses in Southeast Asia with $100k-$1M ARR, turnarounds in manufacturing, e-commerce brands for scaling."
                disabled={isPending}
                rows={3}
              />
            </FormControl>
            <FormDescription>Briefly describe your primary investment criteria or the types of businesses you are seeking.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="preferredInvestmentSize"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred Investment Size (Approximate)</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''} disabled={isPending}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred investment size" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PreferredInvestmentSizes.map((size) => (
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
        control={control}
        name="keyIndustriesOfInterest"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Key Industries of Interest</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="e.g., Technology, E-commerce, Healthcare, Manufacturing, B2B Services. Please list a few."
                disabled={isPending}
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
