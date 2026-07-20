'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface InlineEditFieldProps {
  label: string;
  value: string;
  type?: 'text' | 'textarea' | 'select';
  options?: readonly string[];
  placeholder?: string;
  emptyText?: string;
  onSave: (v: string) => Promise<void>;
}

/**
 * Presentational inline-editable field. Shows a read-only, input-styled box with a
 * pencil affordance; clicking it swaps in the matching shadcn control. Text/textarea
 * save on blur (Enter saves for text, Escape cancels); selects save on change. The
 * component owns its edit/draft/saving state and never reaches into page-level data.
 */
export function InlineEditField({
  label,
  value,
  type = 'text',
  options = [],
  placeholder,
  emptyText,
  onSave,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When entering edit mode, seed the draft from the current value and focus.
  useEffect(() => {
    if (isEditing) {
      setDraft(value);
      // Focus after the control mounts.
      requestAnimationFrame(() => {
        if (type === 'text') inputRef.current?.focus();
        if (type === 'textarea') textareaRef.current?.focus();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const displayText = value || emptyText || placeholder || 'Not added yet';
  const isEmpty = !value;

  const commit = async (next: string) => {
    const trimmed = next.trim();
    // No change — just leave edit mode.
    if (trimmed === (value || '').trim()) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch {
      // onSave failed — revert to display mode showing the original value.
      setDraft(value);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-none border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            type === 'textarea' ? 'min-h-[80px] items-start' : 'h-10'
          )}
        >
          <span
            className={cn(
              'flex-1 break-words',
              isEmpty ? 'text-muted-foreground' : 'text-foreground',
              type === 'textarea' ? 'whitespace-pre-wrap' : 'truncate'
            )}
          >
            {displayText}
          </span>
          <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-center gap-2">
          <Select
            defaultOpen
            value={draft || undefined}
            disabled={isSaving}
            onValueChange={(v) => {
              setDraft(v);
              void commit(v);
            }}
            onOpenChange={(open) => {
              // Closed without a change — exit edit mode.
              if (!open && !isSaving) setIsEditing(false);
            }}
          >
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder={placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isSaving && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
        </div>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <div className="relative">
          <Textarea
            ref={textareaRef}
            className="rounded-none"
            value={draft}
            placeholder={placeholder}
            disabled={isSaving}
            rows={3}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void commit(draft)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setDraft(value);
                setIsEditing(false);
              }
            }}
          />
          {isSaving && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="relative">
        <Input
          ref={inputRef}
          className="rounded-none pr-9"
          value={draft}
          placeholder={placeholder}
          disabled={isSaving}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void commit(draft);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setDraft(value);
              setIsEditing(false);
            }
          }}
        />
        {isSaving && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
        )}
      </div>
    </div>
  );
}
