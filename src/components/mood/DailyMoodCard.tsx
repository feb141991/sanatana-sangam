'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import MoodGlyph from '@/components/ui/MoodGlyph';

const MOOD_CARD_OPTIONS = [
  { key: 'grateful',    label: 'Grateful', colour: '#b09a6a' },
  { key: 'seeking',     label: 'Seeking',  colour: '#c8925e' },
  { key: 'anxious',     label: 'Anxious',  colour: '#7b6f9e' },
  { key: 'joyful',      label: 'Joyful',   colour: '#c8923a' },
  { key: 'scattered',   label: 'Scattered',colour: '#7aab94' },
] as const;

const MOOD_WORKFLOW_VERSION = '2';
const MOOD_WORKFLOW_VERSION_KEY = 'shoonaya_mood_workflow_version';
const PENDING_FOLLOWUP_KEY = 'shoonaya_mood_pending_followup';

interface DailyMoodCardProps {
  onSelectMood: (mood: string) => void;
  userName: string;
}

export default function DailyMoodCard({ onSelectMood, userName }: DailyMoodCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const savedVersion = localStorage.getItem(MOOD_WORKFLOW_VERSION_KEY);
    if (savedVersion !== MOOD_WORKFLOW_VERSION) {
      localStorage.removeItem('shoonaya_mood_dismissed');
      localStorage.removeItem('home_mood_date');
      localStorage.removeItem('home_mood_key');
      localStorage.removeItem(PENDING_FOLLOWUP_KEY);
      localStorage.setItem(MOOD_WORKFLOW_VERSION_KEY, MOOD_WORKFLOW_VERSION);
    }

    const lastDismissed = localStorage.getItem('shoonaya_mood_dismissed');
    const today = new Date().toISOString().split('T')[0];
    if (lastDismissed !== today) {
      setIsVisible(true);
    }
  }, []);

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

  if (!isVisible) return null;

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
      className="relative mx-4 mt-4 mb-2 p-5 rounded-3xl border overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border, rgba(200, 146, 74, 0.22))',
        boxShadow: 'var(--shadow-soft, 0 8px 24px rgba(0,0,0,0.1))',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-cream)' }}>
            How are you feeling, {userName}?
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted-warm)' }}>
            Take a moment to check in.
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

      <div className="flex flex-wrap gap-2">
        {MOOD_CARD_OPTIONS.map((mood) => (
          <button
            key={mood.key}
            onClick={() => {
              onSelectMood(mood.key);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl border motion-press"
            style={{
              background: 'var(--card-bg-soft, rgba(255, 255, 255, 0.03))',
              borderColor: 'var(--card-border, rgba(255, 255, 255, 0.08))',
            }}
          >
            <MoodGlyph mood={mood.key} color={mood.colour} size={16} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-cream)' }}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
