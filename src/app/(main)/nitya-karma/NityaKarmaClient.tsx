'use client';

// ─── Nitya Karma — Daily Morning Sequence ────────────────────────────────────
//
// 7-step tradition-aware morning routine.
// Steps are persisted in nitya_karma_log (one row per step per day).
// Ticks lock for the day — reset happens at midnight (new date = new rows).
//
// Engine calls (when available):
//   engine.nityaKarma.getMorningSequence(userId) → steps + panchang context
//   engine.nityaKarma.markStep(userId, step)     → marks step complete
//   engine.nityaKarma.getStreak(userId)          → current / longest streak
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Flame, CheckCircle2, Circle, Loader2,
  Info, Lock, Trophy, Sunrise, Star, X, Settings2, Plus, Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import { useEngine } from '@/contexts/EngineContext';
import { hapticLight, hapticSuccess } from '@/lib/platform';
import { getTraditionMeta } from '@/lib/tradition-config';
import { usePremium } from '@/hooks/usePremium';
import PremiumActivateModal from '@/components/premium/PremiumActivateModal';
import NityaHeroBanner from '@/components/nitya/NityaHeroBanner';
import type { NityaSequenceStep, NityaKarmaStreak } from '@sangam/sadhana-engine';

// ── Tradition greetings ─────────────────────────────────────────────────────────
const TRADITION_MORNING: Record<string, { greeting: string; allDoneMsg: string }> = {
  hindu:    { greeting: 'Suprabhat 🌅', allDoneMsg: 'Hari Om! Your morning sadhana is complete. The divine sees your devotion. 🙏' },
  sikh:     { greeting: 'Sat Sri Akal ☬', allDoneMsg: 'Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh! Nitnem complete. ☬' },
  buddhist: { greeting: 'Namo Buddhaya ☸️', allDoneMsg: 'Sadhu sadhu sadhu. Your morning practice is complete. May all beings be happy. ☸️' },
  jain:     { greeting: 'Jai Jinendra 🤲', allDoneMsg: 'Jai Jinendra! Samayika complete. Ahimsa and equanimity guide your day. 🤲' },
};

// ── Step-specific motivational messages ──────────────────────────────────────────
const STEP_MESSAGES: Record<string, string[]> = {
  woke_brahma_muhurta: [
    'Brahma Muhurta — you rose before the world. The rishis say this hour is worth a thousand prayers.',
    'Amrit Vela honoured. The mind is clearest before sunrise — you have used it wisely.',
    'Up with the brahma muhurta — most people are still asleep. This hour builds destiny.',
  ],
  snana_done: [
    'Purified body, purified mind. Snana is not just cleanliness — it is a reset of the aura.',
    'Water carries away the heaviness of sleep. You step forward clean and clear.',
    'Sacred bath done. The tradition says even the river rejoices when a sadhak bathes with intention.',
  ],
  tilak_done: [
    'The mark on your forehead carries the tradition of a million practitioners before you. Well done.',
    'Tilak applied — a daily reminder of who you are and what you are here for.',
    'Naam simran begun. Even one moment of genuine naam is worth more than hours of ritual without heart.',
  ],
  sandhya_done: [
    'Sandhya done — you have greeted the day with the same prayer as your ancestors. Beautiful.',
    'Morning prayer complete. The Gita says: the constant effort of practice (abhyasa) is the surest path.',
    'You prayed before you opened your phone. That is dharma in action.',
  ],
  japa_done: [
    '🪬 Japa done — 108 turns of the mala, 108 moments of pure attention. The mind is calmer than before.',
    'Each bead was a small victory over distraction. Your mantra has been heard.',
    'Japa complete. The tradition says: namam is the boat, and repetition is the oar. You have rowed well.',
  ],
  shloka_done: [
    '📖 Shloka received. The scripture enters the heart through the ear and through repetition — you fed both.',
    'Pathshala done. Reading the word of the rishis in the morning plants a seed that grows all day.',
    'Shloka complete. Carry a single line with you today — let it arise when needed.',
  ],
  aarti_done: [
    '🪔 Aarti complete — the flame that went up today carries your intention to what you worship.',
    'The morning closed with gratitude. That is the finest offering a sadhak can make.',
    'Kirtan done. Sound is the oldest medicine. Your vibration for the day is set.',
  ],
};

function getStepMessage(stepId: string): string {
  const msgs = STEP_MESSAGES[stepId];
  if (!msgs) return '✓ Step complete. Well done.';
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// ── Static fallback steps ─────────────────────────────────────────────────────
const FALLBACK_STEPS: NityaSequenceStep[] = [
  { id: 'woke_brahma_muhurta', label: 'Brahma Muhurta',  icon: '🌙', minutes: 0,  description: 'Wake before sunrise — the most auspicious hour for sadhana', completed: false },
  { id: 'snana_done',          label: 'Snana',           icon: '🌊', minutes: 10, description: 'Sacred bath — purify body and mind before worship', completed: false },
  { id: 'tilak_done',          label: 'Tilak / Simran',  icon: '🔱', minutes: 2,  description: 'Apply tilak or begin naam simran — awaken divine awareness', completed: false },
  { id: 'sandhya_done',        label: 'Sandhya Vandana', icon: '🙏', minutes: 15, description: 'Morning prayers or Surya Namaskar — greet the day with devotion', completed: false },
  { id: 'japa_done',           label: 'Japa',            icon: '📿', minutes: 30, description: 'Mantra japa — 1 mala (108 repetitions) to anchor the mind', completed: false },
  { id: 'shloka_done',         label: 'Shloka Paath',    icon: '📖', minutes: 10, description: 'Read or recite today\'s sacred verse — nourish the intellect', completed: false },
  { id: 'aarti_done',          label: 'Aarti / Kirtan',  icon: '🪔', minutes: 5,  description: 'Morning aarti — offer light and song to the divine before beginning your day', completed: false },
];

// ── Tradition-aware step labels ────────────────────────────────────────────────
const STEP_LABELS: Record<string, Record<string, { label: string; icon: string; description: string }>> = {
  sikh: {
    woke_brahma_muhurta: { label: 'Amrit Vela',    icon: '🌙', description: 'Rise before dawn — the ambrosial hour for naam simran' },
    snana_done:          { label: 'Ishnan',         icon: '🌊', description: 'Bathe and purify before beginning nitnem' },
    tilak_done:          { label: 'Naam Simran',    icon: '☬',  description: 'Begin Waheguru simran — Gurmantar in the heart' },
    sandhya_done:        { label: 'Japji Sahib',    icon: '📖', description: 'Recite Japji Sahib — the morning prayer of Guru Nanak Dev Ji' },
    japa_done:           { label: 'Jaap + Chaupai', icon: '📿', description: 'Recite Jaap Sahib and Chaupai Sahib — protection and power' },
    shloka_done:         { label: 'Hukamnama',      icon: '📜', description: 'Receive today\'s divine order from Guru Granth Sahib Ji' },
    aarti_done:          { label: 'Ardas',          icon: '🙏', description: 'Offer Ardas — Sikh supplication for the sangat and the world' },
  },
  buddhist: {
    woke_brahma_muhurta: { label: 'Early Rising',       icon: '🌙', description: 'Rise early — fresh mind supports deep meditation' },
    snana_done:          { label: 'Purification',       icon: '🌊', description: 'Wash and purify body — outer cleanliness reflects inner intention' },
    tilak_done:          { label: 'Precept Reflection', icon: '☸️', description: 'Reflect on the Five Precepts — renew your commitment to ethical life' },
    sandhya_done:        { label: 'Metta Bhavana',      icon: '💛', description: 'Loving-kindness meditation — radiate goodwill to all beings' },
    japa_done:           { label: 'Sitting Practice',   icon: '🧘', description: 'Silent sitting or breath meditation — cultivate samadhi and vipassana' },
    shloka_done:         { label: 'Dhamma Reading',     icon: '📖', description: 'Study a passage from the Dhammapada or a sutta of your choice' },
    aarti_done:          { label: 'Dana Intention',     icon: '🤲', description: 'Set an intention of generosity and service for the day ahead' },
  },
  jain: {
    woke_brahma_muhurta: { label: 'Brahma Muhurta', icon: '🌙', description: 'Rise before dawn — auspicious time for pratikraman and reflection' },
    snana_done:          { label: 'Shaucha',         icon: '🌊', description: 'Physical purification — cleanse body before worship' },
    tilak_done:          { label: 'Sthapana',        icon: '🤲', description: 'Set up the altar and offer flowers or rice to the Tirthankar' },
    sandhya_done:        { label: 'Samayika',        icon: '🙏', description: '48-minute meditation — practise equanimity, the heart of Jain sadhana' },
    japa_done:           { label: 'Navkar Mantra',   icon: '📿', description: 'Recite Navkar Mantra 108 times — salutation to the five supreme beings' },
    shloka_done:         { label: 'Agam Path',       icon: '📖', description: 'Study from the Agam — the canonical Jain texts' },
    aarti_done:          { label: 'Pratikraman',     icon: '🪔', description: 'Morning pratikraman — reflect on and repent for yesterday\'s actions' },
  },
};

function getDefaultSteps(tradition: string): NityaSequenceStep[] {
  const overrides = STEP_LABELS[tradition];
  if (!overrides) return FALLBACK_STEPS;
  return FALLBACK_STEPS.map(step => ({
    ...step,
    label:       overrides[step.id]?.label       ?? step.label,
    icon:        overrides[step.id]?.icon        ?? step.icon,
    description: overrides[step.id]?.description ?? step.description,
  }));
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Apply custom labels/descriptions from user preferences to a step array */
function applyCustomLabels(steps: NityaSequenceStep[], custom: NityaCustom): NityaSequenceStep[] {
  return steps.map(s => ({
    ...s,
    label:       custom.labels[s.id]       || s.label,
    description: custom.descriptions[s.id] || s.description,
  }));
}

// ── Local-first persistence ───────────────────────────────────────────────────
// Saves completed step IDs in localStorage so they survive page navigation
// regardless of whether the Supabase write succeeds.
function localKey(userId: string, date: string) {
  return `nitya_done_${userId}_${date}`;
}
function getLocalDone(userId: string, date: string): Set<string> {
  try {
    const raw = localStorage.getItem(localKey(userId, date));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}
function saveLocalDone(userId: string, date: string, stepId: string) {
  try {
    const existing = getLocalDone(userId, date);
    existing.add(stepId);
    localStorage.setItem(localKey(userId, date), JSON.stringify([...existing]));
  } catch {}
}

function nextBrahmaMuhurtaText(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(4, 30, 0, 0);
  const h = tomorrow.getHours() % 12 || 12;
  const ampm = tomorrow.getHours() < 12 ? 'AM' : 'PM';
  return `Tomorrow at ${h}:30 ${ampm}`;
}

// ── 30-day heatmap helpers ─────────────────────────────────────────────────────
interface DayRecord { date: string; count: number; total: number }

function buildDateRange(days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function heatColour(count: number, total: number, accent: string): string {
  if (total === 0 || count === 0) return 'rgba(255,255,255,0.04)';
  const ratio = count / total;
  if (ratio >= 1) return accent;
  if (ratio >= 0.7) return `${accent}cc`;
  if (ratio >= 0.4) return `${accent}77`;
  return `${accent}33`;
}

// ── Circular progress ring ────────────────────────────────────────────────────
function CircularProgress({ pct, accent, size = 56 }: { pct: number; accent: string; size?: number }) {
  const r   = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={5} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={accent} strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
    </svg>
  );
}

// ── Nitya customization — localStorage helpers ────────────────────────────────
interface NityaCustom {
  /** Overridden step labels keyed by step ID */
  labels: Record<string, string>;
  /** Custom step descriptions keyed by step ID */
  descriptions: Record<string, string>;
  /** Preferred alert time e.g. "04:30" */
  alertTime: string;
  /** Extra user-defined steps (Pro-only) */
  extraSteps: { id: string; label: string; icon: string; minutes: number }[];
}

function customKey(userId: string) {
  return `nitya_custom_${userId}`;
}

function getCustom(userId: string): NityaCustom {
  try {
    const raw = localStorage.getItem(customKey(userId));
    if (!raw) return { labels: {}, descriptions: {}, alertTime: '04:30', extraSteps: [] };
    return { labels: {}, descriptions: {}, alertTime: '04:30', extraSteps: [], ...JSON.parse(raw) };
  } catch {
    return { labels: {}, descriptions: {}, alertTime: '04:30', extraSteps: [] };
  }
}

function saveCustom(userId: string, custom: NityaCustom) {
  try { localStorage.setItem(customKey(userId), JSON.stringify(custom)); } catch {}
}

// ── Nitya Customization Sheet ─────────────────────────────────────────────────
function NityaCustomSheet({
  userId, steps, custom: initialCustom, accent, isPro,
  onSave, onClose,
}: {
  userId: string;
  steps: NityaSequenceStep[];
  custom: NityaCustom;
  accent: string;
  isPro: boolean;
  onSave: (updated: NityaCustom) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<NityaCustom>(JSON.parse(JSON.stringify(initialCustom)));
  const [newStepLabel, setNewStepLabel] = useState('');
  const [newStepIcon, setNewStepIcon]   = useState('🙏');
  const [newStepMins, setNewStepMins]   = useState(10);

  function updateLabel(stepId: string, val: string) {
    setDraft(prev => ({ ...prev, labels: { ...prev.labels, [stepId]: val } }));
  }

  function addExtraStep() {
    if (!newStepLabel.trim()) return;
    const extra = {
      id:      `custom_${Date.now()}`,
      label:   newStepLabel.trim(),
      icon:    newStepIcon || '🙏',
      minutes: newStepMins,
    };
    setDraft(prev => ({ ...prev, extraSteps: [...prev.extraSteps, extra] }));
    setNewStepLabel('');
    setNewStepIcon('🙏');
    setNewStepMins(10);
  }

  function removeExtraStep(id: string) {
    setDraft(prev => ({ ...prev, extraSteps: prev.extraSteps.filter(s => s.id !== id) }));
  }

  function handleSave() {
    saveCustom(userId, draft);
    onSave(draft);
    onClose();
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0"
        style={{ zIndex: 9998, background: 'rgba(0,0,0,0.65)' }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 rounded-t-[2rem] flex flex-col"
        style={{
          zIndex: 9999,
          background: 'linear-gradient(175deg, #1a0d1a 0%, #110808 60%, #130c06 100%)',
          border: '1px solid rgba(200,146,74,0.18)',
          borderBottom: 'none',
          maxHeight: '90dvh',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full opacity-30" style={{ background: accent }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-cream)', letterSpacing: '-0.01em' }}>Customise Your Nitya</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--brand-muted)' }}>Rename steps, set your wake-up time, add practices</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <X size={15} style={{ color: 'var(--brand-muted)' }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-3 space-y-5">

          {/* Alert time */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bell size={14} style={{ color: accent }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--brand-ink)' }}>Morning Alert Time</p>
            </div>
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(200,146,74,0.06)', border: '1px solid rgba(200,146,74,0.12)' }}
            >
              <Bell size={16} style={{ color: accent }} />
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>Wake-up reminder</p>
              </div>
              <input
                type="time"
                value={draft.alertTime}
                onChange={e => setDraft(prev => ({ ...prev, alertTime: e.target.value }))}
                className="rounded-xl px-3 py-1.5 text-sm font-semibold border focus:outline-none focus:ring-1"
                style={{
                  background: 'rgba(200,146,74,0.12)',
                  color: accent,
                  borderColor: 'rgba(200,146,74,0.25)',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <p className="text-[10px] mt-1.5 px-1" style={{ color: 'rgba(180,160,100,0.45)' }}>
              We&apos;ll send your Brahma Muhurta alert at this time each morning
            </p>
          </div>

          {/* Step labels */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings2 size={14} style={{ color: accent }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--brand-ink)' }}>Rename Steps</p>
            </div>
            <div className="space-y-2">
              {steps.map(step => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(200,146,74,0.05)', border: '1px solid rgba(200,146,74,0.1)' }}
                >
                  <span className="text-xl flex-shrink-0">{step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] mb-1" style={{ color: 'var(--brand-muted)' }}>Default: {step.label}</p>
                    <input
                      type="text"
                      placeholder={step.label}
                      value={draft.labels[step.id] ?? ''}
                      onChange={e => updateLabel(step.id, e.target.value)}
                      maxLength={40}
                      className="w-full rounded-lg px-2.5 py-1.5 text-sm border focus:outline-none focus:ring-1 bg-transparent"
                      style={{
                        color: 'var(--brand-ink)',
                        borderColor: 'rgba(200,146,74,0.2)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extra steps (Pro only) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Plus size={14} style={{ color: accent }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--brand-ink)' }}>Custom Practices</p>
            </div>

            {/* Existing extra steps */}
            {draft.extraSteps.length > 0 && (
              <div className="space-y-2 mb-3">
                {draft.extraSteps.map(es => (
                  <div
                    key={es.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(200,146,74,0.06)', border: '1px solid rgba(200,146,74,0.12)' }}
                  >
                    <span className="text-lg">{es.icon}</span>
                    <span className="flex-1 text-sm" style={{ color: 'var(--brand-ink)' }}>{es.label}</span>
                    <span className="text-xs" style={{ color: 'var(--brand-muted)' }}>{es.minutes}m</span>
                    <button onClick={() => removeExtraStep(es.id)}>
                      <X size={14} style={{ color: 'var(--brand-muted)' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new step form */}
            <div
              className="rounded-2xl px-4 py-4 space-y-3"
              style={{ background: 'rgba(200,146,74,0.05)', border: '1px solid rgba(200,146,74,0.1)' }}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Step icon (emoji)"
                  value={newStepIcon}
                  onChange={e => setNewStepIcon(e.target.value)}
                  maxLength={4}
                  className="w-16 rounded-xl px-2 py-2 text-center text-lg border focus:outline-none bg-transparent"
                  style={{ borderColor: 'rgba(200,146,74,0.2)', color: 'var(--brand-ink)' }}
                />
                <input
                  type="text"
                  placeholder="Practice name (e.g. Tratak, Pranayama…)"
                  value={newStepLabel}
                  onChange={e => setNewStepLabel(e.target.value)}
                  maxLength={50}
                  className="flex-1 rounded-xl px-3 py-2 text-sm border focus:outline-none bg-transparent"
                  style={{ borderColor: 'rgba(200,146,74,0.2)', color: 'var(--brand-ink)' }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--brand-muted)' }}>Duration (min):</span>
                <input
                  type="number"
                  min={1} max={120}
                  value={newStepMins}
                  onChange={e => setNewStepMins(Number(e.target.value))}
                  className="w-16 rounded-xl px-2 py-1.5 text-sm text-center border focus:outline-none bg-transparent"
                  style={{ borderColor: 'rgba(200,146,74,0.2)', color: 'var(--brand-ink)' }}
                />
                <button
                  onClick={addExtraStep}
                  disabled={!newStepLabel.trim()}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-opacity"
                  style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}33` }}
                >
                  <Plus size={12} /> Add step
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex-shrink-0 px-5 pt-3 pb-2">
          <motion.button
            onClick={handleSave}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-bold text-base"
            style={{
              background: 'linear-gradient(135deg, #C8924A 0%, #D4784A 50%, #b07040 100%)',
              color: '#1c1c1a',
              boxShadow: '0 4px 24px rgba(200,146,74,0.3)',
            }}
          >
            Save Customisation
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ── Streak card ──────────────────────────────────────────────────────────────
function StreakCard({ streak, accent }: { streak: NityaKarmaStreak; accent: string }) {
  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/6"
      style={{ background: `${accent}08` }}
    >
      <Trophy size={18} style={{ color: accent }} />
      <div>
        <p className="text-sm font-semibold text-[color:var(--brand-ink)]">
          🔥 {streak.current_streak}-day streak
        </p>
        <p className="text-xs text-[color:var(--brand-muted)]">
          Longest: {streak.longest_streak} days · Keep going — don&apos;t break the chain!
        </p>
      </div>
    </div>
  );
}

// ── Pro Upgrade Sheet ────────────────────────────────────────────────────────
function ProUpgradeSheet({ onClose, accent }: { onClose: () => void; accent: string }) {
  const PRO_FEATURES = [
    '🔥 30-day streak analytics & heatmap',
    '🤖 AI-personalised sadhana sequences',
    '📿 Full Japa history & insights',
    '🕉️ Sattvic Mode — guided prānāyāma & kīrtana',
    '📅 Panchang-aware vrat & sandhyā reminders',
    '☬ Tradition-specific step variations',
  ];
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="w-full max-w-2xl mx-auto rounded-t-3xl p-6 space-y-4"
        style={{
          background: 'linear-gradient(180deg,#1a1408 0%,#110e04 100%)',
          border: '1px solid rgba(200,146,74,0.22)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle + close */}
        <div className="flex items-center justify-between">
          <div className="w-10 h-1 rounded-full bg-white/15 mx-auto" />
          <button onClick={onClose} className="absolute right-5 top-5 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} className="text-white/50" />
          </button>
        </div>

        {/* Hero */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 border border-amber-400/30 bg-amber-400/10 mb-2">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-amber-400">SANGAM PRO</span>
          </div>
          <h2 className="font-bold text-2xl text-[color:var(--brand-ink)]">Unlock Your Full Journey</h2>
          <p className="text-sm text-[color:var(--brand-muted)]">Everything you need for a deep, sustained sadhana.</p>
        </div>

        {/* Features */}
        <div className="space-y-2">
          {PRO_FEATURES.map(f => (
            <div key={f} className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-white/5"
              style={{ background: `${accent}0a` }}>
              <span className="text-sm text-[color:var(--brand-ink)]">{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-bold text-base"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            color: '#1c1208',
            boxShadow: `0 4px 28px ${accent}44`,
          }}
        >
          Upgrade to Sangam Pro →
        </motion.button>
        <button onClick={onClose} className="w-full py-2 text-sm text-[color:var(--brand-muted)] text-center">
          Maybe later
        </button>
      </motion.div>
    </motion.div>
  );
}

interface Props {
  userId:    string;
  userName:  string;
  tradition: string;
  isPro?:    boolean;
}

export default function NityaKarmaClient({ userId, userName, tradition }: Omit<Props, 'isPro'>) {
  const router              = useRouter();
  const supabase            = useRef(createClient()).current;
  const { engine, isReady } = useEngine();
  const meta                = getTraditionMeta(tradition);
  const morning             = TRADITION_MORNING[tradition] ?? TRADITION_MORNING.hindu;
  const accent              = meta.accentColour;
  const isPro               = usePremium();

  const [steps,         setSteps]        = useState<NityaSequenceStep[]>([]);
  const [greeting,      setGreeting]     = useState('');
  const [panchang,      setPanchang]     = useState<any>(null);
  const [streak,        setStreak]       = useState<NityaKarmaStreak | null>(null);
  const [loading,       setLoading]      = useState(true);
  const [busySteps,     setBusySteps]    = useState<Set<string>>(new Set());
  const [justCompleted, setJustCompleted]= useState<string | null>(null);
  const [dayRecords,    setDayRecords]   = useState<DayRecord[]>([]);
  const [showProSheet,  setShowProSheet] = useState(false);
  const [showCustom,    setShowCustom]   = useState(false);
  const [custom,        setCustom]       = useState<NityaCustom>({ labels: {}, descriptions: {}, alertTime: '04:30', extraSteps: [] });

  const confettiFired = useRef(false);
  const stepsRef      = useRef<NityaSequenceStep[]>([]);
  useEffect(() => { stepsRef.current = steps; }, [steps]);

  // ── Load customization from localStorage ──────────────────────────────────
  useEffect(() => {
    setCustom(getCustom(userId));
  }, [userId]);

  // ── Load 30-day history ───────────────────────────────────────────────────
  useEffect(() => {
    async function loadHistory() {
      const dates = buildDateRange(30);
      const from = dates[0];
      const { data } = await supabase
        .from('nitya_karma_log')
        .select('log_date, step_id')
        .eq('user_id', userId)
        .gte('log_date', from);

      const countMap: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.log_date) countMap[row.log_date] = (countMap[row.log_date] ?? 0) + 1;
      }

      setDayRecords(dates.map(d => ({ date: d, count: countMap[d] ?? 0, total: FALLBACK_STEPS.length })));
    }
    loadHistory();
  }, [userId, supabase]);

  // ── Load + merge engine steps with DB-persisted ticks ─────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadTodayLog(baseSteps: NityaSequenceStep[]): Promise<NityaSequenceStep[]> {
      const today = todayDateString();

      // Always start with what we have locally — instant, works offline
      const doneIds = getLocalDone(userId, today);

      // Merge in whatever Supabase has (may add cross-device completions)
      try {
        const { data } = await supabase
          .from('nitya_karma_log')
          .select('step_id')
          .eq('user_id', userId)
          .eq('log_date', today);
        (data ?? []).forEach((r: any) => { if (r.step_id) doneIds.add(r.step_id as string); });
      } catch { /* offline — local data is still used */ }

      return baseSteps.map(s => ({ ...s, completed: s.completed || doneIds.has(s.id) }));
    }

    const fallbackTimer = setTimeout(async () => {
      if (cancelled) return;
      const base   = getDefaultSteps(tradition);
      const merged = await loadTodayLog(base);
      if (!cancelled) { setSteps(merged); setGreeting(morning.greeting); setLoading(false); }
    }, 4000);

    if (!isReady || !engine) return () => { cancelled = true; clearTimeout(fallbackTimer); };

    async function load() {
      try {
        const [seq, str] = await Promise.all([
          engine!.nityaKarma.getMorningSequence(userId),
          engine!.nityaKarma.getStreak(userId),
        ]);
        const merged = await loadTodayLog(seq.sequence);
        if (!cancelled) {
          setSteps(merged);
          setGreeting(seq.greeting || morning.greeting);
          setPanchang(seq.panchang_context);
          setStreak(str);
        }
      } catch {
        const base   = getDefaultSteps(tradition);
        const merged = await loadTodayLog(base);
        if (!cancelled) {
          setSteps(merged);
          setGreeting(morning.greeting);
          try { const str = await engine!.nityaKarma.getStreak(userId); if (!cancelled) setStreak(str); } catch { /* silent */ }
        }
      } finally {
        clearTimeout(fallbackTimer);
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; clearTimeout(fallbackTimer); };
  }, [isReady, engine, userId, tradition, morning.greeting, supabase]);

  // ── Mark a step — try-finally ensures busySteps always clears ─────────────
  async function markStep(stepId: string, done: boolean) {
    if (done || busySteps.has(stepId)) return;
    setBusySteps(prev => new Set([...prev, stepId]));
    try {
      await hapticLight();

      // Optimistic UI update
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, completed: true } : s));
      setJustCompleted(stepId);
      setTimeout(() => setJustCompleted(null), 2500);

      // ── Persist step completion ──────────────────────────────────────────
      const today = todayDateString();

      // 1. Write to localStorage immediately — always works, survives navigation
      saveLocalDone(userId, today, stepId);

      // 2. Try Supabase (best-effort for cross-device sync).
      //    Use plain insert — upsert with onConflict requires a DB unique constraint
      //    that may not exist. insert is safe: a 23505 unique-violation just means
      //    the row is already there, which is fine.
      try {
        const { error } = await supabase.from('nitya_karma_log').insert({
          user_id: userId, log_date: today, step_id: stepId,
        });
        if (!error || error.code === '23505') {
          // Success or row already existed — either way the data is there
          setDayRecords(prev => prev.map(d =>
            d.date === today ? { ...d, count: Math.min(d.count + 1, d.total) } : d
          ));
        } else {
          // Log so we can diagnose schema issues without silently losing data
          console.warn('[Nitya] DB write error:', error.code, error.message);
        }
      } catch (err) {
        console.warn('[Nitya] DB write threw:', err);
      }

      // Engine sync (best-effort)
      if (engine) {
        try { await engine.nityaKarma.markStep(userId, stepId as any); } catch { /* silent */ }
      }

      // Check all done using ref (avoids stale closure)
      const currentSteps = stepsRef.current;
      const allNowDone   = currentSteps.every(s => s.id === stepId ? true : s.completed);

      if (allNowDone && !confettiFired.current) {
        confettiFired.current = true;
        await hapticSuccess();
        toast.success(morning.allDoneMsg, { duration: 5000 });
        if (engine) {
          try { const str = await engine.nityaKarma.getStreak(userId); setStreak(str); } catch { /* silent */ }
        }
      } else {
        // Use hardcoded colors — CSS variables don't work inside toast portals
        toast(getStepMessage(stepId), {
          icon: '🙏',
          duration: 3500,
          style: {
            background: '#1c1c1a',
            color: '#f0ede4',
            border: `1px solid ${accent}40`,
            borderRadius: '14px',
            fontSize: '13px',
            maxWidth: '320px',
          },
        });
      }
    } finally {
      // Always clear the busy lock — even if something above throws
      setBusySteps(prev => { const n = new Set(prev); n.delete(stepId); return n; });
    }
  }

  // Apply custom labels and merge extra Pro steps
  const displaySteps: NityaSequenceStep[] = [
    ...applyCustomLabels(steps, custom),
    ...(isPro ? custom.extraSteps.map(es => ({
      id: es.id, label: es.label, icon: es.icon, minutes: es.minutes,
      description: 'Custom practice', completed: false,
    } as NityaSequenceStep)) : []),
  ];

  const completedCount = displaySteps.filter(s => s.completed).length;
  const totalSteps     = displaySteps.length;
  const progressPct    = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  const allDone        = completedCount === totalSteps && totalSteps > 0;
  const vataDays       = panchang?.vrata ?? null;

  return (
    <div className="min-h-screen pb-28">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full glass-panel border border-white/10 flex items-center justify-center"
        >
          <ChevronLeft size={20} style={{ color: accent }} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg text-[color:var(--brand-ink)]">My Sadhana Path</h1>
          <p className="text-xs text-[color:var(--brand-muted)]">
            {meta.symbol} {tradition === 'sikh' ? 'Nitnem' : tradition === 'buddhist' ? 'Morning Practice' : 'Nitya Karma'} · personalised for you
          </p>
        </div>
        <div className="flex items-center gap-2">
          {streak && streak.current_streak > 0 && isPro && (
            <div
              className="flex items-center gap-1 rounded-xl px-3 py-1.5 border border-white/10"
              style={{ background: `${accent}14` }}
            >
              <Flame size={14} style={{ color: accent }} />
              <span className="text-xs font-semibold" style={{ color: accent }}>{streak.current_streak}d</span>
            </div>
          )}
          {/* Customise button — Pro only */}
          {isPro ? (
            <>
              <button
                onClick={() => setShowCustom(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10"
                style={{ background: `${accent}14` }}
                title="Customise your Nitya Karma"
              >
                <Settings2 size={15} style={{ color: accent }} />
              </button>
              <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border border-amber-400/30 bg-amber-400/10">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">PRO</span>
              </div>
            </>
          ) : (
            <button
              onClick={() => setShowProSheet(true)}
              className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border border-amber-400/20 bg-amber-400/8 transition-all hover:bg-amber-400/14"
            >
              <Star size={11} className="text-amber-400/70" />
              <span className="text-[10px] font-semibold text-amber-400/70">Pro</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero banner — time-aware animated sky */}
      <NityaHeroBanner
        greeting={greeting || morning.greeting}
        userName={userName}
        completedCount={completedCount}
        totalSteps={totalSteps}
        progressPct={progressPct}
        streak={streak}
        isPro={isPro}
        panchang={panchang}
        vataDays={vataDays}
      />

      {/* Vrat alert */}
      {vataDays && (
        <div
          className="mx-4 mb-3 rounded-2xl border px-4 py-3 flex items-start gap-3"
          style={{ background: `${accent}10`, borderColor: `${accent}30` }}
        >
          <span className="text-xl shrink-0">🌟</span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--brand-ink)]">Today is {vataDays}</p>
            <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-relaxed">
              A vrat/fast day adds extra spiritual merit to your sadhana. Observe nirjala or phalahar as per your tradition and add an extended japa or stotra session.
            </p>
          </div>
        </div>
      )}

      {/* Steps */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 pt-20">
          <Loader2 size={22} className="animate-spin" style={{ color: accent }} />
          <span className="text-sm text-[color:var(--brand-muted)]">Getting your morning sequence…</span>
        </div>
      ) : (
        <div className="px-4 space-y-3">

          {/* ── Colorful ring progress summary ───────────────────────────── */}
          {!allDone && (
            <div
              className="rounded-2xl px-4 py-4 flex items-center gap-4 border border-white/8"
              style={{ background: `${accent}08` }}
            >
              {/* Big ring */}
              {(() => {
                const r    = 32;
                const circ = 2 * Math.PI * r;
                const off  = circ * (1 - progressPct / 100);
                return (
                  <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90 flex-shrink-0">
                    <defs>
                      <linearGradient id="nitya-ring-grad" x1="1" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#f0c86d" />
                        <stop offset="60%"  stopColor={accent} />
                        <stop offset="100%" stopColor="#D4784A" />
                      </linearGradient>
                    </defs>
                    <circle cx="40" cy="40" r={r}
                      fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} />
                    <motion.circle
                      cx="40" cy="40" r={r}
                      fill="none"
                      stroke={completedCount === totalSteps ? '#7ec87e' : 'url(#nitya-ring-grad)'}
                      strokeWidth={7}
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      initial={{ strokeDashoffset: circ }}
                      animate={{ strokeDashoffset: off }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </svg>
                );
              })()}
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: accent, lineHeight: 1 }}>
                  {completedCount}<span style={{ fontSize: '1rem', color: 'var(--brand-muted)' }}>/{totalSteps}</span>
                </p>
                <p className="text-sm font-semibold text-[color:var(--brand-ink)] mt-0.5">
                  {completedCount === 0 ? 'Start your sadhana' : `${totalSteps - completedCount} step${totalSteps - completedCount !== 1 ? 's' : ''} remaining`}
                </p>
                <p className="text-xs text-[color:var(--brand-muted)] mt-0.5">
                  {Math.round(progressPct)}% of today's Nitya Karma done
                </p>
              </div>
              {/* Mini rings for each step */}
              <div className="flex gap-1 flex-wrap justify-end" style={{ maxWidth: 80 }}>
                {displaySteps.map(s => (
                  <motion.div
                    key={s.id}
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      background: s.completed ? accent : 'rgba(255,255,255,0.08)',
                      border: s.completed ? 'none' : `1px solid ${accent}30`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {displaySteps.map((step, idx) => {
            const isJustDone = justCompleted === step.id;
            const isBusy     = busySteps.has(step.id);
            return (
              <motion.button
                key={step.id}
                onClick={() => markStep(step.id, step.completed)}
                disabled={step.completed || isBusy}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.4 }}
                whileTap={!step.completed && !isBusy ? { scale: 0.97 } : {}}
                className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4 ${
                  step.completed ? 'border-white/6' : 'glass-panel border-white/8'
                }`}
                style={{
                  ...(step.completed ? { background: `${accent}08` } : {}),
                  ...(isJustDone ? { boxShadow: `0 0 0 2px ${accent}55` } : {}),
                  transition: 'box-shadow 0.4s ease',
                }}
              >
                {/* Icon */}
                <motion.div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: step.completed ? `${accent}20` : `${accent}12` }}
                  animate={isJustDone ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  {isBusy
                    ? <Loader2 size={18} className="animate-spin" style={{ color: accent }} />
                    : step.completed
                      ? <CheckCircle2 size={22} className="text-green-400" />
                      : <span>{step.icon}</span>
                  }
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${
                      step.completed ? 'text-[color:var(--brand-muted)] line-through' : 'text-[color:var(--brand-ink)]'
                    }`}>
                      {step.label}
                    </p>
                    {step.minutes > 0 && (
                      <span className="text-[10px] font-medium rounded-full px-2 py-0.5"
                        style={{ background: `${accent}14`, color: accent }}>
                        {step.minutes}m
                      </span>
                    )}
                    {step.completed && (
                      <span className="text-[10px] text-green-400 font-medium">Done ✓</span>
                    )}
                  </div>
                  {!step.completed && (
                    <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                  {step.id === 'japa_done' && !step.completed && (
                    <Link href="/japa" onClick={e => e.stopPropagation()}
                      className="mt-1.5 inline-flex text-xs font-semibold underline underline-offset-2"
                      style={{ color: accent }}>
                      Open Japa Counter →
                    </Link>
                  )}
                  {step.id === 'shloka_done' && !step.completed && (
                    <Link href="/pathshala" onClick={e => e.stopPropagation()}
                      className="mt-1.5 inline-flex text-xs font-semibold underline underline-offset-2"
                      style={{ color: accent }}>
                      Open Pathshala →
                    </Link>
                  )}
                </div>

                {/* Right */}
                {step.completed
                  ? <Lock size={16} className="text-white/20 shrink-0" />
                  : !isBusy
                    ? <Circle size={20} className="text-white/20 shrink-0" />
                    : null}
              </motion.button>
            );
          })}

          {/* All done state */}
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl p-6 text-center space-y-3 border border-white/10"
              style={{ background: `linear-gradient(135deg, ${accent}20, ${accent}10)` }}
            >
              <motion.div className="text-5xl" animate={{ scale: [0.8, 1.15, 1] }} transition={{ duration: 0.5 }}>🙏</motion.div>
              <p className="font-bold text-[color:var(--brand-ink)] text-lg">Full Nitya Karma Complete!</p>
              {streak && (
                <p className="text-[color:var(--brand-muted)] text-sm">
                  <Flame size={13} className="inline mb-0.5 mr-0.5 text-orange-400" />
                  {streak.current_streak}-day streak · Longest: {streak.longest_streak} days
                </p>
              )}
              <div
                className="mt-2 mx-auto max-w-xs rounded-2xl px-4 py-3 flex items-start gap-2.5"
                style={{ background: `${accent}14`, border: `1px solid ${accent}30` }}
              >
                <Sunrise size={16} style={{ color: accent }} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-left" style={{ color: accent }}>
                  Your steps are locked for today. Come back tomorrow — next Brahma Muhurta opens{' '}
                  <span className="font-semibold">{nextBrahmaMuhurtaText()}</span>.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-1 flex-wrap">
                <Link href="/japa" className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: `${accent}18`, color: accent }}>
                  Japa Counter
                </Link>
                <Link href="/pathshala" className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: `${accent}18`, color: accent }}>
                  Pathshala
                </Link>
                <Link href="/nitya-karma/plans" className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: `${accent}18`, color: accent }}>
                  ✦ Guided Plans
                </Link>
              </div>
            </motion.div>
          )}

          {/* Streak card */}
          {!allDone && streak && streak.current_streak > 0 && (
            <StreakCard streak={streak} accent={accent} />
          )}

          {/* 30-Day Practice Graph */}
          <div className="glass-panel rounded-2xl border border-white/8 overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[color:var(--brand-ink)]">30-Day Sadhana</p>
                <p className="text-xs text-[color:var(--brand-muted)] mt-0.5">Daily practice completion</p>
              </div>
              {!isPro && (
                <button
                  onClick={() => setShowProSheet(true)}
                  className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 border border-amber-400/30 bg-amber-400/10 transition-all hover:bg-amber-400/18"
                >
                  <Lock size={11} className="text-amber-400" />
                  <span className="text-[10px] font-semibold text-amber-400">Pro</span>
                </button>
              )}
            </div>

            {isPro ? (
              <div className="px-4 pb-4">
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                  {dayRecords.map(d => (
                    <div key={d.date} title={`${d.date}: ${d.count}/${d.total} steps`}
                      className="aspect-square rounded-md transition-colors"
                      style={{ background: heatColour(d.count, d.total, accent) }} />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-[color:var(--brand-muted)]">30 days ago</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: `${accent}33` }} />
                    <span className="text-[10px] text-[color:var(--brand-muted)]">Partial</span>
                    <div className="w-2.5 h-2.5 rounded-sm ml-1" style={{ background: accent }} />
                    <span className="text-[10px] text-[color:var(--brand-muted)]">Full</span>
                  </div>
                  <span className="text-[10px] text-[color:var(--brand-muted)]">Today</span>
                </div>
                {streak && (
                  <div className="mt-3 pt-3 border-t border-white/6 flex items-center justify-around">
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: accent }}>{streak.current_streak}</p>
                      <p className="text-[10px] text-[color:var(--brand-muted)]">Current streak</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: accent }}>{streak.longest_streak}</p>
                      <p className="text-[10px] text-[color:var(--brand-muted)]">Best streak</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: accent }}>
                        {dayRecords.filter(d => d.count > 0).length}
                      </p>
                      <p className="text-[10px] text-[color:var(--brand-muted)]">Active days</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative px-4 pb-4">
                <div className="grid gap-1 blur-sm pointer-events-none select-none"
                  style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                  {buildDateRange(30).map((d, i) => (
                    <div key={d} className="aspect-square rounded-md"
                      style={{ background: i % 3 === 0 ? accent : i % 3 === 1 ? `${accent}55` : `${accent}18` }} />
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 rounded-b-2xl">
                  <Lock size={18} className="text-amber-400" />
                  <p className="text-xs font-semibold text-[color:var(--brand-ink)]">Practice history is a Pro feature</p>
                  <p className="text-[10px] text-[color:var(--brand-muted)] text-center px-6">
                    Unlock 30-day graphs, streak analytics, and AI-personalised sequences
                  </p>
                  <motion.button
                    onClick={() => setShowProSheet(true)}
                    whileTap={{ scale: 0.96 }}
                    className="mt-1 px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-400/20 text-amber-400 border border-amber-400/30"
                  >
                    Upgrade to Pro →
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {/* Engine note */}
          <div className="glass-panel rounded-2xl border border-white/6 px-4 py-3 flex items-start gap-2.5">
            <Info size={14} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[color:var(--brand-muted)] leading-relaxed">
              Your sequence adapts to today&apos;s tithi, nakshatra, and vrat.{' '}
              <button
                onClick={() => setShowProSheet(true)}
                className="font-semibold text-[color:var(--brand-ink)] underline underline-offset-2"
              >
                Sangam Pro
              </button>
              {' '}unlocks AI-personalised sequences, 30-day analytics, and{' '}
              <Link href="/nitya-karma/plans" className="font-semibold text-[color:var(--brand-ink)] underline underline-offset-2">
                Guided Sadhana Plans
              </Link>.
            </p>
          </div>
        </div>
      )}

      {/* Premium activation modal (replaces old ProUpgradeSheet) */}
      <PremiumActivateModal open={showProSheet} onClose={() => setShowProSheet(false)} />

      {/* Nitya customization sheet — Pro only */}
      {showCustom && isPro && (
        <NityaCustomSheet
          userId={userId}
          steps={steps}
          custom={custom}
          accent={accent}
          isPro={isPro}
          onSave={updated => setCustom(updated)}
          onClose={() => setShowCustom(false)}
        />
      )}
    </div>
  );
}
