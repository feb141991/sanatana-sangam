/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
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
