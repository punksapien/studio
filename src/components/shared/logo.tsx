"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  forceTheme?: 'light' | 'dark';
}

export function Logo({ size = 'xl', forceTheme }: LogoProps) {
  const { resolvedTheme: actualResolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dimensions = {
    sm: { width: 100, height: 33 },
    md: { width: 120, height: 40 },
    lg: { width: 150, height: 50 },
    xl: { width: 200, height: 67 }, // Kept larger size
    '2xl': { width: 220, height: 73 }
  };

  const { width, height } = dimensions[size] || dimensions.xl;

  let useDarkElementsLogoFile: boolean;

  if (forceTheme) {
    // If forceTheme is 'light', it means the background is light, so we need the dark elements logo.
    useDarkElementsLogoFile = forceTheme === 'light';
  } else if (mounted) {
    // If no forceTheme and component is mounted, use the actual resolved theme.
    // If actualResolvedTheme is 'light', we need dark logo elements.
    useDarkElementsLogoFile = actualResolvedTheme === 'light';
  } else {
    // Fallback for SSR or before mount if no forceTheme: assume light background by default.
    useDarkElementsLogoFile = true;
  }

  if (!mounted && !forceTheme) {
    // Avoid hydration mismatch during SSR if theme isn't forced
    return <div style={{ width: `${width}px`, height: `${height}px` }} aria-hidden="true" className="inline-block" />;
  }

  // Both variants stay mounted so that flipping themes (e.g. the navbar crossing its
  // scroll threshold) never swaps an <img> src mid-scroll. The inactive one is kept out
  // of flow and fully transparent, so it is already fetched and decoded when it is needed.
  const variants = [
    { src: '/assets/nobridge_logo_light_trimmed@2x.png', active: useDarkElementsLogoFile },
    { src: '/assets/nobridge_logo_dark_trimmed@2x.png', active: !useDarkElementsLogoFile },
  ];

  return (
    <Link href="/" className="relative flex items-center" aria-label="Nobridge Home">
      {variants.map(({ src, active }) => (
        <Image
          key={src}
          src={src}
          alt={active ? 'Nobridge' : ''}
          aria-hidden={active ? undefined : true}
          width={width}
          height={height}
          className={cn(
            'object-contain',
            !active && 'pointer-events-none absolute left-0 top-0 w-full opacity-0'
          )}
          style={{ height: 'auto' }}
          // Only the visible variant is worth a preload; the hidden one is still in the
          // viewport, so next/image loads it eagerly enough for the scroll-threshold swap.
          priority={active}
        />
      ))}
    </Link>
  );
}
