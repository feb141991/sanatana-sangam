'use client';

/**
 * WeeklyHabitRow — surfaces 7-day practice history directly on the home page.
 *
 * Two dot rows per day column:
 *   Top dot   = Japa Mala done (full opacity + glow)
 *   Bottom dot = Nitya Karma done (softer shade)
 *
 * Tapping the card navigates to /my-progress for the full history.
 */

import Link from 'next/link';
import { Flame, ChevronRight } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';

interface WeeklyHabitRowProps {
  practiceHistory: { date: string; japa: boolean; nitya: boolean }[];
  japaStreak: number;
  tradition?: string | null;
}

const SHORT_DAY = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function WeeklyHabitRow({
  practiceHistory,
  japaStreak,
  tradition,
}: WeeklyHabitRowProps) {
  const meta = getTraditionMeta(tradition ?? 'hindu');
  const accent = meta.accentColour ?? '#C5A059';
  const accentSoft = `${accent}66`;
  const accentFaint = `${accent}18`;

  // Build last 7 days, oldest → newest
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const entry = practiceHistory.find((p) => p.date === dateStr);
    return {
      dateStr,
      label: SHORT_DAY[d.getDay()],
      isToday: i === 6,
      japa: entry?.japa ?? false,
      nitya: entry?.nitya ?? false,
      any: (entry?.japa || entry?.nitya) ?? false,
    };
  });

  const doneCount = days.filter((d) => d.any).length;
  const perfectWeek = doneCount === 7;

  return (
    <Link href="/my-progress" className="block px-5 mb-5 no-underline group">
      <div
        className="rounded-2xl px-4 pt-3 pb-3.5 transition-all duration-200 group-active:scale-[0.99]"
        style={{
          background: `linear-gradient(135deg, ${accentFaint} 0%, rgba(0,0,0,0) 60%)`,
          border: `1px solid ${accentSoft}`,
        }}
      >
        {/* ── Header ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={13} color={accent} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              7-Day Streak
            </span>
          </div>

          <div className="flex items-center gap-1">
            {japaStreak > 0 && (
              <>
                <span className="text-[15px] leading-none" aria-hidden="true">🔥</span>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: 'var(--brand-ink)' }}
                >
                  {japaStreak}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--brand-muted)' }}>
                  &nbsp;day run
                </span>
              </>
            )}
            <ChevronRight size={13} style={{ color: accent, opacity: 0.6, marginLeft: 4 }} />
          </div>
        </div>

        {/* ── 7-day dot grid ────────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-1.5">
          {days.map((day) => (
            <div key={day.dateStr} className="flex flex-col items-center gap-[5px] flex-1">
              {/* Japa dot */}
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: 9,
                  height: 9,
                  background: day.japa ? accent : `${accent}1a`,
                  boxShadow: day.japa ? `0 0 7px ${accent}60` : undefined,
                }}
                title={day.japa ? 'Japa done' : 'Japa missed'}
              />
              {/* Nitya dot */}
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: 9,
                  height: 9,
                  background: day.nitya ? accentSoft : `${accent}0f`,
                }}
                title={day.nitya ? 'Nitya done' : 'Nitya missed'}
              />
              {/* Day label */}
              <span
                className="text-[9px] font-semibold mt-0.5"
                style={{
                  color: day.isToday ? accent : 'var(--brand-muted)',
                  opacity: day.isToday ? 1 : 0.65,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {day.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Legend + summary ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-3">
          {/* Dot legend */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div
                className="rounded-full"
                style={{ width: 7, height: 7, background: accent }}
              />
              <span className="text-[9px]" style={{ color: 'var(--brand-muted)' }}>Japa</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="rounded-full"
                style={{ width: 7, height: 7, background: accentSoft }}
              />
              <span className="text-[9px]" style={{ color: 'var(--brand-muted)' }}>Nitya</span>
            </div>
          </div>

          <p className="text-[10px] font-semibold" style={{ color: accent, opacity: 0.85 }}>
            {perfectWeek
              ? '✨ Perfect week!'
              : `${doneCount}/7 days practiced`}
          </p>
        </div>
      </div>
    </Link>
  );
}
