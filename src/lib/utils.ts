import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Debounce utility function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { flush: () => void; cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debouncedFn = function(this: any, ...args: Parameters<T>) {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (lastArgs) {
        func.apply(this, lastArgs);
      }
      timeoutId = null;
      lastArgs = null;
    }, wait);
  } as T;

  // Add flush method to immediately execute pending invocation
  (debouncedFn as any).flush = function() {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      func.apply(this, lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  // Add cancel method to cancel pending invocation
  (debouncedFn as any).cancel = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debouncedFn as T & { flush: () => void; cancel: () => void };
}
