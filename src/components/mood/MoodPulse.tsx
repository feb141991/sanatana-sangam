'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { MOODS_CONFIG, type MoodConfig } from '@/lib/mood/registry';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import MoodGlyph from '@/components/ui/MoodGlyph';
import SacredGlowIcon from '@/components/ui/SacredGlowIcon';
import { localSpiritualDate } from '@/lib/sacred-time';

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

function getMoodSpiritualDate() {
  const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  return localSpiritualDate(tz, 4);
}

export default function MoodPulse({
  userName,
  backendState,
  onOpen,
  onDismiss,
}: MoodPulseProps) {
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useThemePreference();
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [selectedMood, setSelectedMood] = useState<MoodConfig | null>(null);

  const moodsConfig = MOODS_CONFIG[resolvedTheme as 'dark' | 'light'] ?? MOODS_CONFIG.dark;
  const MOODS = moodsConfig;

  useEffect(() => {
    setMounted(true);
    const today = getMoodSpiritualDate();
    const dismissedOn = localStorage.getItem('shoonaya_mood_dismissed');

    if (dismissedOn === today) {
      setHidden(true);
      return;
    }

    if (backendState?.isLoaded) {
      setHidden(false);
    }
  }, [backendState]);

  if (!mounted || hidden || !backendState?.isLoaded) return null;

  const handleMoodSelect = (mood: MoodConfig) => {
    setSelectedMood(mood);
  };

  const handleDone = () => {
    if (!selectedMood) return;
    const today = getMoodSpiritualDate();
    localStorage.setItem(MOOD_KEY_STORAGE, selectedMood.key);
    localStorage.setItem('home_mood_date', today);
    localStorage.setItem('shoonaya_mood_dismissed', today);
    fetch('/api/mood/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ before_mood: selectedMood.key, source_surface: 'home_dashboard', dismissed: true }),
    }).catch(() => {});
    setHidden(true);
    onDismiss();
  };

  const handleExplore = () => {
    if (!selectedMood) return;
    const today = getMoodSpiritualDate();
    localStorage.setItem(MOOD_KEY_STORAGE, selectedMood.key);
    localStorage.setItem('home_mood_date', today);
    onOpen(selectedMood.key);
  };

  const spiritualToday = getMoodSpiritualDate();
  const localMoodDate = typeof window !== 'undefined' ? localStorage.getItem('home_mood_date') : null;
  const hasCompleted = backendState.hasCompletedToday && localMoodDate === spiritualToday;
  const lastMoodConf = backendState.lastCompletedMood
    ? MOODS.find(m => m.key === backendState.lastCompletedMood)
    : null;

  const firstName = userName.split(' ')[0] || '';

  return (
    <motion.div
      className="fixed inset-0 z-[180] flex items-center justify-center px-4 py-8"
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Mood check-in"
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <motion.div
        className="relative w-full max-w-md rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] px-5 py-5 shadow-2xl"
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 18, scale: 0.97 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
      {!hasCompleted && (
        <button
          onClick={() => {
            setHidden(true);
            onDismiss();
          }}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-soft)] transition-colors"
          aria-label="Dismiss mood check-in"
        >
          <X size={14} className="text-[var(--text-dim)]" />
        </button>
      )}

      {hasCompleted && lastMoodConf ? (
        <div className="flex flex-col">
          <button
            onClick={() => handleMoodSelect(lastMoodConf)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              background: lastMoodConf.bg,
              border: `1px solid ${lastMoodConf.colour}`,
            }}
          >
            <SacredGlowIcon color={lastMoodConf.colour} size={24} variant="active" animated>
              <MoodGlyph mood={lastMoodConf.key} size={14} color={lastMoodConf.colour} />
            </SacredGlowIcon>
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
          <div className="grid grid-cols-2 gap-2">
            {MOODS.map(mood => {
              const isSelected = selectedMood?.key === mood.key;
              return (
                <motion.button
                  key={mood.key}
                  whileTap={prefersReducedMotion ? undefined : { scale: 1.04 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', duration: 0.2 }}
                  onClick={() => handleMoodSelect(mood)}
                  className="flex items-center gap-2 px-3 rounded-xl border transition-colors"
                  style={{
                    minHeight: 44,
                    background: isSelected ? mood.bg : 'var(--surface-soft)',
                    borderColor: isSelected ? mood.colour : 'var(--card-border)',
                    borderWidth: isSelected ? 1.5 : 1,
                  }}
                >
                  <SacredGlowIcon
                    color={mood.colour}
                    size={24}
                    variant={isSelected ? 'active' : 'soft'}
                    animated={isSelected}
                  >
                    <MoodGlyph mood={mood.key} size={14} color={mood.colour} />
                  </SacredGlowIcon>
                  <span
                    className="text-xs font-medium leading-tight"
                    style={{ color: isSelected ? mood.colour : 'var(--text-cream)' }}
                  >
                    {mood.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Confirm bar — appears after mood selected */}
          {selectedMood && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 mt-3 pt-2.5"
              style={{ borderTop: `1px solid ${selectedMood.colour}22` }}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <SacredGlowIcon color={selectedMood.colour} size={22} variant="active" animated>
                  <MoodGlyph mood={selectedMood.key} color={selectedMood.colour} size={12} />
                </SacredGlowIcon>
                <span className="text-[11px] font-semibold truncate" style={{ color: selectedMood.colour }}>
                  {selectedMood.label} saved
                </span>
              </div>
              <button
                onClick={handleDone}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full shrink-0 active:scale-95 transition-transform"
                style={{ background: 'rgba(197,160,89,0.10)', color: 'rgba(197,160,89,0.75)' }}
              >
                Done ✓
              </button>
              <button
                onClick={handleExplore}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0 active:scale-95 transition-transform"
                style={{ background: selectedMood.bg, color: selectedMood.colour }}
              >
                Explore →
              </button>
            </motion.div>
          )}
        </div>
      )}
      </motion.div>
    </motion.div>
  );
}
