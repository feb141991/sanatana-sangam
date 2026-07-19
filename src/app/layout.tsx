import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AppProviders from '@/components/providers/AppProviders';
import AuthSessionGuard from '@/components/providers/AuthSessionGuard';
import {
  Inter,
  Cormorant_Garamond,
  Noto_Sans_Devanagari,

  Noto_Sans_Gurmukhi,
} from 'next/font/google';

// ── Editorial Latin fonts ────────────────────────────────────────────────────
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter-next', display: 'swap' });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-cormorant', display: 'swap' });

// ── Indic script fonts ────────────────────────────────────────────────────────
const notoDevanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], weight: ['400','600'], variable: '--font-deva',     display: 'swap' });
const notoGurmukhi   = Noto_Sans_Gurmukhi({  subsets: ['gurmukhi'],   weight: ['400','600'], variable: '--font-gurmukhi', display: 'swap' });

const fontVars = [
  inter.variable,
  cormorant.variable,
  notoDevanagari.variable,
  notoGurmukhi.variable,
].join(' ');

export const metadata: Metadata = {
  title:       'Shoonaya App | Sanatan, Sikh, Jain & Buddhist Spiritual App',
  description: 'Shoonaya is a spiritual app for Daily Dharma, Panchang, scripture, japa, festivals, and community across Sanatan, Hindu, Sikh, Jain, and Buddhist traditions.',
  keywords:    [
      // Brand
      'Shoonaya', 'shoonaya app', 'Shoonya', 'shoonya app',
      // Traditions (short + full)
      'Hindu', 'Hinduism', 'Sikh', 'Sikhism', 'Buddhist', 'Buddhism', 'Jain', 'Jainism',
      'Sanatan', 'Sanatan Dharma', 'Vedic',
      // App category
      'spiritual app', 'Hindu app', 'prayer app', 'devotional app', 'Indian spiritual app',
      // Daily practice
      'sadhana', 'japa', 'japa mala', 'mala', 'nitya karma', 'dinacharya', 'meditation',
      // Bhakti content
      'bhakti', 'aarti', 'stotram', 'bhajan', 'shloka', 'kirtan', 'mantra',
      // Most-searched content
      'Hanuman Chalisa', 'Gayatri Mantra', 'Bhagavad Gita', 'Gurbani', 'Nitnem',
      // Calendar & panchang
      'panchang', 'Hindu calendar', 'festival calendar', 'tithi', 'nakshatra',
      'Diwali', 'Navratri', 'Ekadashi', 'Gurpurab',
      // Tirtha
      'tirtha', 'pilgrimage', 'temple', 'mandir',
      // Concepts & language
      'dharma', 'karma', 'moksha', 'Sanskrit', 'Vedanta',
    ],
  manifest:    '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico',            sizes: 'any' },
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    // iOS requires exactly 180x180 — pointing to 192x192 is the closest without a new file
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Shoonaya',
    startupImage: [
      // ── iPhone 15 Pro Max / 16 Plus (430×932 @3x) ──
      { url: '/splash/1290x2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // ── iPhone 15 Pro / 15 / 14 Pro (393×852 @3x) ──
      { url: '/splash/1179x2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // ── iPhone 14 Plus / 13 Pro Max / 12 Pro Max (428×926 @3x) ──
      { url: '/splash/1284x2778.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // ── iPhone 14 / 13 / 12 (390×844 @3x) ──
      { url: '/splash/1170x2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // ── iPhone 13 mini / 12 mini / X / Xs (375×812 @3x) ──
      { url: '/splash/1125x2436.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // ── iPhone 11 Pro Max / Xs Max (414×896 @3x) ──
      { url: '/splash/1242x2688.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // ── iPhone 11 / XR (414×896 @2x) ──
      { url: '/splash/828x1792.png',  media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // ── iPhone 8 / SE 2nd gen (375×667 @2x) ──
      { url: '/splash/750x1334.png',  media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // ── iPhone SE 1st gen (320×568 @2x) ──
      { url: '/splash/640x1136.png',  media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // ── iPad Pro 12.9" (1024×1366 @2x) ──
      { url: '/splash/2048x2732.png', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // ── iPad Pro 11" / Air 4+5 (834×1194 @2x) ──
      { url: '/splash/1668x2388.png', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // ── iPad Air 3 / Pro 10.5" (834×1112 @2x) ──
      { url: '/splash/1668x2224.png', media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // ── iPad mini 6 (744×1133 — use 1536x2048 as closest) ──
      { url: '/splash/1536x2048.png', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
    ],
  },
  openGraph: {
    title: 'Shoonaya App | Find Your Infinity',
    description: 'Daily Dharma, Panchang, scripture, japa, festivals and community across Sanatan, Sikh, Jain and Buddhist traditions.',
    siteName: 'Shoonaya',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Shoonaya — Find Your Infinity. Daily Dharma, Panchang & Community for Hindu, Sikh, Buddhist and Jain traditions.' }],
    type: 'website',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shoonaya App | Find Your Infinity',
    description: 'Daily Dharma, Panchang, scripture, japa, festivals and community across Sanatan, Sikh, Jain and Buddhist traditions.',
    images: ['/og-image.png'],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'google-adsense-account': 'ca-pub-6518026066446033',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FDFBF7' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a06' },
  ],
  width:        'device-width',
  initialScale: 1,
  // Allow pinch-zoom for accessibility (WCAG 1.4.4).
  // iOS input auto-zoom (< 16px) is prevented via CSS font-size floor in globals.css.
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-548KZ0TBHD';

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
        {/* Preconnect hints — DNS + TLS handshake before first paint */}
        <link rel="preconnect" href="https://cdn.onesignal.com" />
        <link rel="dns-prefetch" href="https://cdn.onesignal.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <style dangerouslySetInnerHTML={{ __html: `body{background:#0C0A07}` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://www.shoonaya.com/#organization",
                "name": "Shoonaya",
                "url": "https://www.shoonaya.com",
                "logo": "https://www.shoonaya.com/icons/icon-512x512.png",
                "description": "Shoonaya is a spiritual companion app for Daily Dharma, Panchang, scripture, japa, festivals and community across Sanatan, Sikh, Jain and Buddhist traditions.",
              },
              {
                "@type": "WebSite",
                "@id": "https://www.shoonaya.com/#website",
                "url": "https://www.shoonaya.com",
                "name": "Shoonaya",
                "publisher": { "@id": "https://www.shoonaya.com/#organization" },
              },
              {
                "@type": "SoftwareApplication",
                "@id": "https://www.shoonaya.com/#app",
                "name": "Shoonaya",
                "alternateName": "Shoonya",
                "applicationCategory": "LifestyleApplication",
                "applicationSubCategory": "Spiritual App",
                "operatingSystem": "Web, iOS, Android",
                "description": "Shoonaya is a spiritual companion app for Daily Dharma, Panchang, scripture, japa, festivals and community across Sanatan, Sikh, Jain and Buddhist traditions.",
                "url": "https://www.shoonaya.com",
                "image": "https://www.shoonaya.com/og-image.png",
                "screenshot": "https://www.shoonaya.com/og-image.png",
                "publisher": { "@id": "https://www.shoonaya.com/#organization" },
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "description": "Core features free — Daily Dharma, Panchang, japa, scripture, festival calendar and Tirtha Map.",
                },
                "featureList": [
                  "Daily Dharma & sacred text",
                  "Vedic Panchang with tithi, nakshatra, and rahu kalam",
                  "Japa & mala counter with streak tracking",
                  "Sacred festival calendar across four traditions",
                  "Tirtha map — temples, gurdwaras, and sacred sites",
                  "Guided scripture study paths (Pathshala)",
                  "Community and local sangha discovery (Mandali)",
                  "Family lineage and Kul management",
                  "Tradition-aware for Hindu, Sikh, Buddhist, and Jain",
                ],
                "inLanguage": ["en", "hi", "pa"],
                "countriesSupported": "Worldwide",
              },
              {
                "@type": "FAQPage",
                "@id": "https://www.shoonaya.com/#faq",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What is Shoonaya?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Shoonaya is a spiritual companion app built for seekers of Sanatan, Sikh, Jain and Buddhist wisdom. It brings Daily Dharma, Panchang, scripture, japa, sacred festivals, and community into one living space — personalised to your tradition, your language, and your timezone. The name comes from Shoonya — the Sanskrit word for zero, emptiness, and infinite potential.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Is Shoonaya only for Hindus?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "No. Shoonaya is built for four dharmic traditions — Sanatan (Hindu), Sikh, Jain and Buddhist. The app adapts its content, calendar, scripture and community features based on your tradition. A Sikh user sees Gurbani, Gurpurab reminders and Sikh community content. A Buddhist user sees Dhamma teachings, Pali texts and mindfulness practices. Everyone belongs here.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Does Shoonaya work outside India?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes — Shoonaya is built specifically for the global diaspora. Whether you are in London, Toronto, Dubai, Singapore, Sydney or New York, the app finds temples and gurdwaras near you, shows your local Panchang timings, and connects you with your local community.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Is Shoonaya free?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Core features are completely free — Daily Dharma, Panchang, japa counter, scripture library, festival calendar and the Tirtha Map. The tradition should never be behind a paywall. Premium features for deeper community spaces, family lineage tools and advanced learning paths are available through Shoonaya Premium.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "How is Shoonaya different from Headspace, Calm or other meditation apps?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Headspace and Calm are Western mindfulness products. Shoonaya is rooted in living dharmic tradition — with actual scripture, Panchang, japa, community, family lineage, and sacred calendar built in. It is not generic wellness. It knows what Ekadashi is, who Guru Nanak Dev Ji was, and what the Dhammapada says.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Is my spiritual data private?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. Your japa count, prayers, reflections and check-ins are private by default. You choose what to share — with family, your local community (Mandali), or publicly. Your spiritual practice is yours. We do not sell personal data.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Is Shoonaya live?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Shoonaya is live now as a web app. You can enter from your browser today; native iOS and Android apps are planned later.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "How do I install Shoonaya as a web app on iPhone?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Open Shoonaya in Safari, tap the Share button, then choose Add to Home Screen. Shoonaya will appear on your home screen like a native app.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Are native iOS and Android apps available?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Not yet. Shoonaya is live as a web app today. Native iOS and Android apps are planned later, but the web app already works on phone, tablet, and desktop.",
                    },
                  },
                ],
              },
            ],
          })}}
        />
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
          <AuthSessionGuard />
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
              {`window.OneSignalDeferred=window.OneSignalDeferred||[];OneSignalDeferred.push(async function(OneSignal){await OneSignal.init({appId:"${oneSignalAppId}",notifyButton:{enable:false},allowLocalhostAsSecureOrigin:true,serviceWorkerPath:"/OneSignalSDKWorker.js",serviceWorkerUpdaterPath:"/OneSignalSDKUpdaterWorker.js",serviceWorkerParam:{scope:"/"}});});`}
            </Script>
          </>
        )}
        {/* ── Google Analytics 4 — aggregate web analytics only ─────────────── */}
        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaMeasurementId}',{send_page_view:true,allow_google_signals:false,allow_ad_personalization_signals:false});`}
            </Script>
          </>
        )}
        {/* ── Google AdSense ── */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6518026066446033"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
