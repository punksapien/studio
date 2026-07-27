import React, { useId } from 'react';
import styles from './animated-background.module.css';

interface AnimatedBackgroundProps {
  className?: string;
  position?: 'fixed' | 'absolute';
}

export function AnimatedBackground({ className = '', position = 'fixed' }: AnimatedBackgroundProps) {
  // useId is SSR-safe — produces the same ID on server and client
  const reactId = useId();
  const uniqueId = `bg-${reactId.replace(/:/g, '')}`;

  // Each animated wave lives in its own <svg> root so the CSS transform is
  // applied to a replaced element (GPU-composited) instead of an SVG child
  // (which forces a main-thread re-rasterisation of the whole SVG every frame).
  return (
    <div
      className={`${styles.backgroundContainer} ${className}`}
      style={{
        position,
        contain: 'layout style paint',
        isolation: 'isolate'
      }}
    >
      {/* Static base */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svg}
      >
        <rect width="1440" height="900" fill="#0D0D39" />
      </svg>

      {/* Layer 1 — deep: brand base to slightly lighter */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        className={`${styles.svg} ${styles.layer1}`}
      >
        <defs>
          <linearGradient id={`${uniqueId}-gradDeep-1`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#0D0D39', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#1E1E4D', stopOpacity: 0.9 }} />
          </linearGradient>
        </defs>
        <path
          d="M0 900 C 600 900 800 200 1440 100 L 1440 900 Z"
          fill={`url(#${uniqueId}-gradDeep-1)`}
        />
      </svg>

      {/* Layer 2 — mid: lighter tint fading back to brand */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        className={`${styles.svg} ${styles.layer2}`}
      >
        <defs>
          <linearGradient id={`${uniqueId}-gradMid-2`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#272754', stopOpacity: 0.85 }} />
            <stop offset="100%" style={{ stopColor: '#0D0D39', stopOpacity: 0.4 }} />
          </linearGradient>
        </defs>
        <path
          d="M1440 0 C 1000 0 800 700 100 900 L 1440 900 Z"
          fill={`url(#${uniqueId}-gradMid-2)`}
        />
      </svg>

      {/* Layer 3 — light: most visible highlight, brand + white */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        className={`${styles.svg} ${styles.layer3}`}
      >
        <defs>
          <linearGradient id={`${uniqueId}-gradLight-3`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#30305E', stopOpacity: 0.7 }} />
            <stop offset="100%" style={{ stopColor: '#0D0D39', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path
          d="M-100 400 C 400 400 700 0 1100 0 L 1440 0 L 1440 300 C 1000 300 800 800 300 800 Z"
          fill={`url(#${uniqueId}-gradLight-3)`}
        />
      </svg>

      {/* Layer 4 — ribbon: subtle accent sweep */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        className={`${styles.svg} ${styles.layer4}`}
        style={{ mixBlendMode: 'screen' }}
      >
        <defs>
          <linearGradient id={`${uniqueId}-gradRibbon-4`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" style={{ stopColor: '#1E1E4D', stopOpacity: 0.5 }} />
            <stop offset="100%" style={{ stopColor: '#0D0D39', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path
          d="M0 200 C 500 200 700 600 0 800 Z"
          fill={`url(#${uniqueId}-gradRibbon-4)`}
        />
      </svg>

      {/* Layer 5 — deep gradient reused at low opacity */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        className={`${styles.svg} ${styles.layer5}`}
      >
        <defs>
          <linearGradient id={`${uniqueId}-gradDeep-5`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#0D0D39', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#1E1E4D', stopOpacity: 0.9 }} />
          </linearGradient>
        </defs>
        <path
          d="M0 0 C 400 0 600 400 0 600 Z"
          fill={`url(#${uniqueId}-gradDeep-5)`}
          opacity="0.4"
        />
      </svg>
    </div>
  );
}
