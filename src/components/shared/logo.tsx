
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface LogoProps {
  size?: 'xl' | '2xl' | 'lg';
  forceTheme?: 'light' | 'dark'; // New prop
}

export function Logo({ size = 'xl', forceTheme }: LogoProps) {
  const { theme: currentTheme, resolvedTheme: actualResolvedTheme } = useTheme();
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

  if (!mounted) {
    return <div style={{ width: `${width}px`, height: `${height}px` }} aria-hidden="true" />;
  }

  const effectiveTheme = forceTheme || actualResolvedTheme;
  const isDark = effectiveTheme === 'dark';

  const logoSrc = isDark
    ? '/assets/nobridge_logo_light_no_bg.png' // Light logo for DARK backgrounds
    : '/assets/nobridge_logo_dark_no_bg.png';  // Dark logo for LIGHT backgrounds

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
