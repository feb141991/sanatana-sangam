'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────

interface DigestAction {
  label: string;
  href: string;
  type: 'link' | 'primary';
}

interface DigestPanchang {
  tithi: number;
  tithiName: string;
  paksha: string;
  weekday: string;
  weekdayDeity: string;
}

interface DigestData {
  headline: string;
  body: string;
  fact: string;
  action: DigestAction;
  panchang: DigestPanchang;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function DigestSkeleton({ isDark }: { isDark: boolean }) {
  const base = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return (
    <div
      className="rounded-[1.45rem] px-4 py-4 space-y-3"
      style={{
        background: isDark
          ? 'linear-gradient(150deg, rgba(30,24,14,0.98) 0%, rgba(24,20,12,0.96) 100%)'
          : 'linear-gradient(150deg, rgba(255,252,246,0.97) 0%, rgba(248,240,220,0.90) 100%)',
        border: `1px solid ${isDark ? 'rgba(197,160,89,0.16)' : 'rgba(197,160,89,0.22)'}`,
      }}
    >
      {/* Chip skeleton */}
      <div className="w-32 h-4 rounded-full animate-pulse" style={{ background: base }} />
      {/* Headline skeleton */}
      <div className="w-3/4 h-5 rounded-lg animate-pulse" style={{ background: base }} />
      {/* Body skeleton — 3 lines */}
      <div className="space-y-1.5">
        <div className="w-full h-3.5 rounded animate-pulse" style={{ background: base }} />
        <div className="w-full h-3.5 rounded animate-pulse" style={{ background: base }} />
        <div className="w-5/6 h-3.5 rounded animate-pulse" style={{ background: base }} />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface DailyDigestCardProps {
  isDark: boolean;
}

export default function DailyDigestCard({ isDark }: DailyDigestCardProps) {
  const [data, setData]       = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/digest/today');
        if (!res.ok) throw new Error('non-200');
        const json = await res.json() as DigestData;
        // Require the minimum fields
        if (!json?.headline || !json?.body || !json?.panchang?.tithiName) throw new Error('incomplete');
        if (!cancelled) setData(json);
      } catch {
        // Silent fail — don't render the card
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <DigestSkeleton isDark={isDark} />;
  if (!data)   return null;

  // ── Theme tokens (isDark-conditional) ──────────────────────────────────────
  const cardBg     = isDark
    ? 'linear-gradient(150deg, rgba(30,24,14,0.98) 0%, rgba(24,20,12,0.96) 100%)'
    : 'linear-gradient(150deg, rgba(255,252,246,0.97) 0%, rgba(248,240,220,0.90) 100%)';
  const cardBorder = isDark ? 'rgba(197,160,89,0.18)' : 'rgba(197,160,89,0.26)';

  // Tithi chip — saffron/gold
  const chipBg     = isDark ? 'rgba(197,160,89,0.14)' : 'rgba(197,160,89,0.20)';
  const chipColor  = isDark ? '#C5A059' : '#7A5220';

  // Headline
  const headlineColor = isDark ? '#F0EDE6' : '#1a0e04';

  // Body
  const bodyColor = isDark ? 'rgba(240,220,185,0.72)' : 'rgba(60,40,10,0.70)';

  // Fact blockquote
  const factBorderColor = isDark ? 'rgba(212,120,74,0.45)' : 'rgba(180,90,40,0.40)';
  const factBg          = isDark ? 'rgba(212,120,74,0.07)' : 'rgba(212,120,74,0.06)';
  const factColor       = isDark ? 'rgba(245,200,155,0.82)' : 'rgba(100,50,10,0.78)';

  // CTA
  const ctaBg     = isDark
    ? 'linear-gradient(135deg, rgba(197,160,89,0.16), rgba(197,160,89,0.10))'
    : 'linear-gradient(135deg, rgba(197,160,89,0.22), rgba(197,160,89,0.14))';
  const ctaBorder = isDark ? 'rgba(197,160,89,0.22)' : 'rgba(197,160,89,0.32)';
  const ctaColor  = isDark ? '#C5A059' : '#7A5220';

  const { tithiName, paksha } = data.panchang;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[1.45rem] overflow-hidden"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        // Soft radial glow in top-right corner — pandit warmth
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(197,160,89,0.08)'
          : '0 4px 20px rgba(120,80,20,0.08), inset 0 1px 0 rgba(255,255,255,0.60)',
      }}
    >
      {/* Subtle top-right radial glow (decorative) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[1.45rem]"
        style={{
          background: 'radial-gradient(circle at 90% 10%, rgba(197,160,89,0.10), transparent 38%)',
        }}
      />

      <div className="relative px-4 pt-4 pb-5 space-y-3">

        {/* ── Header: lunar icon + tithi chip ─────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Crescent moon glyph */}
          <span
            aria-hidden="true"
            style={{ fontSize: 14, lineHeight: 1, color: chipColor }}
          >
            ☽
          </span>
          {/* Tithi + paksha chip */}
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ background: chipBg, color: chipColor }}
          >
            {tithiName} · {paksha} Paksha
          </span>
          {/* Section label, pushed right */}
          <span
            className="ml-auto text-[9px] font-semibold uppercase tracking-[0.20em]"
            style={{ color: isDark ? 'rgba(197,160,89,0.45)' : 'rgba(120,70,10,0.45)' }}
          >
            Dharmic Digest
          </span>
        </div>

        {/* ── Headline ─────────────────────────────────────────────────────── */}
        <h2
          className="leading-snug"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: headlineColor,
            letterSpacing: '-0.01em',
          }}
        >
          {data.headline}
        </h2>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <p
          className="text-[13px] leading-[1.65]"
          style={{ color: bodyColor }}
        >
          {data.body}
        </p>

        {/* ── Fact — blockquote style ───────────────────────────────────────── */}
        <div
          className="rounded-r-xl pl-3.5 pr-3 py-2.5 text-[12px] leading-[1.6]"
          style={{
            borderLeft: `2.5px solid ${factBorderColor}`,
            background: factBg,
            color: factColor,
          }}
        >
          <span
            className="block text-[9px] font-bold uppercase tracking-[0.20em] mb-0.5"
            style={{ color: isDark ? 'rgba(212,120,74,0.65)' : 'rgba(150,70,20,0.65)' }}
          >
            Did You Know
          </span>
          {data.fact}
        </div>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <Link
          href={data.action.href}
          className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 text-[12px] font-semibold no-underline motion-press"
          style={{
            background: ctaBg,
            border: `1px solid ${ctaBorder}`,
            color: ctaColor,
          }}
        >
          {data.action.label}
          <span aria-hidden="true" style={{ opacity: 0.7 }}>→</span>
        </Link>

      </div>
    </motion.div>
  );
}
