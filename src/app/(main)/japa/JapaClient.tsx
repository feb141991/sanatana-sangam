'use client';

// ─── Japa Counter — Still Water ───────────────────────────────────────────────
//
// "Still Water" concept: the bead is a lake surface. Each mantra repetition
// sends a ripple outward. Minimal, dark, deeply meditative.
//
//   • Single large bead (no SVG ring) — water ripple on every tap
//   • Tradition-aware accent colour from bead type
//   • Tap mantra text → full-screen frosted overlay with complete Sanskrit +
//     ambience switcher (Silence / Rain / River / Temple Bells)
//   • WeeklyCoins: 7-day Apple Journal style coin strip (free tier)
//   • 30-day binary heatmap: gold = any japa that day, dark grey = none (Pro)
//   • Tap a past day → detail bottom sheet
//   • Focus Mode (full-screen) retained for deep sessions
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, RotateCcw, ChevronDown, Flame, Maximize2, Lock } from 'lucide-react';
import { useEngine } from '@/contexts/EngineContext';
import { hapticLight, hapticSuccess } from '@/lib/platform';
import { createClient } from '@/lib/supabase';
import { usePremium } from '@/hooks/usePremium';
import PremiumGate from '@/components/premium/PremiumGate';
import ChantAudioPlayer from '@/components/bhakti/ChantAudioPlayer';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';
import type { Mantra } from '@sangam/sadhana-engine';

// ── Constants ──────────────────────────────────────────────────────────────────
const BEADS_PER_MALA = 108;

// ── Tradition-aware mantra defaults ───────────────────────────────────────────
const DEFAULT_MANTRA_BY_TRADITION: Record<string, { id: string; name: string; short: string; full: string; source?: string }> = {
  hindu:    {
    id:     'gayatri',
    name:   'Gayatri Mantra',
    short:  'ॐ भूर्भुवः स्वः...',
    full:   'ॐ भूर्भुवः स्वः\nतत्सवितुर्वरेण्यं\nभर्गो देवस्य धीमहि\nधियो यो नः प्रचोदयात् ।।',
    source: 'Rigveda 3.62.10',
  },
  sikh:     {
    id:     'waheguru',
    name:   'Waheguru Naam Simran',
    short:  'ਵਾਹਿਗੁਰੂ',
    full:   'ਵਾਹਿਗੁਰੂ\nਵਾਹਿਗੁਰੂ\nਵਾਹਿਗੁਰੂ\nਵਾਹਿਗੁਰੂ',
    source: 'Sri Guru Granth Sahib',
  },
  buddhist: {
    id:     'om_mani',
    name:   'Om Mani Padme Hum',
    short:  'ओम् मणि पद्मे हूम्',
    full:   'ओम् मणि पद्मे हूम्',
    source: 'Karaṇḍavyūha Sūtra',
  },
  jain:     {
    id:     'namokar',
    name:   'Namokar Mantra',
    short:  'णमो अरिहंताणं',
    full:   'णमो अरिहंताणं\nणमो सिद्धाणं\nणमो आयरियाणं\nणमो उवज्झायाणं\nणमो लोए सव्व साहूणं',
    source: 'Jain Āgamas',
  },
};

// ── Audio track map ────────────────────────────────────────────────────────────
const MANTRA_AUDIO_TRACKS: Record<string, string[]> = {
  gayatri:  ['gayatri-mantra-as-it-is'],
  waheguru: ['guru-stotram', 'gayatri-mantra-as-it-is'],
  om_mani:  ['gayatri-mantra-as-it-is'],
  namokar:  ['gayatri-mantra-as-it-is'],
};
const DEFAULT_AUDIO_TRACKS = ['gayatri-mantra-as-it-is', 'guru-stotram'];

// ── Bead types ─────────────────────────────────────────────────────────────────
const BEAD_TYPES = [
  {
    id:        'rudraksha',
    label:     'Rudraksha',
    emoji:     '🟤',
    bg:        'radial-gradient(circle at 33% 28%, #a07858 0%, #6B3F1C 48%, #3d1e0a 100%)',
    tapBg:     'radial-gradient(circle at 33% 28%, #c09878 0%, #8B5A28 48%, #5a2e10 100%)',
    shadow:    'rgba(100,55,18,0.65)',
    tapShadow: 'rgba(180,90,30,0.9)',
    border:    'rgba(180,120,55,0.6)',
    glow:      'rgba(140,80,30,',
    ripple:    'rgba(160,100,45,',
    textColor: '#fde8c8',
    accent:    '#C8924A',
  },
  {
    id:        'tulsi',
    label:     'Tulsi',
    emoji:     '🌿',
    bg:        'radial-gradient(circle at 33% 28%, #7fba60 0%, #3d7a28 48%, #1e4010 100%)',
    tapBg:     'radial-gradient(circle at 33% 28%, #9fd080 0%, #5a9840 48%, #2e5a18 100%)',
    shadow:    'rgba(40,90,20,0.65)',
    tapShadow: 'rgba(60,150,30,0.8)',
    border:    'rgba(80,160,50,0.5)',
    glow:      'rgba(60,120,30,',
    ripple:    'rgba(80,160,50,',
    textColor: '#f0fce8',
    accent:    '#6abf6a',
  },
  {
    id:        'crystal',
    label:     'Crystal',
    emoji:     '💎',
    bg:        'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95) 0%, rgba(160,200,255,0.88) 38%, rgba(80,130,220,0.85) 72%, rgba(40,80,180,0.9) 100%)',
    tapBg:     'radial-gradient(circle at 30% 25%, rgba(255,255,255,1) 0%, rgba(190,230,255,0.95) 38%, rgba(110,165,240,0.9) 72%, rgba(60,110,210,0.95) 100%)',
    shadow:    'rgba(80,120,220,0.55)',
    tapShadow: 'rgba(130,180,255,0.85)',
    border:    'rgba(180,210,255,0.75)',
    glow:      'rgba(100,150,240,',
    ripple:    'rgba(120,170,255,',
    textColor: '#1a2850',
    accent:    '#7aabf5',
  },
  {
    id:        'sandal',
    label:     'Sandalwood',
    emoji:     '🪵',
    bg:        'radial-gradient(circle at 33% 28%, #e8c87a 0%, #b07820 48%, #6a4408 100%)',
    tapBg:     'radial-gradient(circle at 33% 28%, #f8e09a 0%, #d09830 48%, #8a5818 100%)',
    shadow:    'rgba(140,90,15,0.65)',
    tapShadow: 'rgba(200,140,20,0.85)',
    border:    'rgba(220,170,50,0.65)',
    glow:      'rgba(180,130,30,',
    ripple:    'rgba(210,160,40,',
    textColor: '#2a1a00',
    accent:    '#d4a83c',
  },
] as const;
type BeadTypeId = typeof BEAD_TYPES[number]['id'];

// ── Ambience ───────────────────────────────────────────────────────────────────
type AmbienceId = 'silence' | 'rain' | 'river' | 'bells';
const AMBIENCE_OPTIONS: { id: AmbienceId; label: string; emoji: string }[] = [
  { id: 'silence', label: 'Silence',  emoji: '🔕' },
  { id: 'rain',    label: 'Rain',     emoji: '🌧️' },
  { id: 'river',   label: 'River',    emoji: '🌊' },
  { id: 'bells',   label: 'Bells',    emoji: '🔔' },
];
// Royalty-free ambient sounds — replace with self-hosted assets before production
const AMBIENCE_URLS: Partial<Record<AmbienceId, string>> = {
  rain:  'https://cdn.freesound.org/previews/346/346170_5121236-lq.mp3',
  river: 'https://cdn.freesound.org/previews/531/531947_11861866-lq.mp3',
  bells: 'https://cdn.freesound.org/previews/411/411090_5121236-lq.mp3',
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface DayRecord { date: string; done: boolean; }
interface Ripple    { id: number; }
interface Props {
  userId:               string;
  userName:             string;
  tradition:            string;
  currentStreak:        number;
  japaAlreadyDoneToday: boolean;
  history?:             DayRecord[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// ── MantraFullScreen ──────────────────────────────────────────────────────────
// Frosted glass full-screen overlay: complete Sanskrit text + ambience switcher
function MantraFullScreen({
  mantra, defaultMantra, ambience, onAmbienceChange, onClose,
}: {
  mantra:            Mantra | null;
  defaultMantra:     typeof DEFAULT_MANTRA_BY_TRADITION[string];
  ambience:          AmbienceId;
  onAmbienceChange:  (id: AmbienceId) => void;
  onClose:           () => void;
}) {
  const fullText = mantra?.sanskrit ?? defaultMantra.full;
  const title    = mantra?.name    ?? defaultMantra.name;
  const source   = defaultMantra.source;

  return (
    <motion.div
      className="fixed inset-0 z-[95] flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onClose}
      style={{
        background: 'rgba(4,6,10,0.88)',
        backdropFilter: 'blur(32px) saturate(140%)',
        WebkitBackdropFilter: 'blur(32px) saturate(140%)',
      }}
    >
      {/* Close pill */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 px-4 py-2 rounded-full text-xs font-semibold"
        style={{
          background: 'rgba(200,146,74,0.12)',
          border: '1px solid rgba(200,146,74,0.25)',
          color: 'rgba(200,146,74,0.8)',
        }}
      >
        ✕ Close
      </button>

      {/* Main content */}
      <motion.div
        className="flex flex-col items-center gap-8 max-w-sm w-full"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
      >
        {/* Full mantra text */}
        <motion.p
          className="text-center font-[family:var(--font-deva)] leading-loose whitespace-pre-line"
          style={{
            fontSize: 'clamp(1.25rem, 5vw, 1.8rem)',
            color: 'var(--text-cream)',
            textShadow: '0 0 40px rgba(200,146,74,0.22)',
            letterSpacing: '0.02em',
          }}
          animate={{ opacity: [0.80, 1, 0.80] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {fullText}
        </motion.p>

        {/* Title + source */}
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold tracking-wide" style={{ color: 'rgba(200,146,74,0.75)' }}>
            {title}
          </p>
          {source && (
            <p className="text-[11px]" style={{ color: 'rgba(200,146,74,0.38)' }}>{source}</p>
          )}
        </div>

        {/* Ambience switcher */}
        <div className="flex flex-col items-center gap-3 w-full">
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(200,146,74,0.4)' }}>
            Ambience
          </p>
          <div className="flex gap-2 justify-center">
            {AMBIENCE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => onAmbienceChange(opt.id)}
                className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl transition-all"
                style={ambience === opt.id
                  ? {
                      background: 'rgba(200,146,74,0.18)',
                      border: '1px solid rgba(200,146,74,0.45)',
                      boxShadow: '0 0 12px rgba(200,146,74,0.18)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
              >
                <span className="text-xl leading-none">{opt.emoji}</span>
                <span className="text-[10px] font-medium"
                  style={{ color: ambience === opt.id ? 'rgba(200,146,74,0.9)' : 'rgba(255,255,255,0.35)' }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── WeeklyCoins ──────────────────────────────────────────────────────────────
// 7-day Apple Journal-style coin strip — free tier
function WeeklyCoins({ history }: { history: DayRecord[] }) {
  const today   = new Date();
  const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const coins: { label: string; dateStr: string; done: boolean; isToday: boolean }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const done    = history.some(h => h.date === dateStr && h.done);
    coins.push({ label: DAY_ABBR[d.getDay()], dateStr, done, isToday: i === 0 });
  }

  return (
    <div className="mx-4 rounded-2xl border px-4 py-3.5"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(200,146,74,0.12)' }}>
      <p className="text-[11px] uppercase tracking-widest mb-3"
        style={{ color: 'rgba(200,146,74,0.45)' }}>
        This Week
      </p>
      <div className="flex justify-between items-end">
        {coins.map(c => (
          <div key={c.dateStr} className="flex flex-col items-center gap-1.5">
            {/* Coin */}
            <motion.div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 36, height: 36,
                background: c.done
                  ? 'linear-gradient(135deg, #f0c060 0%, #C8924A 55%, #a06520 100%)'
                  : 'rgba(255,255,255,0.07)',
                border: c.isToday
                  ? '2px solid rgba(200,146,74,0.55)'
                  : c.done
                    ? '2px solid rgba(240,190,80,0.4)'
                    : '2px solid rgba(255,255,255,0.08)',
                boxShadow: c.done
                  ? '0 0 10px rgba(200,146,74,0.35), inset 0 1px 0 rgba(255,240,160,0.3)'
                  : 'none',
              }}
              animate={c.done && !c.isToday ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 1.5 }}
            >
              {c.done && (
                <Check size={14} strokeWidth={2.5}
                  style={{ color: '#2a1a00' }} />
              )}
            </motion.div>
            {/* Day label */}
            <span className="text-[10px] font-medium"
              style={{ color: c.isToday ? 'rgba(200,146,74,0.8)' : 'rgba(255,255,255,0.28)' }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DayDetailSheet ─────────────────────────────────────────────────────────────
function DayDetailSheet({
  date, done, onClose,
}: {
  date: string; done: boolean; onClose: () => void;
}) {
  const d = new Date(date);
  const displayDate = d.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.62)' }}>
      <motion.div
        className="w-full max-w-2xl mx-auto rounded-t-3xl px-6 py-6 space-y-4"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        style={{
          background: 'rgba(12,14,20,0.97)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(200,146,74,0.15)',
          borderBottom: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'rgba(200,146,74,0.25)' }} />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ background: done ? 'rgba(200,146,74,0.15)' : 'rgba(255,255,255,0.05)' }}>
            {done ? '📿' : '○'}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-cream)' }}>{displayDate}</p>
            <p className="text-xs mt-0.5" style={{ color: done ? '#C8924A' : 'rgba(255,255,255,0.3)' }}>
              {done ? 'Japa completed ✓' : 'No japa recorded'}
            </p>
          </div>
        </div>

        {done && (
          <div className="rounded-2xl px-4 py-3 text-sm"
            style={{ background: 'rgba(200,146,74,0.07)', border: '1px solid rgba(200,146,74,0.14)', color: 'rgba(200,146,74,0.75)' }}>
            Mala session logged for this day. Full session details available in a future update.
          </div>
        )}

        <button onClick={onClose}
          className="w-full py-3.5 rounded-2xl font-semibold text-sm"
          style={{ background: 'rgba(200,146,74,0.1)', border: '1px solid rgba(200,146,74,0.2)', color: 'rgba(200,146,74,0.8)' }}>
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── JapaHistoryChart ─────────────────────────────────────────────────────────
// 30-day binary heatmap — gold pill = did japa, dark grey = none. Pro-gated.
function JapaHistoryChart({
  history = [], streak, isPro = false,
}: {
  history: DayRecord[]; streak: number; isPro?: boolean;
}) {
  const [selectedDay, setSelectedDay] = useState<{ date: string; done: boolean } | null>(null);
  const today = new Date();

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const done    = history.some(h => h.date === dateStr && h.done);
    return { date: dateStr, done, isToday: i === 29 };
  });

  const doneDays = days.filter(d => d.done).length;

  return (
    <>
      <div className="mx-4 mb-2 rounded-2xl border overflow-hidden"
        style={{ borderColor: 'rgba(200,146,74,0.12)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold" style={{ color: 'rgba(200,146,74,0.8)' }}>
              30-Day Journey
            </p>
            {!isPro && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(200,146,74,0.1)', border: '1px solid rgba(200,146,74,0.2)', color: 'rgba(200,146,74,0.7)' }}>
                <Lock size={9} /> Pro
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            {streak > 0 && isPro && (
              <span className="flex items-center gap-1" style={{ color: '#C8924A' }}>
                <Flame size={12} /> {streak}d
              </span>
            )}
            {isPro && (
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>{doneDays}/30</span>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className={`relative px-4 pb-4 ${!isPro ? 'select-none' : ''}`}>
          <div className="grid gap-[5px]" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
            {days.map(day => (
              <motion.button
                key={day.date}
                disabled={!isPro}
                onClick={() => isPro && setSelectedDay(day)}
                className="aspect-square rounded-lg transition-all"
                whileTap={isPro ? { scale: 0.88 } : {}}
                style={{
                  background: day.done
                    ? 'linear-gradient(135deg, #f0c060 0%, #C8924A 55%, #a06520 100%)'
                    : day.isToday
                      ? 'rgba(200,146,74,0.14)'
                      : 'rgba(255,255,255,0.06)',
                  border: day.isToday
                    ? '1.5px solid rgba(200,146,74,0.4)'
                    : day.done
                      ? '1px solid rgba(240,180,60,0.3)'
                      : '1px solid transparent',
                  boxShadow: day.done ? '0 0 6px rgba(200,146,74,0.25)' : 'none',
                  cursor: isPro ? 'pointer' : 'default',
                }}
                title={isPro ? day.date : undefined}
              />
            ))}
          </div>

          {/* Pro lock overlay */}
          {!isPro && (
            <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-2"
              style={{
                background: 'rgba(6,8,14,0.82)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}>
              <Lock size={20} style={{ color: 'rgba(200,146,74,0.6)' }} />
              <p className="text-xs font-semibold" style={{ color: 'rgba(200,146,74,0.75)' }}>
                30-day history is Pro
              </p>
              <PremiumGate compact>{null}</PremiumGate>
            </div>
          )}
        </div>
      </div>

      {/* Day detail sheet */}
      <AnimatePresence>
        {selectedDay && (
          <DayDetailSheet
            date={selectedDay.date}
            done={selectedDay.done}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── MantraPickerSheet ────────────────────────────────────────────────────────
function MantraPickerSheet({
  mantras, selected, onSelect, onClose,
}: {
  mantras: Mantra[]; selected: Mantra | null;
  onSelect: (m: Mantra) => void; onClose: () => void;
}) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.65)' }}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        className="w-full max-w-2xl mx-auto rounded-t-3xl px-5 pt-4 pb-8 space-y-3 max-h-[75vh] overflow-y-auto"
        style={{
          background: 'rgba(10,12,18,0.98)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(200,146,74,0.15)',
          borderBottom: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-2" style={{ background: 'rgba(200,146,74,0.25)' }} />
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-cream)' }}>Choose Mantra</h3>
        {mantras.map(m => (
          <button key={m.id} onClick={() => { onSelect(m); onClose(); }}
            className="w-full text-left rounded-2xl p-4 border transition-all"
            style={selected?.id === m.id
              ? { borderColor: 'rgba(200,146,74,0.55)', background: 'rgba(200,146,74,0.10)' }
              : { borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-cream)' }}>{m.name}</p>
                <p className="text-xs mt-0.5 font-[family:var(--font-deva)]"
                  style={{ color: 'rgba(200,146,74,0.5)' }}>
                  {m.sanskrit?.split('\n')[0]?.slice(0, 50)}…
                </p>
              </div>
              {selected?.id === m.id && <Check size={18} style={{ color: '#C8924A' }} />}
            </div>
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ── CompletionSheet ──────────────────────────────────────────────────────────
function CompletionSheet({
  rounds, durationSecs, mantraName, streak, isPro, onClose,
}: {
  rounds: number; durationSecs: number; mantraName: string;
  streak: number; isPro: boolean; onClose: () => void;
}) {
  const mins = Math.floor(durationSecs / 60);
  const secs = durationSecs % 60;
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ background: 'rgba(0,0,0,0.72)' }}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="w-full max-w-2xl mx-auto rounded-t-3xl px-8 pt-6 pb-10 space-y-6"
        style={{
          background: 'rgba(10,12,18,0.98)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(200,146,74,0.15)',
          borderBottom: 'none',
        }}>
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'rgba(200,146,74,0.25)' }} />
        <div className="text-center space-y-3">
          <motion.div className="text-5xl" animate={{ scale: [0.7, 1.15, 1] }} transition={{ duration: 0.65 }}>🙏</motion.div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-cream)', letterSpacing: '-0.01em' }}>
            Japa Complete
          </h2>
          <p style={{ color: 'rgba(200,146,74,0.5)' }}>
            {rounds} mala{rounds > 1 ? 's' : ''} of {mantraName}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Rounds', value: `${rounds}` },
            { label: 'Beads',  value: `${rounds * BEADS_PER_MALA}` },
            { label: 'Time',   value: `${mins}m ${secs}s` },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center border"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(200,146,74,0.14)' }}>
              <p className="font-bold text-xl" style={{ color: '#C8924A' }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
            </div>
          ))}
        </div>
        {streak > 0 && isPro && (
          <div className="flex items-center justify-center gap-2 rounded-2xl p-3 border"
            style={{ background: 'rgba(200,146,74,0.07)', borderColor: 'rgba(200,146,74,0.18)' }}>
            <Flame size={20} style={{ color: '#C8924A' }} />
            <span className="font-semibold" style={{ color: '#C8924A' }}>{streak} day streak!</span>
          </div>
        )}
        <button onClick={onClose}
          className="w-full py-4 rounded-2xl font-bold text-base"
          style={{ background: 'linear-gradient(135deg, #C8924A, #8a5818)', color: '#fde8c8', boxShadow: '0 4px 24px rgba(200,146,74,0.25)' }}>
          🕉️ Hari Om
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── JapaFocusOverlay ──────────────────────────────────────────────────────────
// Full-screen focus mode — updated to Still Water palette
function JapaFocusOverlay({
  activeBead, beadCount, roundsDone, duration, targetRounds,
  selectedMantra, defaultMantra, audioTrackIds, streak, tapFlash, ripples,
  onBead, onComplete, onReset, onClose,
}: {
  activeBead:       typeof BEAD_TYPES[number];
  beadCount:        number;
  roundsDone:       number;
  duration:         number;
  targetRounds:     number;
  selectedMantra:   Mantra | null;
  defaultMantra:    typeof DEFAULT_MANTRA_BY_TRADITION[string];
  audioTrackIds:    string[];
  streak:           number;
  tapFlash:         boolean;
  ripples:          Ripple[];
  onBead:           () => void;
  onComplete:       () => void;
  onReset:          () => void;
  onClose:          () => void;
}) {
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      style={{ background: 'linear-gradient(180deg, #050810 0%, #080c14 50%, #050810 100%)' }}
    >
      {/* Top bar */}
      <div className="relative flex items-center gap-3 px-4"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 18px)', paddingBottom: 12 }}>
        <button onClick={onClose}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium"
          style={{ background: 'rgba(200,146,74,0.08)', border: '1px solid rgba(200,146,74,0.2)', color: 'rgba(200,146,74,0.7)' }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Japa Focus</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5"
            style={{ background: 'rgba(200,146,74,0.08)', border: '1px solid rgba(200,146,74,0.18)' }}>
            <Flame size={12} style={{ color: '#C8924A' }} />
            <span className="text-[10px] font-semibold" style={{ color: '#C8924A' }}>{streak}d</span>
          </div>
        )}
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        {/* Stats */}
        <div className="flex items-center gap-8">
          {[
            { val: String(roundsDone), lbl: 'Rounds' },
            { val: fmt(duration),      lbl: 'Time',   mono: true },
            { val: String(targetRounds), lbl: 'Target' },
          ].map(({ val, lbl, mono }) => (
            <div key={lbl} className="text-center">
              <p className={`text-3xl font-bold ${mono ? 'font-mono' : ''}`}
                style={{ color: 'var(--text-cream)' }}>{val}</p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{lbl}</p>
            </div>
          ))}
        </div>

        {/* Bead + ripples */}
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
          {/* Ripple rings */}
          {ripples.map(r => (
            <motion.div key={r.id}
              className="absolute rounded-full pointer-events-none"
              style={{ border: `1.5px solid ${activeBead.ripple}0.6)` }}
              initial={{ width: 160, height: 160, opacity: 0.8 }}
              animate={{ width: 280, height: 280, opacity: 0 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
            />
          ))}

          <button onPointerDown={onBead}
            className="relative rounded-full select-none focus:outline-none"
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}>
            <motion.div
              animate={{ scale: tapFlash ? 0.84 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
              <div style={{
                width: 160, height: 160, borderRadius: '50%',
                background: tapFlash ? activeBead.tapBg : activeBead.bg,
                boxShadow: tapFlash
                  ? `0 0 60px ${activeBead.tapShadow}, 0 0 100px ${activeBead.shadow}`
                  : `0 0 36px ${activeBead.shadow}, 0 0 70px rgba(0,0,0,0.5)`,
                border: `2px solid ${activeBead.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="text-4xl font-bold" style={{ color: activeBead.textColor }}>
                  {beadCount}
                </span>
              </div>
            </motion.div>
          </button>
        </div>

        {/* Mantra */}
        <motion.p
          className="text-center font-[family:var(--font-deva)] text-base px-4 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.65)', textShadow: `0 0 20px ${activeBead.glow}0.3)` }}
          animate={{ opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 5.5, repeat: Infinity }}>
          {selectedMantra?.sanskrit?.split('\n')[0] ?? defaultMantra.short}
        </motion.p>

        {/* Audio */}
        <div className="w-full max-w-xs rounded-2xl overflow-hidden border"
          style={{ borderColor: 'rgba(200,146,74,0.14)', background: 'rgba(255,255,255,0.03)' }}>
          <ChantAudioPlayer title="Japa focus" trackIds={audioTrackIds} compact />
        </div>
      </div>

      {/* Bottom */}
      <div className="px-4 space-y-2.5"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}>
        <button onClick={onComplete}
          className="w-full py-4 rounded-2xl font-bold text-base"
          style={{ background: 'linear-gradient(135deg, #C8924A, #8a5818)', color: '#fde8c8', boxShadow: '0 4px 24px rgba(200,146,74,0.22)' }}>
          Complete Session ✓
        </button>
        <button onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-medium"
          style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function JapaClient({
  userId, userName, tradition, currentStreak, japaAlreadyDoneToday, history = [],
}: Props) {
  const router = useRouter();
  const { engine, isReady } = useEngine();

  const [mantras,         setMantras]         = useState<Mantra[]>([]);
  const [selectedMantra,  setMantra]          = useState<Mantra | null>(null);
  const [showPicker,      setShowPicker]      = useState(false);
  const [showMantraFull,  setMantraFull]      = useState(false);
  const [beadCount,       setBeadCount]       = useState(0);
  const [roundsDone,      setRounds]          = useState(0);
  const [targetRounds,    setTarget]          = useState(1);
  const [isActive,        setIsActive]        = useState(false);
  const [showComplete,    setComplete]        = useState(false);
  const [duration,        setDuration]        = useState(0);
  const [streak,          setStreak]          = useState(currentStreak);
  const [tapFlash,        setTapFlash]        = useState(false);
  const [ripples,         setRipples]         = useState<Ripple[]>([]);
  const [beadTypeId,      setBeadTypeId]      = useState<BeadTypeId>('rudraksha');
  const [isFocusMode,     setFocusMode]       = useState(false);
  const [showConfetti,    setShowConfetti]    = useState(false);
  const [ambience,        setAmbience]        = useState<AmbienceId>('silence');

  const isPro      = usePremium();
  const startedAt  = useRef<string>('');
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef   = useRef<HTMLAudioElement | null>(null);

  const defaultMantra = DEFAULT_MANTRA_BY_TRADITION[tradition] ?? DEFAULT_MANTRA_BY_TRADITION.hindu;
  const audioTrackIds = MANTRA_AUDIO_TRACKS[selectedMantra?.id ?? defaultMantra.id] ?? DEFAULT_AUDIO_TRACKS;
  const activeBead    = BEAD_TYPES.find(t => t.id === beadTypeId) ?? BEAD_TYPES[0];

  // ── Load mantras ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !engine) return;
    engine.mantras.getByTradition(tradition as any).then(list => {
      setMantras(list);
      if (list.length > 0) setMantra(list[0]);
    }).catch(() => {
      const fallback: Mantra = {
        id: defaultMantra.id, name: defaultMantra.name,
        sanskrit: defaultMantra.full, transliteration: '', deity: '',
        tradition: tradition as any, beads_per_round: 108,
      };
      setMantras([fallback]);
      setMantra(fallback);
    });
  }, [isReady, engine, tradition]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  // ── Ambience audio ───────────────────────────────────────────────────────────
  useEffect(() => {
    const url = AMBIENCE_URLS[ambience];
    if (!url) {
      audioRef.current?.pause();
      return;
    }
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.loop = true;
      } else if (audioRef.current.src !== url) {
        audioRef.current.pause();
        audioRef.current = new Audio(url);
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => {});
    } catch { /* Audio not available */ }
    return () => { audioRef.current?.pause(); };
  }, [ambience]);

  // Stop ambience when overlay closes
  useEffect(() => {
    if (!showMantraFull) audioRef.current?.pause();
  }, [showMantraFull]);

  const startSession = useCallback(() => {
    setIsActive(true);
    setBeadCount(0);
    setRounds(0);
    setDuration(0);
    startedAt.current = new Date().toISOString();
  }, []);

  const addRipple = useCallback(() => {
    const id = Date.now() + Math.random();
    setRipples(r => [...r.slice(-4), { id }]); // keep max 5
    setTimeout(() => setRipples(r => r.filter(x => x.id !== id)), 900);
  }, []);

  const countBead = useCallback(async () => {
    setTapFlash(true);
    addRipple();
    setTimeout(() => setTapFlash(false), 130);
    await hapticLight();
    setBeadCount(prev => {
      const next = prev + 1;
      if (next >= BEADS_PER_MALA) {
        setRounds(r => {
          const newRounds = r + 1;
          if (newRounds >= targetRounds) {
            setIsActive(false);
            finishSession(newRounds);
          }
          return newRounds;
        });
        return 0;
      }
      return next;
    });
  }, [targetRounds, addRipple]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishSession = useCallback(async (rounds: number) => {
    await hapticSuccess();
    if (!selectedMantra) return;
    const completedAt = new Date().toISOString();
    try {
      const supabase = createClient();
      await supabase.from('mala_sessions').insert({
        user_id:          userId,
        mantra:           selectedMantra.name,
        chant_source:     selectedMantra.id,
        count:            rounds * BEADS_PER_MALA,
        target_count:     targetRounds * BEADS_PER_MALA,
        duration_seconds: duration,
        share_scope:      'private' as const,
        completed_at:     completedAt,
      });
    } catch (err) { console.error('[Japa] mala_sessions insert failed:', err); }

    if (engine) {
      try {
        await engine.tracker.trackJapaSession({
          mantra_id: selectedMantra.id, mantra_name: selectedMantra.name,
          rounds_completed: rounds, beads_count: rounds * BEADS_PER_MALA,
          duration_seconds: duration, completed: true,
          started_at: startedAt.current, completed_at: completedAt,
        });
        const streakRecord = await engine.streaks.getTodayRecord(userId);
        setStreak(streakRecord.streak_count);
      } catch (err) { console.error('[Japa] engine tracking failed:', err); }
    }

    setFocusMode(false);
    setComplete(true);
    setShowConfetti(true);
  }, [engine, selectedMantra, userId, duration, targetRounds]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    finishSession(roundsDone + (beadCount > 0 ? 1 : 0));
  }, [roundsDone, beadCount, finishSession]);

  const handleReset = useCallback(() => {
    setIsActive(false);
    setBeadCount(0);
    setRounds(0);
    setDuration(0);
    setRipples([]);
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Progress fraction 0–1 for the bead (shown as text inside)
  const progress = beadCount / BEADS_PER_MALA;

  return (
    <div className="relative min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #060910 0%, #080c16 50%, #060910 100%)' }}>

      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div className="relative flex items-center gap-3 px-4 pt-5 pb-3"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(200,146,74,0.08)', border: '1px solid rgba(200,146,74,0.18)' }}>
          <ChevronLeft size={20} style={{ color: 'rgba(200,146,74,0.7)' }} />
        </button>
        <div className="flex-1">
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600,
            color: 'var(--text-cream)', letterSpacing: '-0.01em',
          }}>Japa</h1>
          <p className="text-[11px] font-[family:var(--font-deva)]"
            style={{ color: 'rgba(200,146,74,0.35)' }}>मन · वाक् · कर्म</p>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && isPro && (
            <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5"
              style={{ background: 'rgba(200,146,74,0.08)', border: '1px solid rgba(200,146,74,0.18)' }}>
              <Flame size={13} style={{ color: '#C8924A' }} />
              <span className="text-xs font-semibold" style={{ color: '#C8924A' }}>{streak}d</span>
            </div>
          )}
          {!isPro && <PremiumGate compact>{null}</PremiumGate>}
        </div>
      </motion.div>

      {/* ── Already done banner ──────────────────────────────────────────────── */}
      {japaAlreadyDoneToday && (
        <div className="mx-4 mb-2 rounded-xl px-4 py-2 flex items-center gap-2"
          style={{ background: 'rgba(40,80,50,0.2)', border: '1px solid rgba(80,150,80,0.18)' }}>
          <Check size={15} style={{ color: '#6abf6a' }} />
          <span className="text-sm font-medium" style={{ color: '#8ed48e' }}>Japa complete for today 🙏</span>
        </div>
      )}

      {/* ── Setup panel (visible before session starts) ──────────────────────── */}
      <AnimatePresence>
        {!isActive && !showComplete && (
          <motion.div className="px-4 mb-2 space-y-2.5"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.32 }}>

            {/* Mantra picker */}
            <button onClick={() => setShowPicker(true)}
              className="w-full flex items-center justify-between rounded-2xl border px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(200,146,74,0.14)' }}>
              <div className="text-left">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
                  style={{ color: 'rgba(200,146,74,0.4)' }}>Mantra</p>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-cream)' }}>
                  {selectedMantra?.name ?? defaultMantra.name}
                </p>
              </div>
              <ChevronDown size={17} style={{ color: 'rgba(200,146,74,0.4)' }} />
            </button>

            {/* Rounds */}
            <div className="flex items-center justify-between rounded-2xl border px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(200,146,74,0.10)' }}>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Rounds</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 5, 11].map(n => (
                  <button key={n} onClick={() => setTarget(n)}
                    className="w-8 h-8 rounded-xl text-sm font-bold transition-all"
                    style={targetRounds === n
                      ? { background: 'linear-gradient(135deg, #C8924A, #8a5818)', color: '#fde8c8' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Bead type */}
            <div className="rounded-2xl border px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(200,146,74,0.10)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
                style={{ color: 'rgba(200,146,74,0.4)' }}>Bead</p>
              <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                {BEAD_TYPES.map(b => (
                  <motion.button key={b.id} onClick={() => setBeadTypeId(b.id)} whileTap={{ scale: 0.94 }}
                    className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs whitespace-nowrap flex-shrink-0 font-medium transition-all"
                    style={beadTypeId === b.id
                      ? { background: b.bg, color: b.textColor, border: `1.5px solid ${b.border}`, boxShadow: `0 0 10px ${b.shadow}` }
                      : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {b.emoji} {b.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main counter area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5 py-4">

        {/* Mantra text — tappable to open full-screen view */}
        <motion.button
          onClick={() => setMantraFull(true)}
          className="text-center px-6 py-2 rounded-2xl max-w-xs"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(200,146,74,0.08)', cursor: 'pointer' }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.p
            className="font-[family:var(--font-deva)] text-base leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.75)', textShadow: `0 0 24px ${activeBead.glow}0.25)` }}
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
            {selectedMantra?.sanskrit?.split('\n')[0] ?? defaultMantra.short}
          </motion.p>
          {selectedMantra?.transliteration && (
            <p className="text-[11px] italic mt-0.5" style={{ color: 'rgba(200,146,74,0.35)' }}>
              {selectedMantra.transliteration.split('\n')[0]}
            </p>
          )}
          <p className="text-[10px] mt-1.5 uppercase tracking-widest" style={{ color: 'rgba(200,146,74,0.3)' }}>
            tap to expand
          </p>
        </motion.button>

        {/* Bead + water ripples — the centrepiece */}
        <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>

          {/* Ambient glow behind bead */}
          <motion.div className="absolute rounded-full pointer-events-none"
            style={{
              width: 220, height: 220,
              background: `radial-gradient(circle, ${activeBead.glow}0.08) 0%, transparent 70%)`,
            }}
            animate={{ scale: isActive ? [1, 1.1, 1] : 1, opacity: isActive ? [0.5, 0.9, 0.5] : 0.4 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Water ripples (expand outward on each tap) */}
          <AnimatePresence>
            {ripples.map(r => (
              <motion.div key={r.id}
                className="absolute rounded-full pointer-events-none"
                style={{ border: `1.5px solid ${activeBead.ripple}0.55)` }}
                initial={{ width: 160, height: 160, opacity: 0.75, x: '-50%', y: '-50%', left: '50%', top: '50%' }}
                animate={{ width: 320, height: 320, opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.9, ease: [0.2, 0.8, 0.4, 1] }}
              />
            ))}
          </AnimatePresence>

          {/* The bead itself */}
          <button
            onPointerDown={isActive ? countBead : undefined}
            onClick={!isActive ? startSession : undefined}
            className="absolute rounded-full select-none focus:outline-none"
            style={{
              width: 160, height: 160,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            <motion.div
              animate={{ scale: tapFlash ? 0.87 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 16 }}
              style={{ width: '100%', height: '100%' }}
            >
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: tapFlash ? activeBead.tapBg : activeBead.bg,
                boxShadow: tapFlash
                  ? `0 0 60px ${activeBead.tapShadow}, 0 0 100px ${activeBead.shadow}, inset 0 3px 12px rgba(255,220,160,0.3)`
                  : `0 0 32px ${activeBead.shadow}, 0 0 60px rgba(0,0,0,0.6), inset 0 2px 8px rgba(255,200,120,0.14)`,
                border: `2px solid ${activeBead.border}`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4,
                transition: 'box-shadow 0.1s ease',
              }}>
                {isActive ? (
                  <>
                    <span className="text-4xl font-bold leading-none"
                      style={{ color: activeBead.textColor, textShadow: '0 0 16px rgba(255,210,130,0.5)' }}>
                      {beadCount}
                    </span>
                    <span className="text-[10px]"
                      style={{ color: `${activeBead.textColor}80` }}>
                      / {BEADS_PER_MALA}
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 32, lineHeight: 1, color: activeBead.textColor, opacity: 0.8 }}>▶</span>
                    <motion.span className="text-[10px] font-semibold"
                      style={{ color: `${activeBead.textColor}80` }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2.2, repeat: Infinity }}>
                      Begin
                    </motion.span>
                  </>
                )}
              </div>
            </motion.div>
          </button>
        </div>

        {/* Active session stats */}
        <AnimatePresence>
          {isActive && (
            <motion.div className="flex items-center gap-8"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: activeBead.accent }}>{roundsDone}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Rounds</p>
              </div>
              <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="text-center">
                <p className="text-3xl font-bold font-mono" style={{ color: 'var(--text-cream)' }}>{fmt(duration)}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Time</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio — during active session */}
        <AnimatePresence>
          {isActive && (
            <motion.div className="w-full max-w-xs"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}>
              <div className="rounded-2xl overflow-hidden border"
                style={{ borderColor: 'rgba(200,146,74,0.12)', background: 'rgba(255,255,255,0.03)' }}>
                <ChantAudioPlayer title="Japa companion" trackIds={audioTrackIds} compact />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Action buttons ───────────────────────────────────────────────────── */}
      <div className="px-4 pb-4 space-y-2.5">
        {isActive && (
          <>
            <div className="flex gap-2">
              <button onClick={handleComplete}
                className="flex-1 py-4 rounded-2xl font-bold text-base"
                style={{ background: 'linear-gradient(135deg, #C8924A, #8a5818)', color: '#fde8c8', boxShadow: '0 4px 24px rgba(200,146,74,0.22)' }}>
                Complete ✓
              </button>
              <button onClick={() => setFocusMode(true)}
                className="py-4 px-4 rounded-2xl flex items-center gap-1.5 text-sm font-medium"
                style={{ background: 'rgba(200,146,74,0.08)', border: '1px solid rgba(200,146,74,0.18)', color: 'rgba(200,146,74,0.75)' }}>
                <Maximize2 size={15} /> Focus
              </button>
            </div>
            <button onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-medium"
              style={{ borderColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.28)' }}>
              <RotateCcw size={14} /> Reset
            </button>
          </>
        )}
        {!isActive && !showComplete && (
          <p className="text-center text-[11px] pb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Tap ▶ to begin · tap the bead to count each repetition
          </p>
        )}
      </div>

      {/* ── History section ─────────────────────────────────────────────────── */}
      {!isActive && !showComplete && (
        <div className="space-y-3 pb-8">
          {/* Weekly coins — free */}
          <WeeklyCoins history={history} />

          {/* 30-day heatmap — Pro */}
          <JapaHistoryChart history={history} streak={streak} isPro={isPro} />
        </div>
      )}

      {/* ── Overlays / Sheets ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMantraFull && (
          <MantraFullScreen
            mantra={selectedMantra}
            defaultMantra={defaultMantra}
            ambience={ambience}
            onAmbienceChange={setAmbience}
            onClose={() => setMantraFull(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPicker && (
          <MantraPickerSheet
            mantras={mantras}
            selected={selectedMantra}
            onSelect={setMantra}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComplete && (
          <CompletionSheet
            rounds={roundsDone}
            durationSecs={duration}
            mantraName={selectedMantra?.name ?? defaultMantra.name}
            streak={streak}
            isPro={isPro}
            onClose={() => { setComplete(false); router.back(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFocusMode && isActive && (
          <JapaFocusOverlay
            activeBead={activeBead}
            beadCount={beadCount}
            roundsDone={roundsDone}
            duration={duration}
            targetRounds={targetRounds}
            selectedMantra={selectedMantra}
            defaultMantra={defaultMantra}
            audioTrackIds={audioTrackIds}
            streak={streak}
            tapFlash={tapFlash}
            ripples={ripples}
            onBead={countBead}
            onComplete={handleComplete}
            onReset={() => { handleReset(); setFocusMode(false); }}
            onClose={() => setFocusMode(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
