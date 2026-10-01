import type { Metadata } from "next";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { SitemapClient } from "./SitemapClient";

export const metadata: Metadata = {
  title: "Site Map | Shoonaya",
  description:
    "Explore the complete directory of living traditions, daily practice, sacred calendar, scriptures, learning, and services on Shoonaya.",
  alternates: { canonical: "https://www.shoonaya.com/sitemap" },
};

export default function SitemapPage() {
  return (
    <main>
      <MarketingPageHero
        eyebrow="Directory"
        title="Site Map"
        intro="Explore the complete directory of living traditions, daily practices, sacred calendars, learning paths, and services across Shoonaya."
      />
      <SitemapClient />
    </main>
  );
}
