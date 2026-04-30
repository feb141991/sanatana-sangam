'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MapPin, ChevronDown, ChevronUp, Share2, CalendarDays, X, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format as fmtDate, isSameDay, isSameMonth,
  isToday as isDayToday, addMonths, subMonths,
} from 'date-fns';
import type { Shloka } from '@/lib/shlokas';
import type { Festival, FestivalCalendarMeta } from '@/lib/festivals';
import type { DailySacredText } from '@/lib/sacred-texts';
import { calculatePanchang, PANCHANG_TRUST_META } from '@/lib/panchang';
import { getGreeting, GREETING_POOLS } from '@/lib/traditions';
import type { GuidedPathProgressRow } from '@/lib/guided-paths';
import { useLocation } from '@/lib/LocationContext';
import { createClient } from '@/lib/supabase';
import { localSpiritualDate } from '@/lib/sacred-time';
import { APP } from '@/lib/config';
import { MotionItem, MotionStagger } from '@/components/motion/MotionPrimitives';
import MoodGlyph from '@/components/ui/MoodGlyph';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';

interface Panchang {
  tithi:     string;
  nakshatra: string;
  yoga:      string;
  sunrise:   string;
  sunset:    string;
  rahuKaal:  string;
}

interface SacredTextMeta {
  label:        string;   // "Aaj Ka Shloka" / "Aaj Ka Shabad" etc.
  icon:         string;   // 🕉️ / ☬ / ☸️ / 🤲
  shareLabel:   string;   // used in share sheet title
  accentColour: string;   // hex
  accentLight:  string;   // light tint hex
}

interface FeatureTheme {
  surface: string;
  border: string;
  iconWell: string;
  accent: string;
}

interface Props {
  userId:            string;
  userName:          string;
  city:              string;
  savedLat:          number | null;
  savedLon:          number | null;
  shloka:            Shloka;
  /** Non-null for Sikh / Buddhist / Jain traditions */
  sacredText:        DailySacredText | null;
  sacredTextMeta:    SacredTextMeta;
  festival:          Festival | null;
  festivalCalendar:  Festival[];
  festivalCalendarMeta: FestivalCalendarMeta;
  daysUntilFestival: number | null;
  initialPanchang:   Panchang;
  shlokaStreak:      number;
  lastShlokaDate:    string | null;
  tradition:         string | null;
  sampradaya:        string | null;
  spiritualLevel:    string | null;
  seeking:           string[];
  lifeStage:         string | null;
  customGreeting:    string | null;
  guidedPathProgress: GuidedPathProgressRow[];
  showFirstTimeGuidance: boolean;
  japaStreak?:          number;
  japaAlreadyDoneToday?: boolean;
  nityaDoneToday?:       boolean;
  practiceHistory?:      { date: string; japa: boolean; nitya: boolean }[];
}

const DEFAULT_QUICK_ACCESS = [
  { label: 'Tirtha',     icon: '🛕', href: '/tirtha-map',    desc: 'Find sacred places near you',   theme: 'tirtha'    },
  { label: 'Mandali',    icon: '🏡', href: '/mandali',        desc: 'Your local sangam',              theme: 'mandali'   },
  { label: 'Kul',        icon: '❤️', href: '/kul',            desc: 'Family sadhana together',        theme: 'kul'       },
  { label: 'Pathshala',  icon: '📖', href: '/library',        desc: 'Tradition-first study tracks',   theme: 'pathshala' },
  { label: 'Sanskar',    icon: '🪔', href: '/kul/sanskara',   desc: '16 sacred lifecycle rites',      theme: 'kul'       },
  { label: 'Discover',   icon: '🌿', href: '/discover',       desc: 'Scripture for your mood',        theme: 'bhakti'    },
  { label: 'Panchang',   icon: '📅', href: '/panchang',       desc: 'Today\'s tithi & muhurta',       theme: 'panchang'  },
];
// All possible hrefs in default order
const DEFAULT_CARD_ORDER = DEFAULT_QUICK_ACCESS.map(i => i.href);
const QUICK_ACCESS_MAP   = Object.fromEntries(DEFAULT_QUICK_ACCESS.map(i => [i.href, i]));

// Mood quick-lookup (mirrors DiscoverClient MOODS)
const MOOD_QUICK_MAP: Record<string, { key: string; label: string; colour: string }> = {
  anxious:     { key: 'anxious',     label: 'Anxious',     colour: '#7b6f9e' },
  grieving:    { key: 'grieving',    label: 'Grieving',    colour: '#6b8aad' },
  angry:       { key: 'angry',       label: 'Angry',       colour: '#c86a3a' },
  scattered:   { key: 'scattered',   label: 'Scattered',   colour: '#7aab94' },
  lost:        { key: 'lost',        label: 'Lost',        colour: '#8e8e7a' },
  joyful:      { key: 'joyful',      label: 'Joyful',      colour: '#c8923a' },
  seeking:     { key: 'seeking',     label: 'Seeking',     colour: '#c8925e' },
  lonely:      { key: 'lonely',      label: 'Lonely',      colour: '#8aadad' },
  overwhelmed: { key: 'overwhelmed', label: 'Overwhelmed', colour: '#6b8ab0' },
  grateful:    { key: 'grateful',    label: 'Grateful',    colour: '#b09a6a' },
};

const HOME_THEMES: Record<string, FeatureTheme> = {
  // Dawn amber — Panchang, daily ritual
  panchang: {
    surface: 'linear-gradient(150deg, rgba(52, 42, 28, 0.98) 0%, rgba(38, 32, 22, 0.96) 100%)',
    border: 'rgba(200, 146, 74, 0.22)',
    iconWell: 'rgba(200, 146, 74, 0.14)',
    accent: 'var(--brand-primary)',
  },
  // Deep ink — sacred text, pathshala
  pathshala: {
    surface: 'linear-gradient(150deg, rgba(30, 30, 28, 0.99) 0%, rgba(24, 24, 22, 0.97) 100%)',
    border: 'rgba(200, 146, 74, 0.18)',
    iconWell: 'rgba(200, 146, 74, 0.12)',
    accent: 'var(--brand-primary)',
  },
  // Soft terracotta — bhakti, shloka
  bhakti: {
    surface: 'linear-gradient(150deg, rgba(46, 34, 26, 0.98) 0%, rgba(36, 28, 22, 0.96) 100%)',
    border: 'rgba(212, 120, 74, 0.20)',
    iconWell: 'rgba(212, 120, 74, 0.13)',
    accent: 'var(--brand-primary-strong)',
  },
  // Warm earth — kul, family
  kul: {
    surface: 'linear-gradient(150deg, rgba(38, 32, 26, 0.98) 0%, rgba(30, 26, 20, 0.96) 100%)',
    border: 'rgba(157, 120, 74, 0.22)',
    iconWell: 'rgba(157, 120, 74, 0.14)',
    accent: 'var(--brand-earth)',
  },
  // Forest-warm — mandali, community
  mandali: {
    surface: 'linear-gradient(150deg, rgba(26, 34, 28, 0.98) 0%, rgba(22, 28, 24, 0.96) 100%)',
    border: 'rgba(100, 140, 100, 0.22)',
    iconWell: 'rgba(100, 140, 100, 0.14)',
    accent: '#7aab7a',
  },
  // Sacred indigo-amber — tirtha, pilgrimage
  tirtha: {
    surface: 'linear-gradient(150deg, rgba(28, 30, 44, 0.98) 0%, rgba(24, 26, 38, 0.96) 100%)',
    border: 'rgba(140, 140, 220, 0.22)',
    iconWell: 'rgba(140, 140, 220, 0.12)',
    accent: '#9898dd',
  },
};

// ── Invite code — deterministic from userId (no DB needed) ─────────────────
function generateInviteCode(userId: string): string {
  return userId.replace(/-/g, '').slice(-6).toUpperCase();
}

// ── Invite Modal ──────────────────────────────────────────────────────────────
function InviteModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const prefersReducedMotion = useReducedMotion();
  const code    = generateInviteCode(userId);
  // Use actual deployment domain at runtime so share links always point to the right URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : APP.BASE_URL;
  const link    = `${baseUrl}/join?ref=${code}`;

  async function share() {
    const shareText = `Join me on Sanatana Sangam — your home for dharma, Panchang, scriptures, and community.\n\nUse my invite: ${code}\n${link}`;
    // Try Web Share API first (mobile / some desktop browsers)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Join me on Sanatana Sangam 🙏', text: shareText, url: link });
        return;
      } catch { /* user cancelled — fall through to clipboard */ }
    }
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Invite link copied! 🙏');
    } catch {
      // Final fallback — prompt user to copy manually
      window.prompt('Copy your invite link:', link);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
    >
      <motion.div
        className="w-full rounded-t-[2rem] p-6 space-y-5"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, var(--surface-raised), var(--card-bg))',
          borderTop: '1px solid rgba(200, 146, 74, 0.20)',
          boxShadow: '0 -20px 48px rgba(0, 0, 0, 0.24)',
          backdropFilter: 'blur(22px) saturate(125%)',
          WebkitBackdropFilter: 'blur(22px) saturate(125%)',
        }}
        initial={prefersReducedMotion ? undefined : { y: 32, opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { y: 20, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.34, 1.26, 0.64, 1] }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: 'rgba(200, 146, 74, 0.28)' }} />

        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-cream)' }}>
            Invite Friends &amp; Family
          </h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center motion-press"
            style={{ background: 'rgba(200, 146, 74, 0.10)' }}>
            <X size={15} style={{ color: 'var(--text-muted-warm)' }} />
          </button>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted-warm)' }}>
          Share Sanatana Sangam with your family and friends. They can use your invite code while joining.
        </p>

        {/* Invite code display */}
        <div
          className="rounded-[1.4rem] p-5 text-center border"
          style={{
            background: 'linear-gradient(135deg, rgba(200, 146, 74, 0.12), var(--card-bg))',
            borderColor: 'rgba(200, 146, 74, 0.18)',
          }}
        >
          <p className="text-[10px] mb-2 font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-dim)' }}>Your Invite Code</p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--brand-primary)' }}>{code}</p>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-dim)' }}>{link}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={share}
            className="py-3 font-semibold rounded-2xl text-sm motion-lift"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: '#1a1610' }}>
            Share 🙏
          </button>
          <button onClick={async () => {
            await navigator.clipboard.writeText(code);
            toast.success('Code copied!');
          }}
            className="py-3 font-semibold rounded-2xl border text-sm motion-lift"
            style={{
              color: 'var(--brand-primary)',
              borderColor: 'rgba(200, 146, 74, 0.20)',
              background: 'rgba(44, 38, 28, 0.88)',
            }}>
            Copy Code
          </button>
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>
          🙏 Spread the light of dharma
        </p>
      </motion.div>
    </motion.div>
  );
}

// ── Share helper ──────────────────────────────────────────────────────────────
async function shareContent(title: string, text: string) {
  if (navigator.share) {
    try { await navigator.share({ title, text }); return; } catch { /* cancelled */ }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch {
    toast.error('Unable to share');
  }
}

// ── Format date for calendar ──────────────────────────────────────────────────
function formatFestDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
}
function daysFromNow(dateStr: string) {
  const fest  = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const d     = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((fest.getTime() - d.getTime()) / 86400000);
}

// ── Time-aware greeting helper ─────────────────────────────────────────────
function getTimeGreeting(hour: number): string | null {
  if (hour >= 5  && hour < 12) return 'Suprabhat';
  if (hour >= 17 && hour < 20) return 'Shubh Sandhya';
  if (hour >= 20 || hour < 5)  return 'Shubh Ratri';
  return null; // afternoon → use tradition greeting
}

function formatTraditionGreetingLabel(tradition: string | null, sampradaya: string | null) {
  const label = sampradaya && sampradaya !== 'other'
    ? sampradaya
    : tradition && tradition !== 'other'
      ? tradition
      : 'your path';

  return label
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

// ── Date Picker Modal ─────────────────────────────────────────────────────────
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function DatePickerModal({ selectedDate, onSelect, onClose }: {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [viewDate,      setViewDate]      = useState(new Date(selectedDate));
  const [showYearPicker, setShowYearPicker] = useState(false);

  const curYear = new Date().getFullYear();
  const years   = Array.from({ length: 12 }, (_, i) => curYear - 4 + i);

  const calDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 }),
    end:   endOfWeek(endOfMonth(viewDate),     { weekStartsOn: 0 }),
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      <motion.div
        className="relative w-80 rounded-[1.5rem] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, rgba(40, 36, 28, 0.99), rgba(30, 28, 22, 0.99))',
          border: '1px solid rgba(200, 146, 74, 0.18)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.44)',
        }}
        initial={prefersReducedMotion ? undefined : { y: 12, opacity: 0, scale: 0.97 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1, scale: 1 }}
        exit={prefersReducedMotion ? undefined : { y: 8, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.34, 1.26, 0.64, 1] }}
      >
        {/* Month nav row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(200, 146, 74, 0.14)' }}>
          <button onClick={() => setViewDate(v => subMonths(v, 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center motion-press"
            style={{ background: 'rgba(200, 146, 74, 0.12)' }}>
            <ChevronLeft size={15} style={{ color: 'var(--text-cream)' }} />
          </button>
          <button onClick={() => setShowYearPicker(v => !v)}
            className="flex items-center gap-1 font-semibold text-sm motion-press"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-cream)', fontSize: '1rem' }}>
            {fmtDate(viewDate, 'MMMM yyyy')}
            <ChevronDown size={13} style={{ color: 'var(--text-dim)' }} />
          </button>
          <button onClick={() => setViewDate(v => addMonths(v, 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center motion-press"
            style={{ background: 'rgba(200, 146, 74, 0.12)' }}>
            <ChevronRight size={15} style={{ color: 'var(--text-cream)' }} />
          </button>
        </div>

        {showYearPicker ? (
          <div className="grid grid-cols-4 gap-2 p-4">
            {years.map(y => (
              <button key={y}
                onClick={() => { setViewDate(d => new Date(y, d.getMonth(), 1)); setShowYearPicker(false); }}
                className="py-2 rounded-xl text-xs font-medium motion-press"
                style={y === viewDate.getFullYear()
                  ? { background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: '#1a1610' }
                  : { background: 'rgba(200, 146, 74, 0.08)', color: 'var(--text-muted-warm)' }}>
                {y}
              </button>
            ))}
          </div>
        ) : (
          <div className="px-3 pt-2 pb-4">
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold py-1" style={{ color: 'var(--text-dim)' }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {calDays.map(day => {
                const inMonth    = isSameMonth(day, viewDate);
                const isSelected = isSameDay(day, selectedDate);
                const isToday    = isDayToday(day);
                return (
                  <button key={day.toString()}
                    onClick={() => { onSelect(day); onClose(); }}
                    className="h-8 w-8 mx-auto rounded-full text-xs flex items-center justify-center motion-press"
                    style={
                      isSelected ? { background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: '#1a1610', fontWeight: 700 } :
                      isToday    ? { border: '1.5px solid var(--brand-primary)', color: 'var(--brand-primary)', fontWeight: 700 } :
                      !inMonth   ? { color: 'rgba(176, 170, 158, 0.3)' } :
                                   { color: 'var(--text-muted-warm)' }
                    }>
                    {fmtDate(day, 'd')}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-center">
              <button onClick={() => { onSelect(new Date()); onClose(); }}
                className="text-xs px-5 py-1.5 rounded-full border font-medium motion-press"
                style={{ borderColor: 'rgba(200, 146, 74, 0.20)', color: 'var(--brand-primary)', background: 'rgba(200, 146, 74, 0.08)' }}>
                Today
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Greeting Edit Sheet ───────────────────────────────────────────────────────
function GreetingEditSheet({ tradition, sampradaya, currentGreeting, onSave, onClose }: {
  tradition:       string | null;
  sampradaya:      string | null;
  currentGreeting: string | null;
  onSave:          (greeting: string | null) => void;
  onClose:         () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const key  = tradition && sampradaya ? `${tradition}:${sampradaya}` : 'default';
  const pool = (GREETING_POOLS as Record<string, string[]>)[key]
            ?? (GREETING_POOLS as Record<string, string[]>)[`${tradition}:other`]
            ?? (GREETING_POOLS as Record<string, string[]>)['default'];

  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(currentGreeting);
  const [custom,   setCustom]   = useState(() => (
    currentGreeting && !pool.includes(currentGreeting) ? currentGreeting : ''
  ));

  const pathLabel = formatTraditionGreetingLabel(tradition, sampradaya);
  const previewGreeting = selected ?? getGreeting(tradition, sampradaya, new Date().getDate());
  const previewTone = selected
    ? pool.includes(selected) ? 'Saved tradition greeting' : 'Saved custom greeting'
    : 'Auto greeting';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[2px] overflow-y-auto"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
    >
      <div className="min-h-full flex items-end justify-center p-3 sm:items-center sm:p-6">
        <motion.div
          role="dialog"
          aria-modal="true"
          className="glass-panel-strong w-full max-w-lg rounded-[1.85rem] overflow-hidden"
          onClick={(event) => event.stopPropagation()}
          initial={prefersReducedMotion ? undefined : { y: 24, opacity: 0.98, scale: 0.99 }}
          animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1, scale: 1 }}
          exit={prefersReducedMotion ? undefined : { y: 18, opacity: 0.98, scale: 0.99 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
            {/* Dark-themed header */}
            <div className="sticky top-0 z-10 px-5 py-4 border-b flex items-center justify-between"
              style={{ background: 'rgba(30, 28, 22, 0.97)', borderColor: 'rgba(200, 146, 74, 0.14)', backdropFilter: 'blur(16px)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-cream)' }}>
                  Choose your greeting
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                  Suggested for {pathLabel}. You can stay on auto or save a personal greeting.
                </p>
              </div>
              <button onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center motion-press"
                style={{ background: 'rgba(200, 146, 74, 0.10)' }}>
                <X size={15} style={{ color: 'var(--text-muted-warm)' }} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Preview */}
              <div className="rounded-[1.4rem] p-4 border" style={{ background: 'rgba(200, 146, 74, 0.07)', borderColor: 'rgba(200, 146, 74, 0.16)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--brand-primary)' }}>
                  {previewTone}
                </p>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-cream)' }}>{previewGreeting}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>This is what will appear in your home greeting.</p>
              </div>

              <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
                <button
                  onClick={() => { setSelected(null); setCustom(''); }}
                  className="w-full text-left px-4 py-3 rounded-2xl border text-sm motion-press"
                  style={selected === null ? {
                    borderColor: 'var(--brand-primary)',
                    background: 'rgba(200, 146, 74, 0.10)',
                    color: 'var(--brand-primary)',
                  } : {
                    borderColor: 'rgba(200, 146, 74, 0.12)',
                    color: 'var(--text-muted-warm)',
                  }}
                >
                  <span className="block font-semibold">✨ Auto</span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>Rotate a suggested greeting from your tradition.</span>
                </button>

                <div className="pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-dim)' }}>
                    Suggested for {pathLabel}
                  </p>
                  <div className="space-y-2">
                    {pool.map((g) => (
                      <button
                        key={g}
                        onClick={() => { setSelected(g); setCustom(''); }}
                        className="w-full text-left px-4 py-3 rounded-2xl border text-sm motion-press"
                        style={selected === g ? {
                          borderColor: 'var(--brand-primary)',
                          background: 'rgba(200, 146, 74, 0.10)',
                          color: 'var(--brand-primary)',
                        } : {
                          borderColor: 'rgba(200, 146, 74, 0.10)',
                          color: 'var(--text-muted-warm)',
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Or write your own greeting:</p>
                <input
                  type="text"
                  placeholder="e.g. Jai Mahakal! 🔱"
                  value={custom}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setCustom(nextValue);
                    setSelected(nextValue.trim() || null);
                  }}
                  className="surface-input px-4 py-3 text-sm outline-none"
                  style={{ fontSize: '0.875rem' }}
                />
              </div>

              <button
                onClick={() => { onSave(selected); onClose(); }}
                className="glass-button-primary w-full py-3 font-semibold rounded-2xl text-sm"
                style={{ color: '#1a1610' }}
              >
                Save Greeting 🙏
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>,
    document.body
  );
}

// ── Calendar Modal ────────────────────────────────────────────────────────────
function CalendarModal({
  festivals,
  calendarMeta,
  onClose,
  onDateSelect,
}: {
  festivals: Festival[];
  calendarMeta: FestivalCalendarMeta;
  onClose: () => void;
  onDateSelect?: (date: Date) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = festivals.filter(f => f.date >= todayStr);
  const past     = festivals.filter(f => f.date <  todayStr);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
    >
      <motion.div
        className="w-full rounded-t-[2rem] max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, rgba(36, 32, 24, 0.99), rgba(28, 26, 20, 0.99))',
          borderTop: '1px solid rgba(200, 146, 74, 0.18)',
          boxShadow: '0 -20px 48px rgba(0, 0, 0, 0.38)',
        }}
        initial={prefersReducedMotion ? undefined : { y: 32, opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { y: 20, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.34, 1.26, 0.64, 1] }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-0" style={{ background: 'rgba(200, 146, 74, 0.28)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(200, 146, 74, 0.14)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200, 146, 74, 0.13)' }}>
              <CalendarDays size={16} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-cream)' }}>
                Parva Calendar
              </h2>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{calendarMeta.label} · {calendarMeta.coverage}</p>
            </div>
            {onDateSelect && (
              <span className="text-[10px] ml-1 font-medium" style={{ color: 'var(--brand-primary)' }}>tap date → Panchang</span>
            )}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center motion-press"
            style={{ background: 'rgba(200, 146, 74, 0.10)' }}>
            <X size={15} style={{ color: 'var(--text-muted-warm)' }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 pb-8">
          {upcoming.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2 mt-1" style={{ color: 'var(--text-dim)' }}>Upcoming</p>
              {upcoming.map(f => {
                const days = daysFromNow(f.date);
                return (
                  <div key={f.name + f.date}
                    onClick={() => { if (onDateSelect) { onDateSelect(new Date(f.date + 'T00:00:00')); onClose(); } }}
                    className="flex items-center gap-3 rounded-2xl p-3 cursor-pointer motion-lift border"
                    style={{ background: 'rgba(48, 44, 34, 0.80)', borderColor: 'rgba(200, 146, 74, 0.12)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: 'rgba(200, 146, 74, 0.12)' }}>
                      {f.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight" style={{ color: 'var(--text-cream)' }}>{f.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{formatFestDate(f.date)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {days === 0 ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--brand-primary)', color: '#1a1610' }}>Today</span>
                      ) : days === 1 ? (
                        <span className="text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>Tomorrow</span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{days}d</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {past.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2 mt-4" style={{ color: 'var(--text-dim)' }}>Past</p>
              {past.map(f => (
                <div key={f.name + f.date}
                  className="flex items-center gap-3 rounded-2xl p-3 border opacity-50"
                  style={{ background: 'rgba(36, 34, 26, 0.60)', borderColor: 'rgba(200, 146, 74, 0.08)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(200, 146, 74, 0.07)' }}>{f.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight" style={{ color: 'var(--text-muted-warm)' }}>{f.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{formatFestDate(f.date)}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Sky Animation ─────────────────────────────────────────────────────────────
interface SkyPhase {
  gradient: string;
  opacity: number;
  starOpacity: number;
  moonVisible: boolean;
  sunVisible: boolean;
  sunTop: string;
  sunRight: string;
  sunColor: string;
  cloudOpacity: number;
  horizonGlow: string | null;
}

function getSkyPhase(hour: number): SkyPhase {
  if (hour >= 0 && hour < 4) {
    return { gradient: 'linear-gradient(180deg,#07091a 0%,#0c1028 45%,#111830 100%)', opacity: 0.58, starOpacity: 0.95, moonVisible: true, sunVisible: false, sunTop: '50%', sunRight: '20%', sunColor: '#fff', cloudOpacity: 0.12, horizonGlow: null };
  } else if (hour < 6) {
    return { gradient: 'linear-gradient(180deg,#0c1238 0%,#1c1a48 50%,#2a1a34 100%)', opacity: 0.52, starOpacity: 0.60, moonVisible: true, sunVisible: false, sunTop: '50%', sunRight: '20%', sunColor: '#fff', cloudOpacity: 0.22, horizonGlow: 'rgba(90,40,110,0.38)' };
  } else if (hour < 8) {
    return { gradient: 'linear-gradient(180deg,#1a1438 0%,#4a2260 35%,#b85e28 68%,#e8883a 100%)', opacity: 0.48, starOpacity: 0.10, moonVisible: false, sunVisible: true, sunTop: '62%', sunRight: '24%', sunColor: '#f09040', cloudOpacity: 0.55, horizonGlow: 'rgba(240,110,40,0.52)' };
  } else if (hour < 12) {
    return { gradient: 'linear-gradient(180deg,#1a2f60 0%,#264d90 48%,#4278be 100%)', opacity: 0.36, starOpacity: 0, moonVisible: false, sunVisible: true, sunTop: '18%', sunRight: '22%', sunColor: '#ffd055', cloudOpacity: 0.65, horizonGlow: null };
  } else if (hour < 16) {
    return { gradient: 'linear-gradient(180deg,#1c3870 0%,#2756a0 48%,#3a76c6 100%)', opacity: 0.30, starOpacity: 0, moonVisible: false, sunVisible: true, sunTop: '10%', sunRight: '18%', sunColor: '#ffe070', cloudOpacity: 0.80, horizonGlow: null };
  } else if (hour < 18) {
    return { gradient: 'linear-gradient(180deg,#281e50 0%,#683020 42%,#c05e2c 68%,#e08a48 100%)', opacity: 0.46, starOpacity: 0, moonVisible: false, sunVisible: true, sunTop: '58%', sunRight: '20%', sunColor: '#ff7828', cloudOpacity: 0.70, horizonGlow: 'rgba(220,95,38,0.48)' };
  } else if (hour < 20) {
    return { gradient: 'linear-gradient(180deg,#1a1535 0%,#3a1524 45%,#701c0e 80%,#c03c1c 100%)', opacity: 0.52, starOpacity: 0.22, moonVisible: false, sunVisible: false, sunTop: '50%', sunRight: '20%', sunColor: '#ff5a28', cloudOpacity: 0.42, horizonGlow: 'rgba(180,55,18,0.52)' };
  } else {
    return { gradient: 'linear-gradient(180deg,#080b16 0%,#0b0f20 42%,#10162e 100%)', opacity: 0.56, starOpacity: 0.88, moonVisible: true, sunVisible: false, sunTop: '50%', sunRight: '20%', sunColor: '#fff', cloudOpacity: 0.08, horizonGlow: null };
  }
}

// Deterministic star positions — seeded so they're stable across renders
const STAR_DATA = Array.from({ length: 30 }, (_, i) => ({
  x: ((i * 37 + 13) % 90) + 4,
  y: ((i * 61 + 7)  % 62) + 2,
  r: i % 5 === 0 ? 1.6 : i % 3 === 0 ? 1.1 : 0.75,
  delay: (i * 0.41) % 2.6,
  dur:   2.2 + (i * 0.31) % 1.6,
}));

const CLOUD_DATA = [
  { xPct: 52, yPct: 14, scale: 1.00, speed: 20, delay: 0 },
  { xPct: 12, yPct: 30, scale: 0.68, speed: 27, delay: 5 },
  { xPct: 72, yPct: 40, scale: 0.80, speed: 23, delay: 9 },
  { xPct: 30, yPct: 55, scale: 0.55, speed: 32, delay: 3 },
];

function SkyBackground({ hour }: { hour: number }) {
  const p = getSkyPhase(hour);
  const rm = useReducedMotion();

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none"
      style={{ borderRadius: 'inherit', opacity: p.opacity, zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Base gradient */}
      <div className="absolute inset-0" style={{ background: p.gradient }} />

      {/* Stars */}
      {p.starOpacity > 0 && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {STAR_DATA.map((s, i) => (
            <motion.circle
              key={i}
              cx={s.x} cy={s.y} r={s.r}
              fill="white"
              initial={{ opacity: p.starOpacity * 0.5 }}
              animate={rm ? undefined : { opacity: [p.starOpacity * 0.4, p.starOpacity, p.starOpacity * 0.35] }}
              transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </svg>
      )}

      {/* Moon — crescent via circle occlusion */}
      {p.moonVisible && (
        <motion.div
          className="absolute"
          style={{ top: '9%', right: '20%', width: 20, height: 20 }}
          animate={rm ? undefined : { opacity: [0.72, 0.92, 0.72], y: [0, -1.5, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 20 20" width="20" height="20">
            <circle cx="10" cy="10" r="7.5" fill="rgba(215,220,255,0.88)" />
            <circle cx="13.5" cy="7.5" r="6.5" fill="rgba(10,12,28,0.95)" />
          </svg>
          {/* Moon halo */}
          <div className="absolute inset-0 rounded-full" style={{
            background: 'radial-gradient(circle at 38% 42%, rgba(200,210,255,0.18) 0%, transparent 65%)',
            transform: 'scale(2.2)',
          }} />
        </motion.div>
      )}

      {/* Shooting star (night only, occasional) */}
      {p.starOpacity > 0.5 && !rm && (
        <motion.div
          className="absolute"
          style={{ top: '18%', left: '15%', width: 40, height: 1.5,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.9), transparent)',
            borderRadius: 2,
          }}
          animate={{ x: [0, 60], opacity: [0, 0.8, 0], scaleX: [0.2, 1, 0.2] }}
          transition={{ duration: 0.8, delay: 8, repeat: Infinity, repeatDelay: 18, ease: 'easeOut' }}
        />
      )}

      {/* Sun glow */}
      {p.sunVisible && (
        <motion.div
          className="absolute"
          style={{
            top: p.sunTop, right: p.sunRight,
            width: 36, height: 36,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${p.sunColor}cc 0%, ${p.sunColor}55 38%, transparent 68%)`,
            transform: 'translate(50%, -50%)',
          }}
          animate={rm ? undefined : { scale: [0.92, 1.06, 0.92], opacity: [0.72, 0.95, 0.72] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Horizon glow (dawn / dusk) */}
      {p.horizonGlow && (
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '38%',
          background: `linear-gradient(to top, ${p.horizonGlow}, transparent)` }} />
      )}

      {/* Clouds */}
      {CLOUD_DATA.map((c, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: `${c.yPct}%`, left: `${c.xPct}%`, opacity: p.cloudOpacity * (0.55 + c.scale * 0.3) }}
          animate={rm ? undefined : { x: [0, 14, 0] }}
          transition={{ duration: c.speed, delay: c.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width={54 * c.scale} height={22 * c.scale} viewBox="0 0 54 22" fill="none">
            <ellipse cx="27" cy="16" rx="25" ry="6.5" fill="rgba(255,255,255,0.52)" />
            <ellipse cx="18" cy="12" rx="14.5" ry="9" fill="rgba(255,255,255,0.48)" />
            <ellipse cx="36" cy="13" rx="12.5" ry="8" fill="rgba(255,255,255,0.44)" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function HomeDashboard({
  userId,
  userName,
  city: savedCity,
  savedLat,
  savedLon,
  shloka,
  sacredText,
  sacredTextMeta,
  festival,
  festivalCalendar,
  festivalCalendarMeta,
  daysUntilFestival,
  initialPanchang,
  shlokaStreak:   initialStreak,
  lastShlokaDate,
  tradition,
  sampradaya,
  spiritualLevel,
  seeking,
  lifeStage,
  customGreeting,
  guidedPathProgress,
  showFirstTimeGuidance,
  japaStreak = 0,
  japaAlreadyDoneToday = false,
  nityaDoneToday = false,
  practiceHistory = [],
}: Props) {
  const supabase = createClient();
  const router   = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const shlokaRef = useRef<HTMLDivElement | null>(null);
  const festivalsRef = useRef<HTMLDivElement | null>(null);

  const [shlokaExpanded,    setShlokaExpanded]    = useState(false);
  const [shlokaModalOpen,   setShlokaModalOpen]   = useState(false);
  const [panchang,          setPanchang]          = useState<Panchang>(initialPanchang);
  const [calendarOpen,      setCalendarOpen]      = useState(false);
  const [datePickerOpen,    setDatePickerOpen]    = useState(false);
  const [greetingSheetOpen, setGreetingSheetOpen] = useState(false);
  const [inviteOpen,        setInviteOpen]        = useState(false);
  const [localGreeting,     setLocalGreeting]     = useState<string | null>(customGreeting);
  const [streak,           setStreak]           = useState(initialStreak);
  const [selectedDate,     setSelectedDate]     = useState<Date>(new Date());
  const [readToday,        setReadToday]        = useState(() => {
    const tz    = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    const today = localSpiritualDate(tz, 4);
    return lastShlokaDate === today;
  });
  const [editHomeOpen,     setEditHomeOpen]     = useState(false);
  // Personalised content — load from cache immediately, refresh in background
  const PERSONAL_CACHE_KEY = 'ss-personal-content';
  const PERSONAL_CACHE_DATE_KEY = 'ss-personal-content-date';
  const [personalContent, setPersonalContent] = useState<{
    suggestion: string;
    nudge: string | null;
    context_label?: string | null;
  } | null>(() => {
    // Hydrate from localStorage cache so the card renders immediately on load
    if (typeof window === 'undefined') return null;
    try {
      const cacheDate = localStorage.getItem(PERSONAL_CACHE_DATE_KEY);
      const today     = new Date().toISOString().split('T')[0];
      if (cacheDate === today) {
        const raw = localStorage.getItem(PERSONAL_CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
      }
    } catch { /* silent */ }
    return null;
  });
  const [hiddenHrefs,      setHiddenHrefs]      = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem('home_hidden_cards');
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [cardOrder,        setCardOrder]        = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CARD_ORDER;
    try {
      const saved = localStorage.getItem('home_card_order');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        // Merge: ensure all default hrefs present (handles new cards added later)
        const merged = [...parsed.filter(h => DEFAULT_CARD_ORDER.includes(h)), ...DEFAULT_CARD_ORDER.filter(h => !parsed.includes(h))];
        return merged;
      }
    } catch { /* fall through */ }
    return DEFAULT_CARD_ORDER;
  });
  const [hiddenSections,   setHiddenSections]   = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem('home_hidden_sections');
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  // Light/dark theme detection — drives card surface swaps
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.dataset.theme !== 'light');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // Confetti
  const [showConfetti, setShowConfetti] = useState(false);

  // Mood pill — null = not set today, undefined = loading
  const [moodToday, setMoodToday] = useState<{ key: string; label: string; colour: string } | null | undefined>(undefined);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const moodDate = localStorage.getItem('home_mood_date');
    const moodKey  = localStorage.getItem('home_mood_key');
    if (moodDate === today && moodKey && MOOD_QUICK_MAP[moodKey]) {
      setMoodToday(MOOD_QUICK_MAP[moodKey]);
    } else {
      setMoodToday(null);
    }
  }, []);

  function toggleCard(href: string) {
    setHiddenHrefs(prev => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href); else next.add(href);
      try { localStorage.setItem('home_hidden_cards', JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function moveCard(href: string, dir: 'up' | 'down') {
    setCardOrder(prev => {
      const idx = prev.indexOf(href);
      if (idx < 0) return prev;
      const next = [...prev];
      if (dir === 'up' && idx > 0) { [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; }
      else if (dir === 'down' && idx < next.length - 1) { [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; }
      try { localStorage.setItem('home_card_order', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function toggleSection(key: string) {
    setHiddenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem('home_hidden_sections', JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  // Ordered + visibility-filtered explore cards
  const orderedAccessItems = cardOrder.map(h => QUICK_ACCESS_MAP[h]).filter(Boolean);
  const visibleAccessItems = orderedAccessItems.filter(item => !hiddenHrefs.has(item.href));

  const { coords, city: liveCity } = useLocation();

  const lat = coords?.lat ?? savedLat ?? undefined;
  const lon = coords?.lon ?? savedLon ?? undefined;

  // Recalculate Panchang whenever date or coords change
  useEffect(() => {
    const p = calculatePanchang(selectedDate, lat, lon);
    setPanchang({
      tithi:     p.tithi,
      nakshatra: p.nakshatra,
      yoga:      p.yoga,
      sunrise:   p.sunrise,
      sunset:    p.sunset,
      rahuKaal:  p.rahuKaal,
    });
  }, [selectedDate, lat, lon]);

  // Fetch personalised daily content from Gemini-backed API.
  // Cache result in localStorage keyed to today's date — so on repeat visits
  // the suggestion renders immediately from cache (no blank-space wait).
  // The fetch always runs in background to refresh stale cache from yesterday.
  useEffect(() => {
    let cancelled = false;
    async function fetchPersonalContent() {
      try {
        const res = await fetch('/api/home/personalise');
        if (!res.ok) throw new Error('personalise failed');
        const data = await res.json();
        if (!cancelled && data?.suggestion) {
          setPersonalContent(data);
          try {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(PERSONAL_CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(PERSONAL_CACHE_DATE_KEY, today);
          } catch { /* localStorage unavailable */ }
        }
      } catch {
        // silently skip — cached value (if any) remains visible
      }
    }
    fetchPersonalContent();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (!focus) return;

    const timer = window.setTimeout(() => {
      if (focus === 'shloka') {
        setShlokaExpanded(true);
        setShlokaModalOpen(true);
      }

      if (focus === 'festivals') {
        setCalendarOpen(true);
        festivalsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const todayStr   = new Date().toISOString().split('T')[0];
  const selDateStr = selectedDate.toISOString().split('T')[0];
  const isToday    = selDateStr === todayStr;

  function navigateDay(delta: number) {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  }

  const displayCity = liveCity || savedCity;
  // Welcome back: user hasn't been active in 2+ days
  const isWelcomeBack = (() => {
    if (!lastShlokaDate) return false;
    const last = new Date(lastShlokaDate + 'T00:00:00');
    return (new Date().getTime() - last.getTime()) > 2 * 24 * 60 * 60 * 1000;
  })();

  // Time-aware greeting
  const hour        = new Date().getHours();
  const timeGreeting = getTimeGreeting(hour);
  const autoGreeting = getGreeting(tradition, sampradaya, new Date().getDate());
  const greeting     = localGreeting ?? (isWelcomeBack ? 'Welcome back! 🙏' : autoGreeting);
  const greetingMode = localGreeting
    ? 'Custom greeting saved'
    : timeGreeting
      ? `${timeGreeting} · auto tradition greeting`
      : 'Auto tradition greeting';

  async function saveGreeting(newGreeting: string | null) {
    setLocalGreeting(newGreeting);
    const { error } = await supabase.from('profiles').update({ custom_greeting: newGreeting }).eq('id', userId);
    if (error) {
      setLocalGreeting(customGreeting);
      toast.error(error.message);
      return;
    }
    toast.success(newGreeting ? 'Greeting updated 🙏' : 'Greeting reset to auto');
  }

  // ── Shloka streak ──────────────────────────────────────────────────────────
  async function markShlokaRead() {
    if (readToday || !userId) return;
    const tz        = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    const today     = localSpiritualDate(tz, 4);
    const yestObj   = new Date(today + 'T12:00:00Z');
    yestObj.setUTCDate(yestObj.getUTCDate() - 1);
    const yesterday = yestObj.toISOString().slice(0, 10);

    // Streak continues only if last read was exactly yesterday; otherwise reset to 1
    const newStreak = lastShlokaDate === yesterday ? streak + 1 : 1;

    // Optimistic UI first
    setReadToday(true);
    setStreak(newStreak);

    await supabase
      .from('profiles')
      .update({
        shloka_streak:    newStreak,
        last_shloka_date: today,
      })
      .eq('id', userId);

    // Increment seva_score by 5 — try RPC first, fall back to direct update
    try {
      const { error: rpcError } = await supabase.rpc('increment_seva_score', { user_id: userId, points: 5 });
      if (rpcError) throw rpcError;
    } catch {
      // RPC may not exist yet — direct update fallback
      const { data } = await supabase.from('profiles').select('seva_score').eq('id', userId).single();
      if (data) {
        await supabase.from('profiles')
          .update({ seva_score: (data.seva_score ?? 0) + 5 })
          .eq('id', userId);
      }
    }

    // Always show confetti + close modal for the full celebration moment
    setShowConfetti(true);
    setShlokaModalOpen(false);
    const milestoneMsg = newStreak % 7 === 0
      ? ` 🏅 ${newStreak}-day milestone!`
      : newStreak === 1 ? ' First shloka of your streak! 🌱' : '';
    toast.success(`🔥 ${newStreak}-day streak! +5 seva points${milestoneMsg}`);
    router.refresh(); // Ensure server state syncs on next visit
  }

  // ── Share helpers ──────────────────────────────────────────────────────────
  function sharePanchang() {
    const dateLabel = selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    shareContent('Panchang',
      `🪔 Panchang — ${dateLabel}\n\n` +
      `📅 Tithi: ${panchang.tithi}\n⭐ Nakshatra: ${panchang.nakshatra}\n🕉️ Yoga: ${panchang.yoga}\n` +
      `🌅 Sunrise: ${panchang.sunrise}\n🌆 Sunset: ${panchang.sunset}\n⚠️ Rahu Kaal: ${panchang.rahuKaal}\n\n` +
      `— Shared via Sanatana Sangam`
    );
  }

  function shareShloka() {
    if (sacredText) {
      shareContent(sacredTextMeta.shareLabel,
        `${sacredTextMeta.icon} ${sacredTextMeta.label}\n\n${sacredText.original}\n\n${sacredText.transliteration}\n\nMeaning: ${sacredText.meaning}\n\n${sacredText.source}\n\n— Shared via Sanatana Sangam`
      );
    } else {
      shareContent('Aaj Ka Shloka',
        `🕉️ Aaj Ka Shloka — ${shloka.source}\n\n${shloka.sanskrit}\n\n${shloka.transliteration}\n\nMeaning: ${shloka.meaning}\n\n— Shared via Sanatana Sangam`
      );
    }
  }

  // Light theme card surface — warm translucent paper
  const LIGHT_CARD_BG   = 'rgba(255, 253, 248, 0.90)';
  const LIGHT_CARD_SHADOW = '0 8px 24px rgba(49,35,20,0.07), inset 0 1px 0 rgba(255,255,255,0.85)';
  const DARK_CARD_SHADOW  = '0 20px 40px rgba(0, 0, 0, 0.28)';
  function getCardBg(theme: FeatureTheme) {
    return isDark ? theme.surface : LIGHT_CARD_BG;
  }
  function getCardShadow() {
    return isDark ? DARK_CARD_SHADOW : LIGHT_CARD_SHADOW;
  }

  const homeHeroTheme = HOME_THEMES.pathshala;
  const panchangTheme = HOME_THEMES.panchang;
  const sacredTextTheme = tradition === 'hindu' ? HOME_THEMES.pathshala : HOME_THEMES.bhakti;
  const heroPrimaryText = isDark ? 'var(--text-cream)' : '#211B14';
  const heroSecondaryText = isDark ? 'var(--text-muted-warm)' : '#4D4035';
  const heroTertiaryText = isDark ? 'var(--text-dim)' : '#66584A';
  const heroGlassSurface = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.72)';
  const heroGlassBorder = isDark ? 'rgba(250,238,218,0.12)' : 'rgba(65,36,2,0.12)';
  const dailyTextLine = (sacredText ? sacredText.original : shloka.sanskrit).split('\n')[0];
  const dailyNudge = personalContent?.suggestion
    ?? (!readToday
      ? `Read ${sacredTextMeta.label.toLowerCase()} and keep today's practice alive.`
      : !japaAlreadyDoneToday
        ? 'Start one quiet mala when you have a focused moment.'
        : !nityaDoneToday
          ? 'Complete the remaining nitya rhythm for today.'
          : 'Your core practice is steady today. Continue study or review Panchang.');
  const nextHomeAction = !readToday
      ? {
        label: `Read ${sacredText ? 'today’s text' : 'today’s shloka'}`,
        detail: 'Open the sacred text and mark it read.',
        href: null,
        onClick: () => setShlokaModalOpen(true),
      }
    : !japaAlreadyDoneToday
      ? {
          label: 'Start mala',
          detail: japaStreak > 0 ? `${japaStreak}-day japa streak ready.` : 'Begin today’s japa session.',
          href: '/bhakti/mala',
          onClick: undefined,
        }
      : !nityaDoneToday
        ? {
            label: 'Continue nitya karma',
            detail: 'Finish the daily practice loop.',
            href: '/nitya-karma',
            onClick: undefined,
          }
        : {
            label: 'Continue Pathshala',
            detail: 'Move into study with a calm base.',
            href: '/pathshala',
            onClick: undefined,
          };
  const practiceStatus = [
    { label: 'Text', value: readToday ? 'complete' : 'read', active: readToday, href: null, onClick: () => setShlokaModalOpen(true) },
    { label: 'Mala', value: japaAlreadyDoneToday ? 'complete' : 'start', active: japaAlreadyDoneToday, href: '/bhakti/mala', onClick: undefined },
    { label: 'Nitya', value: nityaDoneToday ? 'complete' : 'continue', active: nityaDoneToday, href: '/nitya-karma', onClick: undefined },
  ];

  return (
    <div className="space-y-4 pb-2 fade-in">

      {/* ── Sacred confetti celebration ── */}
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* ── Daily Darshan Hero ── */}
      <motion.section
        className="rounded-[2rem] px-5 py-5 relative overflow-hidden"
        style={{
          background: isDark
            ? 'linear-gradient(150deg, rgba(30,30,28,0.72), rgba(24,24,22,0.54))'
            : 'linear-gradient(150deg, rgba(255,253,248,0.70), rgba(250,238,218,0.42))',
          border: `1px solid ${isDark ? 'rgba(250,238,218,0.13)' : 'rgba(65,36,2,0.10)'}`,
          boxShadow: isDark ? '0 24px 70px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08)' : '0 18px 50px rgba(49,35,20,0.10), inset 0 1px 0 rgba(255,255,255,0.72)',
          backdropFilter: 'blur(22px) saturate(125%)',
          WebkitBackdropFilter: 'blur(22px) saturate(125%)',
        }}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 18 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      >
        <SkyBackground hour={hour} />
        <motion.div
          className="absolute -right-16 -top-12 h-48 w-48 rounded-full pointer-events-none"
          animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.38, 0.58, 0.38] }}
          transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(circle, ${homeHeroTheme.iconWell}, transparent 66%)`,
            zIndex: 1,
          }}
        />

        <div className="relative flex items-start justify-between gap-3" style={{ zIndex: 2 }}>
          <div className="min-w-0 flex-1">
            <p className="type-card-label tracking-[0.12em] uppercase text-[10px]" style={{ color: heroTertiaryText }}>Today in sangam</p>
            <button
              onClick={() => setGreetingSheetOpen(true)}
              className="group mt-2 -ml-0.5 rounded-2xl flex items-end gap-2 text-left motion-press"
            >
              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.35rem, 5vw, 1.65rem)',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  color: heroPrimaryText,
                  letterSpacing: '-0.01em',
                }}
              >
                {greeting},&nbsp;{userName.split(' ')[0]}
              </h1>
              <Pencil size={13} style={{ color: heroTertiaryText, marginBottom: '0.22rem', flexShrink: 0 }} />
            </button>
            <p className="type-body mt-2 leading-relaxed" style={{ fontSize: '0.82rem', color: heroSecondaryText }}>
              One calm start: panchang, sacred text, and the next practice that matters now.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDatePickerOpen(true)}
            className="flex-shrink-0 rounded-[1.1rem] px-3 py-2 text-center motion-press"
            style={{ background: isDark ? homeHeroTheme.iconWell : 'rgba(255,255,255,0.66)', minWidth: '3rem', border: `1px solid ${heroGlassBorder}` }}
          >
            <p className="text-[9px] font-medium uppercase tracking-[0.12em]" style={{ color: heroTertiaryText }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short' })}
            </p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 500, lineHeight: 1.1, color: heroPrimaryText }}>
              {new Date().getDate()}
            </p>
            <p className="text-[9px] font-medium" style={{ color: heroTertiaryText }}>
              {new Date().toLocaleDateString('en-IN', { month: 'short' })}
            </p>
          </button>
        </div>

        <div
          className="relative mt-5 rounded-[1.5rem] p-4"
          style={{
            zIndex: 2,
            background: heroGlassSurface,
            border: `1px solid ${heroGlassBorder}`,
            boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.74)',
            backdropFilter: 'blur(18px) saturate(130%)',
            WebkitBackdropFilter: 'blur(18px) saturate(130%)',
          }}
        >
          <Link href="/panchang" className="grid grid-cols-3 gap-2 rounded-[1.15rem] p-3 motion-press" style={{
            background: isDark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.64)',
            border: `1px solid ${heroGlassBorder}`,
          }}>
            <div className="min-w-0">
              <p className="home-section-label" style={{ color: heroTertiaryText }}>Tithi</p>
              <p className="home-card-title mt-1 truncate" style={{ color: heroPrimaryText }}>{panchang.tithi}</p>
            </div>
            <div className="min-w-0">
              <p className="home-section-label" style={{ color: heroTertiaryText }}>Nakshatra</p>
              <p className="home-card-title mt-1 truncate" style={{ color: heroPrimaryText }}>{panchang.nakshatra}</p>
            </div>
            <div className="min-w-0">
              <p className="home-section-label" style={{ color: heroTertiaryText }}>Panchang</p>
              <p className="home-card-title mt-1 truncate" style={{ color: heroPrimaryText }}>open →</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setShlokaModalOpen(true)}
            className="mt-4 w-full rounded-[1.35rem] p-4 text-left motion-press"
            style={{
              background: isDark ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.68)',
              border: `1px solid ${heroGlassBorder}`,
              backdropFilter: 'blur(16px) saturate(130%)',
              WebkitBackdropFilter: 'blur(16px) saturate(130%)',
            }}
          >
            <span
              className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium"
              style={{ background: 'rgba(250,238,218,0.95)', color: '#854F0B' }}
            >
              {sacredText ? sacredText.source : shloka.source}
            </span>
            <p
              className="mt-3 line-clamp-4"
              style={{
                fontFamily: 'Georgia, "Noto Serif Devanagari", serif',
                fontSize: 'clamp(1.08rem, 4.2vw, 1.28rem)',
                lineHeight: 1.72,
                color: heroPrimaryText,
                textShadow: isDark ? '0 1px 16px rgba(0,0,0,0.35)' : 'none',
              }}
            >
              {dailyTextLine}
            </p>
          </button>

          <div className="mt-4 rounded-[1.15rem] p-3" style={{
            background: isDark ? 'rgba(250,238,218,0.075)' : 'rgba(255,255,255,0.62)',
            border: `1px solid ${heroGlassBorder}`,
            backdropFilter: 'blur(14px) saturate(125%)',
            WebkitBackdropFilter: 'blur(14px) saturate(125%)',
          }}>
            <p className="home-section-label" style={{ color: heroTertiaryText }}>Next for you</p>
            <p className="home-card-title mt-1" style={{ color: heroPrimaryText }}>{nextHomeAction.label}</p>
            <p className="home-card-copy mt-1" style={{ color: heroSecondaryText }}>{nextHomeAction.detail}</p>
            <p className="home-card-copy mt-2" style={{ color: heroSecondaryText }}>{dailyNudge}</p>
          </div>

          <div className="mt-4 flex gap-2">
            {nextHomeAction.href ? (
              <Link
                href={nextHomeAction.href}
                className="flex-1 rounded-full px-4 py-3 text-center text-sm font-medium motion-press"
                style={{ background: 'rgba(250,199,117,0.88)', color: '#1a1610', boxShadow: '0 10px 26px rgba(239,159,39,0.18)' }}
              >
                {nextHomeAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={nextHomeAction.onClick}
                className="flex-1 rounded-full px-4 py-3 text-sm font-medium motion-press"
                style={{ background: 'rgba(250,199,117,0.88)', color: '#1a1610', boxShadow: '0 10px 26px rgba(239,159,39,0.18)' }}
              >
                {nextHomeAction.label}
              </button>
            )}
            <Link
              href="/panchang"
              className="rounded-full px-4 py-3 text-center text-sm font-medium motion-press"
              style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.68)', color: heroPrimaryText, border: `1px solid ${heroGlassBorder}`, backdropFilter: 'blur(14px)' }}
            >
              Details
            </Link>
          </div>
        </div>

        <div className="relative mt-3 grid grid-cols-3 gap-2" style={{ zIndex: 2 }}>
          {practiceStatus.map((item, index) => (
            <motion.div
              key={item.label}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.44, delay: 0.12 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  className="block rounded-[1rem] px-3 py-2 motion-press"
                  style={{
                    background: item.active ? 'rgba(250,199,117,0.18)' : heroGlassSurface,
                    border: item.active ? '1px solid rgba(200,146,74,0.26)' : `1px solid ${heroGlassBorder}`,
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <p className="home-section-label" style={{ color: heroTertiaryText }}>{item.label}</p>
                  <p className="home-card-title mt-0.5" style={{ color: heroPrimaryText }}>{item.value}</p>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="block w-full rounded-[1rem] px-3 py-2 text-left motion-press"
                  style={{
                    background: item.active ? 'rgba(250,199,117,0.18)' : heroGlassSurface,
                    border: item.active ? '1px solid rgba(200,146,74,0.26)' : `1px solid ${heroGlassBorder}`,
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <p className="home-section-label" style={{ color: heroTertiaryText }}>{item.label}</p>
                  <p className="home-card-title mt-0.5" style={{ color: heroPrimaryText }}>{item.value}</p>
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {(moodToday || displayCity) && (
          <div className="relative mt-3 flex flex-wrap items-center gap-2" style={{ zIndex: 2 }}>
            {moodToday && (
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-medium motion-press"
                style={{ background: isDark ? homeHeroTheme.iconWell : 'rgba(255,255,255,0.66)', color: heroSecondaryText, border: `1px solid ${heroGlassBorder}` }}
              >
                <MoodGlyph mood={moodToday.key} color={moodToday.colour} size={16} />
                {moodToday.label}
              </Link>
            )}
            {displayCity && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px]" style={{ background: isDark ? homeHeroTheme.iconWell : 'rgba(255,255,255,0.66)', color: heroTertiaryText, border: `1px solid ${heroGlassBorder}` }}>
                <MapPin size={11} style={{ color: homeHeroTheme.accent, flexShrink: 0 }} />
                {displayCity}
              </span>
            )}
          </div>
        )}
      </motion.section>

      {/* ── Shloka fullscreen modal ── */}
      <AnimatePresence>
        {shlokaModalOpen && (
          <motion.div
            className="fixed inset-0 z-[200] grid grid-rows-[auto,1fr,auto]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              background: isDark
                ? 'radial-gradient(circle at 50% 18%, rgba(250,199,117,0.13), transparent 34%), radial-gradient(circle at 18% 78%, rgba(250,238,218,0.08), transparent 28%), linear-gradient(160deg,#171714 0%,#0d0d0b 100%)'
                : 'radial-gradient(circle at 50% 18%, rgba(239,159,39,0.16), transparent 34%), radial-gradient(circle at 18% 78%, rgba(133,79,11,0.08), transparent 28%), linear-gradient(160deg,#fdfbf7 0%,#f7ead6 100%)',
            }}
          >
            {/* Ambient glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={prefersReducedMotion ? undefined : { opacity: [0.52, 0.9, 0.52], scale: [1, 1.03, 1] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: `radial-gradient(ellipse at 50% 30%, ${sacredTextTheme.iconWell}, transparent 62%)`,
              }}
            />
            {!prefersReducedMotion && (
              <>
                <motion.div
                  className="absolute left-[14%] top-[18%] h-1.5 w-1.5 rounded-full"
                  animate={{ opacity: [0.25, 1, 0.25], y: [0, -10, 0] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ background: 'rgba(250,238,218,0.72)' }}
                />
                <motion.div
                  className="absolute right-[18%] top-[34%] h-1 w-1 rounded-full"
                  animate={{ opacity: [0.15, 0.9, 0.15], y: [0, -14, 0] }}
                  transition={{ duration: 5.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                  style={{ background: 'rgba(250,199,117,0.72)' }}
                />
                <motion.div
                  className="absolute left-[24%] bottom-[24%] h-1 w-1 rounded-full"
                  animate={{ opacity: [0.18, 0.85, 0.18], y: [0, -12, 0] }}
                  transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                  style={{ background: 'rgba(250,238,218,0.66)' }}
                />
              </>
            )}

            {/* Header bar */}
            <div className="relative flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top,0px),12px)] pb-2"
              style={{
                background: isDark ? 'rgba(20,20,18,0.38)' : 'rgba(255,253,248,0.52)',
                backdropFilter: 'blur(14px) saturate(120%)',
                WebkitBackdropFilter: 'blur(14px) saturate(120%)',
              }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                  style={{ background: sacredTextTheme.iconWell }}>
                  {sacredTextMeta.icon}
                </div>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 500, color: 'var(--text-cream)' }}>
                  {sacredTextMeta.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={shareShloka}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: sacredTextTheme.iconWell }}>
                  <Share2 size={15} style={{ color: 'var(--text-cream)' }} />
                </button>
                <button onClick={() => setShlokaModalOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <X size={16} style={{ color: 'var(--text-muted-warm)' }} />
                </button>
              </div>
            </div>

            {/* Content — scrollable */}
            <div className="relative min-h-0 overflow-y-auto px-5 py-2 flex w-full max-w-2xl mx-auto flex-col justify-start gap-3">
              {/* Source badge */}
              <span className="self-start text-[10px] font-semibold px-3 py-1 rounded-full"
                style={{ background: 'rgba(200,146,74,0.14)', color: 'var(--brand-primary)' }}>
                {sacredText ? sacredText.source : shloka.source}
              </span>

              {/* Sanskrit — large, elevated */}
              <motion.div
                className="rounded-[1.7rem] px-5 py-4"
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 18, scale: 0.98 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.58)',
                  border: `1px solid ${isDark ? 'rgba(250,238,218,0.12)' : 'rgba(65,36,2,0.10)'}`,
                  backdropFilter: 'blur(18px) saturate(125%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(125%)',
                }}
              >
                <p style={{
                  fontFamily: 'Georgia, "Noto Serif Devanagari", serif',
                  fontSize: 'clamp(1.18rem, 4.3vw, 1.62rem)',
                  lineHeight: 1.68,
                  color: 'var(--text-cream)',
                  whiteSpace: 'pre-line',
                }}>
                  {sacredText ? sacredText.original : shloka.sanskrit}
                </p>
              </motion.div>

              {/* Transliteration */}
              <p className="italic text-base leading-relaxed" style={{ color: 'var(--text-muted-warm)', fontSize: '0.86rem' }}>
                {sacredText ? sacredText.transliteration : shloka.transliteration}
              </p>

              {/* Meaning */}
              <div className="rounded-[1.4rem] px-4 py-3" style={{
                background: isDark ? sacredTextTheme.iconWell : 'rgba(255,255,255,0.58)',
                border: `1px solid ${isDark ? 'rgba(250,238,218,0.10)' : 'rgba(65,36,2,0.09)'}`,
                backdropFilter: 'blur(14px) saturate(120%)',
                WebkitBackdropFilter: 'blur(14px) saturate(120%)',
              }}>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] mb-2" style={{ color: 'rgba(200,146,74,0.65)' }}>
                  Meaning
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted-warm)' }}>
                  {sacredText ? sacredText.meaning : shloka.meaning}
                </p>
              </div>

              {/* AI suggestion */}
              {personalContent?.suggestion && (
                <div className="rounded-[1.2rem] px-4 py-3.5" style={{ background: 'rgba(200,146,74,0.07)', borderLeft: '2px solid rgba(200,146,74,0.35)' }}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: 'rgba(200,146,74,0.65)' }}>
                    ✨ {personalContent.context_label ?? 'Today\'s Practice'}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted-warm)' }}>{personalContent.suggestion}</p>
                  {personalContent.nudge && <p className="text-xs mt-1.5 italic" style={{ color: 'rgba(200,146,74,0.55)' }}>{personalContent.nudge}</p>}
                </div>
              )}

              {/* Streak info */}
              {streak > 0 && (
                <p className="text-center text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>
                  🔥 {streak}-day reading streak
                </p>
              )}
            </div>

            {/* CTA bar */}
            <div className="relative px-5 py-3 pb-[max(env(safe-area-inset-bottom,0px),12px)]" style={{
              borderTop: `1px solid ${isDark ? 'rgba(250,238,218,0.12)' : 'rgba(65,36,2,0.10)'}`,
              background: isDark ? 'rgba(20,20,18,0.62)' : 'rgba(255,253,248,0.62)',
              backdropFilter: 'blur(18px) saturate(125%)',
              WebkitBackdropFilter: 'blur(18px) saturate(125%)',
            }}>
              <motion.button
                onClick={markShlokaRead}
                disabled={readToday}
                className="w-full rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
                style={readToday
                  ? { background: 'rgba(200,146,74,0.12)', color: 'var(--brand-primary)', border: '1px solid rgba(200,146,74,0.22)' }
                  : { background: 'rgba(250,199,117,0.90)', color: '#1c1208', boxShadow: '0 14px 30px rgba(239,159,39,0.20)' }}
                whileTap={readToday ? undefined : { scale: 0.97 }}
              >
                {readToday ? `✓ Marked read today` : `${sacredTextMeta.icon} Mark as read — earn 5 seva points`}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Greeting Hero ── */}
      <motion.div
        className="hidden rounded-[2rem] px-5 py-5 relative overflow-hidden"
        style={{
          background: getCardBg(homeHeroTheme),
          border: `1px solid ${homeHeroTheme.border}`,
          boxShadow: getCardShadow(),
          backdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
          WebkitBackdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
        }}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── Sky Animation (time-aware, atmospheric) ── */}
        <SkyBackground hour={new Date().getHours()} />

        {/* Ambient glow accent — above sky layer */}
        <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none" style={{
          background: `radial-gradient(circle at top right, ${homeHeroTheme.iconWell}, transparent 70%)`,
          borderRadius: '0 2rem 0 0',
          zIndex: 1,
        }} />

        {/* ── Row 1: Greeting + Date badge (date is always visible) ── */}
        <div className="relative flex items-start justify-between gap-3" style={{ zIndex: 2 }}>
          <div className="flex-1 min-w-0">
            <p className="type-card-label tracking-[0.12em] uppercase text-[10px]">Sanatana Sangam</p>

            {/* Greeting — serif, spring-animated, editable */}
            <button
              onClick={() => setGreetingSheetOpen(true)}
              className="group mt-2 -ml-0.5 rounded-2xl flex items-end gap-2 text-left"
              style={{ transition: `transform 200ms cubic-bezier(0.34, 1.26, 0.64, 1)` }}
            >
              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.35rem, 5vw, 1.65rem)',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color: 'var(--text-cream)',
                  letterSpacing: '-0.01em',
                }}
              >
                {greeting},&nbsp;{userName.split(' ')[0]}
              </h1>
              <Pencil
                size={13}
                style={{ color: 'var(--text-dim)', marginBottom: '0.22rem', flexShrink: 0,
                  transition: 'color 180ms ease', }}
                className="group-hover:text-[color:var(--brand-primary)]"
              />
            </button>

            {/* Subtitle */}
            <p className="type-body mt-2 leading-relaxed" style={{ fontSize: '0.82rem' }}>
              {showFirstTimeGuidance ? greetingMode : 'A quieter sacred day, ready when you are.'}
            </p>
          </div>

          {/* Date badge — flex-shrink-0 ensures it's always visible */}
          <div
            className="flex-shrink-0 rounded-[1.1rem] px-3 py-2 text-center"
            style={{ background: homeHeroTheme.iconWell, minWidth: '3rem' }}
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-dim)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short' })}
            </p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.1, color: 'var(--text-cream)' }}>
              {new Date().getDate()}
            </p>
            <p className="text-[9px] font-medium" style={{ color: 'var(--text-dim)' }}>
              {new Date().toLocaleDateString('en-IN', { month: 'short' })}
            </p>
          </div>
        </div>

        {/* ── Row 2: Mood + City (full-width, below greeting row) ── */}
        <div style={{ position: 'relative', zIndex: 2 }}>
        {moodToday !== undefined && (
          moodToday ? (
            /* ── Mood set: glowy pill — full width so it never overlaps the date ── */
            <Link
              href="/discover"
              className="flex items-center gap-3 mt-3 rounded-[1.4rem] px-4 py-2.5 transition motion-press"
              style={{
                background: `linear-gradient(135deg, ${moodToday.colour}22, ${moodToday.colour}0e)`,
                border: `1px solid ${moodToday.colour}40`,
                boxShadow: `0 4px 20px ${moodToday.colour}28, 0 0 0 1px ${moodToday.colour}18`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <motion.span
                className="leading-none flex-shrink-0 flex items-center justify-center"
                style={{ width: 36, height: 36 }}
                animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <MoodGlyph mood={moodToday.key} color={moodToday.colour} size={32} />
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: `${moodToday.colour}99` }}>
                  Today&apos;s mood
                </p>
                <p className="text-[14px] font-semibold leading-tight" style={{ color: moodToday.colour }}>
                  {moodToday.label}
                </p>
              </div>
              <span className="text-[10px] flex-shrink-0" style={{ color: `${moodToday.colour}70` }}>
                Change ›
              </span>
            </Link>
          ) : (
            /* ── No mood: subtle inline nudge ── */
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 mt-3 rounded-full px-3 py-1.5 text-[11px] font-medium transition motion-press"
              style={{
                background: 'rgba(200,146,74,0.09)',
                border: '1px solid rgba(200,146,74,0.20)',
                color: 'rgba(200,146,74,0.75)',
              }}
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(200,146,74,0.80)' }}
              />
              How are you feeling today?
            </Link>
          )
        )}

        {/* City */}
        {displayCity && (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-dim)' }}>
            <MapPin size={11} style={{ color: homeHeroTheme.accent, flexShrink: 0 }} />
            <span>{displayCity}</span>
            {coords && (
              <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase"
                style={{ background: 'rgba(200, 146, 74, 0.12)', color: 'var(--brand-primary)' }}>
                live
              </span>
            )}
          </p>
        )}
        </div>{/* end z-[2] row 2 wrapper */}
      </motion.div>

      {/* Practice status now lives inside the daily hero to keep home compact. */}

      {/* Guided paths surface inside Nitya Karma — not on home */}

      {/* ── Panchang Widget ── */}
      <motion.div
        className="hidden home-luminous-card rounded-[1.95rem] overflow-hidden border relative"
        style={{
          ['--home-luminous-colour' as string]: panchangTheme.iconWell,
          background: getCardBg(panchangTheme),
          borderColor: panchangTheme.border,
          backdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
          WebkitBackdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
        }}
        animate={prefersReducedMotion ? undefined : {
          opacity: 1,
          y: 0,
          boxShadow: isToday ? [
            `0 4px 24px ${panchangTheme.accent}28, 0 0 0 1px ${panchangTheme.accent}18`,
            `0 8px 32px ${panchangTheme.accent}42, 0 0 0 1px ${panchangTheme.accent}30`,
            `0 4px 24px ${panchangTheme.accent}28, 0 0 0 1px ${panchangTheme.accent}18`,
          ] : getCardShadow(),
        }}
        transition={prefersReducedMotion ? undefined : {
          opacity: { duration: 0.38, delay: 0.06 },
          y: { duration: 0.38, delay: 0.06, ease: [0.22, 1, 0.36, 1] },
          boxShadow: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
        }}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6 }}
      >
        {/* Ambient glow — pulses gently for today */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={prefersReducedMotion ? undefined : {
            opacity: isToday ? [0.6, 1, 0.6] : 1,
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(ellipse at top left, ${panchangTheme.iconWell}, transparent 60%)`,
          }}
        />
        {/* Extra shimmer sweep for today */}
        {isToday && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ x: ['-100%', '120%'] }}
            transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            style={{
              background: `linear-gradient(105deg, transparent 30%, ${panchangTheme.accent}18 50%, transparent 70%)`,
            }}
          />
        )}

        {/* Header */}
        <div className="relative px-4 pt-4 pb-2 flex items-center gap-2">
          <motion.div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm"
            style={{ background: panchangTheme.iconWell }}
            animate={isToday && !prefersReducedMotion ? { scale: [1, 1.10, 1] } : undefined}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            🪔
          </motion.div>
          <span className="home-card-title">
            {isToday ? 'Aaj Ka Panchang' : 'Panchang'}
          </span>

          {/* Day navigation */}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => navigateDay(-1)}
              className="w-7 h-7 rounded-full flex items-center justify-center motion-press"
              style={{ background: panchangTheme.iconWell }}>
              <ChevronLeft size={13} style={{ color: 'var(--text-cream)' }} />
            </button>
            <button onClick={() => setDatePickerOpen(true)}
              className="text-[11px] min-w-[76px] text-center font-medium"
              style={{ color: 'var(--text-cream)', textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationColor: 'rgba(200,146,74,0.35)' }}>
              {isToday ? 'Today' : selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </button>
            <button onClick={() => navigateDay(1)}
              className="w-7 h-7 rounded-full flex items-center justify-center motion-press"
              style={{ background: panchangTheme.iconWell }}>
              <ChevronRight size={13} style={{ color: 'var(--text-cream)' }} />
            </button>
            {!isToday && (
              <button onClick={() => setSelectedDate(new Date())}
                className="text-[10px] ml-1 rounded-full px-2 py-1 font-semibold motion-press"
                style={{ background: panchangTheme.iconWell, color: 'var(--brand-primary)' }}>
                Today
              </button>
            )}
          </div>
        </div>

        {/* Panchang grid — 3 columns */}
        <div className="relative grid grid-cols-3 gap-0 px-4 pt-1 pb-2">
          <PanchangItem label="Tithi"     value={panchang.tithi}     accent={panchangTheme.accent} />
          <PanchangItem label="Nakshatra" value={panchang.nakshatra} accent={panchangTheme.accent} />
          <PanchangItem label="Yoga"      value={panchang.yoga}      accent={panchangTheme.accent} />
          <PanchangItem label="Sunrise"   value={panchang.sunrise}   accent={panchangTheme.accent} />
          <PanchangItem label="Sunset"    value={panchang.sunset}    accent={panchangTheme.accent} />
        </div>

        {/* Rahu Kaal strip */}
        <div className="relative mx-4 mb-3 rounded-[1rem] px-3 py-2 flex items-center gap-2"
          style={{ background: 'rgba(0, 0, 0, 0.28)', border: `1px solid ${panchangTheme.border}` }}>
          <span className="text-sm">⚠️</span>
          <div className="flex-1">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted-warm)' }}>Rahu Kaal: </span>
            <span className="text-[11px]" style={{ color: 'var(--text-cream)' }}>{panchang.rahuKaal}</span>
          </div>
          <Link href="/panchang"
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold motion-press"
            style={{ background: panchangTheme.iconWell, color: 'var(--text-cream)' }}>
            <CalendarDays size={11} /> Full
          </Link>
          <button onClick={sharePanchang}
            className="w-7 h-7 rounded-full flex items-center justify-center motion-press"
            style={{ background: panchangTheme.iconWell }}
            title="Share Panchang">
            <Share2 size={12} style={{ color: 'var(--text-cream)' }} />
          </button>
        </div>

      </motion.div>


      {/* ── Daily Sacred Text — tradition-aware ── */}
      <motion.div
        ref={shlokaRef}
        className="hidden home-luminous-card rounded-[1.85rem] p-5 relative overflow-hidden border cursor-pointer"
        style={{
          ['--home-luminous-colour' as string]: sacredTextTheme.iconWell,
          borderColor: sacredTextTheme.border,
          background: getCardBg(sacredTextTheme),
          boxShadow: getCardShadow(),
          backdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
          WebkitBackdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
        }}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.10, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setShlokaModalOpen(true)}
        whileTap={{ scale: 0.985 }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at bottom right, rgba(200,146,74,0.05), transparent 65%)`,
        }} />

        {/* Header row */}
        <div className="relative flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[0.85rem] flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: sacredTextTheme.iconWell }}>
              {sacredTextMeta.icon}
            </div>
            <div>
              <p className="home-card-title">
                {sacredTextMeta.label}
              </p>
              {streak > 0 && (
                <p className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold" style={{ color: 'var(--brand-primary)' }}>
                  🔥 {streak}-day streak
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(200, 146, 74, 0.12)', color: 'var(--brand-primary)' }}>
              {sacredText ? sacredText.source : shloka.source}
            </span>
            <button onClick={e => { e.stopPropagation(); shareShloka(); }}
              className="w-7 h-7 rounded-full flex items-center justify-center motion-press"
              style={{ background: sacredTextTheme.iconWell }}
              title={`Share ${sacredTextMeta.shareLabel}`}>
              <Share2 size={12} style={{ color: 'var(--text-muted-warm)' }} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative h-px mb-4" style={{ background: `linear-gradient(90deg, ${sacredTextTheme.border}, transparent)` }} />

        {/* Original script — serif, elevated */}
        <p className="relative whitespace-pre-line mb-3 leading-relaxed"
          style={{
            fontFamily: 'Georgia, "Noto Serif Devanagari", serif',
            fontSize: '1.05rem',
            color: 'var(--text-cream)',
            lineHeight: 1.7,
          }}>
          {sacredText ? sacredText.original : shloka.sanskrit}
        </p>

        {/* Transliteration */}
        <p className="relative whitespace-pre-line italic mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--text-muted-warm)', fontSize: '0.83rem' }}>
          {sacredText ? sacredText.transliteration : shloka.transliteration}
        </p>

        {/* AI practice suggestion — shown when personalisation has loaded */}
        {personalContent?.suggestion && (
          <div className="relative rounded-[0.9rem] px-3 py-2.5 mb-3"
            style={{ background: 'rgba(200,146,74,0.07)', borderLeft: '2px solid rgba(200,146,74,0.35)' }}>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] mb-1" style={{ color: 'rgba(200,146,74,0.65)' }}>
              ✨ {personalContent.context_label ?? 'Today\'s Practice'}
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted-warm)' }}>
              {personalContent.suggestion}
            </p>
            {personalContent.nudge && (
              <p className="text-[11px] mt-1.5 italic" style={{ color: 'rgba(200,146,74,0.55)' }}>
                {personalContent.nudge}
              </p>
            )}
          </div>
        )}

        {/* Actions row */}
        <div className="relative flex items-center justify-between gap-2">
          <button onClick={e => { e.stopPropagation(); setShlokaExpanded(!shlokaExpanded); }}
            className="flex items-center gap-1 text-xs font-medium motion-press"
            style={{ color: 'var(--brand-primary)' }}>
            {shlokaExpanded ? 'Hide meaning' : 'Show meaning'}
            {shlokaExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <button onClick={e => { e.stopPropagation(); markShlokaRead(); }} disabled={readToday}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold motion-press"
            style={readToday
              ? { background: 'rgba(200, 146, 74, 0.12)', color: 'var(--brand-primary)', border: '1px solid rgba(200, 146, 74, 0.18)' }
              : { background: 'var(--brand-primary)', color: '#1a1610' }}>
            {readToday ? '✓ Read today' : `${sacredTextMeta.icon} Mark as read`}
          </button>
        </div>

        {/* Meaning — animated expand */}
        <AnimatePresence initial={false}>
          {shlokaExpanded && (
            <motion.div
              className="relative mt-4 pt-4 border-t text-sm leading-relaxed"
              style={{ borderColor: sacredTextTheme.border, color: 'var(--text-muted-warm)' }}
              initial={prefersReducedMotion ? undefined : { opacity: 0, height: 0, y: -4 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, height: 'auto', y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {sacredText ? sacredText.meaning : shloka.meaning}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Coming Up ── */}
      <motion.div
        ref={festivalsRef}
        className="home-luminous-card rounded-[1.85rem] border overflow-hidden relative"
        style={{
          ['--home-luminous-colour' as string]: HOME_THEMES.tirtha.iconWell,
          background: getCardBg(HOME_THEMES.tirtha),
          borderColor: HOME_THEMES.tirtha.border,
          boxShadow: getCardShadow(),
          backdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
          WebkitBackdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
        }}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-1 flex items-center justify-between">
          <p className="home-section-label">
            Coming Up
          </p>
          <button
            onClick={() => setCalendarOpen(true)}
            className="flex items-center gap-1 text-[11px] font-medium motion-press"
            style={{ color: HOME_THEMES.tirtha.accent }}>
            <CalendarDays size={11} /> All Festivals →
          </button>
        </div>

        {festival && daysUntilFestival !== null ? (
          <div className="px-4 pb-4 pt-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-[1rem] flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: HOME_THEMES.tirtha.iconWell }}>
              {festival.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="home-card-title">
                {festival.name}
              </p>
              <p className="home-card-copy mt-0.5">{festival.description}</p>
            </div>
            {/* Countdown pill */}
            <div className="flex-shrink-0 rounded-[0.9rem] px-3 py-2 text-center"
              style={{ background: daysUntilFestival === 0 ? 'var(--brand-primary)' : HOME_THEMES.tirtha.iconWell }}>
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontSize: daysUntilFestival === 0 ? '1.2rem' : '1.5rem',
                fontWeight: 700,
                lineHeight: 1,
                color: daysUntilFestival === 0 ? '#1a1610' : 'var(--text-cream)',
              }}>
                {daysUntilFestival === 0 ? '🎉' : daysUntilFestival}
              </p>
              <p className="text-[9px] font-semibold mt-1" style={{ color: daysUntilFestival === 0 ? '#1a1610' : 'var(--text-dim)' }}>
                {daysUntilFestival === 0 ? 'Today!' : daysUntilFestival === 1 ? 'Tomorrow' : 'days'}
              </p>
            </div>
          </div>
        ) : (
          <p className="px-4 pb-4 pt-2 text-sm" style={{ color: 'var(--text-muted-warm)' }}>
            Tap <span className="font-semibold" style={{ color: HOME_THEMES.tirtha.accent }}>All Festivals</span> to browse the Parva calendar 🙏
          </p>
        )}

      </motion.div>

      {/* ── Japa Streak Card ── */}
      <motion.div
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link href="/bhakti/mala"
          className="home-luminous-card block rounded-[1.7rem] p-4 relative overflow-hidden border motion-lift"
          style={{
            ['--home-luminous-colour' as string]: 'rgba(212, 120, 74, 0.22)',
            background: isDark ? 'linear-gradient(150deg, rgba(44, 34, 28, 0.98), rgba(34, 26, 20, 0.96))' : LIGHT_CARD_BG,
            borderColor: 'rgba(212, 120, 74, 0.20)',
            boxShadow: isDark ? '0 16px 32px rgba(0, 0, 0, 0.20)' : LIGHT_CARD_SHADOW,
            backdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
            WebkitBackdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
          }}>
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at top left, rgba(212, 120, 74, 0.08), transparent 60%)',
          }} />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[1rem] flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(212, 120, 74, 0.14)' }}>
                🪷
              </div>
              <div>
                <p className="home-section-label mb-1">
                  Daily Japa
                </p>
                <p className="home-card-title">
                  {japaAlreadyDoneToday ? 'Completed today 🙏' : 'Start your mala'}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {japaStreak > 0 ? (
                <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 border"
                  style={{ background: 'rgba(200, 146, 74, 0.12)', borderColor: 'rgba(200, 146, 74, 0.20)' }}>
                  <span className="text-sm">🔥</span>
                  <span className="font-bold text-sm" style={{ color: 'var(--brand-primary)' }}>{japaStreak}d</span>
                </div>
              ) : (
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-dim)' }}>Begin streak →</span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── Quick Access ── */}
      <div>
        <p className="home-section-label mb-3">
          Explore
        </p>
        <MotionStagger className="grid grid-cols-2 gap-3" delay={0.06}>
          {visibleAccessItems.map((item, i) => (
            <MotionItem key={item.href}>
              <Link
                href={item.href}
                className="home-luminous-card border rounded-[1.6rem] p-4 flex items-start gap-3 relative overflow-hidden motion-lift"
                style={{
                  ['--home-luminous-colour' as string]: HOME_THEMES[item.theme].iconWell,
                  background: getCardBg(HOME_THEMES[item.theme]),
                  borderColor: HOME_THEMES[item.theme].border,
                  boxShadow: isDark ? '0 14px 28px rgba(0, 0, 0, 0.18)' : LIGHT_CARD_SHADOW,
                  backdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
                  WebkitBackdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
                  animationDelay: `${i * 60}ms`,
                }}
              >
                {/* Ambient glow per theme */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: `radial-gradient(ellipse at top left, ${HOME_THEMES[item.theme].iconWell}, transparent 65%)`,
                }} />
                <div
                  className="relative w-11 h-11 rounded-[0.9rem] flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: HOME_THEMES[item.theme].iconWell }}>
                  {item.icon}
                </div>
                <div className="relative">
                  <p className="home-card-title">
                    {item.label}
                  </p>
                  <p className="home-card-copy mt-1">{item.desc}</p>
                </div>
              </Link>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>

      {/* ── Vichaar Sabha CTA ── */}
      {!hiddenSections.has('vichaar-sabha') && (
        <Link href="/vichaar-sabha"
          className="home-luminous-card block w-full rounded-[1.7rem] border p-4 text-center relative overflow-hidden motion-lift"
          style={{
            ['--home-luminous-colour' as string]: HOME_THEMES.pathshala.iconWell,
            borderColor: HOME_THEMES.pathshala.border,
            background: getCardBg(HOME_THEMES.pathshala),
            boxShadow: isDark ? '0 12px 24px rgba(0, 0, 0, 0.16)' : LIGHT_CARD_SHADOW,
            backdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
            WebkitBackdropFilter: isDark ? undefined : 'blur(10px) saturate(110%)',
          }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, rgba(200, 146, 74, 0.05), transparent 70%)',
          }} />
          <span className="relative text-xl">💬</span>
          <p className="home-card-title relative mt-1">
            Vichaar Sabha
          </p>
          <p className="home-card-copy relative mt-0.5">Discuss dharma, share wisdom, ask questions</p>
        </Link>
      )}

      {/* ── Invite Friends ── */}
      {!hiddenSections.has('invite-friends') && (
        <button onClick={() => setInviteOpen(true)}
          className="home-luminous-card w-full rounded-[1.7rem] border p-4 text-center relative overflow-hidden motion-lift"
          style={{
            ['--home-luminous-colour' as string]: HOME_THEMES.kul.iconWell,
            borderColor: HOME_THEMES.kul.border,
            background: getCardBg(HOME_THEMES.kul),
            boxShadow: getCardShadow(),
            backdropFilter: isDark ? undefined : 'blur(12px) saturate(115%)',
            WebkitBackdropFilter: isDark ? undefined : 'blur(12px) saturate(115%)',
          }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, rgba(157, 120, 74, 0.06), transparent 70%)',
          }} />
          <span className="relative text-xl">🙏</span>
          <p className="home-card-title relative mt-1">
            Invite Friends &amp; Family
          </p>
          <p className="home-card-copy relative mt-0.5">Spread the light of dharma</p>
        </button>
      )}

      {/* ── Edit Home ── */}
      <button
        onClick={() => setEditHomeOpen(true)}
        className="mx-auto flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold motion-press"
        style={{
          background: 'rgba(200,146,74,0.08)',
          border: '1px solid rgba(200,146,74,0.18)',
          color: 'var(--text-muted-warm)',
          display: 'flex',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit Home
      </button>

      {/* ── Edit Home sheet ── */}
      <AnimatePresence>
        {editHomeOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center overflow-hidden px-3 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
            style={{ background: isDark ? 'rgba(4,2,0,0.60)' : 'rgba(35,25,12,0.28)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={() => setEditHomeOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-2xl"
              onClick={e => e.stopPropagation()}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              transition={{ duration: 0.30, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="rounded-[2rem] p-5 space-y-5 overflow-y-auto overscroll-contain"
                style={{
                  background: isDark ? 'rgba(35,34,30,0.98)' : 'rgba(255,250,242,0.98)',
                  backdropFilter: 'blur(48px)',
                  WebkitBackdropFilter: 'blur(48px)',
                  border: '1px solid rgba(200,146,74,0.18)',
                  boxShadow: isDark ? '0 -4px 40px rgba(0,0,0,0.28)' : '0 -4px 34px rgba(70,45,16,0.18)',
                  maxHeight: 'min(78dvh, 680px)',
                }}
              >
                {/* Handle + header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="w-8 h-[3px] rounded-full mb-3" style={{ background: 'rgba(200,146,74,0.22)' }} />
                    <p className="home-section-label">
                      Customise
                    </p>
                    <p className="home-card-title mt-0.5">
                      Edit Home
                    </p>
                  </div>
                  <button
                    onClick={() => setEditHomeOpen(false)}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(95,58,22,0.08)', border: '1px solid rgba(200,146,74,0.14)' }}
                  >
                    <X size={14} style={{ color: 'var(--text-muted-warm)' }} />
                  </button>
                </div>

                {/* ── Explore Cards — toggle + reorder ── */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] px-1" style={{ color: 'var(--text-dim)' }}>
                    Explore Cards
                  </p>
                  {orderedAccessItems.map((item, idx) => {
                    const hidden = hiddenHrefs.has(item.href);
                    return (
                      <div
                        key={item.href}
                        className="flex items-center gap-2 rounded-2xl px-3 py-2.5 transition-all"
                        style={{
                          background: hidden ? 'var(--card-bg)' : 'rgba(200,146,74,0.08)',
                          border: `1px solid ${hidden ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(95,58,22,0.10)') : 'rgba(200,146,74,0.20)'}`,
                        }}
                      >
                        {/* Up / Down arrows */}
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => moveCard(item.href, 'up')}
                            disabled={idx === 0}
                            className="w-6 h-6 rounded-lg flex items-center justify-center transition disabled:opacity-25"
                            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(95,58,22,0.08)' }}
                          >
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M6 9V3M3 6l3-3 3 3" stroke="rgba(200,146,74,0.75)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => moveCard(item.href, 'down')}
                            disabled={idx === orderedAccessItems.length - 1}
                            className="w-6 h-6 rounded-lg flex items-center justify-center transition disabled:opacity-25"
                            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(95,58,22,0.08)' }}
                          >
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M6 3v6M3 6l3 3 3-3" stroke="rgba(200,146,74,0.75)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>

                        {/* Icon + label */}
                        <span className="text-lg leading-none flex-shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="home-card-title truncate" style={{ color: hidden ? 'var(--brand-muted)' : 'var(--brand-ink)' }}>
                            {item.label}
                          </p>
                          <p className="home-card-copy truncate">{item.desc}</p>
                        </div>

                        {/* Toggle */}
                        <button
                          onClick={() => toggleCard(item.href)}
                          className="flex-shrink-0"
                          aria-label={hidden ? 'Show' : 'Hide'}
                        >
                          <div
                            className="w-11 h-6 rounded-full transition-all flex items-center px-0.5"
                            style={{ background: hidden ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(95,58,22,0.14)') : 'rgba(200,146,74,0.55)' }}
                          >
                            <div
                              className="w-5 h-5 rounded-full transition-all"
                              style={{
                                background: '#fff',
                                transform: hidden ? 'translateX(0)' : 'translateX(20px)',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                              }}
                            />
                          </div>
                        </button>
                      </div>
                    );
                  })}

                  {/* Reset order + show-all */}
                  <div className="flex gap-2 pt-1">
                    {hiddenHrefs.size > 0 && (
                      <button
                        onClick={() => { setHiddenHrefs(new Set()); try { localStorage.removeItem('home_hidden_cards'); } catch {} }}
                        className="flex-1 py-2 rounded-2xl text-xs font-semibold"
                        style={{ background: 'rgba(200,146,74,0.10)', border: '1px solid rgba(200,146,74,0.18)', color: 'var(--text-muted-warm)' }}
                      >
                        Show all
                      </button>
                    )}
                    <button
                      onClick={() => { setCardOrder(DEFAULT_CARD_ORDER); try { localStorage.removeItem('home_card_order'); } catch {} }}
                      className="flex-1 py-2 rounded-2xl text-xs font-semibold"
                      style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(95,58,22,0.07)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(95,58,22,0.10)', color: 'var(--brand-muted)' }}
                    >
                      Reset order
                    </button>
                  </div>
                </div>

                {/* ── Sections ── */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] px-1" style={{ color: 'var(--text-dim)' }}>
                    Sections
                  </p>
                  {[
                    { key: 'vichaar-sabha',  icon: '💬', label: 'Vichaar Sabha',        desc: 'Community discussion forum' },
                    { key: 'invite-friends', icon: '🙏', label: 'Invite Friends',        desc: 'Spread the light of dharma' },
                  ].map(({ key, icon, label, desc }) => {
                    const hidden = hiddenSections.has(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleSection(key)}
                        className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all motion-press"
                        style={{
                          background: hidden ? 'var(--card-bg)' : 'rgba(200,146,74,0.08)',
                          border: `1px solid ${hidden ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(95,58,22,0.10)') : 'rgba(200,146,74,0.20)'}`,
                        }}
                      >
                        <span className="text-xl flex-shrink-0">{icon}</span>
                        <div className="flex-1 text-left">
                          <p className="home-card-title" style={{ color: hidden ? 'var(--brand-muted)' : 'var(--brand-ink)' }}>{label}</p>
                          <p className="home-card-copy">{desc}</p>
                        </div>
                        <div
                          className="w-11 h-6 rounded-full transition-all flex-shrink-0 flex items-center px-0.5"
                          style={{ background: hidden ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(95,58,22,0.14)') : 'rgba(200,146,74,0.55)' }}
                        >
                          <div
                            className="w-5 h-5 rounded-full transition-all"
                            style={{
                              background: '#fff',
                              transform: hidden ? 'translateX(0)' : 'translateX(20px)',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Parva / Festivals modal ── */}
      <AnimatePresence>
        {calendarOpen && (
          <CalendarModal
            festivals={festivalCalendar}
            calendarMeta={festivalCalendarMeta}
            onClose={() => setCalendarOpen(false)}
            onDateSelect={(date) => { setSelectedDate(date); setCalendarOpen(false); }}
          />
        )}
      </AnimatePresence>

      {/* ── Full date picker (tap date label in Panchang) ── */}
      <AnimatePresence>
        {datePickerOpen && (
          <DatePickerModal
            selectedDate={selectedDate}
            onSelect={(date) => setSelectedDate(date)}
            onClose={() => setDatePickerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Greeting edit sheet (tap greeting text) ── */}
      <AnimatePresence>
        {greetingSheetOpen && (
          <GreetingEditSheet
            tradition={tradition}
            sampradaya={sampradaya}
            currentGreeting={localGreeting}
            onSave={saveGreeting}
            onClose={() => setGreetingSheetOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Invite modal ── */}
      <AnimatePresence>
        {inviteOpen && (
          <InviteModal userId={userId} onClose={() => setInviteOpen(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}

function PanchangItem({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="py-1.5 pr-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-dim)' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-cream)', lineHeight: 1.3, marginTop: '0.15rem' }}>{value}</p>
    </div>
  );
}
