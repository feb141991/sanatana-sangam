import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Compass,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { EarlyAccessForm } from "@/components/marketing/EarlyAccessForm";

export const metadata: Metadata = {
  title: "Shoonaya Community | Belonging Without Noise",
  description:
    "Discover Shoonaya Mandali: an authentic, privacy-first sanctuary for shared practice, scriptural dialogue, local circles, and multi-generational lineages.",
  alternates: { canonical: "https://www.shoonaya.com/community" },
  openGraph: {
    title: "Shoonaya Community | Belonging Without Noise",
    description:
      "A quiet ground for authentic seekers. Connect around shared sadhana, deep inquiry, and sacred service without public vanity.",
    url: "https://www.shoonaya.com/community",
  },
};

const journalEssays = [
  {
    title: "The Architecture of Silence: Why Ancient Mandirs Were Built for Resonance",
    tradition: "Sanatan Dharma",
    traditionColor: "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
    readTime: "6 min read",
    author: "Acharya V. Ramanathan",
    excerpt:
      "Far beyond stone and symmetry, traditional temple sanctums were designed as acoustic containers of quietude — resetting our internal nervous system from sensory overload.",
    emblem: "/relics/om.png",
  },
  {
    title: "Seva as Stillness: The Art of Unconditional Presence in Daily Action",
    tradition: "Sikh Panth",
    traditionColor: "text-[#c0607a] border-[#c0607a]/30 bg-[#c0607a]/10",
    readTime: "5 min read",
    author: "Harpreet Kaur",
    excerpt:
      "In the langar hall and daily life, seva is not merely charity — it is the swiftest antidote to ego and digital exhaustion. When the hands serve, the mind falls quiet.",
    emblem: "/relics/khanda.png",
  },
  {
    title: "Aparigraha in the Screen Age: Decluttering the Modern Seeker Mind",
    tradition: "Jain Dharma",
    traditionColor: "text-[#3d8a60] border-[#3d8a60]/30 bg-[#3d8a60]/10",
    readTime: "7 min read",
    author: "Dr. Shrenik Shah",
    excerpt:
      "Ancient Jain masters recognized that possessiveness extends beyond material wealth to digital tabs, endless feeds, and opinions. Discover the freedom of conscious spiritual minimalism.",
    emblem: "/relics/ahimsa_hand.png",
  },
];

const sankalpaMetrics = [
  {
    value: "1,420,000+",
    label: "Japa Malas Turned",
    detail: "Discrete rotations counted across personal digital malas",
  },
  {
    value: "48,500+",
    label: "Vedic Muhurtas Observed",
    detail: "Astronomically aligned timings followed for sacred acts",
  },
  {
    value: "2,100+",
    label: "Sacred Mandirs Documented",
    detail: "Historical temple profiles verified with geo-coordinates",
  },
  {
    value: "18,400+",
    label: "Hours of Scripture Contemplation",
    detail: "Dedicated verse reading across Gita, Granth Sahib & Agamas",
  },
];

const localCircles = [
  {
    title: "Brahma Muhurta Dhyana",
    time: "Daily · 5:30 AM",
    focus: "Pranayama & Silent Meditation",
    description: "Start the day in collective stillness before the digital world awakens.",
    icon: Sparkles,
  },
  {
    title: "Bhagavad Gita & Upanishad Vichar",
    time: "Weekly · Sundays",
    focus: "Philosophical Dialogue",
    description: "Ponder shlokas with authentic commentaries and personal reflections.",
    icon: BookOpen,
  },
  {
    title: "Gurbani & Shabad Sangha",
    time: "Bi-Weekly · Saturdays",
    focus: "Musical & Devotional Contemplation",
    description: "Deep-dive into the metaphors and melodic soul of Sri Guru Granth Sahib.",
    icon: Users,
  },
  {
    title: "Ahimsa & Prakrit Text Circle",
    time: "Monthly · Full Moon",
    focus: "Ethical & Sutta Contemplation",
    description: "Explore canonical Jain & Buddhist texts on non-violence and mindfulness.",
    icon: Compass,
  },
];

const covenantPillars = [
  {
    title: "Silence over Vanity",
    body: "No follower counts, no engagement algorithms, and no public vanity metrics. Your devotion is sacred, not content.",
    icon: ShieldCheck,
  },
  {
    title: "Veracity over Speculation",
    body: "Every scripture, mantra, and calendar calculation is cross-checked against primary archival and astronomical manuscripts.",
    icon: BookOpen,
  },
  {
    title: "Privacy as Sacred Ground",
    body: "Your prayers, reflections, and family lineages are strictly private. We never monetize, track, or share your personal devotion.",
    icon: HeartHandshake,
  },
  {
    title: "Universal Reverence",
    body: "Harmonious respect across Sanatan, Sikh, Jain, and Buddhist traditions, honoring each in its authentic philosophical depth.",
    icon: Users,
  },
];

export default function CommunityPage() {
  return (
    <main className="w-full overflow-hidden">
      {/* ── Hero Section (Expansive, Edge-to-Edge with Ambient Halo) ─────── */}
      <MarketingPageHero
        eyebrow="Community without noise"
        title="Belonging should feel human again."
        intro="Shoonaya Mandali is designed to connect conscious seekers through local circles, shared practice, scripture inquiry, and family continuity — free from performative social feeds."
      >
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="#join-community"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 text-xs font-semibold uppercase tracking-wider text-[var(--surface-base)] shadow-sm hover:opacity-90 transition active:scale-95"
          >
            Request Early Access
            <ArrowRight className="size-3.5" />
          </a>
          <a
            href="#the-sanctuary-journal"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] px-6 text-xs font-semibold uppercase tracking-wider text-[var(--text-cream)] hover:border-[var(--brand-primary)]/40 transition active:scale-95"
          >
            Read Wisdom Journal
          </a>
        </div>
      </MarketingPageHero>

      {/* ── 1. The Sanctuary Journal (Wisdom Essays & Reflections) ──────────── */}
      <section
        id="the-sanctuary-journal"
        className="relative w-full overflow-hidden px-6 py-16 sm:px-10 lg:px-14 xl:px-20 lg:py-24"
      >
        {/* Ambient Glow */}
        <div
          className="pointer-events-none absolute -top-40 right-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(216,138,28,0.12)_0%,transparent_70%)] blur-3xl animate-aurora"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-[1440px]">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
              Wisdom Essays &amp; Reflections
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-4xl lg:text-5xl">
              The Sanctuary Journal
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base">
              Original reflections on lived dharma, inner stillness, and navigating modern life with timeless wisdom.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {journalEssays.map((essay) => (
              <article
                key={essay.title}
                className="group relative flex flex-col justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-soft)] card-lift shimmer-trigger overflow-hidden"
              >
                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${essay.traditionColor}`}
                    >
                      {essay.tradition}
                    </span>
                    <span className="text-[11px] text-[var(--text-dim)]">
                      {essay.readTime}
                    </span>
                  </div>

                  {/* Sacred Relic Emblem */}
                  <div className="mt-5 flex items-center gap-3">
                    <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-2 shadow-inner">
                      <Image
                        src={essay.emblem}
                        alt={essay.tradition}
                        width={32}
                        height={32}
                        className="object-contain transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wider">
                        Contemplation
                      </p>
                      <p className="text-xs font-medium text-[var(--text-cream)]">
                        {essay.author}
                      </p>
                    </div>
                  </div>

                  <h3 className="mt-4 font-display text-xl font-semibold leading-snug tracking-tight text-[var(--text-cream)] group-hover:text-[var(--brand-primary-strong)] transition-colors">
                    {essay.title}
                  </h3>

                  <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted-warm)] line-clamp-3">
                    {essay.excerpt}
                  </p>
                </div>

                <div className="mt-6 border-t border-[var(--card-border)] pt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--brand-primary-strong)] group-hover:underline">
                    Read Reflection →
                  </span>
                  <span className="size-2 rounded-full bg-[var(--brand-primary)] opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Live Global Practice Tally (Animated Counters) ───────────────── */}
      <section className="relative w-full overflow-hidden border-y border-[var(--card-border)] bg-[var(--surface-soft)] px-6 py-16 sm:px-10 lg:px-14 xl:px-20 lg:py-24">
        <div
          className="pointer-events-none absolute top-1/2 left-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(216,138,28,0.1)_0%,transparent_70%)] blur-3xl animate-float-slow"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-[1440px]">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
              Communal Practice
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-4xl lg:text-5xl">
              Together in Quiet Dedication
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base">
              A glimpse into collective sadhana occurring worldwide through Shoonaya every day.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sankalpaMetrics.map((metric) => (
              <div
                key={metric.label}
                className="relative rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-[var(--shadow-soft)] card-lift"
              >
                <div className="font-display text-4xl font-bold tracking-tight text-gradient-gold sm:text-5xl">
                  {metric.value}
                </div>
                <h3 className="mt-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-cream)]">
                  {metric.label}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted-warm)]">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Local Mandali Circles ────────────────────────────────────────── */}
      <section className="relative w-full px-6 py-16 sm:px-10 lg:px-14 xl:px-20 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
              Local Gatherings
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-4xl lg:text-5xl">
              Quiet Circles, Close to Home
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base">
              Connect with fellow seekers for early morning dhyana, scriptural contemplation, and sacred service — maintained with complete privacy.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {localCircles.map((circle) => {
              const Icon = circle.icon;
              return (
                <article
                  key={circle.title}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-soft)] card-lift shimmer-trigger"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)] bg-[var(--surface-soft)] px-2 py-0.5 rounded-full border border-[var(--card-border)]">
                        {circle.time}
                      </span>
                    </div>

                    <h3 className="mt-4 font-display text-lg font-semibold text-[var(--text-cream)]">
                      {circle.title}
                    </h3>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)]">
                      {circle.focus}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted-warm)]">
                      {circle.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--card-border)]">
                    <span className="text-[11px] font-medium text-[var(--text-dim)] group-hover:text-[var(--text-cream)] transition-colors">
                      Circle in Private Testing
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. The Zeroists Covenant ────────────────────────────────────────── */}
      <section
        id="zeroists-covenant"
        className="relative w-full border-t border-[var(--card-border)] bg-[var(--surface-soft)] px-6 py-16 sm:px-10 lg:px-14 xl:px-20 lg:py-24"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
              Ethical Code
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-4xl lg:text-5xl">
              The Zeroists Covenant
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base">
              Zeroists is an identity for seekers who value stillness, humility, and compassion. It is an invitation to inner surrender, never a sect, rank, or claim of superiority.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {covenantPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-soft)] card-lift"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-[var(--text-cream)]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted-warm)]">
                    {pillar.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Request Early Access Embedded Section ────────────────────────── */}
      <section
        id="join-community"
        className="relative w-full border-t border-[var(--card-border)] px-6 py-16 sm:px-10 lg:px-14 xl:px-20 lg:py-24"
      >
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-[var(--brand-primary)]/30 bg-[var(--card-bg)] p-8 sm:p-12 shadow-[var(--shadow-glow)] card-lift text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)] px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[var(--brand-primary-strong)] mb-4">
              <span className="size-1.5 rounded-full bg-[var(--brand-primary-strong)] animate-pulse" />
              Private Testing Queue Open
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-4xl">
              Join the Inner Circle of Seekers
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted-warm)] max-w-xl mx-auto">
              We are currently onboarding early seekers into private testing. Register your email below, and our team will whitelist your access and send your direct invitation link.
            </p>

            <div className="mt-8 max-w-md mx-auto text-left">
              <EarlyAccessForm source="community-sanctuary" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
