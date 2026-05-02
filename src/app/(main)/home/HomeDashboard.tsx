'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Heart,
  MapPin,
  Pencil,
  Share2,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
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
import { getGreeting, getGreetingPool, isGreetingCompatibleWithTradition } from '@/lib/traditions';
import type { GuidedPathProgressRow } from '@/lib/guided-paths';
import { useLocation } from '@/lib/LocationContext';
import { createClient } from '@/lib/supabase';
import { localSpiritualDate } from '@/lib/sacred-time';
import { APP } from '@/lib/config';
import { resolveHomeHeroTheme, type HomeHeroTheme } from '@/config/festivalThemes';
import { MotionItem, MotionStagger } from '@/components/motion/MotionPrimitives';
import MoodGlyph from '@/components/ui/MoodGlyph';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';
import { getTraditionMeta } from '@/lib/tradition-config';
import { getDailyDarshan, DARSHAN_REGISTRY } from '@/lib/darshan-registry';
import DarshanOverlay from '@/components/home/DarshanOverlay';
import DarshanPrompt from '@/components/home/DarshanPrompt';

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
  avatarUrl:         string | null;
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
  heroThemes:        HomeHeroTheme[];
  daysUntilFestival: number | null;
  initialPanchang:   Panchang;
  shlokaStreak:      number;
  lastShlokaDate:    string | null;
  tradition:         string | null;
  sampradaya:        string | null;
  ishtaDevata:       string | null;
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
  { label: 'Pathshala',  icon: '📖', href: '/pathshala',        desc: 'Tradition-first study tracks',   theme: 'pathshala' },
  { label: 'Sanskar',    icon: '🪔', href: '/kul/sanskara',   desc: '16 sacred lifecycle rites',      theme: 'kul'       },
  { label: 'Discover',   icon: '🌿', href: '/discover',       desc: 'Scripture for your mood',        theme: 'bhakti'    },
  { label: 'Panchang',   icon: '📅', href: '/panchang',       desc: 'Today\'s tithi & muhurta',       theme: 'panchang'  },
];
// Mood quick-lookup (mirrors DiscoverClient MOODS)

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

// tradition hero fallback is now in TRADITION_CONFIG

function stripGreetingIcon(greeting: string) {
  return greeting
    .replace(/[🙏🕉️☬☸️🤲✨🌺🌸🦚🔱⚔️🪔🌟]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
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
  const pool = getGreetingPool(tradition, sampradaya);

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
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, color: '#f0ede6' }}>
                  Choose your greeting
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(240, 237, 230, 0.70)' }}>
                  Suggested for {pathLabel}. You can stay on auto or save a personal greeting.
                </p>
              </div>
              <button onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center motion-press"
                style={{ background: 'rgba(200, 146, 74, 0.10)' }}>
                <X size={15} style={{ color: '#f0ede6' }} />
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
  avatarUrl,
  city: savedCity,
  savedLat,
  savedLon,
  shloka,
  sacredText,
  sacredTextMeta,
  festival,
  festivalCalendar,
  festivalCalendarMeta,
  heroThemes,
  daysUntilFestival,
  initialPanchang,
  shlokaStreak:   initialStreak,
  lastShlokaDate,
  tradition,
  sampradaya,
  ishtaDevata,
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
  const [localGreeting,     setLocalGreeting]     = useState<string | null>(() => (
    isGreetingCompatibleWithTradition(customGreeting, tradition, sampradaya) ? customGreeting : null
  ));
  const [heroImageFailed,   setHeroImageFailed]   = useState(false);
  const [streak,           setStreak]           = useState(initialStreak);
  const [selectedDate,     setSelectedDate]     = useState<Date>(new Date());
  const [readToday,        setReadToday]        = useState(() => {
    const tz    = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    const today = localSpiritualDate(tz, 4);
    return lastShlokaDate === today;
  });
  const [editHomeOpen,     setEditHomeOpen]     = useState(false);

  // Daily Darshan Logic
  const [darshanOpen, setDarshanOpen] = useState(false);
  const [darshanPromptVisible, setDarshanPromptVisible] = useState(false);
  const dailyDarshan = getDailyDarshan(tradition);
  const initialDarshanIndex = DARSHAN_REGISTRY.findIndex(d => d.id === dailyDarshan.id);

  useEffect(() => {
    const lastDarshanDate = localStorage.getItem('last_darshan_date');
    const todayStr = new Date().toISOString().split('T')[0];

    if (lastDarshanDate !== todayStr) {
      // Show prompt after a short delay instead of full screen
      const timer = setTimeout(() => {
        setDarshanPromptVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [tradition]);

  const handleOpenDarshan = () => {
    setDarshanOpen(true);
    setDarshanPromptVisible(false);
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('last_darshan_date', todayStr);
  };

  const handleDismissPrompt = () => {
    setDarshanPromptVisible(false);
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('last_darshan_date', todayStr);
  };
  // Personalised content
  const PERSONAL_CACHE_KEY = 'ss-personal-content';
  const PERSONAL_CACHE_DATE_KEY = 'ss-personal-content-date';
  const [personalContent, setPersonalContent] = useState<{
    suggestion: string;
    nudge: string | null;
    context_label?: string | null;
  } | null>(() => {
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

  // Confetti
  const [showConfetti, setShowConfetti] = useState(false);


  // Light/dark theme detection — drives card surface swaps
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.dataset.theme !== 'light');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

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
  const compatibleLocalGreeting = isGreetingCompatibleWithTradition(localGreeting, tradition, sampradaya)
    ? localGreeting
    : null;
  const greeting     = compatibleLocalGreeting ?? timeGreeting ?? autoGreeting;
  const greetingMode = compatibleLocalGreeting
    ? 'Custom greeting saved'
    : isWelcomeBack
      ? 'Welcome back · auto tradition greeting'
      : timeGreeting
      ? `${timeGreeting} · time greeting`
      : 'Auto tradition greeting';

  useEffect(() => {
    setLocalGreeting(isGreetingCompatibleWithTradition(customGreeting, tradition, sampradaya) ? customGreeting : null);
  }, [customGreeting, tradition, sampradaya]);

  async function saveGreeting(newGreeting: string | null) {
    setLocalGreeting(newGreeting);
    const { error } = await supabase.from('profiles').update({ custom_greeting: newGreeting }).eq('id', userId);
    if (error) {
      setLocalGreeting(isGreetingCompatibleWithTradition(customGreeting, tradition, sampradaya) ? customGreeting : null);
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
      : newStreak === 1 ? ` First ${dailyText.actionLabel} of your streak! 🌱` : '';
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
    shareContent(dailyText.shareLabel,
      `${dailyText.icon} ${dailyText.label} — ${dailyText.source}\n\n${dailyText.original}\n\n${dailyText.transliteration}\n\nMeaning: ${dailyText.meaning}\n\n— Shared via Sanatana Sangam`
    );
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
  const meta = getTraditionMeta(tradition);
  const sacredTextTheme = meta.homeSacredTextTheme === 'pathshala' ? HOME_THEMES.pathshala : HOME_THEMES.bhakti;
  const dailyText = {
    label: sacredTextMeta.label,
    icon: sacredTextMeta.icon,
    shareLabel: sacredTextMeta.shareLabel,
    source: sacredText ? sacredText.source : shloka.source,
    original: sacredText ? sacredText.original : shloka.sanskrit,
    transliteration: sacredText ? sacredText.transliteration : shloka.transliteration,
    meaning: sacredText ? sacredText.meaning : shloka.meaning,
    actionLabel: sacredText
      ? sacredTextMeta.label.toLowerCase().replace(/^aaj ka\s+/i, "today’s ")
      : "today’s shloka",
    streakLabel: sacredText ? 'sacred text streak' : 'shloka streak',
  };
  const heroPrimaryText = isDark ? 'var(--text-cream)' : '#211B14';
  const heroSecondaryText = isDark ? 'var(--text-muted-warm)' : '#4D4035';
  const heroTertiaryText = isDark ? 'var(--text-dim)' : '#66584A';
  const heroGlassSurface = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.72)';
  const heroGlassBorder = isDark ? 'rgba(250,238,218,0.12)' : 'rgba(65,36,2,0.12)';
  const dailyTextLine = dailyText.original.split('\n')[0];
  const dailyNudge = personalContent?.suggestion
    ?? (!readToday
      ? `Read ${dailyText.actionLabel} and keep today's practice alive.`
      : !japaAlreadyDoneToday
        ? 'Start one quiet mala when you have a focused moment.'
        : !nityaDoneToday
          ? 'Complete the remaining nitya rhythm for today.'
          : 'Your core practice is steady today. Continue study or review Panchang.');
  const quickAction = !readToday 
    ? {
        label: 'Read today\'s sacred text',
        detail: 'Connect with divine wisdom.',
        href: null,
        onClick: () => setShlokaModalOpen(true),
      }
    : !japaAlreadyDoneToday
      ? {
          label: 'Start your mala',
          detail: 'Chant your ishta mantra.',
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
  const heroTheme = resolveHomeHeroTheme({
    tradition,
    sampradaya,
    ishtaDevata,
    festival,
    dbThemes: heroThemes,
  });
  const heroFallback = meta.heroFallback;

  useEffect(() => {
    setHeroImageFailed(false);
  }, [heroTheme.heroImage]);

  const divineFeatureCards = [
    {
      title: 'Daily Darshan',
      description: 'Get divine blessings every day',
      href: '/daily-darshan',
      icon: Sparkles,
    },
    {
      title: 'Panchang',
      description: 'Tithi, Nakshatra, Yoga & more',
      href: '/panchang',
      icon: CalendarDays,
    },
    {
      title: 'Bhakti',
      description: 'Mala, zen, aarti and sacred practice',
      href: '/bhakti',
      icon: Heart,
    },
    {
      title: 'Pathshala',
      description: 'Study, recite and reflect daily',
      href: '/pathshala',
      icon: BookOpen,
    },
    {
      title: 'Mandali',
      description: 'Join satsang and community circles',
      href: '/mandali',
      icon: Users,
    },
    {
      title: 'Tirtha',
      description: 'Find temples near you',
      href: '/tirtha-map',
      icon: MapPin,
    },
  ];

  return (
    <div className="space-y-4 pb-2 fade-in">

      {/* ── Sacred confetti celebration ── */}
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* ── Divine Minimalist home concept ── */}
      <motion.section
        className="divine-home-shell"
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 18 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="divine-topbar">
          <Link href="/profile" className="divine-icon-button" aria-label="Open notifications">
            <Bell size={19} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="divine-topbar-meta">
              <button
                type="button"
                onClick={() => setGreetingSheetOpen(true)}
                className="divine-greeting-left motion-press"
              >
                <div className="flex items-center gap-2">
                  <h1 className="divine-greeting-title">
                    {stripGreetingIcon(greeting)}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <div className="divine-greeting-badge">
                    <Pencil size={9} />
                    <span>Personalize</span>
                  </div>
                  {displayCity && (
                    <span className="divine-location-v2">
                      <MapPin size={10} />
                      {displayCity}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
          <Link href="/profile" className="divine-profile-link" aria-label="Open profile">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={`${userName}'s profile photo`} fill sizes="44px" className="object-cover" />
            ) : (
              <span>{userName.trim().charAt(0).toUpperCase() || 'S'}</span>
            )}
          </Link>
        </div>

        <div className="divine-hero">
          {!heroImageFailed ? (
            <Image
              src={heroTheme.heroImage}
              alt={heroTheme.heroAlt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 760px"
              className="object-cover object-center divine-hero-image"
              style={{ objectPosition: heroTheme.objectPosition }}
              onError={() => setHeroImageFailed(true)}
            />
          ) : (
            <div className="divine-hero-fallback" aria-hidden="true">
              <span>{heroFallback.mark}</span>
              <strong>{heroFallback.title}</strong>
              <small>{heroFallback.subtitle}</small>
            </div>
          )}
          <div className="divine-hero-overlay" aria-hidden="true" />
          <div className="divine-hero-readability" aria-hidden="true" />
          <div className="divine-poster-motif divine-poster-motif-om" aria-hidden="true">{heroFallback.mark}</div>
          <div className="divine-poster-motif divine-poster-motif-mandala" aria-hidden="true" />
          <div className="divine-poster-motif divine-poster-motif-lotus" aria-hidden="true" />

          <div className="divine-hero-content">
            <div className="divine-hero-topline">
              <Link href="/discover" className="divine-mood-chip-immersive motion-press" aria-label="Open mood discovery">
                {moodToday ? (
                  <>
                    <MoodGlyph mood={moodToday.key} color={moodToday.colour} size={16} />
                    <span>Feeling {moodToday.label}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-white/60" />
                    <span>How are you feeling?</span>
                  </>
                )}
              </Link>
            </div>

            <div className="divine-hero-bottom">
              <button
                type="button"
                onClick={() => setShlokaModalOpen(true)}
                className="divine-shloka-card-v2 motion-press"
              >
                <span className="divine-poster-label">{dailyText.label}</span>
                <p className="divine-sanskrit-immersive-dark line-clamp-3">{dailyTextLine}</p>
                <p className="divine-meaning-dark line-clamp-2">{dailyText.meaning}</p>
              </button>
            </div>
          </div>
        </div>

        {/* Daily Darshan System */}
        <DarshanPrompt
          darshan={dailyDarshan}
          isVisible={darshanPromptVisible}
          onOpen={handleOpenDarshan}
          onDismiss={handleDismissPrompt}
        />


        <MotionStagger className="divine-feature-grid" delay={0.08}>
          {divineFeatureCards.map((item) => {
            const Icon = item.icon;
            const content = (
              <div className="divine-feature-card motion-lift">
                <span className="divine-card-motif" aria-hidden="true" />
                <span className="divine-feature-icon">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <span className="divine-feature-title">{item.title}</span>
                <span className="divine-feature-copy">{item.description}</span>
              </div>
            );

            if (item.onClick) {
              return (
                <MotionItem key={item.title}>
                  <button onClick={item.onClick} className="w-full text-left">
                    {content}
                  </button>
                </MotionItem>
              );
            }

            return (
              <MotionItem key={item.href}>
                <Link href={item.href!}>
                  {content}
                </Link>
              </MotionItem>
            );
          })}
        </MotionStagger>

        <Link href="/seva" className="divine-seva-card motion-lift">
          <span className="divine-card-motif divine-card-motif-large" aria-hidden="true" />
          <span>
            <span className="divine-section-title">Donate / Seva</span>
            <span className="divine-feature-copy mt-1 block">Support temples, cow seva, annadaan and more.</span>
          </span>
          <span className="divine-seva-cta">Donate Now</span>
        </Link>
      </motion.section>

      {/* Daily Darshan Fullscreen Overlay */}
      <DarshanOverlay 
        darshans={DARSHAN_REGISTRY}
        initialIndex={initialDarshanIndex >= 0 ? initialDarshanIndex : 0}
        isOpen={darshanOpen}
        onClose={() => setDarshanOpen(false)}
      />

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
                  {dailyText.icon}
                </div>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 500, color: 'var(--text-cream)' }}>
                  {dailyText.label}
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
                {dailyText.source}
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
                  {dailyText.original}
                </p>
              </motion.div>

              {/* Transliteration */}
              <p className="italic text-base leading-relaxed" style={{ color: 'var(--text-muted-warm)', fontSize: '0.86rem' }}>
                {dailyText.transliteration}
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
                  {dailyText.meaning}
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
                  🔥 {streak}-day {dailyText.streakLabel}
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
                {readToday ? `✓ Marked read today` : `${dailyText.icon} Mark as read — earn 5 seva points`}
              </motion.button>
            </div>
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
            currentGreeting={compatibleLocalGreeting}
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
