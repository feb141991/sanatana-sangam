'use client';

import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

import { MOODS_CONFIG } from '@/lib/mood/registry';
import { useThemePreference } from '@/components/providers/ThemeProvider';

export interface PendingMoodFollowup {
  checkinId: string;
  mood: string;
  actionId: string;
  actionTitle: string;
  actionHref: string;
  createdAt: string;
}

interface MoodFollowupSheetProps {
  pending: PendingMoodFollowup;
  onClose: () => void;
  onCompleted: (afterMood: string) => void;
}

export default function MoodFollowupSheet({ pending, onClose, onCompleted }: MoodFollowupSheetProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [reflectionNote, setReflectionNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useThemePreference();
  const MOODS = MOODS_CONFIG[resolvedTheme] || MOODS_CONFIG.dark;

  const initialMoodLabel = useMemo(() => {
    return MOODS.find(option => option.key === pending.mood)?.label || pending.mood;
  }, [pending.mood, MOODS]);

  const handleSave = async () => {
    if (!selectedMood || isSaving) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/mood/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: pending.checkinId,
          clicked_action: pending.actionId,
          completed_action: pending.actionId,
          after_mood: selectedMood,
          reflection_note: reflectionNote,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save mood follow-up');
      }

      onCompleted(selectedMood);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-end"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <motion.div
        className="w-full rounded-t-[2rem] p-6 space-y-5 relative z-10"
        onClick={event => event.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, var(--surface-raised), var(--card-bg))',
          borderTop: '1px solid rgba(197, 160, 89, 0.20)',
          boxShadow: '0 -20px 48px rgba(0, 0, 0, 0.4)',
        }}
        initial={prefersReducedMotion ? undefined : { y: 32, opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { y: 20, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.34, 1.26, 0.64, 1] }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: 'rgba(197, 160, 89, 0.28)' }} />

        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-cream)' }}>
              How do you feel now?
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted-warm)' }}>
              You started with {initialMoodLabel.toLowerCase()} and opened {pending.actionTitle}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center motion-press"
            style={{ background: 'rgba(197, 160, 89, 0.10)' }}
          >
            <X size={15} style={{ color: 'var(--text-muted-warm)' }} />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMood(m.key)}
              className="px-3 py-2 rounded-xl text-sm font-medium border transition-colors"
              style={{
                background: selectedMood === m.key 
                  ? m.colour 
                  : m.bg,
                color: selectedMood === m.key 
                  ? '#000' 
                  : 'var(--text-cream)',
                borderColor: selectedMood === m.key 
                  ? m.colour 
                  : 'var(--card-border, rgba(255, 255, 255, 0.08))'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="mood-followup-reflection"
            className="text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: 'var(--text-dim)' }}
          >
            Quick reflection
          </label>
          <textarea
            id="mood-followup-reflection"
            value={reflectionNote}
            onChange={event => setReflectionNote(event.target.value)}
            placeholder="Optional: what changed after the practice?"
            rows={3}
            className="w-full rounded-2xl border px-4 py-3 text-sm resize-none"
            style={{
              background: 'var(--card-bg, rgba(44, 38, 28, 0.88))',
              borderColor: 'var(--card-border, rgba(197, 160, 89, 0.20))',
              color: 'var(--text-cream)',
            }}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl px-4 py-3 border text-sm font-medium"
            style={{
              background: 'var(--card-bg-soft, rgba(255, 255, 255, 0.03))',
              borderColor: 'var(--card-border, rgba(255, 255, 255, 0.08))',
              color: 'var(--text-muted-warm)',
            }}
          >
            Later
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedMood || isSaving}
            className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(197, 160, 89,0.95), rgba(212,120,74,0.95))',
              color: '#1a1208',
            }}
          >
            {isSaving ? 'Saving…' : 'Save reflection'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
