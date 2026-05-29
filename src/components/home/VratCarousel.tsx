'use client';

/**
 * VratCarousel — swipeable card carousel for upcoming sacred days.
 *
 * Replaces the flat Sacred Days list with full-width swipeable cards.
 * Each card shows:
 *  • Large 3D emoji visual anchor
 *  • Festival name + tradition badge
 *  • Days until badge
 *  • Short significance description
 *  • "Learn more" CTA
 * Pagination dots at the bottom track position.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CalendarDays } from 'lucide-react';
import type { Festival } from '@/lib/festivals';
import { resolveVratSlug } from '@/lib/vrat-data';

// ── Helpers ────────────────────────────────────────────────────────────────────
function daysFromNow(dateStr: string): number {
  const fest  = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const d     = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((fest.getTime() - d.getTime()) / 86400000);
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
function DaysBadge({ days, isDark }: { days: number; isDark: boolean }) {
  if (days === 0) return (
    <span className="text-[9px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: 'var(--brand-primary)', color: '#1a1610' }}>
      Today
    </span>
  );
  if (days === 1) return (
    <span className="text-[10px] font-bold" style={{ color: isDark ? '#FCD34D' : '#92400E' }}>
      Tomorrow
    </span>
  );
  return (
    <span className="text-[10px] font-semibold" style={{ color: isDark ? 'rgba(245,220,160,0.70)' : 'rgba(80,45,10,0.55)' }}>
      in {days}d
    </span>
  );
}

// ── Single Vrat Card ───────────────────────────────────────────────────────────
function VratCard({
  festival, days, isDark,
}: {
  festival: Festival; days: number; isDark: boolean;
}) {
  const href = getVratHref(festival);
  const cardContent = (
    <div
      className="w-full h-full rounded-[1.2rem] px-3.5 py-3 flex flex-row items-center gap-3 relative overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(26,18,6,0.98) 0%, rgba(40,28,8,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255,253,246,0.98) 0%, rgba(248,228,190,0.80) 100%)',
        border: isDark
          ? '1px solid rgba(197,160,89,0.20)'
          : '1px solid rgba(197,160,89,0.28)',
        boxShadow: isDark
          ? '0 8px 24px rgba(0,0,0,0.28)'
          : '0 6px 20px rgba(49,35,20,0.08)',
      }}
    >
      {/* Ambient glow */}
      <span className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 85% 15%, rgba(197,160,89,0.14), transparent 40%)' }}
        aria-hidden="true" />

      {/* Emoji — left column */}
      <span
        className="drop-shadow-md select-none shrink-0"
        style={{ fontSize: '2.6rem', lineHeight: 1 }}
        aria-hidden="true"
      >
        {festival.emoji}
      </span>

      {/* Text — right column */}
      <div className="flex-1 min-w-0 pr-12">
        <h3
          className="font-serif text-[15px] leading-tight font-bold"
          style={{ color: isDark ? '#F5E8C0' : '#1A0A02' }}
        >
          {festival.name}
        </h3>
        <p className="text-[10px] mt-0.5 mb-1" style={{ color: isDark ? 'rgba(245,220,160,0.50)' : 'rgba(80,45,10,0.50)' }}>
          {formatFestDate(festival.date)}
        </p>
        {festival.description && (
          <p
            className="text-[11px] leading-snug line-clamp-2"
            style={{ color: isDark ? 'rgba(245,220,160,0.60)' : 'rgba(60,35,10,0.65)' }}
          >
            {festival.description}
          </p>
        )}
        {href && (
          <span
            className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{
              background: isDark ? 'rgba(197,160,89,0.14)' : 'rgba(197,160,89,0.12)',
              color: 'var(--brand-primary)',
              border: '1px solid rgba(197,160,89,0.20)',
            }}
          >
            Learn more →
          </span>
        )}
      </div>

      {/* Days badge — top right */}
      <div className="absolute top-3 right-3">
        <DaysBadge days={days} isDark={isDark} />
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
  isDark:                boolean;
  effectiveAppLanguage?: string;
}

export default function VratCarousel({ festivals, isDark, effectiveAppLanguage = 'en' }: Props) {
  const upcoming = festivals
    .map(f => ({ festival: f, days: daysFromNow(f.date) }))
    .filter(x => x.days >= 0 && x.days <= 21)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth - 40; // account for gap + padding
    const scrollLeft = el.scrollLeft;
    const idx = Math.round(scrollLeft / (cardWidth + 12));
    setActiveIndex(Math.max(0, Math.min(idx, upcoming.length - 1)));
  }, [upcoming.length]);

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

  if (upcoming.length === 0) return null;

  const labelKey = effectiveAppLanguage === 'hi' ? 'पवित्र दिन' : effectiveAppLanguage === 'pa' ? 'ਪਵਿੱਤਰ ਦਿਨ' : 'Sacred Days';

  return (
    <div className="mb-4">
      {/* Section header */}
      <div className="px-4 flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <CalendarDays size={13} style={{ color: '#C5A059' }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: '#C5A059' }}>
            {labelKey}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
            style={{
              color:      isDark ? '#F6E2AE' : '#A0622A',
              background: isDark ? 'rgba(247,212,132,0.12)' : 'rgba(247,212,132,0.24)',
            }}
          >
            {upcoming.length}
          </span>
        </div>
        <a
          href="/api/calendar/export"
          download="shoonaya-dharmic-calendar.ics"
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold transition-opacity hover:opacity-80 active:scale-95"
          style={{
            background:  'rgba(197,160,89,0.12)',
            border:      '1px solid rgba(197,160,89,0.22)',
            color:       '#C5A059',
          }}
          title="Add to Google / Apple / Outlook Calendar"
        >
          <Bell size={9} />
          Add to Calendar
        </a>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-1"
        style={{
          scrollSnapType:    'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth:    'none',
          msOverflowStyle:   'none',
        }}
      >
        {upcoming.map(({ festival, days }, i) => (
          <div
            key={`${festival.name}-${festival.date}`}
            style={{
              minWidth:       'calc(100% - 32px)',
              scrollSnapAlign: 'start',
              height:          '144px',
            }}
          >
            <VratCard festival={festival} days={days} isDark={isDark} />
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      {upcoming.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {upcoming.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className="transition-all"
              aria-label={`Go to card ${i + 1}`}
              style={{
                height:          6,
                width:           i === activeIndex ? 20 : 6,
                borderRadius:    9999,
                background:      i === activeIndex ? '#C5A059' : 'rgba(197,160,89,0.30)',
                border:          'none',
                cursor:          'pointer',
                padding:         0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
