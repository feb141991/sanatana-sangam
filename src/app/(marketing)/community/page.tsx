import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  HeartHandshake,
  MapPin,
  Users,
} from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";

export const metadata: Metadata = {
  title: "Shoonaya Community | Belonging Without Noise",
  description:
    "Discover Shoonaya’s approach to local Mandali, shared practice, family continuity and respectful dharmic community.",
  alternates: { canonical: "https://www.shoonaya.com/community" },
};

const communityPillars = [
  {
    title: "Local Mandali",
    body: "Discover nearby seekers and community spaces while keeping personal location and participation boundaries clear.",
    icon: MapPin,
  },
  {
    title: "Shared practice",
    body: "Gather around practice, learning and service rather than an endless attention-driven feed.",
    icon: Users,
  },
  {
    title: "Living learning",
    body: "Continue thoughtful conversations around scripture and tradition with sources and context in view.",
    icon: BookOpen,
  },
  {
    title: "Family continuity",
    body: "Give families a private-first place to preserve memory, lineage and important traditions across distance.",
    icon: HeartHandshake,
  },
] as const;

export default function CommunityPage() {
  return (
    <main>
      <MarketingPageHero
        eyebrow="Community without noise"
        title="Belonging should feel human again."
        intro="Shoonaya is designed to connect people through local community, shared practice, learning and family continuity—not through pressure to perform publicly."
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
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
          {communityPillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-[2.25rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--shadow-soft)] sm:p-10"
            >
              <pillar.icon
                className="size-7 text-[var(--brand-primary-strong)]"
                aria-hidden="true"
              />
              <h2 className="mt-8 font-display text-4xl font-semibold">
                {pillar.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-[var(--text-muted-warm)]">
                {pillar.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--card-border)] bg-[var(--surface-soft)] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary-strong)]">
            The Zeroists
          </p>
          <h2 className="mt-5 font-display text-5xl font-medium sm:text-6xl">
            Seekers returning to the source.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted-warm)]">
            Zeroists is a humble community identity: one home, many paths. It is
            an invitation to belonging, never a rank, sect or claim of
            superiority.
          </p>
        </div>
      </section>
    </main>
  );
}
