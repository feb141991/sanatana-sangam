import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Scroll, BookOpen, Compass, Flame } from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { LegacyExperienceFrame } from "@/components/marketing/LegacyExperienceFrame";
import { marketingTraditions } from "@/config/marketing";

export const metadata: Metadata = {
  title: "Dharmic Traditions & 5,000-Year Story | Shoonaya",
  description:
    "Explore four living traditions: Sanatan, Sikh, Buddhist, and Jain, united in one home across 5,000 years of unbroken wisdom.",
  alternates: { canonical: "https://www.shoonaya.com/traditions" },
};

const TIMELINE_NODES = [
  {
    year: "c. 3500 BCE",
    name: "Rigveda",
    tradition: "Sanatan Dharma",
    color: "#D88A1C",
    bgSoft: "rgba(216, 138, 28, 0.12)",
    description: "The oldest known human text. Sanskrit. Oral. Eternal.",
  },
  {
    year: "c. 500 BCE",
    name: "Tripitaka",
    tradition: "Buddhist Dharma",
    color: "#8B2D3E",
    bgSoft: "rgba(139, 45, 62, 0.12)",
    description: "The Buddha's teachings. Pali. Preserved across Asia.",
  },
  {
    year: "c. 200 CE",
    name: "Tattvartha Sutra",
    tradition: "Jain Dharma",
    color: "#2A6B4A",
    bgSoft: "rgba(42, 107, 74, 0.12)",
    description: "Jain cosmology and ethics. The science of liberation.",
  },
  {
    year: "1604 CE",
    name: "Guru Granth Sahib Ji",
    tradition: "Sikh Dharma",
    color: "#1B5E8B",
    bgSoft: "rgba(27, 94, 139, 0.12)",
    description: "The living Guru. Multi-faith. The ultimate sangam.",
  },
  {
    year: "2026 CE",
    name: "Shoonaya",
    tradition: "The Living Sangam",
    color: "#C5A059",
    bgSoft: "rgba(197, 160, 89, 0.2)",
    description: "One home for all four paths. The next chapter begins now.",
    isCurrent: true,
  },
];

export default function TraditionsPage() {
  return (
    <main>
      {/* 1. START WITH: A 5,000-YEAR STORY */}
      <MarketingPageHero
        eyebrow="A 5,000-Year Story"
        title="Four traditions. One home. For the first time."
        intro="The Bhagavad Gita. The Guru Granth Sahib Ji. The Dhammapada. The Agamas. Four living traditions, each with thousands of years of wisdom, millions of daily practitioners, and a global diaspora seeking connection with their roots. They have always deserved a home worthy of them. Shoonaya is that home."
      />

      {/* 5,000-Year Story Timeline & Stats Section */}
      <section className="border-b border-[var(--card-border)] bg-[var(--surface-soft)] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            {/* Left: Narrative & Big Stats */}
            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary-strong)]">
                  Living Continuity
                </p>
                <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-[var(--text-cream)] sm:text-5xl">
                  Unbroken wisdom across millennia.
                </h2>
                <p className="mt-5 text-base leading-relaxed text-[var(--text-muted-warm)] sm:text-lg">
                  Each path brings distinct vocabulary, scriptural canon, sacred dates, and ritual nuance. Shoonaya never flattens them into a generic blend, providing dedicated, tradition-qualified experiences grounded in source provenance (Pramana).
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                  <div className="font-display text-3xl font-semibold text-[var(--brand-primary-strong)]">
                    1.5B+
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted-warm)]">
                    Dharmic Souls Worldwide
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                  <div className="font-display text-3xl font-semibold text-[var(--brand-primary-strong)]">
                    Pramana
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted-warm)]">
                    Source-Grounded Wisdom
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                  <div className="font-display text-3xl font-semibold text-[var(--brand-primary-strong)]">
                    5,000
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted-warm)]">
                    Years of Wisdom
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Chronological Timeline */}
            <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)] mb-6">
                Chronological Lineage
              </p>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--card-border)]">
                {TIMELINE_NODES.map((node, i) => (
                  <div key={i} className="relative group">
                    {/* Glowing Node Dot */}
                    <div
                      className={`absolute -left-[1.85rem] top-1.5 flex items-center justify-center rounded-full transition-transform group-hover:scale-125 ${
                        node.isCurrent
                          ? "h-4 w-4 ring-4 ring-[#C5A059]/20"
                          : "h-3 w-3"
                      }`}
                      style={{
                        backgroundColor: node.color,
                        boxShadow: `0 0 10px ${node.color}66`,
                      }}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)]">
                          {node.year}
                        </span>
                        <span className="text-xs text-[var(--text-dim)]">•</span>
                        <span className="text-xs text-[var(--text-muted-warm)] font-medium">
                          {node.tradition}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-medium text-[var(--text-cream)]">
                        {node.name}
                      </h3>
                      <p className="text-sm text-[var(--text-muted-warm)]">
                        {node.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THEN FOLLOWS: CHOOSE YOUR TRADITION */}
      <section className="px-4 py-16 sm:px-8 lg:px-10 lg:py-24" id="choose-tradition">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center max-w-3xl mx-auto space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary-strong)]">
              Choose Your Tradition
            </p>
            <h2 className="font-display text-4xl font-medium leading-tight sm:text-5xl text-[var(--text-cream)]">
              Four paths, one Sangam.
            </h2>
            <p className="text-base leading-8 text-[var(--text-muted-warm)] sm:text-lg">
              Shoonaya honours the full breadth of dharmic wisdom across Hindu, Sikh,
              Buddhist, and Jain. Each tradition has its own dedicated experience
              within one shared community. Switch between the tabs below to explore authentic verses, sacred symbols, and daily practices.
            </p>
          </div>

          <LegacyExperienceFrame
            section="traditions"
            title="Shoonaya four-tradition verse carousel"
            className="min-h-[55rem] lg:min-h-[47rem]"
          />
        </div>
      </section>

      {/* 3. GO DEEPER: CONTEXT BEYOND THE CAROUSEL */}
      <section className="border-t border-[var(--card-border)] bg-[var(--surface-soft)] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary-strong)]">
              Go deeper
            </p>
            <h2 className="mt-4 font-display text-5xl font-medium leading-none sm:text-6xl text-[var(--text-cream)]">
              Context beyond the carousel.
            </h2>
            <p className="mt-6 text-base leading-8 text-[var(--text-muted-warm)]">
              These dedicated doorways explain how Shoonaya preserves vocabulary, sources,
              observances, and community context without flattening distinct paths
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
                <h2 className="mt-2 font-display text-5xl font-semibold text-[var(--text-cream)]">
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
