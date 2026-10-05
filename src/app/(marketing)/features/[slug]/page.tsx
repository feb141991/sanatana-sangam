import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
    openGraph: {
      title: `${feature.name} | Shoonaya App`,
      description: feature.summary,
      url: `https://www.shoonaya.com/features/${feature.slug}`,
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
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {feature.deepLinks && feature.deepLinks.length > 0 && (
            <Link
              href={feature.deepLinks[0].href}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-7 font-semibold text-[var(--surface-base)] shadow-sm hover:opacity-90 transition"
            >
              {feature.deepLinks[0].label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
          <Link
            href="/beta/android"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] px-7 font-semibold text-[var(--text-cream)] hover:border-[var(--brand-primary)]/40 transition"
          >
            Request Early Access
          </Link>
        </div>
      </MarketingPageHero>

      <section className="w-full px-6 py-20 sm:px-10 lg:px-14 xl:px-20 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="flex min-h-80 flex-col items-center justify-center gap-6 rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--surface-soft)] p-8">
            <div className="relative flex size-36 items-center justify-center rounded-[2.25rem] bg-[var(--card-bg)] border border-[var(--card-border)] p-4 shadow-[var(--shadow-soft)]">
              <Image
                src={feature.imageSrc}
                alt={feature.name}
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[var(--brand-primary-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)]">
              <Icon className="size-4" />
              <span>{feature.eyebrow}</span>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-12 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary-strong)]">
              What it is designed to support
            </p>
            <ul className="mt-8 space-y-6">
              {feature.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <span className="pt-1 text-base text-[var(--text-muted-warm)] sm:text-lg">
                    {highlight}
                  </span>
                </li>
              ))}
            </ul>

            {feature.deepLinks && feature.deepLinks.length > 0 && (
              <div className="mt-10 border-t border-[var(--card-border)] pt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)] mb-4">
                  Launch & Deep Links
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {feature.deepLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={
                        link.isPrimary
                          ? "inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-xs font-semibold text-[var(--surface-base)] shadow-sm hover:opacity-90 transition active:scale-95"
                          : "inline-flex min-h-11 items-center rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-medium text-[var(--text-cream)] hover:border-[var(--brand-primary)]/40 transition active:scale-95"
                      }
                    >
                      {link.label}
                      {link.isPrimary && <ArrowRight className="size-3.5" aria-hidden="true" />}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-8 border-t border-[var(--card-border)] pt-6 text-sm leading-7 text-[var(--text-dim)]">
              Product availability and depth may evolve during the Android beta. Public claims follow verified release status.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full border-t border-[var(--card-border)] px-6 py-14 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
          <Link
            href="/features"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--text-muted-warm)] hover:text-[var(--text-cream)] transition"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All features & roadmap
          </Link>
          <Link
            href="/traditions"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--brand-primary-strong)] hover:opacity-80 transition"
          >
            Explore traditions
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
