'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { MOODS_CONFIG, type MoodConfig } from '@/lib/mood/registry';
import MoodGlyph from '@/components/ui/MoodGlyph';

export interface MoodPulseProps {
  userName: string;
  tradition: string | null;
  backendState?: {
    hasCompletedToday: boolean;
    hasDismissedToday: boolean;
    isLoaded: boolean;
    lastCompletedMood: string | null;
  };
  onOpen: (moodKey: string) => void;
  onDismiss: () => void;
}

const MOOD_KEY_STORAGE = 'home_mood_key';

export default function MoodPulse({
  userName,
  backendState,
  onOpen,
  onDismiss,
}: MoodPulseProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(true);

  const MOODS = MOODS_CONFIG.dark;

  useEffect(() => {
    setMounted(true);
    const today = new Date().toISOString().split('T')[0];
    const dismissedOn = localStorage.getItem('shoonaya_mood_dismissed');

    if (backendState?.hasDismissedToday || dismissedOn === today) {
      setHidden(true);
      return;
    }

    if (backendState?.isLoaded) {
      setHidden(false);
    }
  }, [backendState]);

  if (!mounted || hidden || !backendState?.isLoaded) return null;

  const handlePillTap = (mood: MoodConfig) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(MOOD_KEY_STORAGE, mood.key);
    localStorage.setItem('home_mood_date', today);
    onOpen(mood.key);
  };

  const hasCompleted = backendState.hasCompletedToday;
  const lastMoodConf = backendState.lastCompletedMood
    ? MOODS.find(m => m.key === backendState.lastCompletedMood)
    : null;

  const firstName = userName.split(' ')[0] || '';

  return (
    <div className="px-4 mb-4 relative">
      {!hasCompleted && (
        <button
          onClick={() => {
            setHidden(true);
            onDismiss();
          }}
          className="absolute top-4 right-8 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-colors bg-[var(--card-bg-soft)]"
        >
          <X size={12} className="text-[var(--text-dim)]" />
        </button>
      )}

      {hasCompleted && lastMoodConf ? (
        <div className="flex flex-col">
          <button
            onClick={() => handlePillTap(lastMoodConf)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              background: lastMoodConf.bg,
              border: `1px solid ${lastMoodConf.colour}`,
            }}
          >
            <MoodGlyph mood={lastMoodConf.key} size={14} color={lastMoodConf.colour} />
            <span className="text-sm font-medium" style={{ color: lastMoodConf.colour }}>
              {lastMoodConf.label} · Explore &rarr;
            </span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--brand-primary)] mb-3">
            भावना · How are you, {firstName}?
          </p>
          <div
            className="-mx-4 px-4 overflow-x-auto"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex gap-2 pb-1 w-max">
              {MOODS.map(mood => (
                <motion.button
                  key={mood.key}
                  whileTap={prefersReducedMotion ? undefined : { scale: 1.08 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', duration: 0.2 }}
                  onClick={() => handlePillTap(mood)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-cream)] transition-colors"
                >
                  <MoodGlyph mood={mood.key} size={14} color={mood.colour} />
                  <span className="text-xs font-medium">{mood.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
