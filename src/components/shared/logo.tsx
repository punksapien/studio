"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function Logo({ size = 'xl' }: { size?: 'xl' | '2xl' | 'lg' }) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine image dimensions based on size
  const dimensions = {
    lg: { width: 120, height: 40 },
    xl: { width: 140, height: 47 },
    '2xl': { width: 160, height: 53 }
  };

  const { width, height } = dimensions[size];

  // Don't render logo until mounted to avoid hydration issues
  if (!mounted) {
    return <div className={`h-[${height}px] w-[${width}px]`} />;
  }

  // Determine which logo to use based on theme
  const isDark = resolvedTheme === 'dark';
  const logoSrc = isDark
    ? '/assets/nobridge_logo_light_no_bg.png'
    : '/assets/nobridge_logo_dark_no_bg.png';

  return (
    <Link href="/" className="flex items-center">
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
