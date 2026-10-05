import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { marketingFeatures, upcomingMarketingFeatures } from "@/config/marketing";

export const metadata: Metadata = {
  title: "Shoonaya Features | Living Tools & Upcoming Roadmap",
  description:
    "Explore Shoonaya's spiritual sanctuary: astronomy-backed Panchang, digital Japa mala, verified scriptures, Vedic astrology charts, temple darshans, family spaces, and upcoming features.",
  alternates: { canonical: "https://www.shoonaya.com/features" },
  openGraph: {
    title: "Shoonaya Features | Sacred Time, Practice & Connection",
    description:
      "Explore Shoonaya's daily spiritual sanctuary: local Panchang, Japa mala, scripture study, family spaces, community, and upcoming roadmap.",
    url: "https://www.shoonaya.com/features",
  },
};

export default function FeaturesPage() {
  return (
    <main className="w-full overflow-hidden">
      {/* ── Hero Section (Expansive, Edge-to-Edge) ─────────────────────────── */}
      <MarketingPageHero
        eyebrow="Shoonaya Ecosystem"
        title="Sacred time. Practice. Connection."
        intro="Shoonaya brings sacred time, daily sadhana, scripture study, family spaces, and community into one tranquil sanctuary. Explore our live tools and preview what is coming next on our roadmap."
      >
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="#available-features"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 text-xs font-semibold uppercase tracking-wider text-[var(--surface-base)] shadow-sm hover:opacity-90 transition active:scale-95"
          >
            Explore Live Features
            <ArrowRight className="size-3.5" />
          </a>
          <a
            href="#upcoming-features"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] px-6 text-xs font-semibold uppercase tracking-wider text-[var(--text-cream)] hover:border-[var(--brand-primary)]/40 transition active:scale-95"
          >
            <Sparkles className="size-3.5 text-[var(--brand-primary-strong)]" />
            Upcoming Roadmap
          </a>
        </div>
      </MarketingPageHero>

      {/* ── Active Features Section (Optimized 3-Column Responsive Grid) ───── */}
      <section id="available-features" className="relative w-full overflow-hidden px-6 py-16 sm:px-10 lg:px-14 xl:px-20 lg:py-24">
        {/* Ambient Devotional Glow */}
        <div
          className="pointer-events-none absolute -top-40 right-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(216,138,28,0.12)_0%,transparent_70%)] blur-3xl animate-aurora"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-10 left-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(197,160,89,0.07)_0%,transparent_70%)] blur-3xl animate-float-slow"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-[1440px]">
          {/* Section Header */}
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
              Available Today
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-4xl lg:text-5xl">
              Core Spiritual Tools & Practices
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base">
              Every tool is engineered with reverence, astronomical precision, and traditional integrity to fit your real daily life.
            </p>
          </div>

          {/* Features Grid: Compact, Crisp 3-Column Layout */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {marketingFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.slug}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-soft)] card-lift shimmer-trigger overflow-hidden"
                >
                  <div>
                    {/* Top Row: Emblems + Live Status Badge */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-2 shadow-inner">
                          <Image
                            src={feature.imageSrc}
                            alt={feature.name}
                            width={34}
                            height={34}
                            className="object-contain transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1"
                          />
                        </div>
                        <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                          <Icon className="size-4" aria-hidden="true" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] bg-[rgba(42,107,74,0.12)] text-[#2a6b4a] dark:text-[#4ade80] border border-[rgba(42,107,74,0.25)] dark:border-[rgba(74,222,128,0.25)] shadow-sm">
                          <span className="size-1 rounded-full bg-[#2a6b4a] dark:bg-[#4ade80] animate-pulse" />
                          ✦ Live Now
                        </span>
                        <span className="font-display text-sm font-light text-[var(--text-dim)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                    </div>

                    {/* Titles */}
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-primary-strong)]">
                      {feature.eyebrow}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-2xl">
                      {feature.name}
                    </h3>

                    {/* Description */}
                    <p className="mt-2.5 text-xs leading-relaxed text-[var(--text-muted-warm)] sm:text-sm line-clamp-3">
                      {feature.description}
                    </p>

                    {/* Key Highlights: Compact 2-bullet list */}
                    <ul className="my-4 space-y-2 border-t border-[var(--card-border)]/60 pt-3">
                      {feature.highlights.slice(0, 2).map((highlight) => (
                        <li key={highlight} className="flex items-start gap-2 text-xs leading-snug text-[var(--text-cream)]">
                          <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                            <Check className="size-2.5" aria-hidden="true" />
                          </span>
                          <span className="line-clamp-2">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Deep Links Container: Sleek & Compact */}
                  <div className="mt-4 border-t border-[var(--card-border)] pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {feature.deepLinks.slice(0, 2).map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={
                              link.isPrimary
                                ? "inline-flex min-h-8 items-center gap-1 rounded-lg bg-[var(--brand-primary)] px-3 py-1 text-xs font-semibold text-[var(--surface-base)] shadow-sm hover:opacity-90 transition active:scale-95"
                                : "inline-flex min-h-8 items-center rounded-lg border border-[var(--card-border)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-medium text-[var(--text-cream)] hover:border-[var(--brand-primary)]/40 transition active:scale-95"
                            }
                          >
                            {link.label}
                            {link.isPrimary && <ArrowRight className="size-2.5" aria-hidden="true" />}
                          </Link>
                        ))}
                      </div>
                      <Link
                        href={`/features/${feature.slug}`}
                        className="inline-flex min-h-8 items-center text-xs font-semibold text-[var(--brand-primary-strong)] underline underline-offset-4 hover:opacity-80 transition"
                      >
                        Guide →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Upcoming Features: Compact, High-Signal 4-Column Grid ──────────── */}
      <section
        id="upcoming-features"
        className="relative w-full overflow-hidden border-t border-[var(--card-border)] bg-[var(--surface-soft)] px-6 py-16 sm:px-10 lg:px-14 xl:px-20 lg:py-24"
      >
        {/* Ambient Subtle Glow */}
        <div
          className="pointer-events-none absolute top-1/4 -right-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(192,96,122,0.08)_0%,transparent_70%)] blur-3xl animate-float-slow"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-[1440px]">
          {/* Section Header */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)] px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[var(--brand-primary-strong)]">
              <Sparkles className="size-3" />
              Roadmap & Active R&D
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-4xl lg:text-5xl">
              On the Horizon: Upcoming Features
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base">
              We are actively developing next-generation tools to deepen personal practice and global community connection. These experiences will roll out progressively to Android beta and web users.
            </p>
          </div>

          {/* Full-width Grid: 4-Column Responsive Layout */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingMarketingFeatures.map((upcoming) => {
              return (
                <article
                  key={upcoming.name}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-soft)] card-lift shimmer-trigger overflow-hidden"
                >
                  <div>
                    {/* Coming Soon Top Banner */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary-strong)] border border-[var(--brand-primary)]/30">
                        ★ {upcoming.badge}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">
                        R&D
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-2 shadow-inner">
                        <Image
                          src={upcoming.imageSrc}
                          alt={upcoming.name}
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)]">
                          {upcoming.eyebrow}
                        </p>
                        <h3 className="font-display text-lg font-semibold text-[var(--text-cream)]">
                          {upcoming.name}
                        </h3>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted-warm)] line-clamp-3">
                      {upcoming.description}
                    </p>

                    <ul className="mt-4 space-y-1.5 border-t border-[var(--card-border)]/60 pt-3">
                      {upcoming.highlights.slice(0, 2).map((h) => (
                        <li key={h} className="flex items-start gap-2 text-[11px] text-[var(--text-muted-warm)]">
                          <span className="mt-1 size-1 rounded-full bg-[var(--brand-primary)] shrink-0" />
                          <span className="line-clamp-2">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 border-t border-[var(--card-border)] pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-dim)]">
                      Early Access
                    </span>
                    <Link
                      href="/early-access"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary-strong)] hover:underline"
                    >
                      Request Access
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
