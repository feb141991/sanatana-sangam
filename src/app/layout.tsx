import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AppProviders from '@/components/providers/AppProviders';
import {
  Inter,
  Cormorant_Garamond,
  Noto_Sans_Devanagari,
  Noto_Sans_Tamil,
  Noto_Sans_Bengali,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Telugu,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
} from 'next/font/google';

// ── Editorial Latin fonts ────────────────────────────────────────────────────
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter-next', display: 'swap' });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-cormorant', display: 'swap' });

// ── Indic script fonts ────────────────────────────────────────────────────────
const notoDevanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], weight: ['400','600'], variable: '--font-deva',     display: 'swap' });
const notoTamil      = Noto_Sans_Tamil({      subsets: ['tamil'],      weight: ['400','600'], variable: '--font-tamil',    display: 'swap' });
const notoBengali    = Noto_Sans_Bengali({    subsets: ['bengali'],    weight: ['400','600'], variable: '--font-bengali',  display: 'swap' });
const notoGurmukhi   = Noto_Sans_Gurmukhi({  subsets: ['gurmukhi'],   weight: ['400','600'], variable: '--font-gurmukhi', display: 'swap' });
const notoTelugu     = Noto_Sans_Telugu({     subsets: ['telugu'],     weight: ['400','600'], variable: '--font-telugu',   display: 'swap' });
const notoKannada    = Noto_Sans_Kannada({    subsets: ['kannada'],    weight: ['400','600'], variable: '--font-kannada',  display: 'swap' });
const notoMalayalam  = Noto_Sans_Malayalam({  subsets: ['malayalam'],  weight: ['400','600'], variable: '--font-malayalam', display: 'swap' });

const fontVars = [
  inter.variable,
  cormorant.variable,
  notoDevanagari.variable,
  notoTamil.variable,
  notoBengali.variable,
  notoGurmukhi.variable,
  notoTelugu.variable,
  notoKannada.variable,
  notoMalayalam.variable,
].join(' ');

export const metadata: Metadata = {
  title:       'Shoonaya — Find your infinite.',
  description: 'Ancient wisdom for modern seekers. Daily Panchang, Sanskrit recitation with AI scoring (Shruti), Japa, Pathshala study, and Kul family spaces — for Hindu, Sikh, Buddhist, and Jain traditions.',
  keywords:    ['panchang', 'japa', 'mantra', 'Sanskrit', 'bhakti', 'dharma', 'Hindu', 'Sikh', 'Buddhist', 'Jain', 'meditation', 'sadhana', 'kirtan', 'Vedanta', 'spiritual'],
  manifest:    '/manifest.json',
  icons: {
    icon:        [
      { url: '/favicon.ico',           sizes: 'any' },
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple:       '/icons/icon-192x192.png',
    shortcut:    '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Shoonaya',
    startupImage: [
      {
        url: '/splash/2048x2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash/1668x2388.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash/1536x2048.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash/1668x2224.png',
        media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash/1620x2160.png',
        media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash/1290x2796.png',
        media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash/1179x2556.png',
        media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash/1284x2778.png',
        media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash/1170x2532.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash/1125x2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash/1242x2688.png',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash/828x1792.png',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash/750x1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash/640x1136.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  openGraph: {
    title: 'Shoonaya — Find Your Infinite',
    description: 'Daily Panchang · Sanskrit Recitation · Japa · Pathshala · Kul',
    siteName: 'Shoonaya',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Shoonaya' }],
    type: 'website',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shoonaya — Find Your Infinite',
    description: 'Ancient wisdom for modern seekers across all dharmic traditions.',
    images: ['/og-image.png'],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FDFBF7' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1916' },
  ],
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  return (
    <html lang="en" className={fontVars}>
      <head>
        {/*
         * Cold-start tradition sync — runs synchronously before React hydrates.
         * Reads the tradition written by TraditionSync on the previous session
         * and stamps data-tradition on <html> so SacredLoader CSS responds
         * instantly without waiting for the profile fetch.
         * Pattern mirrors how next-themes avoids the dark-mode flash.
         */}
        {/*
         * Instant background paint — eliminates the white flash before
         * globals.css loads. Sets body bg synchronously from stored theme
         * preference. Dark default (#0C0A07) matches --surface-base dark.
         * Light users get #FAF6EF. No flicker on either theme.
         */}
        <style dangerouslySetInnerHTML={{ __html: `body{background:#0C0A07}` }} />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          // biome-ignore lint: intentional inline script
          dangerouslySetInnerHTML={{
            __html: `try{
  var __t=localStorage.getItem('sh_tradition');
  if(__t)document.documentElement.setAttribute('data-tradition',__t);
  var __theme=localStorage.getItem('sh_theme');
  if(__theme==='light'){document.body.style.background='#FAF6EF';}
}catch(e){}`,
          }}
        />
      </head>
      <body className="zenith-120fps">
        <AppProviders>
          {children}

          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color:      '#fdf6e3',
                fontFamily: 'var(--font-inter)',
              },
              success: { iconTheme: { primary: '#8E5E2A', secondary: '#fdf6e3' } },
            }}
          />
        </AppProviders>

        {/* ── OneSignal Push Notifications (SDK URL managed in src/lib/config.ts) ── */}
        {oneSignalAppId && (
          <>
            <Script
              src={`https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js`}
              strategy="afterInteractive"
              defer
            />
            <Script id="onesignal-init" strategy="afterInteractive">
              {`
                window.OneSignalDeferred = window.OneSignalDeferred || [];
                OneSignalDeferred.push(async function(OneSignal) {
                  await OneSignal.init({
                    appId: "${oneSignalAppId}",
                    notifyButton: { enable: false },
                    allowLocalhostAsSecureOrigin: true,
                    serviceWorkerParam: { scope: "/" },
                  });
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
