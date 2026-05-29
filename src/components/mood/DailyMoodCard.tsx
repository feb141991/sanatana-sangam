'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MoodGlyph from '@/components/ui/MoodGlyph';
import SacredIcon from '@/components/ui/SacredIcon';
import { MOODS_CONFIG } from '@/lib/mood/registry';
import { getFullRecommendationsForMood } from '@/lib/mood/engine';
import { useThemePreference } from '@/components/providers/ThemeProvider';

const MOOD_WORKFLOW_VERSION     = '2';
const MOOD_WORKFLOW_VERSION_KEY = 'shoonaya_mood_workflow_version';
const PENDING_FOLLOWUP_KEY      = 'shoonaya_mood_pending_followup';
const MOOD_KEY_STORAGE          = 'home_mood_key';

interface DailyMoodCardProps {
  onSelectMood: (mood: string) => void;
  userName: string;
  backendState?: {
    hasCompletedToday: boolean;
    hasDismissedToday: boolean;
    isLoaded: boolean;
  };
}

type Phase = 'pick' | 'content';

export default function DailyMoodCard({ onSelectMood, userName, backendState }: DailyMoodCardProps) {
  const router = useRouter();
  const [isVisible, setIsVisible]     = useState(false);
  const [phase, setPhase]             = useState<Phase>('pick');
  const [activeMoodKey, setActiveMoodKey] = useState<string | null>(null);
  const { resolvedTheme } = useThemePreference();
  const MOODS = MOODS_CONFIG[resolvedTheme] || MOODS_CONFIG.dark;

  // ── Version migration ────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(MOOD_WORKFLOW_VERSION_KEY);
    if (saved !== MOOD_WORKFLOW_VERSION) {
      localStorage.removeItem('shoonaya_mood_dismissed');
      localStorage.removeItem('home_mood_date');
      localStorage.removeItem(MOOD_KEY_STORAGE);
      localStorage.removeItem(PENDING_FOLLOWUP_KEY);
      localStorage.setItem(MOOD_WORKFLOW_VERSION_KEY, MOOD_WORKFLOW_VERSION);
    }
  }, []);

  // ── Visibility + phase from backendState ─────────────────────────────────────
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const localDismissed = localStorage.getItem('shoonaya_mood_dismissed') === today;

    if (backendState?.isLoaded) {
      if (backendState.hasDismissedToday || localDismissed) {
        setIsVisible(false);
        return;
      }
      setIsVisible(true);
      // If mood was already picked today, jump straight to content phase
      if (backendState.hasCompletedToday) {
        const savedKey = localStorage.getItem(MOOD_KEY_STORAGE);
        if (savedKey && MOODS.find(m => m.key === savedKey)) {
          setActiveMoodKey(savedKey);
          setPhase('content');
        } else {
          setPhase('pick');
        }
      } else {
        setPhase('pick');
      }
      return;
    }

    // Local-only fallback while backendState loads
    if (!localDismissed) {
      setIsVisible(true);
      const savedKey = localStorage.getItem(MOOD_KEY_STORAGE);
      if (savedKey && MOODS.find(m => m.key === savedKey)) {
        const todayKey = localStorage.getItem('home_mood_date');
        if (todayKey === today) {
          setActiveMoodKey(savedKey);
          setPhase('content');
        }
      }
    }
  }, [backendState, MOODS]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handlePickMood = (moodKey: string) => {
    setActiveMoodKey(moodKey);
    setPhase('content');
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(MOOD_KEY_STORAGE, moodKey);
    localStorage.setItem('home_mood_date', today);
    // Record checkin (fire-and-forget)
    fetch('/api/mood/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ before_mood: moodKey, source_surface: 'home_dashboard' }),
    }).catch(() => {});
    onSelectMood(moodKey);
  };

  const handleChangeMood = () => setPhase('pick');

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

  // ── Derived data ─────────────────────────────────────────────────────────────
  const activeMood = activeMoodKey ? MOODS.find(m => m.key === activeMoodKey) ?? null : null;
  const recs       = activeMoodKey ? getFullRecommendationsForMood(activeMoodKey).slice(0, 4) : [];

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
          {/* Header row — always visible */}
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.20em]" style={{ color: '#C5A059' }}>
              Your Personalised
            </span>
            <button
              onClick={handleDismiss}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: 'rgba(197,160,89,0.55)', background: 'rgba(197,160,89,0.08)' }}
            >
              Later
            </button>
          </div>

          {/* Phase content — animates between pick and content */}
          <AnimatePresence mode="wait" initial={false}>

            {/* ── PICK phase ─────────────────────────────────────────────────── */}
            {phase === 'pick' && (
              <motion.div
                key="pick"
                initial={{ opacity: 0, x: activeMoodKey ? -16 : 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-xs mb-3" style={{ color: 'var(--brand-muted)' }}>
                  {activeMoodKey
                    ? 'Pick a different mood to refresh your suggestions.'
                    : `How are you, ${userName.split(' ')[0]}? Pick a mood for tailored suggestions.`}
                </p>

                {/* Mood pills */}
                <div
                  className="flex gap-2 overflow-x-auto pb-0.5"
                  style={{ scrollbarWidth: 'none' } as React.CSSProperties}
                >
                  {MOODS.map(mood => (
                    <button
                      key={mood.key}
                      onClick={() => handlePickMood(mood.key)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full transition-all active:scale-95"
                      style={{
                        background: mood.bg,
                        outline: activeMoodKey === mood.key ? `1.5px solid ${mood.colour}55` : 'none',
                      }}
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

            {/* ── CONTENT phase ──────────────────────────────────────────────── */}
            {phase === 'content' && activeMood && (
              <motion.div
                key="content"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Active mood pill + change link */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: activeMood.bg }}
                  >
                    <MoodGlyph mood={activeMood.key} color={activeMood.colour} size={13} />
                    <span className="text-[11px] font-semibold" style={{ color: activeMood.colour }}>
                      {activeMood.label}
                    </span>
                  </div>
                  <button
                    onClick={handleChangeMood}
                    className="text-[10px] font-medium"
                    style={{ color: 'rgba(197,160,89,0.50)' }}
                  >
                    change ↩
                  </button>
                </div>

                {/* Recommendation cards — horizontal scroll */}
                <div
                  className="flex gap-2.5 overflow-x-auto pb-0.5"
                  style={{ scrollbarWidth: 'none' } as React.CSSProperties}
                >
                  {recs.map(rec => (
                    <button
                      key={rec.id}
                      onClick={() => router.push(rec.href)}
                      className="shrink-0 flex flex-col rounded-2xl px-3 py-3 text-left active:scale-[0.97] transition-transform"
                      style={{
                        width: 140,
                        background: `${activeMood.bg}`,
                        border: `1px solid ${activeMood.colour}18`,
                      }}
                    >
                      {/* Icon */}
                      <SacredIcon name={rec.icon} size={15} style={{ color: activeMood.colour }} />

                      {/* Title */}
                      <span
                        className="text-[12px] font-semibold leading-tight mt-2 line-clamp-2"
                        style={{ color: 'var(--brand-ink)' }}
                      >
                        {rec.title}
                      </span>

                      {/* Description */}
                      <span
                        className="text-[10px] leading-snug mt-1 line-clamp-2 flex-1"
                        style={{ color: 'var(--brand-muted)' }}
                      >
                        {rec.description}
                      </span>

                      {/* CTA */}
                      <span
                        className="text-[10px] font-bold mt-2"
                        style={{ color: activeMood.colour }}
                      >
                        {rec.actionLabel} →
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
