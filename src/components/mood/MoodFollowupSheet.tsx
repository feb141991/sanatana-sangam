'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

import { MOODS_CONFIG } from '@/lib/mood/registry';
import { useThemePreference } from '@/components/providers/ThemeProvider';

// ── Celebration particle ──────────────────────────────────────────────────────
function Particle({ delay, colour }: { delay: number; colour: string }) {
  const angle = Math.random() * 360;
  const dist  = 60 + Math.random() * 60;
  const x = Math.cos((angle * Math.PI) / 180) * dist;
  const y = Math.sin((angle * Math.PI) / 180) * dist;
  return (
    <motion.span
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{ background: colour, top: '50%', left: '50%', marginLeft: -4, marginTop: -4 }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0 }}
      transition={{ duration: 0.9 + Math.random() * 0.4, delay, ease: 'easeOut' }}
    />
  );
}

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
  const [showCelebration, setShowCelebration] = useState(false);
  const [savedMood, setSavedMood] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useThemePreference();
  const MOODS = MOODS_CONFIG[resolvedTheme] || MOODS_CONFIG.dark;

  const initialMoodLabel = useMemo(() => {
    return MOODS.find(option => option.key === pending.mood)?.label || pending.mood;
  }, [pending.mood, MOODS]);

  const afterMoodConf = useMemo(() => {
    return savedMood ? MOODS.find(m => m.key === savedMood) : null;
  }, [savedMood, MOODS]);

  // Auto-dismiss the celebration and complete the cycle after 2.8 s
  useEffect(() => {
    if (!showCelebration || !savedMood) return;
    const timer = setTimeout(() => {
      setShowCelebration(false);
      onCompleted(savedMood);
    }, 2800);
    return () => clearTimeout(timer);
  }, [showCelebration, savedMood, onCompleted]);

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

      if (!response.ok) throw new Error('Failed to save mood follow-up');

      setSavedMood(selectedMood);
      setShowCelebration(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Celebration overlay — replaces the modal after reflection is saved ──────
  const celebrationView = (
    <AnimatePresence>
      {showCelebration && afterMoodConf && (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { setShowCelebration(false); onCompleted(savedMood!); }}
        >
          <div className="relative flex flex-col items-center gap-5 text-center px-8">
            {/* Burst particles */}
            {!prefersReducedMotion && Array.from({ length: 14 }).map((_, i) => (
              <Particle key={i} delay={i * 0.04} colour={afterMoodConf.colour} />
            ))}

            {/* Glowing mood circle */}
            <motion.div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl relative"
              style={{
                background: `radial-gradient(circle, ${afterMoodConf.colour}33, transparent 70%)`,
                border: `2px solid ${afterMoodConf.colour}55`,
                boxShadow: `0 0 48px ${afterMoodConf.colour}44`,
              }}
              initial={prefersReducedMotion ? undefined : { scale: 0.4, opacity: 0 }}
              animate={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            >
              🙏
            </motion.div>

            {/* Message */}
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-cream)' }}>
                Practice complete 🌟
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-muted-warm)', lineHeight: 1.6 }}>
                You started <span style={{ color: afterMoodConf.colour, fontWeight: 600 }}>{initialMoodLabel.toLowerCase()}</span>{' '}
                and you&apos;re feeling{' '}
                <span style={{ color: afterMoodConf.colour, fontWeight: 600 }}>{afterMoodConf.label.toLowerCase()}</span> now.{' '}
                Your reflection has been saved. 🙏
              </p>
            </motion.div>

            <motion.p
              className="text-[11px] mt-2"
              style={{ color: 'var(--text-dim)' }}
              initial={prefersReducedMotion ? undefined : { opacity: 0 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Tap anywhere to continue
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
    {celebrationView}
    <motion.div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <motion.div
        className="w-full max-w-sm rounded-3xl p-6 space-y-5 relative z-10 overflow-y-auto"
        onClick={event => event.stopPropagation()}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid rgba(197, 160, 89, 0.22)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          maxHeight: '90dvh',
        }}
        initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 10 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >

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
    </>
  );
}
