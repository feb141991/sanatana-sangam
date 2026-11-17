import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";

import { AppStoreBadges } from "@/components/marketing/AppStoreBadges";
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

      <section className="px-6 py-14 sm:px-10 lg:px-14 xl:px-20 lg:py-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center">
            <div className="max-w-3xl">
              <h2 className="font-display text-2xl font-semibold text-[var(--text-cream)]">What is the Panchatantra?</h2>
              <p className="mt-4 text-lg leading-8 text-[var(--text-muted-warm)] [text-wrap:pretty]">
                The Panchatantra is an ancient collection of Sanskrit animal fables in five books, traditionally attributed
                to Vishnu Sharma. Each tale teaches a lesson about wisdom, friendship, trust or foolishness, which is why it
                has been told to children and kings alike for centuries.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-dim)]">{RETELLING_NOTICE.en}</p>
            </div>

            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)] p-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)]">
                  For Schools, Homeschoolers & Educational Blogs
                </span>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-[var(--text-cream)]">
                  Embed a free daily rotating Panchatantra story widget on your website with 1 line of HTML.
                </p>
              </div>
              <Link
                href="/stories/panchatantra/embed"
                className="inline-flex min-h-11 items-center rounded-full bg-[var(--brand-primary-strong)] px-5 text-xs font-semibold text-[var(--text-cream)] hover:opacity-90 transition-opacity"
              >
                Get Free Embed Code →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto max-w-[1440px]">
          <ul className="grid gap-6 md:grid-cols-2">
            {stories.map((story) => (
              <li
                key={story.id}
                className="flex flex-col justify-between rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <span aria-hidden="true" className="text-3xl leading-none">
                    {story.portrait}
                  </span>
                  <div className="flex-1 min-w-0">
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

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-6 sm:p-8">
            <p className="flex-1 text-base leading-7 text-[var(--text-muted-warm)]">
              More Panchatantra stories are in the Shoonaya Android app. iOS coming soon.
            </p>
            <AppStoreBadges size="sm" />
          </div>
        </div>
      </section>
    </main>
  );
}
