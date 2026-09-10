import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { marketingFeatures } from "@/config/marketing";

export const metadata: Metadata = {
  title: "Shoonaya Features | Practice, Learning and Community",
  description:
    "Explore Shoonaya features for daily sadhana, sacred calendar context, Japa, scripture learning, community, sacred places and family continuity.",
  alternates: { canonical: "https://www.shoonaya.com/features" },
};

export default function FeaturesPage() {
  return (
    <main>
      <MarketingPageHero
        eyebrow="The app"
        title="A dharmic life, held together."
        intro="Shoonaya connects daily practice, learning, sacred time, family and community without turning them into disconnected utilities."
      />

      <section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-3">
          {marketingFeatures.map((feature, index) => (
            <Link
              key={feature.slug}
              href={`/features/${feature.slug}`}
              className="group flex min-h-[22rem] flex-col rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            >
              <div className="flex items-start justify-between">
                <feature.icon
                  className="size-7 text-[var(--brand-primary-strong)]"
                  aria-hidden="true"
                />
                <span className="font-display text-2xl text-[var(--text-dim)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary-strong)]">
                {feature.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-none">
                {feature.name}
              </h2>
              <p className="mt-5 text-sm leading-7 text-[var(--text-muted-warm)]">
                {feature.summary}
              </p>
              <span className="mt-auto flex items-center gap-2 pt-8 text-sm font-semibold text-[var(--brand-primary-strong)]">
                Explore this experience
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
