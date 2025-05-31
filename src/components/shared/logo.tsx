
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
    sm: { width: 100, height: 33 }, // Kept original aspect ratio for sm/md for potentially smaller logo uses
    md: { width: 120, height: 40 },
    lg: { width: 150, height: 50 },
    xl: { width: 200, height: 67 }, // Maintained larger size
    '2xl': { width: 220, height: 73 }
  };

  const { width, height } = dimensions[size] || dimensions.xl;

  let useDarkElementsLogoFile: boolean;

  if (forceTheme) {
    // If forceTheme is 'light', it means the background is light, so we need the dark logo elements.
    useDarkElementsLogoFile = forceTheme === 'light';
  } else if (mounted) {
    // If no forceTheme and component is mounted, use the actual resolved theme.
    // If actualResolvedTheme is 'light', we need dark logo elements.
    useDarkElementsLogoFile = actualResolvedTheme === 'light';
  } else {
    // Fallback for SSR or before mount if no forceTheme: assume light background by default.
    // So, we need the logo file that contains DARK elements.
    useDarkElementsLogoFile = true;
  }

  // Updated paths based on user confirmation of which file contains which color elements
  const logoSrc = useDarkElementsLogoFile
    ? '/assets/nobridge_logo_light_trimmed@2x.png'  // This file has DARK elements (for light backgrounds)
    : '/assets/nobridge_logo_dark_trimmed@2x.png';  // This file has LIGHT elements (for dark backgrounds)

  if (!mounted && !forceTheme) {
    // Avoid hydration mismatch for SSR/initial render if theme isn't forced
    // Render a placeholder or null to prevent flash of incorrect logo
    return <div style={{ width: `${width}px`, height: `${height}px` }} aria-hidden="true" className="inline-block" />;
  }

  return (
    <Link href="/" className="flex items-center" aria-label="Nobridge Home">
      <Image
        src={logoSrc}
        alt="Nobridge"
        width={width}
        height={height}
        className="object-contain" // Ensure this class is present to respect aspect ratio and bounds
        priority
      />
    </Link>
  );
}
