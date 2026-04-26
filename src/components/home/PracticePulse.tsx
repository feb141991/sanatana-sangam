'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, ChevronRight } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DayDot {
  date:      string; // 'YYYY-MM-DD'
  japa:      boolean;
  nitya:     boolean;
}

interface Props {
  japaStreak:           number;
  japaAlreadyDoneToday: boolean;
  nityaDoneToday:       boolean;
  history:              DayDot[]; // last 28 days, descending or ascending
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Returns sorted array of the last 28 YYYY-MM-DD strings (oldest → newest). */
function last28Days(): string[] {
  const out: string[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// ── HeatDot ───────────────────────────────────────────────────────────────────
function HeatDot({
  japa, nitya, isToday, delay,
}: { japa: boolean; nitya: boolean; isToday: boolean; delay: number }) {
  const both = japa && nitya;
  const any  = japa || nitya;

  const bg = both
    ? 'linear-gradient(135deg, #C8924A 40%, #7ec87e 100%)'
    : japa
      ? 'rgba(200,146,74,0.85)'
      : nitya
        ? 'rgba(126,200,126,0.80)'
        : 'rgba(255,255,255,0.07)';

  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-full flex-shrink-0"
      style={{
        width:    any ? 10 : 9,
        height:   any ? 10 : 9,
        background: bg,
        boxShadow: isToday
          ? '0 0 0 1.5px rgba(200,146,74,0.55)'
          : any
            ? '0 1px 4px rgba(0,0,0,0.18)'
            : 'none',
      }}
    />
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PracticePulse({
  japaStreak,
  japaAlreadyDoneToday,
  nityaDoneToday,
  history,
}: Props) {
  // ── Theme detection ────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.dataset.theme !== 'light');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // ── Build 28-day grid ──────────────────────────────────────────────────────
  const today  = todayStr();
  const days   = last28Days();

  const historyMap = useMemo(() => {
    const m: Record<string, DayDot> = {};
    history.forEach(h => { m[h.date] = h; });
    return m;
  }, [history]);

  // Pad today's value with live props (server data may lag)
  const dotData = useMemo(() =>
    days.map(d => {
      if (d === today) return { date: d, japa: japaAlreadyDoneToday, nitya: nityaDoneToday };
      return historyMap[d] ?? { date: d, japa: false, nitya: false };
    }),
  [days, today, japaAlreadyDoneToday, nityaDoneToday, historyMap]);

  const activeDays = dotData.filter(d => d.japa || d.nitya).length;
  const pct        = Math.round((activeDays / 28) * 100);

  // ── Containers ────────────────────────────────────────────────────────────
  const containerBg = isDark
    ? 'linear-gradient(150deg, rgba(30,24,16,0.98), rgba(22,18,12,0.96))'
    : 'rgba(255,253,248,0.90)';

  const containerShadow = isDark
    ? '0 12px 32px rgba(0,0,0,0.24)'
    : '0 8px 24px rgba(49,35,20,0.07), inset 0 1px 0 rgba(255,255,255,0.85)';

  const streakLabel = japaStreak > 0
    ? `${japaStreak}-day streak`
    : 'Start your streak';

  return (
    <div
      className="rounded-[1.7rem] px-4 py-4 relative overflow-hidden"
      style={{
        background:  containerBg,
        border:      '1px solid rgba(200,146,74,0.14)',
        boxShadow:   containerShadow,
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
        style={{ background: 'radial-gradient(circle at top right, rgba(200,146,74,0.08), transparent 70%)' }}
      />

      {/* ── Top row: label + insights link ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.15em]"
          style={{ color: 'var(--brand-muted)' }}
        >
          Practice Pulse
        </p>
        <Link
          href="/japa/insights"
          className="flex items-center gap-0.5 text-[10px] font-semibold"
          style={{ color: 'rgba(200,146,74,0.75)' }}
        >
          Insights <ChevronRight size={11} />
        </Link>
      </div>

      {/* ── Status pills ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        {/* Streak */}
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{
            background: japaStreak > 0 ? 'rgba(200,146,74,0.12)' : 'rgba(255,255,255,0.05)',
            border:     `1px solid ${japaStreak > 0 ? 'rgba(200,146,74,0.25)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <Flame
            size={13}
            style={{ color: japaStreak > 0 ? '#C8924A' : 'var(--text-dim)' }}
            fill={japaStreak > 0 ? 'rgba(200,146,74,0.35)' : 'none'}
          />
          <span
            className="text-[11px] font-bold"
            style={{ color: japaStreak > 0 ? '#C8924A' : 'var(--text-dim)' }}
          >
            {streakLabel}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Today's check marks */}
        <div className="flex items-center gap-1.5">
          <TodayBadge done={japaAlreadyDoneToday} label="Japa" color="#C8924A" />
          <TodayBadge done={nityaDoneToday}        label="Nitya" color="#7ec87e" />
        </div>
      </div>

      {/* ── 28-day heatmap ──────────────────────────────────────────────────── */}
      <div>
        {/* Week header */}
        <div className="grid grid-cols-7 gap-[5px] mb-1.5 px-0.5">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-[8px] font-medium" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
              {d}
            </div>
          ))}
        </div>

        {/* Dot grid — 4 rows × 7 cols */}
        <div className="grid grid-cols-7 gap-[5px] px-0.5">
          {dotData.map((dot, idx) => (
            <div key={dot.date} className="flex items-center justify-center" style={{ height: 16 }}>
              <HeatDot
                japa={dot.japa}
                nitya={dot.nitya}
                isToday={dot.date === today}
                delay={idx * 0.008}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Legend */}
        <div className="flex items-center gap-3">
          <LegendDot color="rgba(200,146,74,0.85)" label="Japa" />
          <LegendDot color="rgba(126,200,126,0.80)" label="Nitya" />
        </div>
        {/* 28-day % */}
        <span className="text-[10px] font-semibold" style={{ color: 'var(--brand-muted)' }}>
          {pct}% active · 28 days
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function TodayBadge({ done, label, color }: { done: boolean; label: string; color: string }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2 py-1"
      style={{
        background: done ? `${color}18` : 'rgba(255,255,255,0.04)',
        border:     `1px solid ${done ? `${color}30` : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <span className="text-[10px]">{done ? '✓' : '·'}</span>
      <span
        className="text-[10px] font-semibold"
        style={{ color: done ? color : 'var(--text-dim)' }}
      >
        {label}
      </span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-[9px]" style={{ color: 'var(--text-dim)', opacity: 0.65 }}>{label}</span>
    </div>
  );
}
