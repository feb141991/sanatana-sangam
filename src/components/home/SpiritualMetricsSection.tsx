'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

// ── SVG Ring ─────────────────────────────────────────────────────────────────
const R = 26;
const CIRC = 2 * Math.PI * R; // ≈ 163.4

interface RingProps {
  score: number;        // 0-100
  color: string;        // solid color
  label: string;
  id: string;
  href: string;
}

function SpiritualRing({ score, color, label, id, href }: RingProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const offset  = CIRC * (1 - clamped / 100);

  // Detect light theme for text color
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    const check = () => setIsLight(document.documentElement.dataset.theme === 'light');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const textFill = isLight ? 'rgba(26,22,16,0.85)' : '#ede8de';

  const ring = (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <svg
        width="68" height="68" viewBox="0 0 68 68"
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
        role="img"
        aria-label={`${label}: ${clamped}%`}
      >
        {/* Track */}
        <circle
          cx="34" cy="34" r={R}
          fill="rgba(200,146,74,0.06)"
          stroke="rgba(200,146,74,0.10)"
          strokeWidth="5.5"
        />
        {/* Progress arc */}
        {clamped > 0 && (
          <circle
            cx="34" cy="34" r={R}
            fill="none"
            stroke={color}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeDasharray={`${CIRC}`}
            strokeDashoffset={`${offset}`}
          />
        )}
        {/* Score numeral — counter-rotate so it reads upright */}
        <text
          x="34" y="37"
          textAnchor="middle"
          transform="rotate(90 34 34)"
          fontSize={clamped >= 100 ? '10' : '12'}
          fontWeight="700"
          fill={textFill}
          fontFamily="var(--font-serif, Georgia, serif)"
        >
          {clamped}
        </text>
      </svg>
      <span
        className="text-[9px] font-bold uppercase tracking-[0.13em] text-center"
        style={{ color: 'var(--text-dim)' }}
      >
        {label}
      </span>
    </div>
  );

  return (
    <Link href={href} className="motion-press">
      {ring}
    </Link>
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
  // ── Theme detection ────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.dataset.theme !== 'light');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const containerBg = isDark
    ? 'linear-gradient(150deg, rgba(30,24,16,0.98), rgba(22,18,12,0.96))'
    : 'rgba(255, 253, 248, 0.90)';

  const containerShadow = isDark
    ? '0 12px 32px rgba(0,0,0,0.24)'
    : '0 8px 24px rgba(49,35,20,0.07), inset 0 1px 0 rgba(255,255,255,0.85)';

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

  return (
    <div className="space-y-3">
      {/* ── Daily Overview rings ─────────────────────────────────────────────── */}
      <div
        className="rounded-[1.7rem] px-4 py-4 relative overflow-hidden"
        style={{
          background: containerBg,
          border: '1px solid rgba(200,146,74,0.14)',
          boxShadow: containerShadow,
        }}
      >
        {/* Top corner glow */}
        <div
          className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(200,146,74,0.07), transparent 70%)' }}
        />

        {/* Sādhana rings — tap each for details */}
        <div className="flex gap-3 justify-between overflow-x-auto pb-1 no-scrollbar">
          <SpiritualRing
            id="japa" score={scores.presence} label="Japa"
            color="#C8924A"
            href="/japa"
          />
          <SpiritualRing
            id="svadhyaya" score={scores.clarity} label="Svādhyāya"
            color="#6aafcc"
            href="/library"
          />
          <SpiritualRing
            id="sadhana" score={scores.balance} label="Sādhana"
            color="#b06adc"
            href="/nitya-karma"
          />
          <SpiritualRing
            id="nitya" score={scores.grounding} label="Nitya"
            color="#e09050"
            href="/nitya-karma"
          />
          <SpiritualRing
            id="viveka" score={scores.renewal} label="Viveka"
            color="#7ab85a"
            href="/discover"
          />
        </div>
      </div>

    </div>
  );
}
