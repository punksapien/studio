'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CollapsibleFieldProps {
  label: string;
  shown: boolean;
  removable: boolean;
  onRemove: () => void;
  children: ReactNode;
}

/**
 * Presentational wrapper for the onboarding "add/remove reveal" pattern.
 * Renders nothing when `!shown` (the +Add buttons live in the parent). When shown,
 * renders the field and, if `removable`, a ghost X button that collapses/clears it.
 */
export function CollapsibleField({
  label,
  shown,
  removable,
  onRemove,
  children,
}: CollapsibleFieldProps) {
  if (!shown) return null;

  if (!removable) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="mt-8 shrink-0"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
