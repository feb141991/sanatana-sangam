'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MOODS_CONFIG, type MoodConfig } from '@/lib/mood/registry';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { getFullRecommendationsForMood } from '@/lib/mood/engine';
import MoodGlyph from '@/components/ui/MoodGlyph';
import SacredIcon from '@/components/ui/SacredIcon';

export interface MoodReturnProps {
  checkinId: string;
  onComplete: (afterMoodKey: string) => void;
  onSkip: () => void;
}

export default function MoodReturn({ checkinId, onComplete, onSkip }: MoodReturnProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useThemePreference();
  const MOODS = MOODS_CONFIG[resolvedTheme as 'dark' | 'light'] ?? MOODS_CONFIG.dark;
  const [afterMood, setAfterMood] = useState<MoodConfig | null>(null);

  const handlePillTap = async (mood: MoodConfig) => {
    setAfterMood(mood);
    // Fire and forget — don't block the UI
    fetch('/api/mood/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkin_id: checkinId,
        after_mood: mood.key,
        session_status: 'completed',
      }),
    }).catch(() => {});
  };

  const recs = afterMood
    ? getFullRecommendationsForMood(afterMood.key).slice(0, 3)
    : [];

  return (
    <div className="pt-6 pb-2 border-t border-[var(--card-border)] mt-4">
      <AnimatePresence mode="wait">

        {/* Phase 1 — pick after-mood */}
        {!afterMood && (
          <motion.div
            key="pick"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-[11px] text-[var(--text-dim)]">How do you feel now?</span>
              <button
                onClick={onSkip}
                className="text-[11px] text-[var(--text-dim)] hover:text-[var(--text-cream)] transition-colors"
              >
                Skip
              </button>
            </div>
            <div
              className="-mx-5 px-5 overflow-x-auto"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              <div className="flex gap-2 w-max pb-2">
                {MOODS.map(mood => (
                  <motion.button
                    key={mood.key}
                    whileTap={prefersReducedMotion ? undefined : { scale: 1.08 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 20 }}
                    onClick={() => handlePillTap(mood)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] active:scale-95 transition-transform"
                  >
                    <MoodGlyph mood={mood.key} size={12} color={mood.colour} />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-cream)' }}>
                      {mood.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase 2 — suggestions based on after-mood */}
        {afterMood && (
          <motion.div
            key="suggest"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Confirmed mood + close */}
            <div className="flex items-center justify-between px-2 mb-3">
              <div className="flex items-center gap-1.5">
                <MoodGlyph mood={afterMood.key} color={afterMood.colour} size={12} />
                <span className="text-[11px] font-semibold" style={{ color: afterMood.colour }}>
                  {afterMood.label} — explore for this
                </span>
              </div>
              <button
                onClick={() => onComplete(afterMood.key)}
                className="text-[11px] text-[var(--text-dim)] hover:text-[var(--text-cream)] transition-colors"
              >
                Done
              </button>
            </div>

            {/* Compact horizontal suggestion cards */}
            <div
              className="-mx-5 px-5 overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              <div className="flex gap-2.5 w-max">
                {recs.map((rec, i) => (
                  <motion.button
                    key={rec.id}
                    initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.92 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { delay: i * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
                    onClick={() => {
                      onComplete(afterMood.key);
                      router.push(rec.href);
                    }}
                    className="flex-shrink-0 w-32 flex flex-col rounded-2xl px-3 py-3 text-left active:scale-[0.97] transition-transform"
                    style={{
                      background: afterMood.bg,
                      border: `1px solid ${afterMood.colour}22`,
                    }}
                  >
                    <SacredIcon name={rec.icon} size={14} style={{ color: afterMood.colour }} />
                    <span
                      className="text-[12px] font-semibold leading-tight line-clamp-2 mt-2 mb-1"
                      style={{ color: 'var(--text-cream)' }}
                    >
                      {rec.title}
                    </span>
                    <span
                      className="text-[10px] leading-snug line-clamp-2 flex-1"
                      style={{ color: 'var(--text-muted-warm)' }}
                    >
                      {rec.description}
                    </span>
                    <span className="text-[10px] font-bold mt-2" style={{ color: afterMood.colour }}>
                      {rec.actionLabel} →
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
