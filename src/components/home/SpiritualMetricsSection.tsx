'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, Flame, BookOpen, Sun } from 'lucide-react';

// ── SVG Ring ─────────────────────────────────────────────────────────────────
const R = 24;
const CIRC = 2 * Math.PI * R; // ≈ 150.8

interface RingProps {
  score: number;        // 0-100
  color: string;        // gradient stop start
  color2: string;       // gradient stop end
  label: string;
  id: string;
}

function SpiritualRing({ score, color, color2, label, id }: RingProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const offset  = CIRC * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <svg
        width="64" height="64" viewBox="0 0 62 62"
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
        role="img"
        aria-label={`${label}: ${clamped}%`}
      >
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="31" cy="31" r={R}
          fill="rgba(22, 18, 12, 0.95)"
          stroke="rgba(200,146,74,0.08)"
          strokeWidth="5.5"
        />
        {/* Progress arc */}
        {clamped > 0 && (
          <circle
            cx="31" cy="31" r={R}
            fill="none"
            stroke={`url(#grad-${id})`}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeDasharray={`${CIRC}`}
            strokeDashoffset={`${offset}`}
          />
        )}
        {/* Score numeral — counter-rotate so it reads upright */}
        <text
          x="31" y="34"
          textAnchor="middle"
          transform="rotate(90 31 31)"
          fontSize={clamped >= 100 ? '10' : '12'}
          fontWeight="700"
          fill="#ede8de"
          fontFamily="var(--font-serif, Georgia, serif)"
        >
          {clamped}
        </text>
      </svg>
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.13em] text-center"
        style={{ color: 'var(--text-dim)' }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Mini sparkline bars ───────────────────────────────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[2px] h-4 mt-1.5">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-[4px] rounded-sm"
          style={{
            height: `${Math.max(20, (v / max) * 100)}%`,
            background: v > 0 ? color : 'rgba(200,146,74,0.1)',
          }}
        />
      ))}
    </div>
  );
}

// ── Segmented bar ─────────────────────────────────────────────────────────────
function SegBar({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <div className="flex gap-[2px] mt-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="flex-1 h-[3px] rounded-full"
          style={{ background: i < filled ? color : 'rgba(200,146,74,0.1)' }}
        />
      ))}
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────
interface MetricCardProps {
  eyebrow: string;
  value: string;
  status: string;
  statusColor: string;
  barFill: number;      // 0-100
  barColor: string;
  sparkValues?: number[];
  segFilled?: number;
  segTotal?: number;
  insight: string;
  href?: string;
  icon?: React.ReactNode;
}

function MetricCard({
  eyebrow, value, status, statusColor, barFill, barColor,
  sparkValues, segFilled, segTotal, insight, href, icon,
}: MetricCardProps) {
  const Wrapper = href ? Link : 'div';
  return (
    <Wrapper
      href={href as string}
      className="rounded-[1.4rem] p-3.5 relative overflow-hidden block"
      style={{
        background: 'linear-gradient(150deg, rgba(38,32,22,0.98), rgba(28,24,16,0.96))',
        border: '1px solid rgba(200,146,74,0.13)',
      }}
    >
      {/* Ambient corner glow */}
      <div
        className="absolute top-0 right-0 w-12 h-12 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${barColor}18, transparent 70%)` }}
      />

      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className="text-[12px]">{icon}</span>}
        <p
          className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: 'rgba(200,146,74,0.55)' }}
        >
          {eyebrow}
        </p>
      </div>

      <p
        className="text-[22px] leading-none font-semibold relative"
        style={{ fontFamily: 'var(--font-serif, Georgia, serif)', color: 'var(--text-cream)', letterSpacing: '-0.02em' }}
      >
        {value}
      </p>

      <p className="text-[10px] font-semibold mt-1" style={{ color: statusColor }}>
        {status}
      </p>

      {/* Progress bar */}
      <div
        className="h-[2px] rounded-full mt-2 overflow-hidden"
        style={{ background: 'rgba(200,146,74,0.1)' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${barFill}%`, background: barColor }}
        />
      </div>

      {/* Trend or segments */}
      {sparkValues && <Sparkline values={sparkValues} color={barColor} />}
      {segFilled !== undefined && segTotal !== undefined && (
        <SegBar filled={segFilled} total={segTotal} color={barColor} />
      )}

      <p
        className="text-[9.5px] mt-2 leading-[1.45]"
        style={{ color: 'var(--text-dim)' }}
      >
        {insight}
      </p>
    </Wrapper>
  );
}

// ── Timeline Entry ────────────────────────────────────────────────────────────
function TimelineEntry({
  icon, title, time, href, done = false,
}: { icon: string; title: string; time: string; href: string; done?: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[1.3rem] px-3.5 py-3 motion-lift"
      style={{
        background: done ? 'rgba(200,146,74,0.07)' : 'rgba(32,26,18,0.95)',
        border: `1px solid ${done ? 'rgba(200,146,74,0.18)' : 'rgba(200,146,74,0.1)'}`,
      }}
    >
      <div
        className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[16px] flex-shrink-0"
        style={{ background: done ? 'rgba(200,146,74,0.14)' : 'rgba(200,146,74,0.08)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[12.5px] font-semibold leading-snug"
          style={{ color: done ? 'var(--brand-primary)' : 'var(--text-cream)' }}
        >
          {title}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
          {time}
        </p>
      </div>
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={done ? 'rgba(200,146,74,0.5)' : 'rgba(200,146,74,0.25)'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

// ── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2 mt-1 px-0.5"
      style={{ color: 'rgba(200,146,74,0.55)' }}
    >
      {children}
    </p>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────
interface SpiritualMetricsSectionProps {
  japaStreak: number;
  shlokaStreak: number;
  japaAlreadyDoneToday: boolean;
  readToday: boolean;
  tradition?: string | null;
}

export default function SpiritualMetricsSection({
  japaStreak,
  shlokaStreak,
  japaAlreadyDoneToday,
  readToday,
  tradition,
}: SpiritualMetricsSectionProps) {
  // ── Score computation ──────────────────────────────────────────────────────
  const scores = useMemo(() => {
    // Presence: japa streak — 21 days = full (consistent sadhana = presence)
    const presence = Math.min(100, Math.round((japaStreak / 21) * 100));

    // Clarity: scripture streak — 30 days = full
    const clarity = Math.min(100, Math.round((shlokaStreak / 30) * 100));

    // Balance: weighted average of presence + clarity
    const balance = Math.round((presence * 0.55 + clarity * 0.45));

    // Grounding: based on today's practice completion
    const groundingToday = (japaAlreadyDoneToday ? 50 : 0) + (readToday ? 50 : 0);
    // Blend with streak momentum
    const grounding = Math.round(groundingToday * 0.7 + Math.min(100, (japaStreak / 14) * 100) * 0.3);

    // Renewal: gives a sense of freshness — starts moderate, elevated on day 7+ consecutive
    const renewal = Math.min(100, japaStreak >= 7 ? 70 + (japaStreak - 7) * 2 : japaStreak * 9);

    return { presence, clarity, balance, grounding, renewal };
  }, [japaStreak, shlokaStreak, japaAlreadyDoneToday, readToday]);

  // ── Metric card data ───────────────────────────────────────────────────────
  const japaStatus = japaAlreadyDoneToday
    ? { text: 'Aligned', color: '#7ab85a' }
    : japaStreak > 0
      ? { text: 'Restoring', color: '#C8924A' }
      : { text: 'Begin today', color: 'var(--text-dim)' };

  const shlokaStatus = readToday
    ? { text: 'Elevated', color: '#6aafcc' }
    : shlokaStreak > 0
      ? { text: 'Restoring', color: '#C8924A' }
      : { text: 'Open scripture', color: 'var(--text-dim)' };

  const balanceStatus = scores.balance >= 70
    ? { text: 'Balanced', color: '#b06adc' }
    : scores.balance >= 40
      ? { text: 'Building', color: '#C8924A' }
      : { text: 'Low — begin rituals', color: 'var(--text-dim)' };

  const groundingStatus = scores.grounding >= 70
    ? { text: 'Grounded', color: '#7ab85a' }
    : scores.grounding >= 40
      ? { text: 'Centering', color: '#C8924A' }
      : { text: 'Needs attention', color: 'var(--text-dim)' };

  // Mock 7-day sparkline values — derived from streaks so it looks real
  const japaSparkline = Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i;
    return daysAgo < japaStreak ? Math.round(60 + Math.random() * 40) : 0;
  });

  // Replace random with deterministic values based on streak
  const detJapaSparkline = Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i;
    if (daysAgo < japaStreak) {
      return 60 + ((i * 17) % 40);
    }
    return 0;
  });

  const shlokaWeekFilled = Math.min(7, Math.max(0, shlokaStreak > 0 ? (readToday ? Math.min(7, shlokaStreak) : Math.min(6, shlokaStreak - 1)) : 0));

  // Today's ritual entries for timeline
  const today = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="space-y-3">
      {/* ── Daily Overview rings ─────────────────────────────────────────────── */}
      <div
        className="rounded-[1.7rem] px-4 py-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, rgba(30,24,16,0.98), rgba(22,18,12,0.96))',
          border: '1px solid rgba(200,146,74,0.14)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.24)',
        }}
      >
        {/* Top corner glow */}
        <div
          className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(200,146,74,0.07), transparent 70%)' }}
        />

        <SectionLabel>Daily Overview</SectionLabel>

        {/* Rings row */}
        <div className="flex gap-3 justify-between overflow-x-auto pb-1 no-scrollbar">
          <SpiritualRing
            id="presence" score={scores.presence} label="Presence"
            color="#C8924A" color2="#D4784A"
          />
          <SpiritualRing
            id="clarity" score={scores.clarity} label="Clarity"
            color="#6aafcc" color2="#4a8ab4"
          />
          <SpiritualRing
            id="balance" score={scores.balance} label="Balance"
            color="#b06adc" color2="#8850b4"
          />
          <SpiritualRing
            id="grounding" score={scores.grounding} label="Grounding"
            color="#e09050" color2="#c06030"
          />
          <SpiritualRing
            id="renewal" score={scores.renewal} label="Renewal"
            color="#7ab85a" color2="#5a9840"
          />
        </div>
      </div>

      {/* ── Energy & Balance metric cards ────────────────────────────────────── */}
      <SectionLabel>Energy &amp; Balance</SectionLabel>

      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard
          eyebrow="Japa Streak"
          value={`${japaStreak}${japaStreak === 1 ? ' day' : ' days'}`}
          status={japaStatus.text}
          statusColor={japaStatus.color}
          barFill={Math.min(100, (japaStreak / 21) * 100)}
          barColor="#7ab85a"
          sparkValues={detJapaSparkline}
          insight={japaStreak >= 21 ? 'Maala complete — exemplary' : `${21 - japaStreak} days to full cycle`}
          href="/bhakti/mala"
          icon={<Flame size={11} style={{ color: '#7ab85a', display: 'inline' }} />}
        />
        <MetricCard
          eyebrow="Reflection"
          value={`${shlokaWeekFilled}/7`}
          status={shlokaStatus.text}
          statusColor={shlokaStatus.color}
          barFill={(shlokaWeekFilled / 7) * 100}
          barColor="#6aafcc"
          segFilled={shlokaWeekFilled}
          segTotal={7}
          insight={readToday ? 'Read today · streak maintained' : 'Open scripture to continue'}
          href="/library"
          icon={<BookOpen size={11} style={{ color: '#6aafcc', display: 'inline' }} />}
        />
        <MetricCard
          eyebrow="Balance Score"
          value={`${scores.balance}%`}
          status={balanceStatus.text}
          statusColor={balanceStatus.color}
          barFill={scores.balance}
          barColor="#b06adc"
          sparkValues={[
            Math.max(0, scores.balance - 20 + ((0 * 7) % 15)),
            Math.max(0, scores.balance - 15 + ((1 * 7) % 15)),
            Math.max(0, scores.balance - 12 + ((2 * 7) % 15)),
            Math.max(0, scores.balance - 8 + ((3 * 7) % 15)),
            Math.max(0, scores.balance - 5 + ((4 * 7) % 15)),
            Math.max(0, scores.balance - 2 + ((5 * 7) % 15)),
            scores.balance,
          ]}
          insight="Japa + scripture in harmony"
          href="/nitya-karma"
          icon={<TrendingUp size={11} style={{ color: '#b06adc', display: 'inline' }} />}
        />
        <MetricCard
          eyebrow="Grounding"
          value={`${scores.grounding}%`}
          status={groundingStatus.text}
          statusColor={groundingStatus.color}
          barFill={scores.grounding}
          barColor="#e09050"
          segFilled={Math.round((scores.grounding / 100) * 5)}
          segTotal={5}
          insight={japaAlreadyDoneToday && readToday ? 'Both pillars done today' : 'Complete today\'s rituals'}
          href="/nitya-karma"
          icon={<Sun size={11} style={{ color: '#e09050', display: 'inline' }} />}
        />
      </div>

      {/* ── Ritual Timeline ───────────────────────────────────────────────────── */}
      <SectionLabel>Ritual Timeline</SectionLabel>

      <div className="space-y-2">
        <TimelineEntry
          icon="🌅" title="Brahma Muhurta window" time="4:30 – 6:00 AM · Dawn practice" href="/panchang" done
        />
        <TimelineEntry
          icon="📿"
          title="Japa · 108 Maala rounds"
          time={japaAlreadyDoneToday ? 'Completed today · streak ' + japaStreak : 'Pending · tap to begin'}
          href="/bhakti/mala"
          done={japaAlreadyDoneToday}
        />
        <TimelineEntry
          icon="📖"
          title={tradition === 'sikh' ? 'Gurbani reading' : tradition === 'buddhist' ? 'Dhamma reading' : 'Scripture · Gita / Upanishad'}
          time={readToday ? 'Read today · ' + shlokaStreak + '-day streak' : 'Pending · open Pathshala'}
          href="/library"
          done={readToday}
        />
        <TimelineEntry
          icon="🙏" title="Evening reflection" time={`${today} · Set intention`} href="/bhakti"
        />
      </div>

      {/* ── Bottom action row ────────────────────────────────────────────────── */}
      <div className="flex gap-2.5 pt-1">
        <Link
          href="/nitya-karma"
          className="flex-1 h-10 rounded-full flex items-center justify-center text-[11.5px] font-semibold tracking-[0.04em] transition"
          style={{
            border: '1px solid rgba(200,146,74,0.22)',
            color: 'rgba(200,146,74,0.7)',
          }}
        >
          Edit Rituals
        </Link>
        <Link
          href="/library"
          className="flex-1 h-10 rounded-full flex items-center justify-center text-[11.5px] font-semibold tracking-[0.04em] transition"
          style={{
            border: '1px solid rgba(200,146,74,0.22)',
            color: 'rgba(200,146,74,0.7)',
          }}
        >
          View All Practices
        </Link>
      </div>
    </div>
  );
}
