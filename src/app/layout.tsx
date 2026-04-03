import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title:       'Sanatana Sangam — The Global Home for Sanatani',
  description: 'A living digital sabha — connecting Sanatani worldwide through community, knowledge, and bhakti.',
  keywords:    ['Hindu', 'Sanatana Dharma', 'community', 'mandali', 'dharma', 'bhakti', 'temple'],
  manifest:    '/manifest.json',
  icons: {
    icon:  '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title:       'Sanatana Sangam',
    description: 'The Global Home for Sanatani — community, knowledge, and bhakti in one place.',
    type:        'website',
    locale:      'en_GB',
  },
};

export const viewport: Viewport = {
  themeColor:   '#1f6b72',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  return (
    <html lang="en">
      <body>
        {children}

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color:      '#fdf6e3',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#1f6b72', secondary: '#fdf6e3' } },
          }}
        />

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
