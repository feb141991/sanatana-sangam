/** @type {import('next').NextConfig} */
const path = require('path');
const kathaAliases = require('./src/lib/katha-aliases.json');
const packageJson = require('./package.json');

const releaseIdentity = {
  NEXT_PUBLIC_RELEASE_SHA:
    process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || 'local',
  NEXT_PUBLIC_DEPLOYMENT_URL:
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'local',
  NEXT_PUBLIC_APP_VERSION: packageJson.version,
  NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
};

const nextConfig = {
  output: 'standalone',
  env: releaseIdentity,
  async redirects() {
    return [
      {
        source: '/landing.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/vichaar-sabha/:path*',
        destination: '/mandali',
        permanent: true,
      },
      {
        source: '/vichaar-sabha',
        destination: '/mandali',
        permanent: true,
      },
      ...Object.entries(kathaAliases).map(([alias, canonicalId]) => ({
        source: `/bhakti/katha/${alias}`,
        destination: `/bhakti/katha/${canonicalId}`,
        permanent: true,
      })),
    ];
  },
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
              "connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://api.sarvam.ai https://onesignal.com https://api.onesignal.com https://tts.bhashini.ai https://overpass-api.de https://overpass.kumi.systems https://nominatim.openstreetmap.org https://api.geoapify.com https://pagead2.googlesyndication.com https://adservice.google.com https://www.google-analytics.com https://vitals.vercel-insights.com",
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://img.icons8.com https://i.ytimg.com https://*.tile.openstreetmap.org https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://www.google.com https://www.gstatic.com https://www.google-analytics.com",
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
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
  webpack: (config) => {
    // Resolve engine workspace packages via src/index.ts during dev
    config.resolve.alias = {
      ...config.resolve.alias,
      '@sangam/sadhana-engine': path.resolve(__dirname, 'packages/sadhana-engine/src/index.ts'),
      '@sangam/pathshala-engine': path.resolve(__dirname, 'packages/pathshala-engine/src/index.ts'),
      // Force every import of these to the exact same file, regardless of
      // which chunk (main bundle vs the lazily-loaded @react-three/fiber
      // chunk) requests it. A single `npm overrides` dedupe on disk was not
      // enough -- Next's own chunk-splitting still bundled a second, private
      // copy of `scheduler` (and therefore a disconnected React internals
      // object) into the async DivineDiyaCanvas chunk, which is what threw
      // "Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')"
      // on Home 100% of the time that component mounted (incidents
      // ce_ce629613, ce_fca6e023, ce_f254a5ad, ce_0d941ade, ce_a678bf20,
      // ce_9499b8ef). Aliasing to an absolute resolved path makes webpack
      // treat it as one module identity across every chunk, which npm
      // overrides alone cannot guarantee once code-splitting is involved.
      // The '$' suffix anchors this to an EXACT-match specifier only --
      // without it, webpack treats the alias as a prefix match and it also
      // hijacks subpaths like 'react/jsx-runtime' and 'react-dom/client',
      // which breaks the build entirely (every file using JSX fails to
      // resolve react/jsx-runtime).
      react$: require.resolve('react'),
      'react-dom$': require.resolve('react-dom'),
      scheduler$: require.resolve('scheduler'),
    };
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    if (!workflowEnabled) {
      const workflowStub = path.resolve(__dirname, 'src/workflows/local-stubs.ts');
      config.resolve.alias['workflow/api$'] = workflowStub;
      config.resolve.alias['@/workflows/account-deletion$'] = workflowStub;
      config.resolve.alias['@/workflows/push-notifications$'] = workflowStub;
      config.resolve.alias[path.resolve(__dirname, 'src/workflows/account-deletion.ts')] = workflowStub;
      config.resolve.alias[path.resolve(__dirname, 'src/workflows/push-notifications.ts')] = workflowStub;
    }
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

// Enable Workflow transforms only by explicit opt-in. Vercel sets VERCEL_URL
// for every build, but the Workflow package also expects its own runtime
// path/config; enabling transforms just because a build runs on Vercel causes
// /.well-known/workflow page-data collection to fail.
const workflowEnabled = Boolean(
  process.env.ENABLE_VERCEL_WORKFLOWS === 'true' ||
    process.env.ENABLE_WORKFLOW_LOCAL === 'true'
);

module.exports = workflowEnabled ? require('workflow/next').withWorkflow(nextConfig) : nextConfig;
