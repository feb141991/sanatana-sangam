'use client';

/**
 * VratCarousel — swipeable card carousel for upcoming sacred days & multi-day observance series.
 *
 * Renders platform-appropriate cards from either:
 *  1. Canonical ObservanceSeries DTOs (daily_journey, festival_cluster, recurring_series)
 *  2. Standalone single-observance Festival items
 *
 * Preserves strict editorial guards, same-date multi-child independent routing,
 * and fail-closed under-review state protection.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { CalendarDays, AlertCircle, Flame, Sparkles } from 'lucide-react';
import type { Festival } from '@/lib/festivals';
import { resolveVratSlug } from '@/lib/vrat-data';
import type { ObservanceSeries, ObservanceSeriesChild } from '../../../contracts/observance-series-contract';
import {
  calendarDayDistance,
  getSafeChildEditorialCopy,
  getSafeSeriesName,
  getSeriesCardCopy,
  getSeriesCardChildren,
  getSeriesReviewMessage,
  isSeriesStartWithinWindow,
  type SeriesCardLanguage,
} from '@/lib/calendar/series-card-helpers';

const HOME_OBSERVANCE_WINDOW_DAYS = 3;

// ── Helpers ────────────────────────────────────────────────────────────────────
function daysFromReference(dateStr: string, spiritualDate: string): number {
  return calendarDayDistance(spiritualDate, dateStr) ?? 0;
}

function formatFestDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', weekday: 'short',
  });
}

function getVratHref(festival: Festival): string | null {
  if (festival.route_kind === 'vrat') {
    return festival.route_slug ?? resolveVratSlug(festival.name);
  }
  if (festival.route_kind === null || festival.route_kind === undefined) {
    return resolveVratSlug(festival.name);
  }
  return null;
}

// ── Badge helpers ──────────────────────────────────────────────────────────────
function DaysBadge({ days, lang }: { days: number; lang: SeriesCardLanguage }) {
  const copy = getSeriesCardCopy(lang);
  if (days === 0) {
    return (
      <span className="text-[9px] font-bold px-2.5 py-1 rounded-full"
        style={{ background: 'var(--brand-primary)', color: 'var(--brand-accent)' }}>
        {copy.today}
      </span>
    );
  }
  if (days === 1) {
    return (
      <span className="text-[10px] font-bold" style={{ color: 'var(--brand-primary)' }}>
        {copy.tomorrow}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold" style={{ color: 'var(--text-dim)' }}>
      {copy.inDays(days)}
    </span>
  );
}

// ── Series Card Component ──────────────────────────────────────────────────────
function SeriesChildCard({
  series,
  child,
  lang,
  spiritualDate,
}: {
  series: ObservanceSeries;
  child: ObservanceSeriesChild;
  lang: SeriesCardLanguage;
  spiritualDate: string;
}) {
  const days = child.civilDate
    ? daysFromReference(child.civilDate, spiritualDate)
    : series.startDate ? daysFromReference(series.startDate, spiritualDate) : 0;
  const { title, subtitle, description } = getSafeChildEditorialCopy(child, lang, {
    calendarProfile: series.profile.calendar,
    tradition: series.tradition,
  });
  const href = child.routeKind === 'vrat' && child.routeSlug
    ? `/vrat/${encodeURIComponent(child.routeSlug)}`
    : null;
  const totalCount = series.totalDays ?? series.children.length;
  const copy = getSeriesCardCopy(lang);
  const seriesName = getSafeSeriesName(series, lang, {
    calendarProfile: series.profile.calendar,
    tradition: series.tradition,
  });

  const isConcluded = series.status === 'concluding' || (child.sequence === totalCount && days === 0);
  const statusLine = series.status === 'upcoming'
    ? `${seriesName} · ${copy.begins} ${days === 0 ? copy.today : days === 1 ? copy.tomorrow : copy.inDays(days)}`
    : isConcluded
    ? `${title} · ${copy.concludesToday}`
    : series.mode === 'daily_journey'
      ? `${copy.dayOf(child.sequence, totalCount)} · ${subtitle || title}`
      : `${seriesName} · ${copy.dayOf(child.sequence, totalCount)}`;

  const cardContent = (
    <div
      className="w-full h-full rounded-[1.2rem] px-3.5 py-3 flex flex-row items-center gap-3 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--surface-soft) 100%)',
        border: '1px solid var(--premium-border)',
        boxShadow: '0 8px 24px color-mix(in srgb, var(--brand-ink) 12%, transparent)',
      }}
    >
      <span className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 85% 15%, var(--brand-primary-soft), transparent 45%)' }}
        aria-hidden="true" />

      {/* Visual Anchor */}
      <span
        className="w-11 h-11 rounded-xl shrink-0 inline-flex items-center justify-center"
        style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}
        aria-hidden="true"
      >
        {series.mode === 'daily_journey' ? <Sparkles size={22} /> : <Flame size={22} />}
      </span>

      {/* Content Column */}
      <div className="flex-1 min-w-0 pr-12">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              background: 'var(--brand-primary-soft)',
              color: 'var(--brand-primary)',
            }}
          >
            {seriesName}
          </span>
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-dim)' }}>
            {statusLine}
          </span>
        </div>

        <h3
          className="font-serif text-[15px] leading-tight font-bold truncate"
          style={{ color: 'var(--brand-ink)' }}
        >
          {title}
        </h3>

        {description && (
          <p
            className="text-[11px] leading-snug line-clamp-2 mt-0.5"
            style={{ color: 'var(--text-muted-warm)' }}
          >
            {description}
          </p>
        )}

        <span
          className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{
            background: 'var(--brand-primary-soft)',
            color: 'var(--brand-primary)',
            border: '1px solid var(--premium-border)',
          }}
        >
          {copy.explore} →
        </span>
      </div>

      {/* Days badge — top right */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
        <DaysBadge days={days} lang={lang} />
      </div>
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="block w-full h-full"
      style={{ textDecoration: 'none' }}
      aria-label={`${seriesName}, ${title}, ${days === 0 ? copy.today : copy.inDays(days)}`}
    >
      {cardContent}
    </Link>
  ) : <div className="w-full h-full">{cardContent}</div>;
}

// ── Under-Review / Incomplete Fail-Closed Series Card ──────────────────────────
function UnderReviewSeriesCard({ series, lang }: { series: ObservanceSeries; lang: SeriesCardLanguage }) {
  const copy = getSeriesCardCopy(lang);
  const seriesName = getSafeSeriesName(series, lang, {
    calendarProfile: series.profile.calendar,
    tradition: series.tradition,
  });
  return (
    <div
      className="w-full h-full rounded-[1.2rem] px-3.5 py-3 flex flex-row items-center gap-3 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--surface-soft) 100%)',
        border: '1px dashed color-mix(in srgb, var(--brand-primary) 45%, transparent)',
      }}
    >
      <AlertCircle size={24} className="text-amber-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
            {seriesName}
          </span>
          <span className="text-[9px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
            {copy.reviewPending}
          </span>
        </div>
        <p className="text-[11px] leading-snug mt-1" style={{ color: 'var(--text-dim)' }}>
          {getSeriesReviewMessage(series, lang)}
        </p>
      </div>
    </div>
  );
}

// ── Single Vrat Card ───────────────────────────────────────────────────────────
function VratCard({
  festival, days, lang,
}: {
  festival: Festival; days: number; lang: SeriesCardLanguage;
}) {
  const copy = getSeriesCardCopy(lang);
  const href = getVratHref(festival);
  const cardContent = (
    <div
      className="w-full h-full rounded-[1.2rem] px-3.5 py-3 flex flex-row items-center gap-3 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--surface-soft) 100%)',
        border: '1px solid var(--premium-border)',
        boxShadow: '0 8px 24px color-mix(in srgb, var(--brand-ink) 10%, transparent)',
      }}
    >
      <span className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 85% 15%, var(--brand-primary-soft), transparent 40%)' }}
        aria-hidden="true" />

      <span
        className="drop-shadow-md select-none shrink-0"
        style={{ fontSize: '2.6rem', lineHeight: 1 }}
        aria-hidden="true"
      >
        {festival.emoji}
      </span>

      <div className="flex-1 min-w-0 pr-12">
        <h3
          className="font-serif text-[15px] leading-tight font-bold"
          style={{ color: 'var(--brand-ink)' }}
        >
          {festival.name}
        </h3>
        <p className="text-[10px] mt-0.5 mb-1" style={{ color: 'var(--text-dim)' }}>
          {formatFestDate(festival.date)}
        </p>
        {festival.description && (
          <p
            className="text-[11px] leading-snug line-clamp-2"
            style={{ color: 'var(--text-muted-warm)' }}
          >
            {festival.description}
          </p>
        )}
        {href && (
          <span
            className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{
              background: 'var(--brand-primary-soft)',
              color: 'var(--brand-primary)',
              border: '1px solid var(--premium-border)',
            }}
          >
            {copy.learnMore} →
          </span>
        )}
      </div>

      <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
        <DaysBadge days={days} lang={lang} />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={`/vrat/${encodeURIComponent(href)}`}
        className="block w-full h-full"
        style={{ textDecoration: 'none' }}
      >
        {cardContent}
      </Link>
    );
  }
  return <div className="w-full h-full">{cardContent}</div>;
}

// ── Main Carousel ─────────────────────────────────────────────────────────────
interface Props {
  festivals:             Festival[];
  series?:               ObservanceSeries[];
  effectiveAppLanguage?: string;
  spiritualDate:         string;
}

type CarouselItem =
  | { type: 'series'; series: ObservanceSeries; child: ObservanceSeriesChild; days: number; key: string }
  | { type: 'under_review_series'; series: ObservanceSeries; days: number; key: string }
  | { type: 'festival'; festival: Festival; days: number; key: string };

export default function VratCarousel({
  festivals,
  series = [],
  effectiveAppLanguage = 'en',
  spiritualDate,
}: Props) {
  // 1. Process Series items
  const seriesItems: CarouselItem[] = [];
  for (const s of series) {
    if (s.status === 'under_review') {
      if (isSeriesStartWithinWindow(s, spiritualDate, HOME_OBSERVANCE_WINDOW_DAYS)) {
        const days = s.startDate ? daysFromReference(s.startDate, spiritualDate) : 0;
        seriesItems.push({
          type: 'under_review_series',
          series: s,
          days,
          key: `series-review-${s.definitionKey}`,
        });
      }
      continue;
    }

    // Active, Upcoming, or Concluding series
    if (s.status === 'active' || s.status === 'upcoming' || s.status === 'concluding') {
      const targetChildren = getSeriesCardChildren(s);

      if (targetChildren.length === 0) {
        seriesItems.push({
          type: 'under_review_series',
          series: s,
          days: s.startDate ? daysFromReference(s.startDate, spiritualDate) : 0,
          key: `series-invalid-${s.seriesKey}`,
        });
        continue;
      }

      for (const child of targetChildren) {
        const days = child.civilDate
          ? daysFromReference(child.civilDate, spiritualDate)
          : (s.startDate ? daysFromReference(s.startDate, spiritualDate) : 0);
        if (days >= 0 && days <= HOME_OBSERVANCE_WINDOW_DAYS) {
          seriesItems.push({
            type: 'series',
            series: s,
            child,
            days,
            key: `series-${s.seriesKey}-${child.occurrenceId ?? child.slug}`,
          });
        }
      }
    }
  }

  // 2. Process Standalone Festivals (avoid duplicating child observances already in active series)
  const activeSeriesSlugs = new Set(
    seriesItems.flatMap(item => item.type === 'series' ? [item.child.slug] : []),
  );
  const festivalItems: CarouselItem[] = festivals
    .map(f => ({ festival: f, days: daysFromReference(f.date, spiritualDate) }))
    .filter(x => x.days >= 0 && x.days <= HOME_OBSERVANCE_WINDOW_DAYS)
    .filter(x => !x.festival.slug || !activeSeriesSlugs.has(x.festival.slug))
    .sort((a, b) => a.days - b.days)
    .map(x => ({
      type: 'festival' as const,
      festival: x.festival,
      days: x.days,
      key: `fest-${x.festival.slug ?? x.festival.name}-${x.festival.date}`,
    }));

  const allItems: CarouselItem[] = [...seriesItems, ...festivalItems]
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth - 40;
    const scrollLeft = el.scrollLeft;
    const idx = Math.round(scrollLeft / (cardWidth + 12));
    setActiveIndex(Math.max(0, Math.min(idx, allItems.length - 1)));
  }, [allItems.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (isScrolling.current) return;
      updateActiveIndex();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [updateActiveIndex]);

  function scrollTo(idx: number) {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth - 40;
    isScrolling.current = true;
    el.scrollTo({ left: idx * (cardWidth + 12), behavior: 'smooth' });
    setActiveIndex(idx);
    setTimeout(() => { isScrolling.current = false; }, 500);
  }

  if (allItems.length === 0) return null;

  const labelKey = effectiveAppLanguage === 'hi' ? 'पवित्र दिन' : effectiveAppLanguage === 'pa' ? 'ਪਵਿੱਤਰ ਦਿਨ' : 'Sacred Days';

  return (
    <div className="mb-4">
      {/* Section header */}
      <div className="px-4 flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <CalendarDays size={13} style={{ color: 'var(--brand-primary)' }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--brand-primary)' }}>
            {labelKey}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
            style={{
              color: 'var(--brand-primary)',
              background: 'var(--brand-primary-soft)',
            }}
          >
            {allItems.length}
          </span>
        </div>
        <a
          href="/api/calendar/export"
          download="shoonaya-dharmic-calendar.ics"
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold transition-opacity hover:opacity-80 active:scale-95"
          style={{
            background: 'var(--brand-primary-soft)',
            border: '1px solid var(--premium-border)',
            color: 'var(--brand-primary)',
          }}
          title="Add to Google / Apple / Outlook Calendar"
        >
          {getSeriesCardCopy(
            effectiveAppLanguage === 'hi' || effectiveAppLanguage === 'pa' ? effectiveAppLanguage : 'en',
          ).addToCalendar}
        </a>
      </div>

      {/* Swipeable track */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none snap-x snap-mandatory"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {allItems.map((item) => (
          <div
            key={item.key}
            className="shrink-0 snap-start"
            style={{ width: 'calc(100vw - 48px)', maxWidth: '380px', height: '100px' }}
          >
            {item.type === 'series' ? (
              <SeriesChildCard
                series={item.series}
                child={item.child}
                lang={effectiveAppLanguage === 'hi' || effectiveAppLanguage === 'pa' ? effectiveAppLanguage : 'en'}
                spiritualDate={spiritualDate}
              />
            ) : item.type === 'under_review_series' ? (
              <UnderReviewSeriesCard
                series={item.series}
                lang={effectiveAppLanguage === 'hi' || effectiveAppLanguage === 'pa' ? effectiveAppLanguage : 'en'}
              />
            ) : (
              <VratCard
                festival={item.festival}
                days={item.days}
                lang={effectiveAppLanguage === 'hi' || effectiveAppLanguage === 'pa' ? effectiveAppLanguage : 'en'}
              />
            )}
          </div>
        ))}
      </div>

      {/* Pagination dots (only if > 1 card) */}
      {allItems.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2.5">
          {allItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className="rounded-full transition-all duration-300"
              style={{
                width:      idx === activeIndex ? '16px' : '5px',
                height:     '5px',
                background: idx === activeIndex
                  ? 'var(--brand-primary)'
                  : 'color-mix(in srgb, var(--brand-primary) 30%, transparent)',
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
