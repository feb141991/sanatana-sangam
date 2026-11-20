import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Calendar, Compass, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import { generateFestivalSeoCampaign } from '@/lib/ai/marketing-rag';
import { AppStoreBadges } from '@/components/marketing/AppStoreBadges';
import festivalRulesJson from '../../../../../../packages/dharma-rules/src/festivals/rules.json';
import {
  formatCityCoordinates,
  getFestivalCityFacts,
  resolveFestivalSeoCity,
} from '@/lib/seo/festival-city-facts';

type FestivalCityPageProps = {
  params: Promise<{ slug: string; city: string }>;
};

interface RuleRecord {
  slug: string;
  display_name: string;
}

function Fact({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--page-bg)]/45 p-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--text-cream)]">{value}</div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: FestivalCityPageProps): Promise<Metadata> {
  const { slug, city } = await params;
  const resolvedCity = resolveFestivalSeoCity(city);
  if (!resolvedCity) notFound();
  const capitalizedCity = resolvedCity.name;

  const rules = festivalRulesJson as unknown as RuleRecord[];
  const rule = rules.find((r) => r.slug === slug);
  const festName = rule ? rule.display_name : slug.replace(/-/g, ' ');

  const year = new Date().getFullYear();
  const title = `${festName} ${year} in ${capitalizedCity}: Precise Timings & Muhurta | Shoonaya`;
  const description = `Canonical ${festName} ${year} timings for ${capitalizedCity}. Real-time astronomical calculation (Drigganita), local sunrise rules, and puja windows on Shoonaya.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.shoonaya.com/festivals/${slug}/${city.toLowerCase()}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.shoonaya.com/festivals/${slug}/${city.toLowerCase()}`,
    },
  };
}

export default async function FestivalCityPage({ params }: FestivalCityPageProps) {
  const { slug, city } = await params;
  const resolvedCity = resolveFestivalSeoCity(city);
  if (!resolvedCity) notFound();
  const capitalizedCity = resolvedCity.name;
  const year = new Date().getFullYear();

  const rules = festivalRulesJson as unknown as RuleRecord[];
  const rule = rules.find((r) => r.slug === slug);
  if (!rule && slug.length < 3) notFound();

  const facts = await getFestivalCityFacts(slug, city, year);
  if (!facts) notFound();

  const campaign = await generateFestivalSeoCampaign({
    festivalSlug: slug,
    city: capitalizedCity,
    year,
    locationFacts: {
      festivalDate: facts.festivalDate,
      timezone: facts.city.tz,
      coordinates: formatCityCoordinates(facts.city),
      sunrise: facts.panchang.sunrise,
      sunset: facts.panchang.sunset,
      tithi: `${facts.panchang.paksha} ${facts.panchang.tithi}`,
      masa: facts.panchang.masaName,
    },
  });

  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-[var(--text-cream)]">
      {/* Schema.org FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: campaign.jsonLdFaqSchema }}
      />

      {/* Header & Breadcrumb */}
      <div className="border-b border-[var(--card-border)] bg-[var(--card-bg)]/40 backdrop-blur-md">
        <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
            <Link href="/" className="hover:text-[var(--text-cream)] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/journal" className="hover:text-[var(--text-cream)] transition-colors">
              Panchang & Festivals
            </Link>
            <span>/</span>
            <span className="text-[var(--brand-primary-strong)] font-medium">
              {campaign.festivalName} in {campaign.city}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-[var(--card-border)]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)] px-3.5 py-1 text-xs font-semibold text-[var(--brand-primary-strong)]">
              <MapPin className="size-3.5" />
              <span>Location-Specific Astrometry ({campaign.city})</span>
            </div>

            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-5xl text-[var(--text-cream)]">
              {campaign.h1}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-[var(--text-muted-warm)] sm:text-lg">
              A location-specific observance date and daily Panchang context for devotees in {campaign.city}.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={`/get?utm_source=seo&utm_medium=landing-hero&utm_campaign=${campaign.festivalSlug}-${campaign.city.toLowerCase()}`}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-[var(--bg-dark)] shadow-md hover:bg-[var(--brand-primary-hover)] transition-all card-lift"
              >
                <span>Get Real-Time {campaign.festivalName} Alarms</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Deterministic local facts: the page's city value is visible and auditable. */}
          <section className="rounded-2xl border border-[var(--brand-primary)]/30 bg-[var(--card-bg)] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                <MapPin className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--text-cream)]">
                  {campaign.festivalName} in {facts.city.name}
                </h2>
                <p className="text-xs text-[var(--text-dim)]">
                  {facts.city.country} · {facts.city.tz} · {formatCityCoordinates(facts.city)}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Fact label="Calculated date" value={facts.festivalDate ?? 'No engine date available'} />
              <Fact label="Local sunrise" value={facts.panchang.sunrise} />
              <Fact label="Local sunset" value={facts.panchang.sunset} />
              <Fact label="Tithi at local noon" value={`${facts.panchang.paksha} ${facts.panchang.tithi}`} />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--text-dim)]">
              <span>Masa: {facts.panchang.masaName}</span>
              <span>Nakshatra: {facts.panchang.nakshatra}</span>
              <span>{facts.calculationLabel}</span>
            </div>
          </section>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Introductory Overview */}
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                <Calendar className="size-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[var(--text-cream)]">
                Observance Overview
              </h2>
            </div>
            <div
              className="prose prose-invert max-w-none text-sm leading-relaxed text-[var(--text-muted-warm)] space-y-3"
              dangerouslySetInnerHTML={{ __html: campaign.introHtml }}
            />
          </div>

          {/* Astronomical Precision Breakdown */}
          <div className="rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--card-bg)] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                <Compass className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--text-cream)]">
                  Astronomical Timing & Horizon in {campaign.city}
                </h2>
                <p className="text-xs text-[var(--text-dim)]">
                  Why universal instants create different civil dates
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-muted-warm)]">
              {facts.festivalDate
                ? `${campaign.astronomicalTimingExplanation} For ${facts.city.name}, the corrected engine resolves this observance to ${facts.festivalDate}; the local sunrise is ${facts.panchang.sunrise} and sunset is ${facts.panchang.sunset} (${facts.city.tz}).`
                : `No computed date is published for ${campaign.festivalName} in ${facts.city.name} for ${year}. The page does not substitute a generic Indian date.`}
            </p>
          </div>

          {/* Classical Significance */}
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[var(--text-cream)]">
                Classical Shastric Foundations
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-muted-warm)]">
              {campaign.classicalSignificance}
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-xl font-bold text-[var(--text-cream)] mb-6">
              Frequently Asked Questions ({campaign.festivalName} in {campaign.city})
            </h2>
            <div className="space-y-4">
              {campaign.faqItems.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[var(--card-border)] bg-[var(--page-bg)]/50 p-4 transition-all"
                >
                  <h3 className="font-semibold text-sm text-[var(--text-cream)]">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted-warm)]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* App Conversion Card */}
          <div className="rounded-3xl border border-[var(--brand-primary)]/40 bg-gradient-to-b from-[var(--card-bg)] to-[var(--brand-primary-soft)]/20 p-8 text-center sm:p-12 shadow-lg">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary-strong)] ring-1 ring-[var(--brand-primary)]/30">
              <Sparkles className="size-7" />
            </div>

            <h3 className="mt-4 font-display text-2xl font-bold text-[var(--text-cream)] sm:text-3xl">
              Experience Sacred Time Without Distraction
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-muted-warm)]">
              Get exact horizon-verified alarms for {campaign.festivalName}, Brahma Muhurta, and Choghadiya in {campaign.city}. Completely ad-free and grounded in classical Shastras.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <AppStoreBadges />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
