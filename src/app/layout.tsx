import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AppProviders from "@/components/providers/AppProviders";
import AuthSessionGuard from "@/components/providers/AuthSessionGuard";
import WebConsentManager from "@/components/privacy/WebConsentManager";
import ClientErrorReporter from "@/components/monitoring/ClientErrorReporter";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";
import {
  Inter,
  Cormorant_Garamond,
  Noto_Sans_Devanagari,
  Noto_Sans_Gurmukhi,
} from "next/font/google";

// ── Editorial Latin fonts ────────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter-next",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

// ── Indic script fonts ────────────────────────────────────────────────────────
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600"],
  variable: "--font-deva",
  display: "swap",
});
const notoGurmukhi = Noto_Sans_Gurmukhi({
  subsets: ["gurmukhi"],
  weight: ["400", "600"],
  variable: "--font-gurmukhi",
  display: "swap",
});

const fontVars = [
  inter.variable,
  cormorant.variable,
  notoDevanagari.variable,
  notoGurmukhi.variable,
].join(" ");

const brandDescription =
  "Shoonaya: Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection. Follow your local Panchang, notice observances, and make room for daily practice.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.shoonaya.com"),
  title: "Shoonaya: Find your infinite.",
  applicationName: "Shoonaya",
  description: brandDescription,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    // iOS requires exactly 180x180 — pointing to 192x192 is the closest without a new file
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Shoonaya: Find your infinite.",
    description: brandDescription,
    siteName: "Shoonaya",
    images: [
      {
        url: "https://www.shoonaya.com/og-image.png?v=3",
        width: 1200,
        height: 630,
        alt: "Shoonaya: Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection.",
      },
    ],
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shoonaya: Find your infinite.",
    description: brandDescription,
    images: ["https://www.shoonaya.com/og-image.png?v=3"],
  },
  itunes: {
    appId: "6793055966",
  },
  verification: {
    google: "IHVjfHkB6vTUw1x8DwkvzMjI9duZwupDNX_8iStS1mc",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFBF7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a06" },
  ],
  width: "device-width",
  initialScale: 1,
  // Allow pinch-zoom for accessibility (WCAG 1.4.4).
  // iOS input auto-zoom (< 16px) is prevented via CSS font-size floor in globals.css.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

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
        <style
          dangerouslySetInnerHTML={{ __html: `body{background:#0C0A07}` }}
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
          <OrganizationJsonLd />
          <ClientErrorReporter />
          <AuthSessionGuard />
          {children}

          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#1a1a1a",
                color: "#fdf6e3",
                fontFamily: "var(--font-inter)",
              },
              success: {
                iconTheme: { primary: "#8E5E2A", secondary: "#fdf6e3" },
              },
            }}
          />
        </AppProviders>

        <WebConsentManager
          gaMeasurementId={gaMeasurementId}
          adsenseClient={adsenseClient}
        />
      </body>
    </html>
  );
}
