'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STORAGE_KEY = 'nobridge-offer-seen';
const POPUP_DELAY_MS = 10000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isExcludedPath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/seller-dashboard' ||
    pathname.startsWith('/seller-dashboard/') ||
    pathname === '/dev-preview' ||
    pathname.startsWith('/dev-preview/')
  );
}

export default function OfferPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const excluded = isExcludedPath(pathname);

  // Arm the timer to open the popup after a delay, unless already seen this session.
  useEffect(() => {
    if (excluded) return;
    if (typeof window === 'undefined') return;

    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // If sessionStorage is unavailable, don't show the popup.
      return;
    }

    timerRef.current = setTimeout(() => {
      setOpen(true);
    }, POPUP_DELAY_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [excluded]);

  const markSeen = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Ignore storage errors.
    }
  };

  const dismiss = () => {
    markSeen();
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      markSeen();
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/leads/ma-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      markSeen();
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (excluded) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[1165px] w-[95vw] p-0 overflow-hidden gap-0">
        <div className="flex flex-col md:flex-row">
          {/* Image half */}
          <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6 min-h-[14rem] md:min-h-[36rem]">
            <Image
              src="/assets/team-partners.webp"
              alt="Nobridge M&A advisory partners"
              width={440}
              height={440}
              sizes="440px"
              className="object-contain w-auto h-auto max-w-full max-h-[440px]"
              priority
            />
          </div>

          {/* Text half */}
          <div className="w-full md:w-1/2 bg-primary text-primary-foreground p-8 md:p-10 flex flex-col justify-center">
            <DialogTitle className="text-2xl md:text-3xl font-semibold tracking-tight whitespace-nowrap">Private M&amp;A Evaluation</DialogTitle>

            <div className="mt-4 space-y-3 text-sm md:text-base leading-relaxed opacity-90">
              <p className="italic">Every significant transaction deserves a considered plan.</p>
              <p>Let us help you prepare a confidential roadmap, whether you&apos;re buying or selling - designed around your ultimate goal.</p>
              <p>Complimentary, and without obligation.</p>
            </div>

            {submitted ? (
              <p className="mt-6 text-base font-medium">
                Thank you — we&apos;ll be in touch.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-3" noValidate>
                <Input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={!!error}
                  aria-label="Email address"
                  className="bg-white text-black placeholder:text-gray-500 border-white"
                />

                {error && (
                  <p className="text-sm text-red-300" role="alert">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Sending…' : 'Request Complimentary Plan'}
                </Button>

                <button
                  type="button"
                  onClick={dismiss}
                  className="block w-full text-center text-sm underline opacity-80 hover:opacity-100 transition-opacity"
                >
                  No Thanks
                </button>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
