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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.sarvam.ai https://api.groq.com https://texttospeech.googleapis.com https://onesignal.com; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.supabase.co https://img.icons8.com https://i.ytimg.com; frame-ancestors 'none'; report-uri /api/csp-report;"
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
