import type { Metadata } from "next";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { TraditionsSectionClient } from "./TraditionsSectionClient";

export const metadata: Metadata = {
  title: "Traditions & Teachings | Shoonaya",
  description:
    "Shoonaya is rooted in Sanatan Dharma and includes selected, distinct Sikh, Jain, and Buddhist experiences where available. Explore traditions and teachings in their own context.",
  alternates: { canonical: "https://www.shoonaya.com/traditions" },
};

const TIMELINE_NODES = [
  {
    year: "c. 3500 BCE",
    name: "Rigveda",
    tradition: "Sanatan Dharma",
    color: "#D88A1C",
    bgSoft: "rgba(216, 138, 28, 0.12)",
    description: "Hymns preserved through oral and textual traditions in Sanskrit.",
  },
  {
    year: "c. 500 BCE",
    name: "Tripitaka",
    tradition: "Buddhist Dharma",
    color: "#8B2D3E",
    bgSoft: "rgba(139, 45, 62, 0.12)",
    description: "Teachings associated with the Buddha, preserved in several canons.",
  },
  {
    year: "c. 200 CE",
    name: "Tattvartha Sutra",
    tradition: "Jain Dharma",
    color: "#2A6B4A",
    bgSoft: "rgba(42, 107, 74, 0.12)",
    description: "A foundational Jain text on philosophy and conduct.",
  },
  {
    year: "1604 CE",
    name: "Guru Granth Sahib Ji",
    tradition: "Sikh Dharma",
    color: "#1B5E8B",
    bgSoft: "rgba(27, 94, 139, 0.12)",
    description: "The central Sikh scripture, revered as the living Guru.",
  },
  {
    year: "2026 CE",
    name: "Shoonaya",
    tradition: "A daily spiritual sanctuary",
    color: "#C5A059",
    bgSoft: "rgba(197, 160, 89, 0.2)",
    description: "Sacred time, practice, and connection for everyday life.",
    isCurrent: true,
  },
];

export default function TraditionsPage() {
  return (
    <main>
      {/* Begin with the distinct traditions Shoonaya draws from. */}
      <MarketingPageHero
        eyebrow="Traditions and teachings"
        title="Distinct paths, honored in their own context."
        intro="Shoonaya is rooted in Sanatan Dharma and includes selected experiences from Sikh, Jain, and Buddhist traditions. Each path has its own teachings, history, and practice; Shoonaya presents them distinctly where available and does not treat them as interchangeable."
      />

      {/* Selected texts and traditions through time */}
      <section className="border-b border-[var(--card-border)] bg-[var(--surface-soft)] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            {/* Left: Narrative & Big Stats */}
            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary-strong)]">
                  Distinct traditions
                </p>
                <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-[var(--text-cream)] sm:text-5xl">
                  Each path has its own roots.
                </h2>
                <p className="mt-5 text-base leading-relaxed text-[var(--text-muted-warm)] sm:text-lg">
                  Traditions have their own vocabularies, texts, observances, and practices. Shoonaya’s Sanatan roots are clear, and selected Sikh, Jain, and Buddhist content is presented in its own context where available.
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                  <div className="font-display text-3xl font-semibold text-[var(--brand-primary-strong)]">
                    Sanatan roots
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted-warm)]">
                    Shoonaya’s spiritual foundation
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                  <div className="font-display text-3xl font-semibold text-[var(--brand-primary-strong)]">
                    Distinct paths
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted-warm)]">
                    Selected content in its own context
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                  <div className="font-display text-3xl font-semibold text-[var(--brand-primary-strong)]">
                    Daily practice
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted-warm)]">
                    Sacred time, reflection, and learning
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Chronological Timeline */}
            <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)] mb-6">
                Selected texts and traditions
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
      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24" id="choose-tradition">
        <div className="mx-auto max-w-6xl">
          <TraditionsSectionClient />
        </div>
      </section>
    </main>
  );
}
