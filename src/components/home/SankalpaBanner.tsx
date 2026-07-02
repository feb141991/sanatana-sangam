'use client';

import Link from 'next/link';
import { getTraditionMeta } from '@/lib/tradition-config';
import SacredIcon from '@/components/ui/SacredIcon';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, CheckCircle2 } from 'lucide-react';
import CircularProgress from '@/components/ui/CircularProgress';

interface Props {
  sankalpa: {
    id: string;
    text: string;
    start_date: string;
    end_date: string;
    tradition: string;
    related_practice?: string | null;
  } | null;
  tradition?: string;
  onSet: () => void;
  onComplete: () => void;
  checkedToday: boolean;
  onCheckin: () => void;
  relatedPractice?: string | null;
}

export default function SankalpaBanner({
  sankalpa,
  tradition,
  onSet,
  onComplete,
  checkedToday,
  onCheckin,
  relatedPractice,
}: Props) {
  const prefersReducedMotion = useReducedMotion();

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!sankalpa) {
    return (
      <div
        onClick={onSet}
        className="flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-transform active:scale-[0.98]"
        style={{
          background: 'rgba(197, 160, 89, 0.08)',
          border: '1px solid rgba(197, 160, 89, 0.2)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden="true"><SacredIcon name="sun" size={18} /></span>
          <span className="text-sm font-medium" style={{ color: 'var(--divine-text)' }}>Set your Sankalpa for this month</span>
        </div>
        <span className="text-[var(--brand-primary)]">→</span>
      </div>
    );
  }

  // ── Progress maths ─────────────────────────────────────────────────────────
  const today      = new Date();
  const start      = new Date(sankalpa.start_date);
  const end        = new Date(sankalpa.end_date);
  const targetDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
  const elapsedDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86_400_000));
  const remainingDays   = Math.max(0, targetDays - elapsedDays);
  const progressPercent = Math.min(100, Math.max(0, (elapsedDays / targetDays) * 100));

  const meta        = getTraditionMeta(sankalpa.tradition);
  const accentColor = meta?.accentColour || 'var(--brand-primary)';

  // ── Practice mapping ────────────────────────────────────────────────────────
  const PRACTICE_LABELS: Record<string, { label: string; emoji: string; href: string }> = {
    japa:      { label: 'Japa',      emoji: '📿', href: '/japa' },
    reading:   { label: 'Reading',   emoji: '📖', href: '/pathshala' },
    meditation:{ label: 'Dhyana',    emoji: '🧘', href: '/nitya-karma' },
    nitya:     { label: 'Nitya',     emoji: '🕯️', href: '/nitya-karma' },
    quiz:      { label: 'Quiz',      emoji: '🧠', href: '/quiz' },
  };
  const practice = relatedPractice ? (PRACTICE_LABELS[relatedPractice] ?? null) : null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: 'rgba(197, 160, 89, 0.07)',
        border: '1px solid rgba(197, 160, 89, 0.18)',
        display: 'flex',
      }}
    >
      {/* Icon */}
      <span className="text-base shrink-0" aria-hidden="true">
        <SacredIcon name="sun" size={18} />
      </span>

      {/* Sankalpa text & practice shortcuts */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p
          className="text-[13px] font-serif truncate"
          title={sankalpa.text}
          style={{ color: 'var(--divine-text)' }}
        >
          {sankalpa.text}
        </p>

        {/* Practice Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          {practice && (
            <Link
              href={practice.href}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 transition-opacity hover:opacity-85"
              style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              {practice.emoji} {practice.label} &rarr;
            </Link>
          )}

          <Link
            href="/my-progress"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 transition-opacity hover:opacity-85"
            style={{
              background: 'rgba(197, 160, 89, 0.05)',
              color: 'var(--brand-muted)',
              border: '1px solid rgba(197, 160, 89, 0.12)',
            }}
          >
            My Progress &rarr;
          </Link>
        </div>
      </div>

      {/* Right column: Progress ring & check-in button */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Progress Ring */}
        {prefersReducedMotion ? (
          <div
            className="relative flex-shrink-0 inline-flex items-center justify-center"
            style={{ width: 44, height: 44 }}
          >
            <svg
              width={44}
              height={44}
              className="absolute inset-0"
              style={{ transform: 'rotate(-90deg)' }}
              aria-hidden="true"
            >
              {/* Track */}
              <circle
                cx={22}
                cy={22}
                r={20.25}
                fill="none"
                stroke="var(--ring-track)"
                strokeWidth={3.5}
              />
              {/* Progress arc */}
              {progressPercent > 0 && (
                <circle
                  cx={22}
                  cy={22}
                  r={20.25}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 20.25}
                  strokeDashoffset={(2 * Math.PI * 20.25) * (1 - progressPercent / 100)}
                />
              )}
            </svg>
            <div className="relative z-10 flex items-center justify-center pointer-events-none">
              <span style={{ fontSize: 9, fontWeight: 700, color: accentColor }}>
                {remainingDays}d
              </span>
            </div>
          </div>
        ) : (
          <CircularProgress
            key="sankalpa-progress-ring"
            pct={progressPercent}
            accent={accentColor}
            size={44}
            strokeWidth={3.5}
            label={
              <span style={{ fontSize: 9, fontWeight: 700, color: accentColor }}>
                {remainingDays}d
              </span>
            }
          />
        )}

        {/* Check-in Button */}
        {!checkedToday ? (
          <motion.button
            onClick={onCheckin}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-sm transition-opacity hover:opacity-90 focus:outline-none"
            style={{
              background: accentColor,
              color: 'white',
              border: 'none',
            }}
            aria-label="Mark today honoured"
            title="Mark today honoured"
          >
            <Check size={16} />
          </motion.button>
        ) : (
          <motion.div
            initial={prefersReducedMotion ? undefined : { scale: 0.5 }}
            animate={prefersReducedMotion ? undefined : { scale: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 20 }}
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 shadow-sm"
            style={{
              background: `${accentColor}18`,
              color: accentColor,
              border: `1px solid ${accentColor}30`,
            }}
          >
            <CheckCircle2 size={20} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
