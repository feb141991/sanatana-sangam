import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import {
  PANCHATANTRA_HUB_PATH,
  RETELLING_NOTICE,
  SITE_ORIGIN,
  listPublicPanchatantraStories,
  panchatantraStoryPath,
} from "@/lib/panchatantra-public";

const HUB_URL = `${SITE_ORIGIN}${PANCHATANTRA_HUB_PATH}`;
const TITLE = "Panchatantra Stories in English and Hindi | Shoonaya";
const DESCRIPTION =
  "Classic Panchatantra fables retold in English and Hindi, each with its moral. पंचतंत्र की कहानियाँ हिंदी और अंग्रेज़ी में।";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: HUB_URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: HUB_URL, type: "website" },
};

export default function PanchatantraHubPage() {
  const stories = listPublicPanchatantraStories();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Panchatantra Stories",
    description: DESCRIPTION,
    url: HUB_URL,
    inLanguage: ["en", "hi"],
    publisher: { "@type": "Organization", name: "Shoonaya", url: SITE_ORIGIN },
    hasPart: stories.map((story) => ({
      "@type": "Article",
      headline: story.title,
      url: `${SITE_ORIGIN}${panchatantraStoryPath(story.slug, "en")}`,
    })),
  };

  return (
    <main className="w-full overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <MarketingPageHero
        eyebrow="Panchatantra stories"
        title="Panchatantra stories, retold."
        intro="Classic animal fables, each with its moral, in English and Hindi. पंचतंत्र की कहानियाँ, हर कथा के साथ उसकी सीख।"
      />

      <section className="mx-auto max-w-3xl px-6 py-14 sm:px-10 lg:py-20">
        <h2 className="font-display text-2xl font-semibold text-[var(--text-cream)]">What is the Panchatantra?</h2>
        <p className="mt-4 text-lg leading-8 text-[var(--text-muted-warm)]">
          The Panchatantra is an ancient collection of Sanskrit animal fables in five books, traditionally attributed
          to Vishnu Sharma. Each tale teaches a lesson about wisdom, friendship, trust or foolishness, which is why it
          has been told to children and kings alike for centuries.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[var(--text-dim)]">{RETELLING_NOTICE.en}</p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20 sm:px-10">
        <ul className="space-y-4">
          {stories.map((story) => (
            <li
              key={story.id}
              className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8"
            >
              <div className="flex items-start gap-4">
                <span aria-hidden="true" className="text-3xl leading-none">
                  {story.portrait}
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold leading-snug text-[var(--text-cream)]">
                    {story.title}
                  </h3>
                  <p lang="hi" className="mt-1 text-base leading-7 text-[var(--text-muted-warm)]">
                    {story.titleHi}
                  </p>
                  <p className="mt-3 text-base leading-7 text-[var(--text-muted-warm)]">{story.moral}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--text-dim)]">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {story.durationMin} min read
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={panchatantraStoryPath(story.slug, "en")}
                      className="inline-flex min-h-11 items-center rounded-full border border-[var(--card-border)] px-5 text-sm font-semibold text-[var(--text-cream)] transition-colors hover:border-[var(--brand-primary-strong)]"
                    >
                      Read in English
                    </Link>
                    <Link
                      href={panchatantraStoryPath(story.slug, "hi")}
                      hrefLang="hi"
                      lang="hi"
                      className="inline-flex min-h-11 items-center rounded-full border border-[var(--card-border)] px-5 text-sm font-semibold text-[var(--text-cream)] transition-colors hover:border-[var(--brand-primary-strong)]"
                    >
                      हिंदी में पढ़ें
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-6">
          <p className="flex-1 text-base leading-7 text-[var(--text-muted-warm)]">
            More Panchatantra stories are in the Shoonaya app.
          </p>
          <Link
            href="/get"
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--brand-primary-strong)] px-5 text-sm font-semibold text-[var(--text-cream)]"
          >
            Get the app
          </Link>
        </div>
      </section>
    </main>
  );
}
