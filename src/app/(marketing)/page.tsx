import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CircleDot,
  ShieldCheck,
  Users,
} from "lucide-react";

import { HeroFeatureCarousel } from "@/components/marketing/HeroFeatureCarousel";
import { marketingFeatures, marketingTraditions } from "@/config/marketing";

export const metadata: Metadata = {
  title: "Shoonaya | A Modern Dharmic Companion",
  description:
    "Discover Shoonaya, a native dharmic companion for daily sadhana, sacred time, scripture, family and community across Hindu, Sikh, Buddhist and Jain paths.",
  alternates: { canonical: "https://www.shoonaya.com/" },
};

const coreAreas = [
  {
    name: "Sacred Calendar",
    description: "Sacred-time context shaped by place and tradition.",
    href: "/features/sacred-calendar",
    icon: CalendarDays,
  },
  {
    name: "Daily Sadhana",
    description: "A grounded rhythm for everyday practice.",
    href: "/features/daily-sadhana",
    icon: CircleDot,
  },
  {
    name: "Pathshala",
    description: "Scripture learning with source context.",
    href: "/features/pathshala",
    icon: BookOpen,
  },
  {
    name: "Mandali",
    description: "Community built around belonging, not noise.",
    href: "/features/mandali",
    icon: Users,
  },
] as const;

export default function MarketingHomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Shoonaya",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Android",
    description:
      "A modern dharmic companion for daily practice, sacred time, scripture, family and community.",
    url: "https://www.shoonaya.com/",
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="relative min-h-dvh overflow-hidden px-5 pb-16 pt-32 sm:px-8 lg:px-10 lg:pb-20 lg:pt-36">
        <Image
          src="/images/marketing/shoonaya-dawn.webp"
          alt="Himalayan river valley at dawn with a temple along the water"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-base)] via-[var(--surface-base)]/90 to-[var(--surface-base)]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-base)] via-transparent to-[var(--surface-base)]/40" />

        <div className="relative mx-auto grid min-h-[calc(100dvh-9rem)] max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-primary-strong)]">
              Your daily dharmic companion
            </p>
            <h1 className="mt-6 font-display text-[clamp(3.5rem,7vw,7.3rem)] font-medium leading-[0.86] tracking-[-0.045em] text-[var(--text-cream)]">
              Ancient wisdom.
              <span className="mt-3 block text-[var(--brand-primary-strong)]">
                Made part of your day.
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--text-muted-warm)] sm:text-xl">
              Daily sadhana, sacred time, scripture, family and community—shaped
              with care for Hindu, Sikh, Buddhist and Jain paths.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/beta/android"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-7 font-semibold text-[var(--surface-base)] shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
              >
                Join the Android beta
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/features"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--surface-raised)]/80 px-7 font-semibold text-[var(--text-cream)] backdrop-blur-xl transition-colors hover:bg-[var(--surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              >
                Explore Shoonaya
              </Link>
            </div>
            <p className="mt-6 text-sm text-[var(--text-dim)]">
              Android beta access · Native app experience · iOS planned later
            </p>
          </div>

          <div className="hidden lg:block">
            <HeroFeatureCarousel />
          </div>
        </div>
      </section>

      <section
        id="discover"
        className="border-y border-[var(--card-border)] bg-[var(--surface-raised)] px-5 py-4 sm:px-8 lg:px-10"
        aria-label="Core Shoonaya experiences"
      >
        <div className="mx-auto grid max-w-7xl sm:grid-cols-2 lg:grid-cols-4">
          {coreAreas.map((area) => (
            <Link
              key={area.name}
              href={area.href}
              className="group flex min-h-32 gap-4 border-b border-[var(--card-border)] px-3 py-6 transition-colors hover:bg-[var(--brand-primary-soft)] sm:odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0"
            >
              <area.icon
                className="mt-1 size-6 shrink-0 text-[var(--brand-primary-strong)]"
                aria-hidden="true"
              />
              <span>
                <span className="block font-display text-xl font-semibold text-[var(--text-cream)]">
                  {area.name}
                </span>
                <span className="mt-1 block text-sm leading-6 text-[var(--text-muted-warm)]">
                  {area.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
                One home, many paths
              </p>
              <h2 className="mt-5 font-display text-5xl font-medium leading-none sm:text-6xl">
                Designed around living traditions.
              </h2>
              <p className="mt-6 text-lg leading-8 text-[var(--text-muted-warm)]">
                Shoonaya does not treat dharmic traditions as interchangeable
                themes. Vocabulary, sources, observances and practice remain
                appropriately distinct.
              </p>
              <Link
                href="/traditions"
                className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--brand-primary-strong)]"
              >
                Explore the traditions
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {marketingTraditions.map((tradition) => (
                <Link
                  key={tradition.slug}
                  href={`/traditions/${tradition.slug}`}
                  className="rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-7 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                >
                  <p className="font-display text-2xl text-[var(--brand-primary-strong)]">
                    {tradition.nativeName}
                  </p>
                  <h3 className="mt-5 font-display text-3xl font-semibold">
                    {tradition.name}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted-warm)]">
                    {tradition.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface-soft)] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
                A complete dharmic companion
              </p>
              <h2 className="mt-5 max-w-3xl font-display text-5xl font-medium leading-none sm:text-6xl">
                Practice, learning and belonging in one place.
              </h2>
            </div>
            <Link
              href="/features"
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--brand-primary-strong)]"
            >
              View every feature
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {marketingFeatures.slice(0, 6).map((feature) => (
              <Link
                key={feature.slug}
                href={`/features/${feature.slug}`}
                className="group rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-7 transition-colors hover:bg-[var(--surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              >
                <feature.icon
                  className="size-7 text-[var(--brand-primary-strong)]"
                  aria-hidden="true"
                />
                <h3 className="mt-8 font-display text-3xl font-semibold">
                  {feature.name}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--text-muted-warm)]">
                  {feature.summary}
                </p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary-strong)]">
                  Discover more
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--shadow-strong)] sm:p-12 lg:grid-cols-[0.75fr_1.25fr] lg:p-16">
          <div className="flex size-16 items-center justify-center rounded-3xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
            <ShieldCheck className="size-8" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
              Pramana in view
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium sm:text-5xl">
              Trust is part of the product.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--text-muted-warm)]">
              Sacred content deserves visible provenance, careful rights
              handling and honest uncertainty. Unsupported material remains
              withheld rather than being filled with generic prose.
            </p>
            <Link
              href="/sources"
              className="mt-7 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--brand-primary-strong)]"
            >
              See our source approach
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--card-border)] bg-[var(--surface-raised)] px-5 py-24 text-center sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
            Android beta
          </p>
          <h2 className="mt-5 font-display text-5xl font-medium leading-none sm:text-6xl">
            Help shape the next doorway.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted-warm)]">
            Join the Android beta to test Shoonaya on a real device and share
            considered feedback as the native experience develops.
          </p>
          <Link
            href="/beta/android"
            className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-8 font-semibold text-[var(--surface-base)]"
          >
            Join the Android beta
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
