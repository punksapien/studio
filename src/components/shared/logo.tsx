
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // Added sm and md
  forceTheme?: 'light' | 'dark';
}

export function Logo({ size = 'xl', forceTheme }: LogoProps) {
  const { resolvedTheme: actualResolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dimensions = {
    sm: { width: 100, height: 33 }, // Smaller size
    md: { width: 120, height: 40 }, // Medium size
    lg: { width: 150, height: 50 }, // Larger than before
    xl: { width: 180, height: 60 }, // Increased size for navbar/footer
    '2xl': { width: 220, height: 73 } // Even larger
  };

  const { width, height } = dimensions[size] || dimensions.xl; // Fallback to xl if size is invalid

  let useDarkLogoElements: boolean;

  if (forceTheme) {
    // If forceTheme is 'light', it means the background is light, so we need the dark logo elements.
    useDarkLogoElements = forceTheme === 'light';
  } else if (mounted) {
    // If no forceTheme and component is mounted, use the actual resolved theme.
    // If actualResolvedTheme is 'light', we need dark logo elements.
    useDarkLogoElements = actualResolvedTheme === 'light';
  } else {
    // Fallback for SSR or before mount if no forceTheme: assume light background by default.
    // This means showing the dark logo elements.
    useDarkLogoElements = true;
  }

  const logoSrc = useDarkLogoElements
    ? '/assets/nobridge_logo_dark_no_bg.png'  // Dark elements for LIGHT backgrounds
    : '/assets/nobridge_logo_light_no_bg.png'; // Light elements for DARK backgrounds

  // If not mounted and no forceTheme, render a placeholder to avoid hydration mismatch
  // while theme is being resolved on the client.
  if (!mounted && !forceTheme) {
    return <div style={{ width: `${width}px`, height: `${height}px` }} aria-hidden="true" className="inline-block" />;
  }

  return (
    <Link href="/" className="flex items-center" aria-label="Nobridge Home">
      <Image
        src={logoSrc}
        alt="Nobridge"
        width={width}
        height={height}
        className="object-contain" // Ensures image scales within bounds without cropping
        priority // Good for LCP elements like logos
      />
    </Link>
  );
}
