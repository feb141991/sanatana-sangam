import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { notFound } from "next/navigation";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import {
  findMarketingTradition,
  marketingTraditions,
} from "@/config/marketing";

type TraditionPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return marketingTraditions.map((tradition) => ({ slug: tradition.slug }));
}

export async function generateMetadata({
  params,
}: TraditionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tradition = findMarketingTradition(slug);

  if (!tradition) return {};

  return {
    title: `${tradition.name} Path | Shoonaya`,
    description: tradition.summary,
    alternates: {
      canonical: `https://www.shoonaya.com/traditions/${tradition.slug}`,
    },
  };
}

export default async function TraditionPage({ params }: TraditionPageProps) {
  const { slug } = await params;
  const tradition = findMarketingTradition(slug);

  if (!tradition) notFound();

  return (
    <main>
      <MarketingPageHero
        eyebrow={tradition.nativeName}
        title={`${tradition.name} path`}
        intro={tradition.description}
      />

      <section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.65fr_1.35fr]">
          <div>
            <p className="font-display text-6xl text-[var(--brand-primary-strong)] sm:text-7xl">
              {tradition.nativeName}
            </p>
            <p className="mt-6 text-lg leading-8 text-[var(--text-muted-warm)]">
              {tradition.summary}
            </p>
          </div>
          <div className="rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary-strong)]">
              Our product commitments
            </p>
            <ul className="mt-8 space-y-6">
              {tradition.commitments.map((commitment) => (
                <li key={commitment} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <span className="pt-1 text-lg leading-8 text-[var(--text-muted-warm)]">
                    {commitment}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--card-border)] px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link
            href="/traditions"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--text-muted-warm)]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All traditions
          </Link>
          <Link
            href="/beta/android"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--brand-primary-strong)]"
          >
            Join the Android beta
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
