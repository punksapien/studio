
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

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
    xl: { width: 200, height: 67 }, // Increased size
    '2xl': { width: 220, height: 73 }
  };

  const { width, height } = dimensions[size] || dimensions.xl;

  let useDarkLogoElements: boolean;

  if (forceTheme) {
    // If forceTheme is 'light', it implies the background is light, so we need the dark logo elements.
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

  // This logic assumes:
  // - nobridge_logo_dark_no_bg.png = DARK elements (for light backgrounds)
  // - nobridge_logo_light_no_bg.png = LIGHT elements (for dark backgrounds)
  const logoSrc = useDarkLogoElements
    ? '/assets/nobridge_logo_dark_no_bg.png'
    : '/assets/nobridge_logo_light_no_bg.png';

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
        className="object-contain"
        priority
      />
    </Link>
  );
}
