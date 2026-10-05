"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Clock, Search, Sparkles } from "lucide-react";
import type { JournalEssay } from "@/config/journal";

type JournalIndexClientProps = {
  essays: JournalEssay[];
};

export function JournalIndexClient({ essays }: JournalIndexClientProps) {
  const [selectedTradition, setSelectedTradition] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const traditions = useMemo(() => {
    return ["All", "Sanatan Dharma", "Sikh Panth", "Jain Dharma", "Buddhist Dharma"];
  }, []);

  const filteredEssays = useMemo(() => {
    return essays.filter((essay) => {
      const matchesTradition =
        selectedTradition === "All" ||
        essay.tradition.toLowerCase().includes(selectedTradition.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        essay.title.toLowerCase().includes(query) ||
        essay.subtitle.toLowerCase().includes(query) ||
        essay.excerpt.toLowerCase().includes(query) ||
        essay.author.toLowerCase().includes(query);

      return matchesTradition && matchesSearch;
    });
  }, [essays, selectedTradition, searchQuery]);

  const featured = essays[0];

  return (
    <div className="space-y-16">
      {/* Featured Essay Spotlight */}
      {selectedTradition === "All" && !searchQuery && featured && (
        <section aria-label="Featured Reflection" className="relative">
          <div className="rounded-3xl border border-[var(--brand-primary)]/40 bg-gradient-to-br from-[var(--surface-soft)] via-[var(--card-bg)] to-[var(--surface-soft)] p-8 sm:p-12 shadow-[var(--shadow-soft)] card-lift overflow-hidden">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-primary)]/40 bg-[var(--brand-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)]">
                <Sparkles className="size-3.5" />
                Featured Reflection
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${featured.traditionColor}`}>
                {featured.tradition}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)]">
                <Clock className="size-3.5" />
                {featured.readTime}
              </span>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
              <div>
                <Link href={`/journal/${featured.slug}`} className="group block">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-cream)] sm:text-3xl lg:text-4xl group-hover:text-[var(--brand-primary-strong)] transition-colors">
                    {featured.title}
                  </h2>
                </Link>
                <p className="mt-4 text-base leading-relaxed text-[var(--text-muted-warm)] sm:text-lg">
                  {featured.subtitle}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-dim)]">
                  {featured.excerpt}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Link
                    href={`/journal/${featured.slug}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--brand-primary)] bg-[var(--brand-primary)] px-6 text-xs font-semibold uppercase tracking-wider text-black shadow-md hover:brightness-110 transition active:scale-95"
                  >
                    <span>Read Full Essay</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                  <span className="text-xs text-[var(--text-dim)]">
                    By {featured.author} · {featured.publishedDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative flex size-32 sm:size-40 items-center justify-center rounded-3xl border border-[var(--brand-primary)]/30 bg-[var(--surface-base)] p-6 shadow-inner">
                  <Image
                    src={featured.emblem}
                    alt={featured.tradition}
                    width={96}
                    height={96}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-y border-[var(--card-border)] py-6">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter by tradition">
          {traditions.map((trad) => {
            const isActive = selectedTradition === trad;
            return (
              <button
                key={trad}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedTradition(trad)}
                className={`inline-flex min-h-10 items-center rounded-full px-4 text-xs font-medium transition-all ${
                  isActive
                    ? "border border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] font-semibold shadow-sm"
                    : "border border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-muted-warm)] hover:border-[var(--brand-primary)]/40 hover:text-[var(--text-cream)]"
                }`}
              >
                {trad === "All" ? "All Traditions" : trad}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[260px] sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search essays, authors, themes..."
            aria-label="Search essays"
            className="w-full rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] py-2.5 pl-10 pr-4 text-xs text-[var(--text-cream)] placeholder-[var(--text-dim)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
          />
        </div>
      </div>

      {/* Essays Grid */}
      <section aria-label="Wisdom Essays">
        {filteredEssays.length === 0 ? (
          <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-12 text-center">
            <BookOpen className="mx-auto size-10 text-[var(--text-dim)]" />
            <h3 className="mt-4 font-display text-lg font-semibold text-[var(--text-cream)]">
              No reflections found
            </h3>
            <p className="mt-2 text-xs text-[var(--text-muted-warm)]">
              Try adjusting your search query or selecting a different tradition filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedTradition("All");
                setSearchQuery("");
              }}
              className="mt-5 inline-flex min-h-10 items-center rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-5 text-xs font-semibold text-[var(--text-cream)] hover:border-[var(--brand-primary)]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEssays.map((essay) => (
              <article
                key={essay.slug}
                className="group relative flex flex-col justify-between rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-soft)] card-lift shimmer-trigger transition-all hover:border-[var(--brand-primary)]/50"
              >
                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${essay.traditionColor}`}
                    >
                      {essay.tradition}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-dim)]">
                      <Clock className="size-3" />
                      {essay.readTime}
                    </span>
                  </div>

                  {/* Emblem & Author */}
                  <div className="mt-5 flex items-center gap-3">
                    <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-2 shadow-inner">
                      <Image
                        src={essay.emblem}
                        alt={essay.tradition}
                        width={32}
                        height={32}
                        className="object-contain transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[var(--text-cream)]">
                        {essay.author}
                      </p>
                      <p className="text-[10px] text-[var(--text-dim)] truncate max-w-[180px]">
                        {essay.authorRole}
                      </p>
                    </div>
                  </div>

                  {/* Title & Excerpt */}
                  <Link href={`/journal/${essay.slug}`} className="block mt-4">
                    <h3 className="font-display text-xl font-semibold leading-snug tracking-tight text-[var(--text-cream)] group-hover:text-[var(--brand-primary-strong)] transition-colors">
                      {essay.title}
                    </h3>
                  </Link>

                  <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted-warm)] line-clamp-3">
                    {essay.excerpt}
                  </p>
                </div>

                {/* Footer Read Action */}
                <div className="mt-6 border-t border-[var(--card-border)] pt-4 flex items-center justify-between">
                  <Link
                    href={`/journal/${essay.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary-strong)] group-hover:translate-x-1 transition-transform"
                  >
                    <span>Read Reflection</span>
                    <ArrowRight className="size-3" />
                  </Link>
                  <span className="size-2 rounded-full bg-[var(--brand-primary)] opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
