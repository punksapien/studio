
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface LogoProps {
  size?: 'xl' | '2xl' | 'lg';
  forceTheme?: 'light' | 'dark';
}

export function Logo({ size = 'xl', forceTheme }: LogoProps) {
  const { resolvedTheme: actualResolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dimensions = {
    lg: { width: 120, height: 40 },
    xl: { width: 140, height: 47 },
    '2xl': { width: 160, height: 53 }
  };

  const { width, height } = dimensions[size];

  let useDarkLogoElements: boolean;

  if (forceTheme) {
    // If forceTheme is 'light', it means the background is light, so we need dark logo elements.
    useDarkLogoElements = forceTheme === 'light';
  } else {
    // Only rely on resolvedTheme if forceTheme is not provided
    if (!mounted) {
      // Fallback before mount if no forceTheme: show placeholder or default to dark elements
      // This helps prevent hydration mismatch if actualResolvedTheme is initially undefined SSR vs Client
      return <div style={{ width: `${width}px`, height: `${height}px` }} aria-hidden="true" />;
    }
    // If mounted and no forceTheme, use the actual resolved theme.
    // If actualResolvedTheme is 'light', we need dark logo elements.
    useDarkLogoElements = actualResolvedTheme === 'light';
  }

  const logoSrc = useDarkLogoElements
    ? '/assets/nobridge_logo_dark_no_bg.png'  // Dark elements for LIGHT backgrounds
    : '/assets/nobridge_logo_light_no_bg.png'; // Light elements for DARK backgrounds

  return (
    <Link href="/" className="flex items-center" aria-label="Nobridge Home">
      <Image
        src={logoSrc}
        alt="Nobridge"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </Link>
  );
}
