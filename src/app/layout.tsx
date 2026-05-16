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
  description: 'Ancient wisdom for seekers. Hindu, Sikh, Buddhist, and Jain dharma breathe together in one sacred space — community, scripture, and daily practice.',
  keywords:    ['Hindu', 'Sikh', 'Buddhist', 'Jain', 'dharma', 'community', 'mandali', 'bhakti', 'śūnya', 'Shoonaya', 'ancient wisdom', 'seekers'],
  manifest:    '/manifest.json',
  icons: {
    icon:  '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Shoonaya',
  },
  openGraph: {
    title:       'Shoonaya',
    description: 'Find your infinite. Ancient wisdom for seekers — Hindu · Sikh · Buddhist · Jain',
    type:        'website',
    locale:      'en_GB',
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
