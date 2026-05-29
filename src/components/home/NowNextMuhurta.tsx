'use client';

/**
 * NowNextMuhurta — Muslim Pro-style dual card showing the current and next
 * named sacred time window from today's Panchang.
 *
 * Named windows considered (sorted chronologically):
 *   🌄 Brahma Muhurta   — 96–48 min before sunrise   (auspicious)
 *   🌅 Sunrise          — sunrise moment              (auspicious)
 *   ☀️  Abhijit Muhurta  — midday ±24 min             (auspicious)
 *   ⚠️  Rahu Kaal        — day-specific inauspicious window
 *   🌇 Sunset           — sunset moment              (neutral)
 *
 * "Now" = window currently active (between start and end).
 * "Next" = first window that starts in the future.
 *
 * Refreshes every 30 s. Renders nothing if all windows for the day have passed.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface NowNextMuhurtaProps {
  brahmaMuhurta:  string;  // "4:45 AM – 5:30 AM"
  abhijitMuhurat: string;  // "12:00 PM – 12:48 PM"
  rahuKaal:       string;  // "3:00 PM – 4:30 PM"
  sunrise:        string;  // "6:21 AM"
  sunset:         string;  // "7:15 PM"
  isDark:         boolean;
}

type WindowType = 'auspicious' | 'inauspicious' | 'neutral';

interface TimeWindow {
  name:  string;
  emoji: string;
  type:  WindowType;
  start: Date;
  end:   Date;
}

interface CardData {
  window: TimeWindow;
  slot:   'Now' | 'Next';
  detail: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

/** Parse "4:45 AM" → today's Date or null */
function parseTime(t: string): Date | null {
  const m = t.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  const d = new Date();
  d.setHours(h, min, 0, 0);
  return d;
}

/** Parse "4:45 AM – 5:30 AM" → { start, end } or null */
function parseRange(range: string): { start: Date; end: Date } | null {
  const parts = range.split('–').map(s => s.trim());
  const start = parseTime(parts[0] ?? '');
  const end   = parseTime(parts[1] ?? '');
  if (!start || !end) return null;
  return { start, end };
}

/** Format Date → "6:21 AM" */
function fmtTime(d: Date): string {
  let h = d.getHours();
  const min = d.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${min.toString().padStart(2, '0')} ${period}`;
}

/** Format ms → "23 min" / "1h 3m" */
function fmtMs(ms: number): string {
  const total = Math.ceil(ms / 60_000);
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function buildWindows(
  brahmaMuhurta:  string,
  abhijitMuhurat: string,
  rahuKaal:       string,
  sunrise:        string,
  sunset:         string,
): TimeWindow[] {
  const windows: TimeWindow[] = [];

  const brahma = parseRange(brahmaMuhurta);
  if (brahma) windows.push({ name: 'Brahma Muhurta',  emoji: '🌄', type: 'auspicious',   ...brahma });

  const sr = parseTime(sunrise);
  if (sr) windows.push({
    name:  'Sunrise',
    emoji: '🌅',
    type:  'auspicious',
    start: sr,
    end:   new Date(sr.getTime() + 8 * 60_000),   // 8-min window
  });

  const abhijit = parseRange(abhijitMuhurat);
  if (abhijit) windows.push({ name: 'Abhijit Muhurta', emoji: '☀️', type: 'auspicious',   ...abhijit });

  const rahu = parseRange(rahuKaal);
  if (rahu) windows.push({ name: 'Rahu Kaal',        emoji: '⚠️', type: 'inauspicious', ...rahu });

  const ss = parseTime(sunset);
  if (ss) windows.push({
    name:  'Sunset',
    emoji: '🌇',
    type:  'neutral',
    start: ss,
    end:   new Date(ss.getTime() + 8 * 60_000),
  });

  return windows.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function computeCards(windows: TimeWindow[]): { now: CardData | null; next: CardData | null } {
  const ts = Date.now();
  let current:  TimeWindow | null = null;
  let upcoming: TimeWindow | null = null;

  for (const w of windows) {
    const inWindow = w.start.getTime() <= ts && w.end.getTime() > ts;
    const isFuture = w.start.getTime() > ts;

    if (inWindow && !current) current = w;
    else if (isFuture && !upcoming) upcoming = w;
  }

  return {
    now: current
      ? { window: current, slot: 'Now',  detail: `ends in ${fmtMs(current.end.getTime() - ts)}` }
      : null,
    next: upcoming
      ? { window: upcoming, slot: 'Next', detail: `at ${fmtTime(upcoming.start)}` }
      : null,
  };
}

// ── sub-component ─────────────────────────────────────────────────────────────

function MuhurtaCard({ card, isDark }: { card: CardData; isDark: boolean }) {
  const isBad  = card.window.type === 'inauspicious';
  const isNow  = card.slot === 'Now';

  const accent  = isBad ? '#e05252' : '#C5A059';
  const cardBg  = isDark
    ? isBad ? 'rgba(224,82,82,0.09)' : 'rgba(197,160,89,0.09)'
    : isBad ? 'rgba(224,82,82,0.06)' : 'rgba(255,252,240,0.92)';
  const border  = isDark
    ? `rgba(${isBad ? '224,82,82' : '197,160,89'},0.20)`
    : `rgba(${isBad ? '224,82,82' : '197,160,89'},0.24)`;
  const nameClr = isDark ? '#F0EDE6' : '#1A100A';
  const detClr  = isDark ? 'rgba(240,237,230,0.50)' : 'rgba(60,40,15,0.55)';

  return (
    <div
      className="flex-1 rounded-2xl p-3.5 relative overflow-hidden"
      style={{ background: cardBg, border: `1px solid ${border}` }}
    >
      {/* Pulse dot — only on "Now" */}
      {isNow && (
        <span
          className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse"
          style={{ background: accent }}
          aria-hidden="true"
        />
      )}

      {/* Slot label */}
      <p
        className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2"
        style={{ color: accent }}
      >
        {card.slot}
      </p>

      {/* Large emoji */}
      <span
        className="block mb-1.5 select-none"
        style={{ fontSize: '1.9rem', lineHeight: 1 }}
        aria-hidden="true"
      >
        {card.window.emoji}
      </span>

      {/* Name */}
      <p className="text-[11.5px] font-bold leading-tight mb-1" style={{ color: nameClr }}>
        {card.window.name}
      </p>

      {/* Timing detail */}
      <p className="text-[10px] leading-snug" style={{ color: detClr }}>
        {card.detail}
      </p>
    </div>
  );
}

// ── main export ───────────────────────────────────────────────────────────────

export default function NowNextMuhurta({
  brahmaMuhurta,
  abhijitMuhurat,
  rahuKaal,
  sunrise,
  sunset,
  isDark,
}: NowNextMuhurtaProps) {
  const [cards, setCards] = useState<{ now: CardData | null; next: CardData | null }>({
    now:  null,
    next: null,
  });

  useEffect(() => {
    const windows = buildWindows(brahmaMuhurta, abhijitMuhurat, rahuKaal, sunrise, sunset);
    function tick() { setCards(computeCards(windows)); }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [brahmaMuhurta, abhijitMuhurat, rahuKaal, sunrise, sunset]);

  // Nothing to show (all windows have passed, or panchang not ready)
  if (!cards.now && !cards.next) return null;

  const dimBg  = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,253,246,0.65)';
  const dimBdr = isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(197,160,89,0.12)';
  const dimTxt = isDark ? 'rgba(240,237,230,0.30)'  : 'rgba(60,40,15,0.30)';

  return (
    <div className="px-5 mb-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2.5">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: '#C5A059' }}
        >
          Sacred Times
        </span>
        <Link
          href="/panchang"
          className="flex items-center gap-0.5 active:opacity-70 transition-opacity"
          style={{ color: 'rgba(197,160,89,0.70)', fontSize: 10 }}
        >
          Full Panchang <ChevronRight size={10} />
        </Link>
      </div>

      <div className="flex gap-2.5">
        {cards.now  && <MuhurtaCard card={cards.now}  isDark={isDark} />}
        {cards.next && <MuhurtaCard card={cards.next} isDark={isDark} />}

        {/* Placeholder when only Now card exists (all upcoming windows passed) */}
        {cards.now && !cards.next && (
          <div
            className="flex-1 rounded-2xl p-3.5"
            style={{ background: dimBg, border: `1px solid ${dimBdr}` }}
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: 'rgba(197,160,89,0.40)' }}>Next</p>
            <span className="block mb-1.5 select-none" style={{ fontSize: '1.9rem', lineHeight: 1 }} aria-hidden="true">🌙</span>
            <p className="text-[11.5px] font-bold leading-tight mb-1" style={{ color: dimTxt }}>End of day</p>
            <p className="text-[10px] leading-snug" style={{ color: dimTxt }}>No more windows today</p>
          </div>
        )}
      </div>
    </div>
  );
}
