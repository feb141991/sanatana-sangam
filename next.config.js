/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com; connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://api.sarvam.ai https://onesignal.com https://tts.bhashini.ai https://overpass-api.de https://overpass.kumi.systems https://nominatim.openstreetmap.org; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.supabase.co https://img.icons8.com https://i.ytimg.com https://*.tile.openstreetmap.org; media-src 'self' data: blob: https://*.supabase.co https://assets.mixkit.co https://commons.wikimedia.org https://upload.wikimedia.org; frame-src https://www.youtube.com https://www.youtube-nocookie.com; frame-ancestors 'none'; report-uri /api/csp-report;"
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
};

module.exports = nextConfig;
