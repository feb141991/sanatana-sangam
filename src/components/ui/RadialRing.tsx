'use client';

/**
 * RadialRing — unified radial-progress ring for the entire app.
 *
 * Design tokens used:
 *   --ring-track         background arc (adapts to light/dark via globals.css)
 *   --brand-primary      default accent when `accent` prop is omitted
 *   --font-serif         centre numeral typeface
 *
 * Usage examples:
 *   <RadialRing pct={72} accent="#C8924A" size={80} showPct label="Japa" href="/japa" />
 *   <RadialRing pct={50} accentEnd="#D4784A" gradientId="nitya-ring" size={80} />
 *   <RadialRing pct={100} size={44} strokeWidth={4} label={<CheckIcon />} />
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import React from 'react';

export interface RadialRingProps {
  /** 0–100 */
  pct: number;
  /** Arc start colour — any CSS colour. Falls back to var(--brand-primary) */
  accent?: string;
  /** Arc end colour — enables a gradient arc when provided */
  accentEnd?: string;
  /** Must be globally unique on the page when gradient is used */
  gradientId?: string;
  /** Outer diameter in px (default 64) */
  size?: number;
  /** Ring stroke width in px (default 6) */
  strokeWidth?: number;
  /** Node rendered inside the ring (overrides showPct) */
  label?: React.ReactNode;
  /** When true and no label, renders the pct number in centre */
  showPct?: boolean;
  /** Caption text below the ring */
  caption?: string;
  /** Wraps everything in a Next.js <Link> */
  href?: string;
  /** Extra className on the outer wrapper */
  className?: string;
}

export default function RadialRing({
  pct,
  accent,
  accentEnd,
  gradientId,
  size = 64,
  strokeWidth = 6,
  label,
  showPct = false,
  caption,
  href,
  className = '',
}: RadialRingProps) {
  const clamped   = Math.min(100, Math.max(0, pct));
  const r         = (size - strokeWidth) / 2;
  const circ      = 2 * Math.PI * r;
  const offset    = circ * (1 - clamped / 100);
  const fillColor = accent ?? 'var(--brand-primary)';
  const gId       = gradientId ?? `rr-${size}-${(accent ?? 'def').replace(/[^a-z0-9]/gi, '')}`;
  const arcStroke = accentEnd ? `url(#${gId})` : fillColor;

  // Centre content
  const inner: React.ReactNode = label !== undefined
    ? label
    : showPct
      ? (
        <span
          style={{
            fontSize: Math.max(10, size * 0.185),
            fontWeight: 700,
            fontFamily: 'var(--font-serif, Georgia, serif)',
            color: fillColor,
            lineHeight: 1,
          }}
        >
          {clamped}
        </span>
      )
      : null;

  const ring = (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <div
        className="relative flex-shrink-0 inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
          aria-hidden="true"
        >
          {accentEnd && (
            <defs>
              <linearGradient id={gId} x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={fillColor} />
                <stop offset="100%" stopColor={accentEnd} />
              </linearGradient>
            </defs>
          )}

          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="var(--ring-track)"
            strokeWidth={strokeWidth}
          />

          {/* Progress arc */}
          {clamped > 0 && (
            <motion.circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke={arcStroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </svg>

        {/* Centre label */}
        {inner !== null && (
          <div className="relative z-10 flex items-center justify-center pointer-events-none">
            {inner}
          </div>
        )}
      </div>

      {/* Optional caption below ring */}
      {caption && (
        <span
          className="text-[9px] font-bold uppercase tracking-[0.13em] text-center leading-tight"
          style={{ color: 'var(--brand-muted)' }}
        >
          {caption}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="motion-press block">
        {ring}
      </Link>
    );
  }
  return ring;
}
