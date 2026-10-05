import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  Share2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Compass,
} from "lucide-react";

import {
  findJournalEssay,
  getAllJournalEssays,
  getRelatedEssays,
} from "@/config/journal";

type JournalArticleProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllJournalEssays().map((essay) => ({ slug: essay.slug }));
}

export async function generateMetadata({
  params,
}: JournalArticleProps): Promise<Metadata> {
  const { slug } = await params;
  const essay = findJournalEssay(slug);

  if (!essay) return {};

  return {
    title: `${essay.title} | The Sanctuary Journal`,
    description: essay.excerpt,
    alternates: {
      canonical: `https://www.shoonaya.com/journal/${essay.slug}`,
    },
    openGraph: {
      title: `${essay.title} | Shoonaya Journal`,
      description: essay.excerpt,
      url: `https://www.shoonaya.com/journal/${essay.slug}`,
      type: "article",
      authors: [essay.author],
    },
  };
}

export default async function JournalArticlePage({ params }: JournalArticleProps) {
  const { slug } = await params;
  const essay = findJournalEssay(slug);

  if (!essay) notFound();

  const related = getRelatedEssays(essay.slug, 3);

  // Article JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: essay.title,
    description: essay.excerpt,
    datePublished: "2026-01-15T00:00:00Z",
    author: {
      "@type": "Person",
      name: essay.author,
      jobTitle: essay.authorRole,
    },
    publisher: {
      "@type": "Organization",
      name: "Shoonaya",
      url: "https://www.shoonaya.com",
    },
    mainEntityOfPage: `https://www.shoonaya.com/journal/${essay.slug}`,
  };

  return (
    <main className="w-full overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Article Header & Hero ───────────────────────────────────────── */}
      <section className="relative w-full border-b border-[var(--card-border)] bg-gradient-to-b from-[var(--surface-soft)] via-[var(--surface-base)] to-[var(--surface-base)] px-6 pt-36 pb-16 sm:px-10 lg:px-14 xl:px-20 lg:pt-44 lg:pb-24">
        {/* Devotional Ambient Halos */}
        <div
          className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(216,138,28,0.12)_0%,transparent_70%)] blur-3xl animate-aurora"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-4xl">
          {/* Back Navigation */}
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-semibold text-[var(--text-muted-warm)] hover:text-[var(--text-cream)] hover:border-[var(--brand-primary)]/40 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>All Sanctuary Reflections</span>
          </Link>

          {/* Badges & Meta */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border ${essay.traditionColor}`}
            >
              {essay.tradition}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-dim)]">
              <Clock className="size-3.5" />
              {essay.readTime}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-dim)]">
              <Calendar className="size-3.5" />
              {essay.publishedDate}
            </span>
          </div>

          {/* Title and Subtitle */}
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--text-cream)] sm:text-5xl lg:text-6xl">
            {essay.title}
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-[var(--text-muted-warm)] sm:text-xl">
            {essay.subtitle}
          </p>

          {/* Author Strip */}
          <div className="mt-10 flex items-center justify-between border-t border-[var(--card-border)]/60 pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-2.5 shadow-sm">
                <Image
                  src={essay.emblem}
                  alt={essay.tradition}
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-cream)]">
                  {essay.author}
                </p>
                <p className="text-xs text-[var(--text-dim)]">
                  {essay.authorRole}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-[var(--text-dim)]">
                The Sanctuary Journal
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Container ───────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-10 lg:px-14">
        {/* Key Takeaways Callout Box */}
        <div className="rounded-3xl border border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]/20 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-primary-strong)]">
            <Sparkles className="size-4" />
            <span>Essential Contemplations</span>
          </div>
          <ul className="mt-4 space-y-3">
            {essay.keyTakeaways.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--text-cream)]">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-[var(--brand-primary-strong)]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Narrative Article Sections */}
        <div className="mt-14 space-y-14">
          {essay.sections.map((section, idx) => (
            <section key={idx} className="space-y-6">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-cream)] sm:text-3xl border-b border-[var(--card-border)]/40 pb-3">
                {section.heading}
              </h2>

              <div className="space-y-5 text-base leading-8 text-[var(--text-muted-warm)] font-normal">
                {section.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="first-letter:text-xl">
                    {p}
                  </p>
                ))}
              </div>

              {/* Classical Quote Callout */}
              {section.quote && (
                <figure className="my-8 rounded-2xl border-l-4 border-[var(--brand-primary)] bg-[var(--surface-soft)] p-6 sm:p-8">
                  <blockquote className="font-serif italic text-lg leading-relaxed text-[var(--text-cream)]">
                    &ldquo;{section.quote.text}&rdquo;
                  </blockquote>
                  <figcaption className="mt-3 text-xs font-semibold text-[var(--brand-primary-strong)]">
                    — {section.quote.source}
                    {section.quote.context && (
                      <span className="block text-[11px] font-normal text-[var(--text-dim)] mt-0.5">
                        {section.quote.context}
                      </span>
                    )}
                  </figcaption>
                </figure>
              )}
            </section>
          ))}
        </div>

        {/* ── Practical Sadhana Guidance ──────────────────────────────────── */}
        <div className="mt-16 rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-10 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)]">
            <Compass className="size-4" />
            <span>Living Contemplative Practice</span>
          </div>

          <h3 className="mt-3 font-display text-xl font-bold text-[var(--text-cream)] sm:text-2xl">
            {essay.practiceGuidance.title}
          </h3>

          <div className="mt-6 space-y-4">
            {essay.practiceGuidance.steps.map((step, sIdx) => (
              <div key={sIdx} className="flex items-start gap-4 rounded-2xl border border-[var(--card-border)]/50 bg-[var(--surface-soft)] p-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-xs font-bold text-[var(--brand-primary-strong)]">
                  {sIdx + 1}
                </span>
                <p className="text-sm leading-relaxed text-[var(--text-muted-warm)] pt-0.5">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Author Bio Card ────────────────────────────────────────────── */}
        <div className="mt-14 rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3">
              <Image
                src={essay.emblem}
                alt={essay.author}
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)]">
                About the Author
              </p>
              <h4 className="font-display text-lg font-bold text-[var(--text-cream)]">
                {essay.author}
              </h4>
              <p className="mt-1 text-xs text-[var(--text-dim)]">
                {essay.authorBio}
              </p>
            </div>
          </div>
        </div>

        {/* ── Canonical Citations & Archival Provenance ─────────────────────── */}
        <div className="mt-14 border-t border-[var(--card-border)] pt-8">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)]">
            Primary Scriptural & Archival Sources
          </h4>
          <ul className="mt-4 space-y-2.5">
            {essay.citations.map((cite, cIdx) => (
              <li key={cIdx} className="text-xs leading-relaxed text-[var(--text-dim)]">
                <span className="font-medium text-[var(--text-muted-warm)]">{cite.text}</span> ·{" "}
                <span>{cite.reference}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Related Reflections ─────────────────────────────────────────── */}
      <section className="border-t border-[var(--card-border)] bg-[var(--surface-soft)] px-6 py-16 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)]">
                Continue the Inquiry
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold text-[var(--text-cream)]">
                Related Reflections
              </h3>
            </div>
            <Link
              href="/journal"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary-strong)] hover:underline"
            >
              <span>View All 8 Essays</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((rel) => (
              <article
                key={rel.slug}
                className="group relative flex flex-col justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm card-lift transition-all hover:border-[var(--brand-primary)]/40"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${rel.traditionColor}`}>
                      {rel.tradition}
                    </span>
                    <span className="text-[11px] text-[var(--text-dim)]">
                      {rel.readTime}
                    </span>
                  </div>

                  <Link href={`/journal/${rel.slug}`} className="block mt-4">
                    <h4 className="font-display text-lg font-semibold text-[var(--text-cream)] group-hover:text-[var(--brand-primary-strong)] transition-colors">
                      {rel.title}
                    </h4>
                  </Link>

                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted-warm)] line-clamp-2">
                    {rel.excerpt}
                  </p>
                </div>

                <div className="mt-5 border-t border-[var(--card-border)] pt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--brand-primary-strong)] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>Read Reflection</span>
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
