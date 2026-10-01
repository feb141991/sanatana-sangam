import type { Metadata } from "next";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { FaqClient } from "./FaqClient";

export const metadata: Metadata = {
  title: "Frequently Asked Questions & Services | Shoonaya",
  description:
    "Comprehensive guide and answers about Shoonaya: daily sadhana, astronomical panchang, tactile japa mala, scripture recitations, traditions, privacy, and community.",
  alternates: { canonical: "https://www.shoonaya.com/faq" },
};

export default function FaqPage() {
  return (
    <main>
      <MarketingPageHero
        eyebrow="Help & Knowledge Base"
        title="Frequently Asked Questions"
        intro="Direct answers regarding Shoonaya services, daily practice tools, sacred calendar precision, tradition sources, and privacy commitments."
      />
      <FaqClient />
    </main>
  );
}
