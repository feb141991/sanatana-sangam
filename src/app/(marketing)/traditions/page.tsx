import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { LegacyExperienceFrame } from "@/components/marketing/LegacyExperienceFrame";
import { marketingTraditions } from "@/config/marketing";

export const metadata: Metadata = {
  title: "Dharmic Traditions in Shoonaya",
  description:
    "Learn how Shoonaya approaches Hindu, Sikh, Buddhist and Jain paths with distinct vocabulary, sources, observances and community context.",
  alternates: { canonical: "https://www.shoonaya.com/traditions" },
};

export default function TraditionsPage() {
  return (
    <main>
      <MarketingPageHero
        eyebrow="Many paths, held with care"
        title="Difference is part of belonging."
        intro="Shoonaya creates one shared home without presenting distinct traditions as interchangeable themes or claiming one practice is universal."
      />

      <section className="px-4 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary-strong)]">
                Living voices
              </p>
              <h2 className="mt-4 font-display text-5xl font-medium leading-none sm:text-6xl">
                Enter each path on its own terms.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[var(--text-muted-warm)] lg:justify-self-end">
              Move between the four original Shoonaya panels to encounter each
              tradition’s language, verse, calendar and daily-life context. The
              carousel and its motion are preserved from the homepage experience.
            </p>
          </div>
          <LegacyExperienceFrame
            section="traditions"
            title="Shoonaya four-tradition verse carousel"
            className="min-h-[55rem] lg:min-h-[47rem]"
          />
        </div>
      </section>

      <section className="border-t border-[var(--card-border)] bg-[var(--surface-soft)] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary-strong)]">
              Go deeper
            </p>
            <h2 className="mt-4 font-display text-5xl font-medium leading-none sm:text-6xl">
              Context beyond the carousel.
            </h2>
            <p className="mt-6 text-base leading-8 text-[var(--text-muted-warm)]">
              These doorways explain how Shoonaya preserves vocabulary, sources,
              observances and community context without flattening distinct paths
              into one generic experience.
            </p>
          </div>
          {marketingTraditions.map((tradition, index) => (
            <Link
              key={tradition.slug}
              href={`/traditions/${tradition.slug}`}
              className="group grid gap-8 rounded-[2.25rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] md:grid-cols-[0.35fr_0.65fr] md:items-center sm:p-10"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  Path {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-4 font-display text-3xl text-[var(--brand-primary-strong)]">
                  {tradition.nativeName}
                </p>
                <h2 className="mt-2 font-display text-5xl font-semibold">
                  {tradition.name}
                </h2>
              </div>
              <div>
                <p className="text-lg leading-8 text-[var(--text-muted-warm)]">
                  {tradition.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-[var(--brand-primary-strong)]">
                  Explore this path
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
