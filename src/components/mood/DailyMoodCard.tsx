'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MoodGlyph from '@/components/ui/MoodGlyph';
import { MOODS_CONFIG } from '@/lib/mood/registry';
import { useThemePreference } from '@/components/providers/ThemeProvider';

const MOOD_WORKFLOW_VERSION     = '2';
const MOOD_WORKFLOW_VERSION_KEY = 'shoonaya_mood_workflow_version';
const PENDING_FOLLOWUP_KEY      = 'shoonaya_mood_pending_followup';

interface DailyMoodCardProps {
  onSelectMood: (mood: string) => void;
  userName: string;
  backendState?: {
    hasCompletedToday: boolean;
    hasDismissedToday: boolean;
    isLoaded: boolean;
  };
}

export default function DailyMoodCard({ onSelectMood, userName, backendState }: DailyMoodCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCheckInAgain, setIsCheckInAgain] = useState(false);
  const { resolvedTheme } = useThemePreference();
  const MOODS = MOODS_CONFIG[resolvedTheme] || MOODS_CONFIG.dark;

  useEffect(() => {
    const saved = localStorage.getItem(MOOD_WORKFLOW_VERSION_KEY);
    if (saved !== MOOD_WORKFLOW_VERSION) {
      localStorage.removeItem('shoonaya_mood_dismissed');
      localStorage.removeItem('home_mood_date');
      localStorage.removeItem('home_mood_key');
      localStorage.removeItem(PENDING_FOLLOWUP_KEY);
      localStorage.setItem(MOOD_WORKFLOW_VERSION_KEY, MOOD_WORKFLOW_VERSION);
    }
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const localDismissed = localStorage.getItem('shoonaya_mood_dismissed') === today;
    if (backendState?.isLoaded) {
      if (backendState.hasDismissedToday || localDismissed) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
        setIsCheckInAgain(backendState.hasCompletedToday);
      }
      return;
    }
    if (!localDismissed) setIsVisible(true);
  }, [backendState]);

  const handleDismiss = async () => {
    fetch('/api/mood/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dismissed: true, source_surface: 'home_dashboard' }),
    }).catch(() => {});
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('shoonaya_mood_dismissed', today);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 mb-4"
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.20em]" style={{ color: '#C5A059' }}>
                Your Personalised
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: 'rgba(197,160,89,0.55)', background: 'rgba(197,160,89,0.08)' }}
            >
              Later
            </button>
          </div>

          {/* Sub-label */}
          <p className="text-xs mb-3" style={{ color: 'var(--brand-muted)' }}>
            {isCheckInAgain
              ? 'Has your mood shifted since earlier?'
              : `How are you, ${userName.split(' ')[0]}? Pick a mood to get tailored suggestions.`}
          </p>

          {/* Mood pills — horizontal scroll, borderless */}
          <div
            className="flex gap-2 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: 'none' } as React.CSSProperties}
          >
            {MOODS.map(mood => (
              <button
                key={mood.key}
                onClick={() => {
                  setIsVisible(false);
                  onSelectMood(mood.key);
                }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full transition-all active:scale-95"
                style={{ background: mood.bg }}
              >
                <MoodGlyph mood={mood.key} color={mood.colour} size={15} />
                <span className="text-[12px] font-semibold" style={{ color: mood.colour }}>
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
