/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  async headers() {
    return [
      // ── PWA static assets — long cache ───────────────────────────────────
      {
        source: '/icons/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/splash/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      // ── Service worker — never cache so updates are instant ───────────────
      {
        source: '/OneSignalSDKWorker.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      // ── All pages — security headers ──────────────────────────────────────
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com https://api.onesignal.com https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://www.googletagservices.com https://adservice.google.com https://www.googletagmanager.com https://vercel.live",
              "connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://api.sarvam.ai https://onesignal.com https://api.onesignal.com https://tts.bhashini.ai https://overpass-api.de https://overpass.kumi.systems https://nominatim.openstreetmap.org https://api.geoapify.com https://pagead2.googlesyndication.com https://adservice.google.com https://vitals.vercel-insights.com",
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://img.icons8.com https://i.ytimg.com https://*.tile.openstreetmap.org https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://www.google.com https://www.gstatic.com",
              "media-src 'self' data: blob: https://*.supabase.co https://assets.mixkit.co https://commons.wikimedia.org https://upload.wikimedia.org",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net",
              "frame-ancestors 'none'",
              "report-uri /api/csp-report",
            ].join('; ')
          }
        ],
      },
    ];
  },
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'img.icons8.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  webpack: (config) => {
    // Resolve engine workspace packages via src/index.ts during dev
    config.resolve.alias = {
      ...config.resolve.alias,
      '@sangam/sadhana-engine': path.resolve(__dirname, 'packages/sadhana-engine/src/index.ts'),
      '@sangam/pathshala-engine': path.resolve(__dirname, 'packages/pathshala-engine/src/index.ts'),
    };
    return config;
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', 'date-fns'],
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
