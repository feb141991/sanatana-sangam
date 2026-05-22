'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import MoodGlyph from '@/components/ui/MoodGlyph';

import { MOODS_CONFIG } from '@/lib/mood/registry';
import { useThemePreference } from '@/components/providers/ThemeProvider';

const MOOD_WORKFLOW_VERSION = '2';
const MOOD_WORKFLOW_VERSION_KEY = 'shoonaya_mood_workflow_version';
const PENDING_FOLLOWUP_KEY = 'shoonaya_mood_pending_followup';

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
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useThemePreference();
  const MOODS = MOODS_CONFIG[resolvedTheme] || MOODS_CONFIG.dark;

  useEffect(() => {
    const savedVersion = localStorage.getItem(MOOD_WORKFLOW_VERSION_KEY);
    if (savedVersion !== MOOD_WORKFLOW_VERSION) {
      localStorage.removeItem('shoonaya_mood_dismissed');
      localStorage.removeItem('home_mood_date');
      localStorage.removeItem('home_mood_key');
      localStorage.removeItem(PENDING_FOLLOWUP_KEY);
      localStorage.setItem(MOOD_WORKFLOW_VERSION_KEY, MOOD_WORKFLOW_VERSION);
    }
  }, []);

  useEffect(() => {
    // If backend state is authoritative, use it. Otherwise, use optimistic local storage cache.
    if (backendState?.isLoaded) {
      if (!backendState.hasDismissedToday) {
        setIsVisible(true);
        if (backendState.hasCompletedToday) {
          setIsCheckInAgain(true);
        } else {
          setIsCheckInAgain(false);
        }
      } else {
        setIsVisible(false);
      }
      return;
    }

    // Fallback: Optimistic local state before backend resolves
    const lastDismissed = localStorage.getItem('shoonaya_mood_dismissed');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastDismissed !== today) {
      setIsVisible(true);
    }
  }, [backendState]);

  const handleDismiss = async () => {
    // Send dismiss event to backend
    fetch('/api/mood/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        dismissed: true,
        source_surface: 'home_dashboard' 
      }),
    }).catch(console.error); // Fire and forget

    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('shoonaya_mood_dismissed', today);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        initial={prefersReducedMotion ? undefined : { opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
        onClick={handleDismiss}
      />
      
      {/* Modal Card */}
      <motion.div
        initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 10 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-sm p-6 rounded-3xl border overflow-hidden shadow-2xl"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'var(--card-border, rgba(200, 146, 74, 0.22))',
        }}
      >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-cream)' }}>
            {isCheckInAgain ? 'Check in again' : `How are you feeling, ${userName}?`}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted-warm)' }}>
            {isCheckInAgain ? 'Has your mood shifted?' : 'Take a moment to check in.'}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="w-8 h-8 rounded-full flex items-center justify-center motion-press flex-shrink-0"
          style={{ background: 'rgba(200, 146, 74, 0.10)' }}
        >
          <X size={16} style={{ color: 'var(--text-muted-warm)' }} />
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {MOODS.map((mood) => (
          <button
            key={mood.key}
            onClick={() => {
              onSelectMood(mood.key);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl border motion-press transition-colors"
            style={{
              background: mood.bg,
              borderColor: 'var(--card-border, rgba(255, 255, 255, 0.08))',
            }}
          >
            <MoodGlyph mood={mood.key} color={mood.colour} size={16} />
            <span className="text-[13px] font-medium" style={{ color: 'var(--text-cream)' }}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}
