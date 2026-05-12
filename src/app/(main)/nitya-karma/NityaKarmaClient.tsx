'use client';

// ─── Nitya Karma — Daily Morning Sequence ────────────────────────────────────
//
// 7-step tradition-aware morning routine.
// Steps are persisted in nitya_karma_log (one row per step per day).
//
// SPIRITUAL DAY: In Sanatana Dharma a new day begins at Brahma Muhurta (dawn),
// not at civil midnight. We use localSpiritualDate(timezone, 4) everywhere
// "today" is needed — before 4 AM local time, the previous date is returned so
// the sadhak still sees their completed steps from the night before.
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
  ChevronLeft, ChevronDown, Flame, CheckCircle2, Circle, Loader2,
  Info, Lock, Trophy, Sunrise, Star, X, Settings2, Plus, Bell, BarChart2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import { useEngine } from '@/contexts/EngineContext';
import { hapticLight, hapticSuccess } from '@/lib/platform';
import { getTraditionMeta } from '@/lib/tradition-config';
import { getAshramaDuties, getAshramaMeta, type LifeStage, type GenderContext } from '@/lib/ashrama';
import { localSpiritualDate, buildSpiritualDateRange } from '@/lib/sacred-time';
import { calculatePanchang, getTodaySpiritualPulse } from '@/lib/panchang';
import { usePremium } from '@/hooks/usePremium';
import PremiumActivateModal from '@/components/premium/PremiumActivateModal';
import NityaHeroBanner from '@/components/nitya/NityaHeroBanner';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';
import type { NityaSequenceStep, NityaKarmaStreak } from '@sangam/sadhana-engine';
import { useVocabulary } from '@/hooks/useVocabulary';

// ── Tradition greetings ─────────────────────────────────────────────────────────
// TRADITION_MORNING moved to TRADITION_CONFIG

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
    'The mark on your forehead carries the tradition of a million practitioners before you. You are ready.',
    'Tilak applied — sankalpa made. The ajna chakra is sealed; your intention for this day is set.',
    'Wearing the sign of your ishtadevata, you step into worship. The outer mark reminds you of the inner vow.',
  ],
  sandhya_done: [
    'Vandana done — you have greeted the sun with the same arghya as your ancestors for ten thousand years. Beautiful.',
    'Morning salutation complete. The Gita says: the constant effort of practice (abhyasa) is the surest path.',
    'You offered the dawn its due before opening your phone. That is dharma in action.',
  ],
  aarti_done: [
    '🪔 Aarti complete — the flame that rose carried your sankalpa to your ishtadevata. The worship is received.',
    'Puja done. You met the divine with flowers, water, and fire. No offering is ever too small.',
    'The diya burns — and for a moment the boundary between worshipper and worshipped dissolved. That is the point.',
  ],
  japa_done: [
    '🪬 Japa done — 108 turns of the mala, 108 moments of pure attention. The mind is calmer than before.',
    'Each bead was a small victory over distraction. Your mantra has been heard.',
    'Japa complete. The tradition says: namam is the boat, and repetition is the oar. You have rowed well.',
  ],
  shloka_done: [
    '📖 Shloka received. The scripture enters the heart through the ear and through repetition — you fed both.',
    'Svadhyaya done. Reading the word of the rishis in the morning plants a seed that grows all day.',
    'Shloka complete. Carry a single line with you into the world — let it arise when you need it most.',
  ],
};

function getStepMessage(stepId: string): string {
  const msgs = STEP_MESSAGES[stepId];
  if (!msgs) return '✓ Step complete. Well done.';
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// ── Static fallback steps ─────────────────────────────────────────────────────
// Liturgical order per Dharmashastra / Gita Press Nitya Karma Puja Prakash:
//   1. Brahma Muhurta — rise in the auspicious pre-dawn hour
//   2. Snana          — sacred bath cleanses and prepares the body
//   3. Tilak          — apply sacred mark; sankalpa (resolve) is set AFTER bath, BEFORE worship
//   4. Vandana        — morning salutation: arghya to Surya, Gayatri, pranayama
//   5. Puja / Aarti   — deity worship; Aarti is the culminating flame offering
//   6. Japa           — mantra repetition with mala in a purified and worshipped space
//   7. Shloka Paath   — Svadhyaya (self-study) closes the Nitya cycle; scripture read last
const FALLBACK_STEPS: NityaSequenceStep[] = [
  { id: 'woke_brahma_muhurta', label: 'Brahma Muhurta', icon: '🌙', minutes: 0,  description: 'Wake in the pre-dawn hour — the veil between the human and the divine is thinnest here', completed: false },
  { id: 'snana_done',          label: 'Snana',          icon: '🌊', minutes: 10, description: 'Sacred bath — water purifies body, prana, and subtle body before you enter the worship space', completed: false },
  { id: 'tilak_done',          label: 'Tilak',          icon: '🔱', minutes: 2,  description: 'Apply the sacred mark and set your sankalpa — this is the threshold gesture that opens the day\'s worship', completed: false },
  { id: 'sandhya_done',        label: 'Vandana',        icon: '🙏', minutes: 15, description: 'Morning salutation — offer arghya to Surya, recite Gayatri, and greet the dawn with your tradition\'s prayers', completed: false },
  { id: 'aarti_done',          label: 'Puja / Aarti',   icon: '🪔', minutes: 20, description: 'Worship your ishtadevata with panchopachar or shodashopachara; conclude with Aarti — the lamp of devotion', completed: false },
  { id: 'japa_done',           label: 'Japa',           icon: '📿', minutes: 30, description: 'Mantra japa — one mala (108 repetitions) in the purified space, mind anchored by the naam', completed: false },
  { id: 'shloka_done',         label: 'Shloka Paath',   icon: '📖', minutes: 10, description: 'Svadhyaya — read or recite a passage from your tradition\'s scripture; let the word enter the day', completed: false },
];

// ── Tradition-aware step labels ────────────────────────────────────────────────
// Keys mirror FALLBACK_STEPS ids. Order in this map does not matter — it is
// applied as an overlay. Each tradition follows its own equivalent sequence logic.
const STEP_LABELS: Record<string, Record<string, { label: string; icon: string; description: string }>> = {
  sikh: {
    // Sikh Nitnem sequence: Amrit Vela → Ishnan → Naam Simran → Japji Sahib → Ardas → Jaap+Chaupai → Hukamnama
    woke_brahma_muhurta: { label: 'Amrit Vela',    icon: '🌙', description: 'Rise before dawn — the ambrosial hour for naam simran, before the mind is touched by the world' },
    snana_done:          { label: 'Ishnan',         icon: '🌊', description: 'Bathe and purify body and mind — Sikhi teaches that inner cleanliness begins with outer' },
    tilak_done:          { label: 'Naam Simran',    icon: '☬',  description: 'Begin Waheguru naam simran — the Gurmantar settles the mind before the banis begin' },
    sandhya_done:        { label: 'Japji Sahib',    icon: '📖', description: 'Recite Japji Sahib — the morning bani of Guru Nanak Dev Ji, foundation of all Nitnem' },
    aarti_done:          { label: 'Ardas',          icon: '🙏', description: 'Offer Ardas — the Sikh prayer of supplication for the sangat, the panth, and all of creation' },
    japa_done:           { label: 'Jaap + Chaupai', icon: '📿', description: 'Recite Jaap Sahib and Chaupai Sahib — the banis of power, protection, and divine praise' },
    shloka_done:         { label: 'Hukamnama',      icon: '📜', description: 'Receive today\'s Hukamnama — the divine order from Guru Granth Sahib Ji; this word is your guidance for the day' },
  },
  buddhist: {
    // Buddhist morning sequence: Early Rising → Purification → Precepts → Metta → Puja/Offerings → Sitting → Dhamma
    woke_brahma_muhurta: { label: 'Early Rising',       icon: '🌙', description: 'Rise before the world stirs — a fresh, uncontaminated mind is the best ground for meditation' },
    snana_done:          { label: 'Purification',       icon: '🌊', description: 'Wash body and rinse mouth — outer cleanliness reflects the inner intention of purity (sila)' },
    tilak_done:          { label: 'Precept Renewal',    icon: '☸️', description: 'Silently renew the Five Precepts — this is your threshold gesture before approaching the shrine' },
    sandhya_done:        { label: 'Metta Bhavana',      icon: '💛', description: 'Loving-kindness practice — radiate goodwill outward: self, loved ones, neutrals, difficult beings, all sentient life' },
    aarti_done:          { label: 'Puja / Offerings',   icon: '🪔', description: 'Offer flowers, incense, and light before the Buddha image — the three gems are honoured, merit is made' },
    japa_done:           { label: 'Sitting Practice',   icon: '🧘', description: 'Silent breath or mantra meditation — cultivate samatha and vipassana in a purified and worshipped space' },
    shloka_done:         { label: 'Dhamma Reading',     icon: '📖', description: 'Study a passage from the Dhammapada, Sutta Pitaka, or a teacher\'s commentary — let the teaching close the practice' },
  },
  jain: {
    // Jain morning sequence: Brahma Muhurta → Shaucha → Sthapana → Samayika → Puja → Navkar → Agam
    woke_brahma_muhurta: { label: 'Brahma Muhurta', icon: '🌙', description: 'Rise before dawn — the auspicious hour for pratikraman, reflection, and setting the mind in ahimsa' },
    snana_done:          { label: 'Shaucha',         icon: '🌊', description: 'Physical purification — cleanse body completely before entering the worship space' },
    tilak_done:          { label: 'Sthapana',        icon: '🤲', description: 'Set up the Jina image or symbol and offer flowers, rice, or saffron — the altar is opened for the day' },
    sandhya_done:        { label: 'Samayika',        icon: '🙏', description: '48-minute vow of equanimity — the supreme Jain sadhana; the mind is set to pratikraman mode' },
    aarti_done:          { label: 'Puja / Aarti',    icon: '🪔', description: 'Ashtaprakari Puja (eight offerings) before the Tirthankar; conclude with diya Aarti' },
    japa_done:           { label: 'Navkar Mantra',   icon: '📿', description: 'Recite Navkar Mantra 108 times — salutation to the five supreme beings who have conquered the self' },
    shloka_done:         { label: 'Agam Path',       icon: '📖', description: 'Study from the Agam — the canonical Jain texts; let scripture seal the morning and seed the intellect' },
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

// todayDateString is replaced by localSpiritualDate(timezone) — see Props.
// Kept as a UTC fallback for callers that don't have timezone yet.
function todayDateStringUtc(): string {
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

// buildDateRange is replaced by buildSpiritualDateRange(timezone, days) below.

// ── Nitya heatmap colour — based on raw step count (not ratio) ────────────────
// 0 steps → dark grey | 1 → dim saffron | 2 → medium saffron | 3+ → bright gold
function heatColour(count: number): string {
  if (count === 0) return 'rgba(255,255,255,0.06)';
  if (count === 1) return 'rgba(200,120,40,0.38)';
  if (count === 2) return 'rgba(210,140,40,0.68)';
  // 3+ steps → full gold gradient (return special sentinel; callers check for 'gold')
  return 'gold';
}
function heatStyle(count: number): React.CSSProperties {
  if (count === 0)  return { background: 'rgba(255,255,255,0.06)' };
  if (count === 1)  return { background: 'rgba(200,120,40,0.38)',  border: '1px solid rgba(200,120,40,0.25)' };
  if (count === 2)  return { background: 'rgba(210,140,40,0.70)',  border: '1px solid rgba(220,150,40,0.35)' };
  // 3+
  return {
    background: 'linear-gradient(135deg, #f0c060 0%, #C8924A 55%, #a06520 100%)',
    border:     '1px solid rgba(240,180,60,0.4)',
    boxShadow:  '0 0 6px rgba(200,146,74,0.3)',
  };
}

// (CircularProgress removed — use shared RadialRing from @/components/ui/RadialRing)

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
          background: 'var(--surface-raised)',
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
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 600, color: 'var(--brand-ink)', letterSpacing: '-0.01em' }}>Customise Your Nitya</h2>
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
                }}
              />
            </div>
            <p className="text-[10px] mt-1.5 px-1" style={{ color: 'var(--text-dim)' }}>
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
          Upgrade to Shoonaya Pro →
        </motion.button>
        <button onClick={onClose} className="w-full py-2 text-sm text-[color:var(--brand-muted)] text-center">
          Maybe later
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Ashrama Setup Prompt ──────────────────────────────────────────────────────
// Shown inline on Nitya Karma for existing users who completed onboarding
// before the life_stage step was added (life_stage = null in DB).
const ASHRAMA_STAGES: { key: string; icon: string; label: string; subtitle: string }[] = [
  { key: 'brahmacharya', icon: '🌱', label: 'Student / Youth',      subtitle: 'Learning, building, growing' },
  { key: 'grihastha',    icon: '🏡', label: 'Householder',           subtitle: 'Family, work, dharma' },
  { key: 'vanaprastha',  icon: '🍃', label: 'Forest Dweller',        subtitle: 'Transition, wisdom, letting go' },
  { key: 'sannyasa',     icon: '🌅', label: 'Renunciant',            subtitle: 'Surrender, liberation, moksha' },
];

function AshramaSetupPrompt({
  accent, tradition, saving, onSave,
}: {
  accent:     string;
  tradition:  string;
  saving:     boolean;
  onSave:     (stage: string, gc: string | null) => void;
}) {
  const [selected,  setSelected]  = useState<string | null>(null);
  const [gender,    setGender]    = useState<'male' | 'female' | null>(null);
  const [step,      setStep]      = useState<'stage' | 'gender'>('stage');

  function handleStageSelect(key: string) {
    setSelected(key);
    setStep('gender');
  }

  function handleGenderSelect(gc: 'male' | 'female' | null) {
    if (!selected) return;
    onSave(selected, gc);
  }

  return (
    <div
      className="rounded-[1.5rem] overflow-hidden border"
      style={{ borderColor: `${accent}30`, background: 'var(--surface-raised)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-[0.7rem] flex items-center justify-center text-lg shrink-0"
            style={{ background: `${accent}18` }}>
            🕉
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: `${accent}99` }}>
              Ashrama Dharma
            </p>
            <p className="text-[13px] font-semibold text-[color:var(--brand-ink)]">
              Unlock your life-stage duties
            </p>
          </div>
        </div>
        <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
          {step === 'stage'
            ? 'Which Ashrama best describes where you are in life? Your daily dharma duties will be personalised to your stage.'
            : 'One more — your duties will be tailored accordingly.'}
        </p>
      </div>

      <div className="mx-5 h-px mb-4" style={{ background: `${accent}14` }} />

      <AnimatePresence mode="wait">
        {step === 'stage' && (
          <motion.div
            key="stage"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="px-5 pb-5 space-y-2"
          >
            {ASHRAMA_STAGES.map(s => (
              <motion.button
                key={s.key}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStageSelect(s.key)}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all"
                style={{ background: `${accent}0e`, border: `1px solid ${accent}20` }}
              >
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-[color:var(--brand-ink)]">{s.label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--brand-muted)' }}>{s.subtitle}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {step === 'gender' && (
          <motion.div
            key="gender"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="px-5 pb-5 space-y-3"
          >
            <p className="text-[12px] font-semibold text-[color:var(--brand-ink)] mb-1">
              How would you like your dharma duties framed?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'male',   icon: '🔱', label: 'Traditional male duties' },
                { key: 'female', icon: '🌸', label: 'Traditional female duties' },
              ].map(g => (
                <motion.button
                  key={g.key}
                  whileTap={{ scale: 0.96 }}
                  disabled={saving}
                  onClick={() => handleGenderSelect(g.key as 'male' | 'female')}
                  className="flex flex-col items-center gap-2 rounded-2xl px-3 py-4 transition-all"
                  style={{ background: `${accent}0e`, border: `1px solid ${accent}20` }}
                >
                  <span className="text-3xl">{g.icon}</span>
                  <p className="text-[11px] text-center font-medium text-[color:var(--brand-ink)]">{g.label}</p>
                </motion.button>
              ))}
            </div>
            <button
              disabled={saving}
              onClick={() => handleGenderSelect(null)}
              className="w-full py-2.5 rounded-2xl text-[12px] text-center"
              style={{ color: 'var(--brand-muted)', background: `${accent}08`, border: `1px solid ${accent}14` }}
            >
              {saving ? 'Saving…' : 'Skip — show general duties'}
            </button>
            <button
              onClick={() => setStep('stage')}
              className="w-full text-[11px] text-center"
              style={{ color: 'var(--brand-muted)' }}
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props {
  userId:        string;
  userName:      string;
  tradition:     string;
  lifeStage:     string | null;
  genderContext: string | null;
  timezone:      string | null;
  isPro?:        boolean;
}

export default function NityaKarmaClient({ userId, userName, tradition, lifeStage, genderContext, timezone }: Omit<Props, 'isPro'>) {
  // Compute "today" as a spiritual date: before 4 AM local = still yesterday.
  // This is re-evaluated each render — if the app is left open across Brahma
  // Muhurta it will naturally shift to the new day on next interaction.
  const spiritualToday = localSpiritualDate(timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, 4);
  const router              = useRouter();
  const supabase            = useRef(createClient()).current;
  const { engine, isReady } = useEngine();
  const meta                = getTraditionMeta(tradition);
  const accent              = meta.accentColour;
  const isPro               = usePremium();
  const { term }            = useVocabulary(tradition);

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
  const [showConfetti,  setShowConfetti] = useState(false);
  const [ashramaOpen,       setAshramaOpen]      = useState(true);
  // ── Screen navigation (hub → sub-screen, like Japa multi-screen) ─────────
  type NityaScreen = 'hub' | 'dincharya' | 'ashrama' | 'journey';
  const [nityaScreen, setNityaScreen] = useState<NityaScreen>('hub');
  // ── Inline Ashrama setup (for users with null life_stage) ─────────────────
  const [localLifeStage,    setLocalLifeStage]   = useState<string | null>(lifeStage);
  const [localGenderCtx,    setLocalGenderCtx]   = useState<string | null>(genderContext);
  const [savingAshrama,     setSavingAshrama]     = useState(false);
  // Women's practice mode — traditional (classical stridharma) or modern (contemporary)
  const [womenMode,         setWomenMode]         = useState<'traditional' | 'modern'>(() => {
    if (typeof window === 'undefined') return 'traditional';
    return (localStorage.getItem('ashrama_women_mode') as 'traditional' | 'modern') ?? 'traditional';
  });
  const [dutyChecks,    setDutyChecks]   = useState<Set<string>>(() => {
    // Local daily check-ins — stored per spiritual day in sessionStorage
    if (typeof window === 'undefined') return new Set<string>();
    try {
      const today = localSpiritualDate(timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, 4);
      const raw   = sessionStorage.getItem(`ashrama_checks:${today}`);
      return raw ? new Set(JSON.parse(raw)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const confettiFired = useRef(false);
  const stepsRef      = useRef<NityaSequenceStep[]>([]);
  useEffect(() => { stepsRef.current = steps; }, [steps]);

  // ── Save inline Ashrama setup ──────────────────────────────────────────────
  async function saveAshramaSetup(stage: string, gc: string | null) {
    setSavingAshrama(true);
    try {
      // Must destructure { error } — Supabase does NOT throw on DB errors,
      // it returns them. Without this check, the toast fires and local state
      // updates even on a failed write, so the prompt reappears next login.
      const { error } = await supabase.from('profiles').update({
        life_stage:     stage,
        gender_context: gc ?? null,
      }).eq('id', userId);
      if (error) throw error;
      setLocalLifeStage(stage);
      setLocalGenderCtx(gc);
      toast.success('Ashrama Dharma unlocked 🙏');
    } catch (err: any) {
      console.error('[Ashrama save]', err);
      toast.error(err?.message ? `Could not save: ${err.message}` : 'Could not save — try again');
    } finally {
      setSavingAshrama(false);
    }
  }

  // ── Load customization from localStorage ──────────────────────────────────
  useEffect(() => {
    setCustom(getCustom(userId));
  }, [userId]);

  // ── Load 30-day history ───────────────────────────────────────────────────
  useEffect(() => {
    async function loadHistory() {
      const dates = buildSpiritualDateRange(
        timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        30,
        4
      );
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
  }, [userId, supabase, timezone]);

  // ── Load + merge engine steps with DB-persisted ticks ─────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadTodayLog(baseSteps: NityaSequenceStep[]): Promise<NityaSequenceStep[]> {
      const today = spiritualToday;

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
      if (!cancelled) { setSteps(merged); setGreeting(meta.morningGreeting); setLoading(false); }
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
          setGreeting(seq.greeting || meta.morningGreeting);
          setPanchang(seq.panchang_context);
          setStreak(str);
        }
      } catch {
        const base   = getDefaultSteps(tradition);
        const merged = await loadTodayLog(base);
        if (!cancelled) {
          setSteps(merged);
          setGreeting(meta.morningGreeting);
          try { const str = await engine!.nityaKarma.getStreak(userId); if (!cancelled) setStreak(str); } catch { /* silent */ }
        }
      } finally {
        clearTimeout(fallbackTimer);
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; clearTimeout(fallbackTimer); };
  }, [isReady, engine, userId, tradition, meta.morningGreeting, supabase, spiritualToday]);

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
      // Use the spiritual date — before 4 AM = still yesterday's practice day.
      const today = spiritualToday;

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

      // Engine sync — pass the spiritual date explicitly so the engine doesn't
      // fall back to UTC midnight
      if (engine) {
        try { await engine.nityaKarma.markStep(userId, stepId as any, true, today); } catch { /* silent */ }
      }

      // Check all done using ref (avoids stale closure)
      const currentSteps = stepsRef.current;
      const allNowDone   = currentSteps.every(s => s.id === stepId ? true : s.completed);

      if (allNowDone && !confettiFired.current) {
        confettiFired.current = true;
        await hapticSuccess();
        setShowConfetti(true);
        toast.success(meta.morningAllDoneMsg, { duration: 5000 });
        if (engine) {
          try { const str = await engine.nityaKarma.getStreak(userId); setStreak(str); } catch { /* silent */ }
        }
        // ── Bridge to Guided Plan: advance day_reached when all Nitya steps done ──
        // Finds the user's active guided plan and increments the current day,
        // so completing dincharya automatically progresses their sadhana path.
        try {
          const { data: planRow } = await supabase
            .from('guided_path_progress')
            .select('id, day_reached, path_id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (planRow) {
            const nextDay = (planRow.day_reached ?? 0) + 1;
            await supabase
              .from('guided_path_progress')
              .update({ day_reached: nextDay, updated_at: new Date().toISOString() })
              .eq('id', planRow.id);
            toast('Guided plan day advanced 📖', {
              icon: '🌿',
              duration: 2500,
              style: { background: '#1c1c1a', color: '#f0ede4', borderRadius: '14px', fontSize: '12px' },
            });
          }
        } catch { /* silent — guided plan bridge is best-effort */ }
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

  // ── Sacred Day Pulse (tradition-aware, computed from live astronomy) ────────
  // Calculate once from the astronomy engine — tithiIndex drives all traditions.
  const sacredPulse = (() => {
    try {
      const p = calculatePanchang(new Date());
      return getTodaySpiritualPulse(p.tithiIndex, tradition, new Date());
    } catch { return null; }
  })();

  // ── Hoisted Ashrama derived values (used by tab badge + tab 2 content) ────
  const _gc        = (localGenderCtx as GenderContext | null);
  const _stageMeta = localLifeStage
    ? getAshramaMeta(tradition, localLifeStage as LifeStage, _gc)
    : null;
  const _duties    = localLifeStage
    ? getAshramaDuties(tradition, localLifeStage as LifeStage, _gc, _gc === 'female' ? womenMode : undefined)
    : [];
  const ashramaDoneCount = _duties.filter(d => dutyChecks.has(d.id)).length;

  function toggleDuty(id: string) {
    setDutyChecks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try {
        sessionStorage.setItem(`ashrama_checks:${spiritualToday}`, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  // ── Shared header used by all sub-screens ─────────────────────────────────
  function SubHeader({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
    return (
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full glass-panel border border-white/10 flex items-center justify-center"
        >
          <ChevronLeft size={20} style={{ color: accent }} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg text-[color:var(--brand-ink)]">{title}</h1>
          <p className="text-xs text-[color:var(--brand-muted)]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {streak && streak.current_streak > 0 && isPro && (
            <div className="flex items-center gap-1 rounded-xl px-3 py-1.5 border border-white/10"
              style={{ background: `${accent}14` }}>
              <Flame size={14} style={{ color: accent }} />
              <span className="text-xs font-semibold" style={{ color: accent }}>{streak.current_streak}d</span>
            </div>
          )}
          {isPro ? (
            <>
              <Link href="/nitya-karma/insights"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10"
                style={{ background: `${accent}14` }}
                title="Sadhana Insights"
              >
                <BarChart2 size={16} style={{ color: accent }} />
              </Link>
              {nityaScreen === 'dincharya' && (
                <button onClick={() => setShowCustom(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10"
                  style={{ background: `${accent}14` }}>
                  <Settings2 size={15} style={{ color: accent }} />
                </button>
              )}
              <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border border-amber-400/30 bg-amber-400/10">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">PRO</span>
              </div>
            </>
          ) : (
            <button onClick={() => setShowProSheet(true)}
              className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border border-amber-400/20 bg-amber-400/8">
              <Star size={11} className="text-amber-400/70" />
              <span className="text-[10px] font-semibold text-amber-400/70">Pro</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="divine-home-shell min-h-screen pb-28 bg-[var(--divine-bg)] -mx-3 sm:-mx-4 relative selection:bg-[#C5A059]/30">

      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════════════════════════════
            HUB — the main menu screen, picks a practice mode
        ════════════════════════════════════════════════════════════════════ */}
        {nityaScreen === 'hub' && (
          <motion.div
            key="hub"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 pt-4 pb-3 pointer-events-none">
              <button onClick={() => router.back()}
                className="w-9 h-9 rounded-full glass-panel border flex items-center justify-center pointer-events-auto"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--brand-ink)' }}>
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--brand-muted)]">
                  {meta.symbol} {meta.nityaKarmaTitle}
                </p>
              </div>
              <div className="pointer-events-auto">
                {isPro ? (
                  <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border glass-panel backdrop-blur-md"
                    style={{ borderColor: 'var(--border-subtle)' }}>
                    <Star size={12} style={{ color: accent, fill: accent }} />
                    <span className="text-[10px] font-bold" style={{ color: accent }}>PRO</span>
                  </div>
                ) : (
                  <button onClick={() => setShowProSheet(true)}
                    className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border glass-panel backdrop-blur-md"
                    style={{ borderColor: 'var(--border-subtle)' }}>
                    <Star size={11} className="text-[color:var(--brand-muted)]" />
                    <span className="text-[10px] font-semibold text-[color:var(--brand-muted)]">Pro</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hero banner */}
            <NityaHeroBanner
              greeting={greeting || meta.morningGreeting}
              userName={userName}
              completedCount={completedCount}
              totalSteps={totalSteps}
              progressPct={progressPct}
              streak={streak}
              isPro={isPro}
              panchang={panchang}
              vataDays={vataDays}
            />

            <div
              className="relative z-20 -mt-16 px-4 pt-10 space-y-3"
              style={{ background: 'linear-gradient(180deg, transparent 0%, var(--divine-bg) 64px)' }}
            >
              {/* Vrat alert */}
              {vataDays && (
                <Link href={`/vrat/${encodeURIComponent(vataDays)}`} className="rounded-2xl border px-4 py-3 flex items-center gap-3 relative overflow-hidden block group"
                  style={{ background: `${accent}10`, borderColor: `${accent}30` }}>
                  <span className="text-xl shrink-0">🌟</span>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-sm font-semibold text-[color:var(--brand-ink)]">Today is {vataDays}</p>
                    <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-relaxed">
                      A vrat day adds extra spiritual merit. Observe nirjala or phalahar and add extended japa. Tap to view significance.
                    </p>
                  </div>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: accent, transform: 'rotate(-90deg)', flexShrink: 0 }} />
                </Link>
              )}

              {/* Sacred Day Pulse — tradition-aware nudge above practice cards */}
              {sacredPulse && !vataDays && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border px-4 py-3 flex items-start gap-3"
                  style={{ background: `${accent}0D`, borderColor: `${accent}28` }}
                >
                  <span className="text-2xl shrink-0">{sacredPulse.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: accent }}>
                      {sacredPulse.label} Today
                    </p>
                    <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-relaxed">
                      {sacredPulse.description}
                    </p>
                  </div>
                  <span
                    className="w-2 h-2 rounded-full mt-1 shrink-0"
                    style={{
                      background: sacredPulse.intensity === 'high'
                        ? accent
                        : sacredPulse.intensity === 'medium'
                          ? `${accent}99`
                          : `${accent}55`,
                      boxShadow: sacredPulse.intensity === 'high' ? `0 0 6px ${accent}80` : 'none',
                    }}
                  />
                </motion.div>
              )}

              {/* 3 practice mode cards */}
              <div className="space-y-3">

              {/* ① Dincharya — FREE */}
              <motion.button
                onClick={() => setNityaScreen('dincharya')}
                whileTap={{ scale: 0.975 }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                className="w-full text-left rounded-[1.4rem] border p-5 flex items-center gap-4 glass-panel"
                style={{ borderColor: `${accent}28` }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: `${accent}18` }}>
                  🌅
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-[15px] text-[color:var(--brand-ink)]">Dincharya</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(34,197,94,0.15)', color: 'rgb(34,197,94)' }}>FREE</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                    Your daily morning sequence · 7 sacred steps
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${accent}18` }}>
                      <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: accent }} />
                    </div>
                    <span className="text-[9px] font-semibold shrink-0" style={{ color: accent }}>
                      {loading ? '…' : `${completedCount}/${totalSteps}`}
                    </span>
                  </div>
                </div>
                <ChevronDown size={16} style={{ color: accent, transform: 'rotate(-90deg)', flexShrink: 0 }} />
              </motion.button>

              {/* ② Sadhana Patha — Guided Plans — PRO (direct nav to /nitya-karma/plans) */}
              <motion.button
                onClick={() => isPro ? router.push('/nitya-karma/plans') : setShowProSheet(true)}
                whileTap={{ scale: 0.975 }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.10, duration: 0.35 }}
                className="w-full text-left rounded-[1.4rem] border p-5 flex items-center gap-4 glass-panel"
                style={{ borderColor: isPro ? `${accent}28` : 'rgba(251,191,36,0.18)' }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: isPro ? `${accent}18` : 'rgba(251,191,36,0.10)' }}>
                  📿
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-[15px] text-[color:var(--brand-ink)]">Sadhana Patha</p>
                    {!isPro && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-400 flex items-center gap-0.5">
                        <Lock size={8} /> Pro
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                    7 & 21-day guided plans · structured daily practices
                  </p>
                </div>
                {isPro
                  ? <ChevronDown size={16} style={{ color: accent, transform: 'rotate(-90deg)', flexShrink: 0 }} />
                  : <Lock size={16} className="text-amber-400/60 shrink-0" />
                }
              </motion.button>

              {/* ③ Ashrama Dharma — PRO */}
              <motion.button
                onClick={() => isPro ? setNityaScreen('ashrama') : setShowProSheet(true)}
                whileTap={{ scale: 0.975 }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.35 }}
                className="w-full text-left rounded-[1.4rem] border p-5 flex items-center gap-4 glass-panel"
                style={{ borderColor: isPro ? (localLifeStage ? `${(_stageMeta?.accent ?? accent)}28` : `${accent}28`) : 'rgba(251,191,36,0.18)' }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: isPro ? `${(_stageMeta?.accent ?? accent)}18` : 'rgba(251,191,36,0.10)' }}>
                  {isPro && _stageMeta ? _stageMeta.icon : '🏡'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-[15px] text-[color:var(--brand-ink)]">Ashrama Dharma</p>
                    {isPro
                      ? (!localLifeStage
                        ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400">Set up</span>
                        : null)
                      : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-400 flex items-center gap-0.5">
                          <Lock size={8} /> Pro
                        </span>
                    }
                  </div>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                    {isPro && _stageMeta
                      ? `${_stageMeta.label} duties · ${ashramaDoneCount}/${_duties.length} reflected today`
                      : 'Life-stage duties personalised to your Ashrama'}
                  </p>
                </div>
                {isPro
                  ? <ChevronDown size={16} style={{ color: accent, transform: 'rotate(-90deg)', flexShrink: 0 }} />
                  : <Lock size={16} className="text-amber-400/60 shrink-0" />
                }
              </motion.button>

              {/* Engine info */}
              <div className="glass-panel rounded-2xl border border-white/6 px-4 py-3 flex items-start gap-2.5">
                <Info size={14} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
                <p className="text-xs text-[color:var(--brand-muted)] leading-relaxed">
                  Your sequence adapts to today&apos;s tithi, nakshatra, and vrat.{' '}
                  <button onClick={() => setShowProSheet(true)}
                    className="font-semibold text-[color:var(--brand-ink)] underline underline-offset-2">
                    Shoonaya Pro
                  </button>
                  {' '}unlocks AI-personalised sequences, Ashrama Dharma, and Guided Plans.
                </p>
              </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 1 — Dincharya (7-step morning routine, FREE)
        ════════════════════════════════════════════════════════════════════ */}
        {nityaScreen === 'dincharya' && (
          <motion.div
            key="dincharya"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <SubHeader
              title={meta.nityaKarmaTitle}
              subtitle={`${meta.symbol} Your 7-step morning sequence`}
              onBack={() => setNityaScreen('hub')}
            />

            {/* Steps */}
            {loading ? (
              <div className="flex items-center justify-center gap-3 pt-20">
                <Loader2 size={22} className="animate-spin" style={{ color: accent }} />
                <span className="text-sm text-[color:var(--brand-muted)]">Getting your morning sequence…</span>
              </div>
            ) : (
              <div className="px-4 space-y-3">

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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${step.completed ? 'text-[color:var(--brand-muted)] line-through' : 'text-[color:var(--brand-ink)]'}`}>
                      {step.label}
                    </p>
                    {step.minutes > 0 && (
                      <span className="text-[10px] font-medium rounded-full px-2 py-0.5"
                        style={{ background: `${accent}14`, color: accent }}>{step.minutes}m</span>
                    )}
                    {step.completed && <span className="text-[10px] text-green-400 font-medium">Done ✓</span>}
                  </div>
                  {!step.completed && (
                    <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-relaxed">{step.description}</p>
                  )}
                  {step.id === 'japa_done' && !step.completed && (
                    <Link href="/bhakti/mala" onClick={e => e.stopPropagation()}
                      className="mt-1.5 inline-flex text-xs font-semibold underline underline-offset-2"
                      style={{ color: accent }}>Open Japa Counter →</Link>
                  )}
                  {step.id === 'shloka_done' && !step.completed && (
                    <Link href="/pathshala" onClick={e => e.stopPropagation()}
                      className="mt-1.5 inline-flex text-xs font-semibold underline underline-offset-2"
                      style={{ color: accent }}>Open Pathshala →</Link>
                  )}
                </div>
                {step.completed
                  ? <Lock size={16} className="text-white/20 shrink-0" />
                  : !isBusy ? <Circle size={20} className="text-white/20 shrink-0" /> : null}
              </motion.button>
            );
          })}

          {/* All done */}
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
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
              <div className="mt-2 mx-auto max-w-xs rounded-2xl px-4 py-3 flex items-start gap-2.5"
                style={{ background: `${accent}14`, border: `1px solid ${accent}30` }}>
                <Sunrise size={16} style={{ color: accent }} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-left" style={{ color: accent }}>
                  Locked for today. Come back tomorrow — Brahma Muhurta opens{' '}
                  <span className="font-semibold">{nextBrahmaMuhurtaText()}</span>.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-1 flex-wrap">
                <Link href="/bhakti/mala" className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: `${accent}18`, color: accent }}>Japa Counter</Link>
                <Link href="/pathshala" className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: `${accent}18`, color: accent }}>Pathshala</Link>
                <button onClick={() => isPro ? setNityaScreen('journey') : setShowProSheet(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: `${accent}18`, color: accent }}>✦ Guided Plans</button>
              </div>
            </motion.div>
          )}

          {/* Streak card */}
          {!allDone && streak && streak.current_streak > 0 && (
            <StreakCard streak={streak} accent={accent} />
          )}
        </div>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 2 — Ashrama Dharma (life-stage duties, PRO)
        ════════════════════════════════════════════════════════════════════ */}
        {nityaScreen === 'ashrama' && (
          <motion.div
            key="ashrama"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <SubHeader
              title="Ashrama Dharma"
              subtitle={_stageMeta ? `${_stageMeta.label} · life-stage duties` : 'Life-stage practice path'}
              onBack={() => setNityaScreen('hub')}
            />
            <div className="px-4 space-y-3 pt-1">
              <p className="text-[11.5px] leading-relaxed px-1" style={{ color: 'var(--brand-muted)' }}>
                Duties and reflections aligned to your current Ashrama. Tap to mark each one as reflected on.
              </p>

              {!localLifeStage ? (
                <AshramaSetupPrompt
                  accent={accent}
                  tradition={tradition}
                  saving={savingAshrama}
                  onSave={saveAshramaSetup}
                />
              ) : _stageMeta && (
                <div className="rounded-[1.5rem] overflow-hidden border"
                  style={{ borderColor: `${_stageMeta.accent}22`, background: 'var(--surface-raised)' }}>
                  {/* Section header */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[0.7rem] flex items-center justify-center text-xl shrink-0"
                        style={{ background: `${_stageMeta.accent}18` }}>
                        {_stageMeta.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em]"
                          style={{ color: `${_stageMeta.accent}99` }}>{_stageMeta.label} Dharma</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                          {ashramaDoneCount}/{_duties.length} reflected on today
                        </p>
                      </div>
                    </div>
                    {/* Women's practice mode toggle — only shown for female gender context */}
                    {localGenderCtx === 'female' && (
                      <div className="flex items-center rounded-full overflow-hidden border shrink-0"
                        style={{ borderColor: `${_stageMeta.accent}28`, background: `${_stageMeta.accent}08` }}>
                        {(['traditional', 'modern'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => {
                              setWomenMode(mode);
                              try { localStorage.setItem('ashrama_women_mode', mode); } catch {}
                            }}
                            className="px-2.5 py-1 text-[10px] font-semibold transition-all"
                            style={{
                              background: womenMode === mode ? `${_stageMeta.accent}22` : 'transparent',
                              color: womenMode === mode ? _stageMeta.accent : 'var(--text-dim)',
                            }}>
                            {mode === 'traditional' ? '🏛️' : '✨'} {mode === 'traditional' ? 'Classical' : 'Modern'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                {/* Subtitle */}
                <p className="px-5 pb-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                  {_stageMeta.subtitle} — reflect on each as you move through the day.
                </p>
                <div className="mx-5 h-px mb-3" style={{ background: `${_stageMeta.accent}14` }} />

                {/* Duty list */}
                <div className="px-4 pb-4 space-y-2">
                  {_duties.map((duty, idx) => {
                    const done = dutyChecks.has(duty.id);
                    return (
                      <motion.button
                        key={duty.id}
                        onClick={() => toggleDuty(duty.id)}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.28 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center gap-3.5 rounded-[1rem] px-3.5 py-3 text-left"
                        style={{
                          background: done ? `${_stageMeta.accent}10` : 'rgba(255,255,255,0.025)',
                          border: `1px solid ${done ? `${_stageMeta.accent}30` : 'rgba(255,255,255,0.05)'}`,
                          transition: 'all 200ms ease',
                        }}
                      >
                        <div className="w-9 h-9 rounded-[0.65rem] flex items-center justify-center text-lg shrink-0"
                          style={{ background: done ? `${_stageMeta.accent}18` : 'var(--card-bg)' }}>
                          {done
                            ? <CheckCircle2 size={18} style={{ color: _stageMeta.accent }} />
                            : <span>{duty.icon}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[12.5px] font-semibold leading-tight ${done ? 'line-through' : ''}`}
                            style={{ color: done ? 'var(--brand-muted)' : 'var(--brand-ink)' }}>
                            {duty.label}
                          </p>
                          {!done && (
                            <p className="text-[10.5px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                              {duty.description}
                            </p>
                          )}
                        </div>
                        {!done && (
                          <span className="text-[9px] font-semibold rounded-full px-1.5 py-0.5 shrink-0"
                            style={{ background: `${_stageMeta.accent}14`, color: _stageMeta.accent }}>
                            {duty.minutes && duty.minutes > 0 ? `${duty.minutes}m` : 'All day'}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="px-5 pb-4">
                  <p className="text-[10px] text-center" style={{ color: 'var(--text-dim)' }}>
                    These are reflections, not obligations — check when done, uncheck to revisit
                  </p>
                </div>
              </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 3 — Journey (Guided Plans + 30-day calendar, PRO)
        ════════════════════════════════════════════════════════════════════ */}
        {nityaScreen === 'journey' && (
          <motion.div
            key="journey"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <SubHeader
              title="Journey"
              subtitle="Guided plans · practice history"
              onBack={() => setNityaScreen('hub')}
            />
            <div className="px-4 space-y-3 pt-1">

              {/* Guided Plans card */}
              <Link href="/nitya-karma/plans"
                className="block rounded-[1.4rem] border px-5 py-4 flex items-center gap-4 glass-panel active:scale-[0.98] transition-transform"
                style={{ borderColor: `${accent}28` }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: `${accent}18` }}>🗺️</div>
                <div className="flex-1">
                  <p className="font-bold text-[15px] text-[color:var(--brand-ink)]">Guided Sadhana Plans</p>
                  <p className="text-[11.5px] mt-0.5 leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                    Structured 21-day paths — Navratri, Ekadashi, Sattvic Fast & more
                  </p>
                </div>
                <ChevronDown size={16} style={{ color: accent, transform: 'rotate(-90deg)', flexShrink: 0 }} />
              </Link>

              {/* 30-day calendar */}
              <div className="glass-panel rounded-2xl border border-white/8 overflow-hidden">
                <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--brand-ink)]">30-Day Sadhana</p>
                    <p className="text-xs text-[color:var(--brand-muted)] mt-0.5">Step intensity · last 30 days</p>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <div className="grid gap-[4px] mb-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <div key={i} className="text-center text-[9px] font-semibold"
                        style={{ color: 'rgba(255,255,255,0.25)' }}>{d}</div>
                    ))}
                  </div>
                  {(() => {
                    // Use the spiritual date range that was used to build dayRecords
                    const startDate = new Date(`${dayRecords[0]?.date ?? spiritualToday}T12:00:00Z`);
                    const dayOfWeek = startDate.getUTCDay();
                    const slots: (DayRecord | null)[] = Array(dayOfWeek).fill(null);
                    for (const rec of dayRecords) slots.push(rec);
                    while (slots.length % 7 !== 0) slots.push(null);
                    return (
                      <div className="grid gap-[4px]" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {slots.map((slot, idx) => {
                          if (!slot) return <div key={idx} className="aspect-square" />;
                          const isToday = slot.date === spiritualToday;
                          return (
                            <div key={slot.date}
                              title={`${slot.date}: ${slot.count} steps`}
                              className="aspect-square rounded-md transition-all"
                              style={{
                                ...heatStyle(slot.count),
                                outline: isToday ? `2px solid rgba(200,146,74,0.55)` : undefined,
                                outlineOffset: '1px',
                              }}
                            />
                          );
                        })}
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {[{ style: heatStyle(0), label: '0' }, { style: heatStyle(1), label: '1' },
                      { style: heatStyle(2), label: '2' }, { style: heatStyle(3), label: '3+' }].map(({ style, label }) => (
                      <div key={label} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm" style={style} />
                        <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{label} step{label === '1' ? '' : 's'}</span>
                      </div>
                    ))}
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
              </div>

              {/* Engine note */}
              <div className="glass-panel rounded-2xl border border-white/6 px-4 py-3 flex items-start gap-2.5">
                <Info size={14} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
                <p className="text-xs text-[color:var(--brand-muted)] leading-relaxed">
                  Your sequence adapts to today&apos;s tithi, nakshatra, and vrat.{' '}
                  <button onClick={() => setShowProSheet(true)}
                    className="font-semibold text-[color:var(--brand-ink)] underline underline-offset-2">
                    Shoonaya Pro
                  </button>
                  {' '}unlocks AI-personalised sequences, full analytics, and all Guided Plans.
                </p>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Modals */}
      <PremiumActivateModal open={showProSheet} onClose={() => setShowProSheet(false)} />
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
