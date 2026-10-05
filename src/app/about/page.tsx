import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Compass,
  Calendar,
  BookOpen,
  Eye,
  Users,
  HeartHandshake,
} from "lucide-react";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "About Shoonaya | Find your infinite.",
  description:
    "Shoonaya — Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection. Local Panchang, daily Japa, scripture, family spaces, and community.",
  alternates: {
    canonical: "https://www.shoonaya.com/about",
  },
  openGraph: {
    title: "About Shoonaya | Find your infinite.",
    description:
      "A daily spiritual sanctuary for sacred time, practice, and connection. Notice sacred time, understand what it means to you, and make room for what matters.",
    url: "https://www.shoonaya.com/about",
  },
};

const SANCTUARY_TOOLS = [
  {
    name: "Local Panchang and Sacred Calendar",
    imageSrc: "/images/clay-relics/panchang-relic.png",
    icon: Calendar,
    href: "/panchang",
    description:
      "Follow daily tithi, nakshatra, and selected timings for your location. See observances such as Ekadashi, Amavasya, and Pradosh, with context and guidance where available.",
  },
  {
    name: "Daily Practice and Japa",
    imageSrc: "/images/clay-relics/japa-relic.png",
    icon: Sparkles,
    href: "/japa",
    description:
      "Use a mala counter and make space for mantra, sadhana, and reflection at a pace that fits your life. Build a steady rhythm through small, intentional moments.",
  },
  {
    name: "Scripture and Pathshala",
    imageSrc: "/images/clay-relics/pathshala-relic.png",
    icon: BookOpen,
    href: "/library",
    description:
      "Explore sacred texts and guided learning, with verses and explanations that help you study and reflect. Available collections include the Bhagavad Gita, Upanishads, Gurbani, Dhammapada, and Jain texts.",
  },
  {
    name: "Rashiphal and Kundali",
    imageSrc: "/images/clay-relics/astrology-relic.png",
    icon: Compass,
    href: "/kundali",
    description:
      "Explore birth-chart views and reflective astrology features as a way to consider life's patterns and possibilities.",
  },
  {
    name: "Live Darshan and Sacred Places",
    imageSrc: "/images/clay-relics/darshan-relic.png",
    icon: Eye,
    href: "/darshan",
    description:
      "Visit available Darshan streams and discover sacred places connected to Hindu, Sikh, Jain, and Buddhist communities.",
  },
  {
    name: "Kul Family Spaces",
    imageSrc: "/images/clay-relics/kul-relic.png",
    icon: Users,
    href: "/kul",
    description:
      "Preserve family lineage, memories, meaningful dates, and shared practices in a private family space.",
  },
  {
    name: "Mandali Community",
    imageSrc: "/images/clay-relics/mandali-relic.png",
    icon: HeartHandshake,
    href: "/community",
    description:
      "Connect with local circles, share reflections, join conversations, and discover community gatherings.",
  },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://www.shoonaya.com" },
          { name: "About", url: "https://www.shoonaya.com/about" },
        ]}
      />

      <main className="w-full overflow-hidden">
        {/* ── 1. Hero Section (Expansive, Edge-to-Edge) ─────────────────────────── */}
        <section className="relative w-full border-b border-[var(--card-border)] px-6 pb-20 pt-36 sm:px-10 lg:px-14 xl:px-20 lg:pb-28 lg:pt-44">
          <div className="mx-auto max-w-[1440px]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand-primary-strong)]">
              About Shoonaya
            </p>
            <h1 className="mt-5 max-w-4xl font-display text-5xl font-medium leading-[0.98] tracking-[-0.035em] text-[var(--text-cream)] sm:text-6xl lg:text-8xl">
              Find your infinite.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--text-muted-warm)] sm:text-2xl sm:leading-relaxed">
              A daily spiritual sanctuary for sacred time, practice, and connection.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#sanctuary-story"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-7 text-xs font-semibold uppercase tracking-wider text-[var(--surface-base)] shadow-sm hover:opacity-90 transition active:scale-95"
              >
                Our Purpose
                <ArrowRight className="size-3.5" />
              </a>
              <Link
                href="/features"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] px-7 text-xs font-semibold uppercase tracking-wider text-[var(--text-cream)] hover:border-[var(--brand-primary)]/40 transition active:scale-95"
              >
                Explore Living Tools
              </Link>
            </div>
          </div>
        </section>

        {/* ── 2. The Sanctuary Story (Unboxed Full-Width Narrative) ──────────── */}
        <section id="sanctuary-story" className="w-full px-6 py-20 sm:px-10 lg:px-14 xl:px-20 lg:py-28">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
                The Rhythm of the Day
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-4xl lg:text-5xl">
                Life gets busy, and meaningful days can pass without notice.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[var(--text-muted-warm)] sm:text-lg sm:leading-9">
                Shoonaya helps you stay connected to the sacred rhythm of the day: see what is unfolding in your local Panchang, understand the observances that matter to you, and find simple ways to bring reflection and practice into everyday life.
              </p>
            </div>
          </div>
        </section>

        {/* ── 3. A Growing Collection of Tools (Expansive Fluid Grid) ───────── */}
        <section className="w-full border-t border-[var(--card-border)] bg-[var(--surface-soft)] px-6 py-20 sm:px-10 lg:px-14 xl:px-20 lg:py-28">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
                Lived Practice
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-4xl lg:text-5xl">
                A Growing Collection of Tools
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[var(--text-muted-warm)] sm:text-lg">
                Explore a growing collection of tools for personal practice, learning, family, and community:
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
              {SANCTUARY_TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <article
                    key={tool.name}
                    className="group relative flex flex-col justify-between rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--shadow-soft)] transition-all hover:border-[var(--brand-primary)]/40 hover:shadow-xl"
                  >
                    <div>
                      <div className="flex items-center gap-3.5 mb-6">
                        <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-2 shadow-inner">
                          <Image
                            src={tool.imageSrc}
                            alt={tool.name}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        </div>
                        <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                          <Icon className="size-4" aria-hidden="true" />
                        </div>
                      </div>

                      <h3 className="font-display text-xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-2xl">
                        {tool.name}
                      </h3>
                      <p className="mt-3.5 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:leading-7">
                        {tool.description}
                      </p>
                    </div>

                    <div className="mt-6 border-t border-[var(--card-border)] pt-4">
                      <Link
                        href={tool.href}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary-strong)] hover:opacity-80 transition"
                      >
                        Launch tool
                        <ArrowRight className="size-3" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 4. Distinct Paths, Rooted in Respect (Full-Bleed Band) ─────────── */}
        <section className="w-full px-6 py-20 sm:px-10 lg:px-14 xl:px-20 lg:py-28">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
                Integrity & Reverence
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-4xl lg:text-5xl">
                Distinct Paths, Rooted in Respect
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[var(--text-muted-warm)] sm:text-lg sm:leading-9">
                Shoonaya is rooted in Sanatan Dharma and approaches Sikh, Jain, and Buddhist traditions as distinct paths, with their own teachings and practices. Content and tools vary by feature and tradition.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(216,138,28,0.3)] bg-[rgba(216,138,28,0.1)] px-4 py-2 text-xs font-semibold text-[#D88A1C]">
                  <span>ॐ</span> Sanatan Dharma
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(230,126,34,0.3)] bg-[rgba(230,126,34,0.1)] px-4 py-2 text-xs font-semibold text-[#E67E22]">
                  <span>ੴ</span> Sikh Dharma
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(42,107,74,0.3)] bg-[rgba(42,107,74,0.1)] px-4 py-2 text-xs font-semibold text-[#2A6B4A]">
                  <span>卐</span> Jain Dharma
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(139,45,62,0.3)] bg-[rgba(139,45,62,0.1)] px-4 py-2 text-xs font-semibold text-[#8B2D3E]">
                  <span>☸</span> Buddhist Dharma
                </span>
              </div>
            </div>

            {/* Sanctuary Quote Callout */}
            <div className="mt-16 rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--surface-soft)] p-8 sm:p-12 lg:p-14">
              <p className="font-display text-2xl font-light italic leading-relaxed text-[var(--text-cream)] sm:text-3xl lg:text-4xl">
                &ldquo;Shoonaya helps you notice sacred time, understand what it means to you, and make room for what matters.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* ── 5. Unboxed Next Steps / CTA ────────────────────────────────────── */}
        <section className="w-full border-t border-[var(--card-border)] bg-[var(--surface-soft)] px-6 py-16 sm:px-10 lg:px-14 xl:px-20">
          <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h3 className="font-display text-2xl font-semibold text-[var(--text-cream)] sm:text-3xl">
                Begin with sacred time today.
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted-warm)] sm:text-base">
                Join our Android beta release or discover living features in your browser.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/beta/android"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-7 text-xs font-semibold uppercase tracking-wider text-[var(--surface-base)] shadow-sm hover:opacity-90 transition active:scale-95"
              >
                Request Early Access
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href="/features"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-7 text-xs font-semibold uppercase tracking-wider text-[var(--text-cream)] hover:border-[var(--brand-primary)]/40 transition active:scale-95"
              >
                View Features
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
