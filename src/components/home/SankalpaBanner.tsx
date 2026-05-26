'use client';

import { getTraditionMeta } from '@/lib/tradition-config';
import SacredIcon from '@/components/ui/SacredIcon';
interface Props {
  sankalpa: { id: string; text: string; start_date: string; end_date: string; tradition: string; related_practice?: string } | null;
  tradition?: string;
  onSet: () => void;
  onComplete: () => void;
}

// 8 dots — fills proportionally to show journey progress at a glance.
const DOT_COUNT = 8;

export default function SankalpaBanner({ sankalpa, tradition, onSet, onComplete }: Props) {
  // ── Empty state ────────────────────────────────────────────────────────────
  if (!sankalpa) {
    return (
      <div
        onClick={onSet}
        className="flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-transform active:scale-[0.98] mt-4"
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
  const filledDots      = Math.round((progressPercent / 100) * DOT_COUNT);

  const meta        = getTraditionMeta(sankalpa.tradition);
  const accentColor = meta?.accentColour || 'var(--brand-primary)';

  return (
    // ── Compact pill — same visual weight as the empty-state row ─────────────
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl mt-4"
      style={{
        background: 'rgba(197, 160, 89, 0.07)',
        border: '1px solid rgba(197, 160, 89, 0.18)',
      }}
    >
      {/* Icon */}
      <span className="text-base shrink-0" aria-hidden="true"><SacredIcon name="sun" size={18} /></span>

      {/* Sankalpa text — 1 line, truncated */}
      <p
        className="flex-1 text-[13px] font-serif truncate min-w-0"
        title={sankalpa.text}
        style={{ color: 'var(--divine-text)' }}
      >
        {sankalpa.text}
      </p>

      {/* Progress dots */}
      <div className="flex items-center gap-[3px] shrink-0" aria-label={`${Math.round(progressPercent)}% complete`}>
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <span
            key={i}
            className="rounded-full transition-all duration-500 w-2 h-2"
            style={{
              background: i < filledDots ? accentColor : 'rgba(197,160,89,0.2)',
              boxShadow:  i < filledDots ? `0 0 4px ${accentColor}66` : 'none',
            }}
          />
        ))}
      </div>

      {/* Days remaining */}
      <span
        className="font-semibold tracking-wide shrink-0 tabular-nums"
        style={{ color: accentColor, fontSize: 11 }}
      >
        {remainingDays} days left
      </span>
    </div>
  );
}
