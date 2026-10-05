import type { Metadata } from "next";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { getAllJournalEssays } from "@/config/journal";
import { JournalIndexClient } from "./JournalIndexClient";

export const metadata: Metadata = {
  title: "The Sanctuary Journal: Contemplative Essays & Lived Wisdom | Shoonaya",
  description:
    "Original long-form reflections on lived dharma, sacred architecture, astronomical timekeeping, silent meditation, and ethical mindfulness for the modern seeker.",
  alternates: {
    canonical: "https://www.shoonaya.com/journal",
  },
  openGraph: {
    title: "The Sanctuary Journal: Contemplative Essays | Shoonaya",
    description:
      "Original long-form reflections on lived dharma, sacred architecture, and mindful living.",
    url: "https://www.shoonaya.com/journal",
  },
};

export default function JournalPage() {
  const essays = getAllJournalEssays();

  return (
    <main className="w-full overflow-hidden">
      <MarketingPageHero
        eyebrow="The Sanctuary Journal"
        title="Timeless reflections for the conscious seeker."
        intro="In-depth wisdom essays exploring sacred geometry, deep contemplation, celestial time, and selfless service: bridging classical tradition with modern clarity."
      />

      <section className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 lg:px-14 xl:px-20 lg:py-24">
        <JournalIndexClient essays={essays} />
      </section>
    </main>
  );
}
