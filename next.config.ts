import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Force dynamic rendering for interactive admin and dashboard pages
  experimental: {
    // Disable static exports for routes with client-side interactivity
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
  // SEO optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  headers: async () => {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // Report-only for now: tighten to an enforcing CSP once violation
            // reports are clean. All fonts are self-hosted via next/font, so no
            // third-party font hosts are allowlisted.
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "media-src 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2678400, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      // Placeholder images
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Unsplash images
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Local Supabase development instance
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/**',
      },
      // Alternative localhost format for Supabase
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/**',
      },
      // Production Supabase hosted instance
      // Format: https://[project-ref].supabase.co/storage/v1/object/...
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
      // Self-hosted Supabase instances (if needed in future)
      // Add your production domain here when deploying
      // {
      //   protocol: 'https',
      //   hostname: 'your-production-domain.com',
      //   port: '',
      //   pathname: '/storage/v1/object/**',
      // },
    ],
  },
  // Ensure environment variables are loaded
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
};

export default nextConfig;
