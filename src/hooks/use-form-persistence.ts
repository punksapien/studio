'use client';

import { useEffect, useRef, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { debounce } from '@/lib/utils';

interface UseFormPersistenceOptions {
  storageKey: string;
  debounceMs?: number;
  excludeFields?: string[];
}

export function useFormPersistence<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  options: UseFormPersistenceOptions
) {
  const { storageKey, debounceMs = 1000, excludeFields = [] } = options;
  const isRestoringRef = useRef(false);
  const hasRestoredRef = useRef(false);
  const watcherRef = useRef<any>(null);

  // Create a debounced save function
  const saveToStorage = useCallback(
    debounce((values: T) => {
      if (isRestoringRef.current || !hasRestoredRef.current) return;

      try {
        // Filter out excluded fields and file inputs
        const valuesToSave = Object.entries(values).reduce((acc, [key, value]) => {
          if (excludeFields.includes(key)) return acc;
          // Don't save File objects
          if (value instanceof File) return acc;
          acc[key] = value;
          return acc;
        }, {} as any);

        localStorage.setItem(storageKey, JSON.stringify(valuesToSave));
        console.log(`[FormPersistence] Saved form data to ${storageKey}`);
      } catch (error) {
        console.error('[FormPersistence] Error saving form data:', error);
      }
    }, debounceMs),
    [storageKey, excludeFields, debounceMs]
  );

  // Restore form data on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;

    const restoreFromStorage = () => {
      try {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          isRestoringRef.current = true;
          const parsedData = JSON.parse(savedData);

          // Get current form values to merge with saved data
          const currentValues = form.getValues();
          const formFields = Object.keys(currentValues);

          // Restore each field individually using setValue to avoid triggering reset
          Object.entries(parsedData).forEach(([key, value]) => {
            if (formFields.includes(key) && !excludeFields.includes(key)) {
              // Handle special cases for Select components
              if (value === null || value === '') {
                form.setValue(key as any, undefined, { shouldValidate: false, shouldDirty: false });
              } else {
                form.setValue(key as any, value, { shouldValidate: false, shouldDirty: false });
              }
            }
          });

          console.log(`[FormPersistence] Restored form data from ${storageKey}`);

          // Reset flags after restoration
          setTimeout(() => {
            isRestoringRef.current = false;
            hasRestoredRef.current = true;
          }, 100);
        } else {
          // No saved data, mark as restored to start watching
          hasRestoredRef.current = true;
        }
      } catch (error) {
        console.error('[FormPersistence] Error restoring form data:', error);
        hasRestoredRef.current = true;
      }
    };

    restoreFromStorage();
  }, [storageKey, form, excludeFields]);

  // Watch form changes and save (only after initial restoration)
  useEffect(() => {
    if (!hasRestoredRef.current) return;

    // Clear any existing watcher
    if (watcherRef.current) {
      watcherRef.current.unsubscribe();
    }

    // Create new watcher with delay to avoid immediate triggering
    const timer = setTimeout(() => {
      watcherRef.current = form.watch((values) => {
        if (!isRestoringRef.current && hasRestoredRef.current) {
          saveToStorage(values as T);
        }
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      if (watcherRef.current) {
        watcherRef.current.unsubscribe();
      }
    };
  }, [form, saveToStorage, hasRestoredRef.current]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(storageKey);
    console.log(`[FormPersistence] Cleared saved data for ${storageKey}`);
  }, [storageKey]);

  // Save immediately (useful before navigation)
  const saveNow = useCallback(() => {
    if (!hasRestoredRef.current) return;

    const values = form.getValues();
    saveToStorage.flush();
    saveToStorage(values);
  }, [form, saveToStorage]);

  return {
    clearSavedData,
    saveNow,
  };
}
