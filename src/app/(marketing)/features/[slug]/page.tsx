import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { notFound } from "next/navigation";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { findMarketingFeature, marketingFeatures } from "@/config/marketing";

type FeaturePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return marketingFeatures.map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({
  params,
}: FeaturePageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = findMarketingFeature(slug);

  if (!feature) return {};

  return {
    title: `${feature.name} | Shoonaya App`,
    description: feature.summary,
    alternates: {
      canonical: `https://www.shoonaya.com/features/${feature.slug}`,
    },
  };
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const feature = findMarketingFeature(slug);

  if (!feature) notFound();

  const Icon = feature.icon;

  return (
    <main>
      <MarketingPageHero
        eyebrow={feature.eyebrow}
        title={feature.name}
        intro={feature.description}
      >
        <Link
          href="/beta/android"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-7 font-semibold text-[var(--surface-base)]"
        >
          Join the Android beta
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </MarketingPageHero>

      <section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="flex min-h-80 items-center justify-center rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--surface-soft)]">
            <div className="flex size-32 items-center justify-center rounded-[2.25rem] bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] shadow-[var(--shadow-soft)]">
              <Icon className="size-14" aria-hidden="true" />
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary-strong)]">
              What it is designed to support
            </p>
            <ul className="mt-8 space-y-6">
              {feature.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <span className="pt-1 text-lg text-[var(--text-muted-warm)]">
                    {highlight}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-10 border-t border-[var(--card-border)] pt-8 text-sm leading-7 text-[var(--text-dim)]">
              Product availability and depth may evolve during the Android beta.
              Public claims will follow verified release status.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--card-border)] px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link
            href="/features"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--text-muted-warm)]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All features
          </Link>
          <Link
            href="/traditions"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--brand-primary-strong)]"
          >
            See how traditions are handled
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
