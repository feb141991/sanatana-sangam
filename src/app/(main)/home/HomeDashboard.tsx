'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Heart,
  MapPin,
  Pencil,
  Share2,
  Shield,
  Trophy,
  Users,
  X,
  Radio,
  Play,
  Mic,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react';
import { SEED_PATHS } from '@/lib/pathshala-paths';
// DigitalDeeksha removed — was overlaying home page
import { Sparkles, Search, Settings, Plus } from 'lucide-react';
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
import { calculatePanchang, PANCHANG_TRUST_META, getTodaySpiritualPulses } from '@/lib/panchang';
import { getFestivalStory, type FestivalStory } from '@/lib/festival-stories';
import { getDharmVeerOfTheDay, TRADITION_META, type DharmVeer } from '@/lib/dharm-veer';
import { getPitruPakshaDay, getPitruPakshaBannerCopy } from '@/lib/pitru-paksha';
import { getGreeting, getGreetingPool, isGreetingCompatibleWithTradition } from '@/lib/traditions';
import { SACRED_RELICS, getUnlockedRelics } from '@/lib/relics';
import type { GuidedPathProgressRow } from '@/lib/guided-paths';
import { useLocation } from '@/lib/LocationContext';
import { createClient } from '@/lib/supabase';
import { usePremium } from '@/hooks/usePremium';
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
import { getTransliteration } from '@/lib/transliteration';
import { resolveEffectiveMeaningLanguage } from '@/lib/language-runtime';
import { useLocalizedMeaning } from '@/hooks/useLocalizedMeaning';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useLanguage } from '@/lib/i18n/LanguageContext';
// DivineDiya removed — Prāthanā card removed from home

import { useThemePreference } from '@/components/providers/ThemeProvider';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';

interface Panchang {
  tithi:      string;
  nakshatra:  string;
  yoga:       string;
  sunrise:    string;
  sunset:     string;
  rahuKaal:   string;
  tithiIndex: number;
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
  festivals:         Festival[];
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
  appLanguage?:      string;
  meaningLanguage?:  string;
  transliterationLanguage?: string;
  showTransliteration?: boolean;
  spiritualLevel:    string | null;
  seeking:           string[];
  lifeStage:         string | null;
  customGreeting:    string | null;
  coverUrl?:         string | null;
  guidedPathProgress: GuidedPathProgressRow[];
  showFirstTimeGuidance: boolean;
  japaStreak?:          number;
  japaAlreadyDoneToday?: boolean;
  nityaDoneToday:      boolean;
  practiceHistory:     { date: string; japa: boolean; nitya: boolean }[];
  liveStreams:         any[];
  isAdmin?:            boolean;
  sevaScore?:          number;
}

const DEFAULT_QUICK_ACCESS = [
  { label: 'Tirtha',     icon: '🛕', href: '/tirtha-map',    desc: 'Find sacred places near you',   theme: 'tirtha'    },
  { label: 'Mandali',    icon: '🏡', href: '/mandali',        desc: 'Your local sangam',              theme: 'mandali'   },
  { label: 'Kul',        icon: '❤️', href: '/kul',            desc: 'Family sadhana together',        theme: 'kul'       },
  { label: 'Sanskar',    icon: '🪔', href: '/kul/sanskara',   desc: '16 sacred lifecycle rites',      theme: 'kul'       },
  { label: 'Discover',   icon: '🌿', href: '/discover',       desc: 'Scripture for your mood',        theme: 'bhakti'    },
  { label: 'Panchang',   icon: '📅', href: '/panchang',       desc: 'Today\'s tithi & muhurta',       theme: 'panchang'  },
];
// Mood quick-lookup (mirrors DiscoverClient MOODS)

// Five moods surfaced in the home card (subset of MOOD_QUICK_MAP)
const MOOD_CARD_OPTIONS = [
  { key: 'grateful',    emoji: '🙏', label: 'Grateful' },
  { key: 'seeking',     emoji: '🔍', label: 'Seeking'  },
  { key: 'anxious',     emoji: '😔', label: 'Anxious'  },
  { key: 'joyful',      emoji: '😊', label: 'Joyful'   },
  { key: 'scattered',   emoji: '🌀', label: 'Scattered' },
] as const;

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
    const shareText = `Join me on Shoonaya — your home for dharma, Panchang, scriptures, and community.\n\nUse my invite: ${code}\n${link}`;
    // Try Web Share API first (mobile / some desktop browsers)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Join me on Shoonaya 🙏', text: shareText, url: link });
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
          Share Shoonaya with your family and friends. They can use your invite code while joining.
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
  festivals,
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
  appLanguage,
  meaningLanguage,
  spiritualLevel,
  seeking,
  lifeStage,
  customGreeting,
  coverUrl,
  guidedPathProgress,
  showFirstTimeGuidance,
  japaStreak = 0,
  japaAlreadyDoneToday = false,
  nityaDoneToday,
  practiceHistory,
  liveStreams,
  transliterationLanguage,
  showTransliteration = true,
  isAdmin = false,
  sevaScore = 0,
}: Props) {
  const supabase = useRef(createClient()).current;
  const queryClient = useQueryClient();
  const router      = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const isPro = usePremium();
  const { playHaptic } = useZenithSensory();
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
  const [activeStoryFestival, setActiveStoryFestival] = useState<import('@/lib/festivals').Festival | null>(null);
  const [isQuizModalOpen,  setQuizModalOpen]    = useState(false);

  // showDeeksha / handleDeekshaComplete removed

  // ── Daily Quiz state ──────────────────────────────────────────────────────
  const [quiz, setQuiz]               = useState<{
    type: 'fact' | 'quiz'; question: string; options?: string[]; answerIndex?: number; explanation?: string; fact: string; source: string;
  } | null | 'loading' | 'error'>(null);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null); // index of chosen option

  // Daily Darshan Logic — Tradition Based
  const [customCover, setCustomCover] = useState<string | null>(coverUrl || null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  useEffect(() => {
    if (coverUrl) setCustomCover(coverUrl);
    else {
      const saved = localStorage.getItem('user_cover_photo');
      if (saved) setCustomCover(saved);
    }
  }, [coverUrl]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }

    setIsUploadingCover(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `profiles/${userId}/home_cover_${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pubData.publicUrl;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setCustomCover(publicUrl);
      localStorage.setItem('user_cover_photo', publicUrl);
      toast.success('Home sanctuary updated! 🙏');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const [darshanOpen, setDarshanOpen] = useState(false);
  const [darshanPromptVisible, setDarshanPromptVisible] = useState(false);
  
  // Find a live stream that matches the user's tradition
  const traditionLiveStream = liveStreams.find(s => s.tradition === tradition) || liveStreams[0];
  
  const dailyDarshan = getDailyDarshan(tradition);
  const initialDarshanIndex = DARSHAN_REGISTRY.findIndex(d => d.id === dailyDarshan.id);

  // Combine static darshan with live info for the prompt
  const displayDarshan = {
    ...dailyDarshan,
    liveTitle: traditionLiveStream?.title,
    liveLocation: traditionLiveStream?.location,
    liveId: traditionLiveStream?.id
  };

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
  const PERSONAL_CACHE_KEY = 'shoonaya-personal-content';
  const PERSONAL_CACHE_DATE_KEY = 'shoonaya-personal-content-date';
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

  // ── Daily Quiz — load from localStorage cache or fetch fresh ──────────────
  const _quizTrad           = tradition ?? 'hindu';
  const QUIZ_CACHE_KEY      = `shoonaya-quiz-daily-${_quizTrad}`;
  const QUIZ_CACHE_DATE_KEY = `shoonaya-quiz-daily-date-${_quizTrad}`;
  const QUIZ_ANSWERED_KEY   = `shoonaya-quiz-daily-answered-${_quizTrad}`;

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    try {
      // Check cache first
      const cachedDate = localStorage.getItem(QUIZ_CACHE_DATE_KEY);
      const cachedRaw  = localStorage.getItem(QUIZ_CACHE_KEY);
      if (cachedDate === today && cachedRaw) {
        setQuiz(JSON.parse(cachedRaw));
        const answered = localStorage.getItem(QUIZ_ANSWERED_KEY);
        if (answered !== null) setQuizAnswered(Number(answered));
        return;
      }
    } catch { /* ignore */ }

    // Fetch fresh
    setQuiz('loading');
    const trad = tradition ?? 'hindu';
    fetch(`/api/quiz/daily?tradition=${trad}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const quizData = { ...data, type: 'quiz' as const };
        setQuiz(quizData);
        localStorage.setItem(QUIZ_CACHE_KEY,      JSON.stringify(quizData));
        localStorage.setItem(QUIZ_CACHE_DATE_KEY, today);
      })
      .catch(() => setQuiz('error'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradition]);

  async function handleQuizAnswer(idx: number) {
    if (!quiz || typeof quiz === 'string' || quizAnswered !== null) return;

    setQuizAnswered(idx);
    localStorage.setItem(QUIZ_ANSWERED_KEY, String(idx));

    // Celebration
    if (idx === quiz.answerIndex) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }

    // Persist to DB
    try {
      await fetch('/api/quiz/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question:      quiz.question,
          chosen_index:  idx,
          correct_index: quiz.answerIndex,
          is_correct:    idx === quiz.answerIndex,
          tradition:     tradition ?? 'hindu',
          explanation:   quiz.explanation ?? null,
        })
      });
    } catch (err) {
      console.error('Failed to persist quiz answer:', err);
    }
  }

  // Confetti
  const [showConfetti, setShowConfetti] = useState(false);


  // Light/dark theme detection — drives card surface swaps
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () => {
      const theme = document.documentElement.dataset.theme;
      if (theme) {
        setIsDark(theme === 'dark');
      } else {
        // Fallback to system preference if no data-theme attribute
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };
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
      tithi:      p.tithi,
      nakshatra:  p.nakshatra,
      yoga:       p.yoga,
      sunrise:    p.sunrise,
      sunset:     p.sunset,
      rahuKaal:   p.rahuKaal,
      tithiIndex: p.tithiIndex,
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
    
    // Check for new relics
    const unlocked = getUnlockedRelics(newStreak, sevaScore, tradition ?? 'hindu');
    const previouslyUnlockedCount = Number(localStorage.getItem('shoonaya_relics_count') || '0');
    if (unlocked.length > previouslyUnlockedCount) {
      const newest = unlocked[unlocked.length - 1];
      
      // Interactive Toast
      toast((t) => (
        <button 
          onClick={() => {
            router.push('/profile');
            toast.dismiss(t.id);
          }}
          className="flex flex-col items-start gap-1 group"
        >
          <span className="text-xs font-bold text-[#C5A059]">✨ New Sacred Symbol Unlocked!</span>
          <span className="text-sm font-medium">{newest.name} is now yours. Tap to view in Kosh.</span>
        </button>
      ), { 
        icon: newest.imageUrl ? <Image src={newest.imageUrl} alt={newest.name} width={24} height={24} className="rounded-full" /> : '🔱',
        duration: 8000 
      });

      // Also persist as an in-app notification
      supabase.from('notifications').insert({
        user_id: userId,
        title: 'New Sacred Symbol Unlocked! ✨',
        body: `You've unlocked the ${newest.name}. View it in your Kosh.`,
        icon_emoji: '🔱',
        action_url: '/profile',
        category: 'milestone'
      }).then(() => {
        // Refresh notifications query if needed
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) });
      });

      localStorage.setItem('shoonaya_relics_count', unlocked.length.toString());
    }

    router.refresh(); // Ensure server state syncs on next visit
  }

  // ── Share helpers ──────────────────────────────────────────────────────────
  function sharePanchang() {
    const dateLabel = selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    shareContent('Panchang',
      `🪔 Panchang — ${dateLabel}\n\n` +
      `📅 Tithi: ${panchang.tithi}\n⭐ Nakshatra: ${panchang.nakshatra}\n🕉️ Yoga: ${panchang.yoga}\n` +
      `🌅 Sunrise: ${panchang.sunrise}\n🌆 Sunset: ${panchang.sunset}\n⚠️ Rahu Kaal: ${panchang.rahuKaal}\n\n` +
      `— Shared via Shoonaya`
    );
  }

  function shareShloka() {
    shareContent(dailyText.shareLabel,
      `${dailyText.icon} ${dailyText.label} — ${dailyText.source}\n\n${dailyText.original}\n\n${dailyText.transliteration ? `${dailyText.transliteration}\n\n` : ''}${dailyText.meaningLabel}: ${dailyText.meaning}\n\n— Shared via Shoonaya`
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
  const effectiveMeaningLanguage = resolveEffectiveMeaningLanguage(appLanguage, meaningLanguage);
  const dailyTextBase = {
    label: sacredTextMeta.label,
    icon: sacredTextMeta.icon,
    shareLabel: sacredTextMeta.shareLabel,
    source: sacredText ? sacredText.source : shloka.source,
    original: sacredText ? sacredText.original : shloka.sanskrit,
    transliteration: getTransliteration(
      sacredText ? sacredText.original : shloka.sanskrit,
      sacredText ? sacredText.transliteration : shloka.transliteration,
      transliterationLanguage ?? 'en'
    ),
    meaning: sacredText ? sacredText.meaning : shloka.meaning,
    actionLabel: sacredText
      ? sacredTextMeta.label.toLowerCase().replace(/^aaj ka\s+/i, "today’s ")
      : "today’s shloka",
    streakLabel: sacredText ? 'sacred text streak' : 'shloka streak',
  };

  // ── Multi-Festival Engine ──────────────────────────────────────────────────
  const festival = festivals[0] ?? null;
  const secondaryFestivals = festivals.slice(1);
  const localizedDailyMeaning = useLocalizedMeaning({
    entryId: `home:${tradition ?? 'other'}:${dailyTextBase.source}:${dailyTextBase.original.slice(0, 48)}`,
    sourceMeaning: dailyTextBase.meaning,
    sourceLabel: dailyTextBase.source,
    targetLanguage: effectiveMeaningLanguage,
  });
  const dailyText = {
    ...dailyTextBase,
    transliteration: showTransliteration ? dailyTextBase.transliteration : '',
    meaning: localizedDailyMeaning.meaning,
    meaningLabel: localizedDailyMeaning.label,
  };

  // ── Context for Sacred Text — resolve meaning + transliteration in background
  const heroPrimaryText = isDark ? 'var(--text-cream)' : '#211B14';
  const heroSecondaryText = isDark ? 'var(--text-muted-warm)' : '#4D4035';
  const { t, lang } = useLanguage();
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
  // ── Sacred Day Pulses ───────────────────────────────────────────────────────
  // Only show when viewing today (not a past/future panchang date).
  const sacredPulses = isToday
    ? getTodaySpiritualPulses(panchang.tithiIndex, tradition, selectedDate)
    : [];

  // ── Mood check-in card ───────────────────────────────────────────────────────
  // Visible from 5 AM to 1 PM local if the user hasn't set a mood today.
  const showMoodCard = (() => {
    if (moodToday !== null) return false; // already set or still loading
    const h = new Date().getHours();
    return h >= 5 && h < 13;
  })();

  function handleMoodCardPick(moodKey: string) {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('home_mood_date', today);
    localStorage.setItem('home_mood_key', moodKey);
    if (MOOD_QUICK_MAP[moodKey]) setMoodToday(MOOD_QUICK_MAP[moodKey]);
    router.push(`/discover?mood=${moodKey}`);
  }

  // ── Pitru Paksha ────────────────────────────────────────────────────────────
  // Only Hindu (and 'all') tradition users see this — Buddhist/Jain/Sikh have
  // their own ancestor-remembrance traditions handled elsewhere.
  const pitruPakshaDay = (() => {
    if (tradition && tradition !== 'hindu' && tradition !== 'all') return null;
    return getPitruPakshaDay(selectedDate);
  })();
  const pitruPakshaCopy = pitruPakshaDay ? getPitruPakshaBannerCopy(pitruPakshaDay) : null;

  // ── Festival Story Cards ────────────────────────────────────────────────────
  // Show "read the story" cards for ALL festivals ≤ 7 days away that have content.
  const activeFestivalStories = festivals
    .map(f => ({ festival: f, story: getFestivalStory(f.name), daysLeft: daysFromNow(f.date) }))
    .filter(x => x.story && x.daysLeft !== null && x.daysLeft <= 7);

  // ── Dharm Veer ───────────────────────────────────────────────────────────────
  // Always shown on home — a forgotten/underappreciated hero of Dharma, rotating
  // every 3 days, tradition-weighted for the user's sampradaya.
  const dharmVeer: DharmVeer = getDharmVeerOfTheDay(tradition);
  const dharmVeerTradMeta = TRADITION_META[dharmVeer.tradition] ?? TRADITION_META['hindu'];

  const heroTheme = resolveHomeHeroTheme({
    tradition,
    sampradaya,
    ishtaDevata,
    festival,
    dbThemes: heroThemes,
  });
  
  const isFestivalTheme = Boolean(heroTheme.festivalSlugs && heroTheme.festivalSlugs.length > 0 && daysUntilFestival === 0);
  const activeCoverUrl = isFestivalTheme ? heroTheme.heroImage : (customCover || heroTheme.heroImage);
  
  const heroFallback = meta.heroFallback;

  useEffect(() => {
    setHeroImageFailed(false);
  }, [activeCoverUrl]);

  const divineFeatureCards: Array<{
    title: string;
    description: string;
    href?: string;
    onClick?: () => void;
    icon: React.ElementType;
  }> = [
    // Daily Darshan hidden until content is fully prepared
    // { title: t('dailyDarshan'), description: t('dailyDarshanDesc'), onClick: handleOpenDarshan, icon: Sparkles },
    {
      title: t('liveDarshan'),
      description: t('liveDarshanDesc'),
      href: '/live-darshan',
      icon: Radio,
    },
    {
      title: t('tithi'),
      description: t('panchangDesc'),
      href: '/panchang',
      icon: CalendarDays,
    },
    {
      title: 'Mandali Ranks',
      description: 'See the top disciples globally',
      href: '/scoreboard',
      icon: Trophy,
    },
    ...(isAdmin ? [{
      title: 'Moderation Hub',
      description: 'Review reports & safety',
      href: '/admin/moderation',
      icon: ShieldAlert,
    }] : []),
    {
      title: t('bhakti'),
      description: t('bhaktiDesc'),
      href: '/bhakti',
      icon: Heart,
    },
    {
      title: t('mandali'),
      description: t('mandaliDesc'),
      href: '/mandali',
      icon: Users,
    },
    {
      title: t('kul'),
      description: t('kulDesc'),
      href: '/kul',
      icon: Shield,
    },

    {
      title: t('tirtha'),
      description: t('tirthaDesc'),
      href: '/tirtha-map',
      icon: MapPin,
    },
  ];

  return (
    <div className="divine-home-shell bg-[var(--divine-bg)] -mx-3 sm:-mx-4 relative selection:bg-[#C5A059]/30">
      <div className="relative">

      {/* ── Sacred confetti celebration ── */}
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />

        {/* ── Seamless Divine Hero & Header ────────────────────────────────────────── */}
        <div className="relative">
          <motion.div
            className="divine-hero cursor-pointer"
            style={{ perspective: 1000, minHeight: '420px', margin: 0 }}
            whileHover={prefersReducedMotion ? {} : {
              scale: 1.005,
              transition: { duration: 0.4, ease: "easeOut" }
            }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.995 }}
          >
            {!heroImageFailed ? (
              <Image
                src={activeCoverUrl}
                alt={(!isFestivalTheme && customCover) ? "Your custom cover" : heroTheme.heroAlt}
                fill
                priority
                sizes="100vw"
                className="object-cover object-center divine-hero-image"
                style={{ objectPosition: (!isFestivalTheme && customCover) ? 'center' : heroTheme.objectPosition }}
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
            
            {/* Custom Cover Upload Button */}
            <div className="absolute bottom-6 right-6 z-50 flex gap-2">
              {customCover && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setCustomCover(null);
                    localStorage.removeItem('user_cover_photo');
                    // Clear from DB so it doesn't restore on next load
                    await supabase.from('profiles').update({ cover_url: null }).eq('id', userId);
                    toast.success('Restored default cover 🙏');
                  }}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors shadow-lg"
                  aria-label="Remove Custom Cover"
                >
                  <X size={16} className="text-white/90" />
                </button>
              )}
              <label 
                className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors shadow-lg" 
                aria-label="Change Cover Photo"
                onClick={e => e.stopPropagation()}
              >
                <Pencil size={16} className="text-white/90" />
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </label>
            </div>
            
          </motion.div>

          {/* Transparent Header Overlay — two-row layout */}
          <div
            className="absolute top-0 left-0 right-0 z-50 pointer-events-none"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
          >
            {/* Row 1: Bell (left) | Mood (center) | Avatar (right) */}
            <div className="px-5 flex items-center justify-between">
              {/* Notification bell — left */}
              <motion.div
                className="pointer-events-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
              >
                <Link
                  href="/profile"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-black/10 dark:bg-black/22 border border-black/5 dark:border-white/18 backdrop-blur-md"
                  style={{
                    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                  }}
                  aria-label="Notifications"
                >
                  <Bell size={17} strokeWidth={1.8} className="text-[#F2EAD6] opacity-90" />
                </Link>
              </motion.div>

              {/* Mood chip — center */}
              <motion.div
                className="pointer-events-auto"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <Link href="/discover" className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-soft)] dark:bg-black/15 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-lg" aria-label="Open mood discovery">
                  {moodToday ? (
                    <>
                      <MoodGlyph mood={moodToday.key} color={moodToday.colour} size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--divine-text)] dark:text-white/90">Feeling {moodToday.label}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="text-[#F2EAD6] opacity-70" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2EAD6] opacity-80">Mood</span>
                    </>
                  )}
                </Link>
              </motion.div>

              {/* Profile avatar — right */}
              <motion.div
                className="pointer-events-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Link href="/profile" className="relative group">
                  <div className="w-11 h-11 rounded-full border-2 border-white/25 p-0.5 transition-all duration-500 group-hover:border-white/45"
                    style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.35)' }}>
                    <div className="w-full h-full rounded-full overflow-hidden relative bg-white/10 backdrop-blur-sm">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={userName} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-serif text-lg text-[#F2EAD6]">
                          {userName.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  {isPro && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#C5A059] rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                      <Sparkles size={10} className="text-white" />
                    </div>
                  )}
                </Link>
              </motion.div>
            </div>

            {/* Row 2: City + Greeting */}
            <div className="px-5 mt-3 pointer-events-auto">
              {displayCity && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.20em] text-[var(--divine-text)] dark:text-white mb-1 opacity-60 dark:opacity-100"
                  style={{ textShadow: isDark ? '0 1px 6px rgba(0,0,0,0.55)' : 'none' }}
                >
                  <MapPin size={10} strokeWidth={2.5} />
                  {displayCity}
                </motion.p>
              )}
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-serif text-[var(--divine-text)] dark:text-white leading-tight"
                style={{ textShadow: isDark ? '0 2px 12px rgba(0,0,0,0.55)' : 'none' }}
              >
                {stripGreetingIcon(greeting)},&nbsp;
                <span style={{ color: 'rgba(255,240,200,0.92)' }}>{userName.split(' ')[0]}</span>
              </motion.h1>
            </div>
          </div>
        </div>
        
        {/* ── Zenith Transitional Shloka ── */}
        <div className="px-5 -mt-8 relative z-20">
          <motion.button
            type="button"
            onClick={() => setShlokaModalOpen(true)}
            className="w-full text-center py-4 cursor-pointer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] opacity-80 mb-2 block">
              {dailyText.label}
            </span>
            <p className="font-serif text-lg md:text-xl text-[var(--divine-text)] leading-relaxed italic px-4">
              “{dailyTextLine}”
            </p>
            <p className="text-xs text-[var(--divine-text)] opacity-60 mt-2 px-8 line-clamp-1">
              {dailyText.meaning}
            </p>
          </motion.button>
        </div>

        {/* Daily Darshan — hidden until content is fully prepared */}
      </div>


        {/* ── Sacred Day Pulses (Stack) ────────────────────────────────────────────── */}
        <AnimatePresence>
          {sacredPulses.map((pulse, idx) => (
            <motion.div
              key={`pulse-${pulse.label}-${idx}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-2"
            >
              <Link 
                href={`/vrat/${encodeURIComponent(pulse.label)}`}
                className="sacred-pulse-banner group relative hover:scale-[1.02] transition-transform duration-300 block overflow-hidden"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-3 w-full pr-6">
                  <span className="sacred-pulse-emoji" aria-hidden="true">{pulse.emoji}</span>
                  <div className="sacred-pulse-body flex-1 min-w-0">
                    <span className="sacred-pulse-label">
                      {pulse.translationKey ? t(pulse.translationKey as any) : pulse.label} {t('today')}
                    </span>
                    <span className="sacred-pulse-desc">
                      {pulse.descKey ? t(pulse.descKey as any) : pulse.description} {t('viewDetails')}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-[#A0622A]/80 shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Pitru Paksha Banner ─────────────────────────────────────────── */}
        <AnimatePresence>
          {pitruPakshaDay && pitruPakshaCopy && (
            <motion.div
              key="pitru-paksha-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`pitru-paksha-banner${pitruPakshaDay.isMahalaya ? ' mahalaya' : ''}`}
              role="status"
              aria-live="polite"
            >
              <div className="pitru-paksha-left">
                <span className="pitru-paksha-emoji" aria-hidden="true">
                  {pitruPakshaDay.isMahalaya ? '🪔' : '☽'}
                </span>
                <div>
                  <span className="pitru-paksha-title">{pitruPakshaCopy.title}</span>
                  <span className="pitru-paksha-sub">{pitruPakshaCopy.subtitle}</span>
                </div>
              </div>
              <span className="pitru-paksha-day-badge" aria-label={`Day ${pitruPakshaDay.day} of ${pitruPakshaDay.totalDays}`}>
                {pitruPakshaDay.day}/{pitruPakshaDay.totalDays}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mood Check-In Card ───────────────────────────────────────────── */}
        <AnimatePresence>
          {showMoodCard && (
            <motion.div
              key="mood-checkin-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="mood-checkin-card"
              role="group"
              aria-label="Morning mood check-in"
            >
              <p className="mood-checkin-prompt">How are you feeling this morning?</p>
              <div className="mood-checkin-options" role="list">
                {MOOD_CARD_OPTIONS.map(m => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => handleMoodCardPick(m.key)}
                    className="mood-checkin-option motion-press"
                    role="listitem"
                    aria-label={m.label}
                  >
                    <span className="mood-checkin-emoji" aria-hidden="true">{m.emoji}</span>
                    <span className="mood-checkin-label">{m.label}</span>
                  </button>
                ))}
              </div>
              <Link href="/discover" className="mood-checkin-skip">
                More moods →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Festival Story Cards (Stack) ────────────────────────────────────────── */}
        <AnimatePresence>
          {activeFestivalStories.map(({ festival: f, story, daysLeft }) => (
            <motion.button
              key={`story-${f.name}`}
              type="button"
              onClick={() => setActiveStoryFestival(f)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="festival-story-card motion-press mb-3"
              aria-label={`Read the story of ${f.name}`}
            >
              <span className="festival-story-emoji" aria-hidden="true">{story?.emoji}</span>
              <div className="festival-story-body">
                <span className="festival-story-kicker">
                  {daysLeft === 0 ? 'Today' : `In ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                  {' · '}Festival Story
                </span>
                <span className="festival-story-title">{f.name}</span>
                <span className="festival-story-teaser line-clamp-2">{story?.significance}</span>
              </div>
              <ChevronRight size={16} className="festival-story-chevron" aria-hidden="true" />
            </motion.button>
          ))}
        </AnimatePresence>

        {/* ── Dharm Veer Card ──────────────────────────────────────────────── */}
        <motion.div
          key="dharm-veer-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="sacred-pulse-banner group relative hover:scale-[1.02] transition-transform duration-300 block overflow-hidden"
        >
          <Link 
            href={`/dharm-veer/${dharmVeer.id}`}
            className="flex items-center gap-3 w-full pr-6 text-left no-underline"
            onClick={() => playHaptic('light')}
          >
            <span className="sacred-pulse-emoji" aria-hidden="true">{dharmVeer.emoji}</span>
            <div className="sacred-pulse-body flex-1 min-w-0">
              <span className="sacred-pulse-label">
                {lang !== 'en' && dharmVeer.nameLocal ? dharmVeer.nameLocal : dharmVeer.name}
              </span>
              <span className="sacred-pulse-desc line-clamp-1">
                {lang !== 'en' && dharmVeerTradMeta.dharmVeerLocal ? dharmVeerTradMeta.dharmVeerLocal : t('journeyLabel')} · {lang !== 'en' && dharmVeerTradMeta.labelLocal ? dharmVeerTradMeta.labelLocal : dharmVeerTradMeta.label}
              </span>
            </div>
            <ChevronRight size={16} className="text-[#A0622A]/80 shrink-0" aria-hidden="true" />
          </Link>
        </motion.div>
        
        {/* ── Your Path — Continue Learning ────────────────────────────────────── */}
        {guidedPathProgress && guidedPathProgress.length > 0 && (
          <div className="px-5 mb-4 mt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A059] opacity-80">
                Your Path
              </p>
              <Link href="/pathshala" className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] hover:underline">
                View All →
              </Link>
            </div>
            
            {guidedPathProgress.filter(p => p.status === 'active').slice(0, 1).map((enrollment) => {
              const path = SEED_PATHS.find(p => p.id === enrollment.path_id);
              if (!path) return null;
              
              const doneLessons = (enrollment.completed_lessons ?? []).length;
              const totalLessons = (path as any).total_lessons ?? 1;
              const progressPct = Math.round((doneLessons / totalLessons) * 100);
              const resumeLesson = enrollment.current_lesson ?? 0;
              const lessonLabel = resumeLesson > 0 ? `Lesson ${resumeLesson + 1}` : 'Begin';

              return (
                <motion.div
                  key={enrollment.path_id}
                  className="relative rounded-[1.8rem] overflow-hidden motion-press p-5 border border-[rgba(200,146,74,0.18)]"
                  style={{ 
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(28,20,12,0.92), rgba(18,12,8,0.96))'
                      : 'linear-gradient(135deg, rgba(255,244,228,0.96), rgba(250,235,210,0.98))',
                    boxShadow: isDark 
                      ? '0 8px 32px rgba(0,0,0,0.32)'
                      : '0 8px 32px rgba(180,110,30,0.08)'
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ background: 'rgba(200,146,74,0.12)', border: '1px solid rgba(200,146,74,0.2)' }}>
                        📖
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight truncate" style={{ fontFamily: 'var(--font-serif)', color: heroPrimaryText }}>
                        {path.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                          <motion.div 
                            className="h-full bg-[#C5A059]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#C5A059]">{progressPct}%</span>
                      </div>
                    </div>
                    <Link
                      href={`/pathshala/${enrollment.path_id}/lesson`}
                      className="w-11 h-11 rounded-full bg-[#C5A059] flex items-center justify-center text-[#1c1c1a] shadow-lg shadow-[#C5A059]/30"
                    >
                      <Play size={18} fill="currentColor" />
                    </Link>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(200,146,74,0.1)]">
                    <p className="text-[10px] font-medium" style={{ color: heroTertiaryText }}>
                      {lessonLabel} · {totalLessons - doneLessons} lessons remaining
                    </p>
                    <div className="flex items-center gap-2">
                      <Link href={`/pathshala/${enrollment.path_id}/recite`} className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
                        Recite
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}


        {/* ── Do You Know? Daily Quiz Spark Teaser ─────────────────────────── */}
        <AnimatePresence>
          {quiz && quiz !== 'loading' && quiz !== 'error' && (
            <motion.div
              key="quiz-spark-teaser"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38 }}
              className="quiz-spark-card compact cursor-pointer group"
              onClick={() => setQuizModalOpen(true)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(200,146,74,0.12)] flex items-center justify-center text-lg">
                    🧠
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-primary)] opacity-80">
                      {tradition ? `${tradition} Quiz` : 'Do You Know?'}
                    </span>
                    <h3 className="text-sm font-bold theme-ink line-clamp-1 mt-0.5">{quiz.question}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[var(--brand-muted)] group-hover:text-[var(--brand-primary)] transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {quizAnswered !== null ? 'Done ✓' : 'Play →'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div id="features-section" className="scroll-mt-24">
          <MotionStagger className="divine-feature-grid" delay={0.08}>
          {divineFeatureCards.map((item) => {
            const Icon = item.icon;
            const content = (
              <div className="divine-feature-card motion-lift">
                <span className="divine-card-motif" aria-hidden="true" />
                <span className="divine-feature-icon">
                  <Icon size={20} strokeWidth={2.2} />
                </span>
                <span className="divine-feature-title">{item.title}</span>
                <span className="divine-feature-copy">{item.description}</span>
              </div>
            );

            if (item.onClick) {
              return (
                <MotionItem key={item.title}>
                  <button 
                    onClick={() => {
                      playHaptic('light');
                      item.onClick!();
                    }} 
                    className="w-full text-left"
                  >
                    {content}
                  </button>
                </MotionItem>
              );
            }

            return (
              <MotionItem key={item.href}>
                <Link 
                  href={item.href!}
                  onClick={() => playHaptic('light')}
                >
                  {content}
                </Link>
              </MotionItem>
            );
          })}
        </MotionStagger>
      </div>

        <Link href="/seva" className="divine-seva-card motion-lift">
          <span className="divine-card-motif divine-card-motif-large" aria-hidden="true" />
          <span>
            <span className="divine-section-title">Donate / Seva</span>
            <span className="divine-feature-copy mt-1 block">Support temples, cow seva, annadaan and more.</span>
          </span>
          <span className="divine-seva-cta">Donate Now</span>
        </Link>

      {/* Daily Darshan Overlay — hidden until content is fully prepared */}

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

            {/* Content — scrollable, but compact enough to fit without scrolling */}
            <div className="relative min-h-0 overflow-y-auto px-5 py-2 flex w-full max-w-2xl mx-auto flex-col justify-start gap-2">
              {/* Source badge */}
              <span className="self-start text-[10px] font-semibold px-3 py-1 rounded-full"
                style={{ background: 'rgba(200,146,74,0.14)', color: 'var(--brand-primary)' }}>
                {dailyText.source}
              </span>

              {/* Sanskrit — large, elevated */}
              <motion.div
                className="rounded-[1.4rem] px-4 py-3"
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
                  fontSize: 'clamp(0.95rem, 3.5vw, 1.25rem)',
                  lineHeight: 1.55,
                  color: heroPrimaryText,
                  whiteSpace: 'pre-line',
                }}>
                  {dailyText.original}
                </p>
              </motion.div>

              {/* Transliteration */}
              {dailyText.transliteration && dailyText.transliteration !== dailyText.original && (
                <p className="italic leading-snug" style={{ color: heroSecondaryText, fontSize: '0.78rem' }}>
                  {dailyText.transliteration}
                </p>
              )}

              {/* Meaning */}
              <div className="rounded-[1.2rem] px-3 py-2.5" style={{
                background: isDark ? sacredTextTheme.iconWell : 'rgba(255,255,255,0.58)',
                border: `1px solid ${isDark ? 'rgba(250,238,218,0.10)' : 'rgba(65,36,2,0.09)'}`,
                backdropFilter: 'blur(14px) saturate(120%)',
                WebkitBackdropFilter: 'blur(14px) saturate(120%)',
              }}>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: 'rgba(200,146,74,0.65)' }}>
                  {dailyText.meaningLabel}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: heroSecondaryText }}>
                  {dailyText.meaning}
                </p>
              </div>

              {/* AI suggestion */}
              {personalContent?.suggestion && (
                <div className="rounded-[1.2rem] px-4 py-3.5" style={{ background: 'rgba(200,146,74,0.07)', borderLeft: '2px solid rgba(200,146,74,0.35)' }}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: 'rgba(200,146,74,0.65)' }}>
                    ✨ {personalContent.context_label ?? 'Today\'s Practice'}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: heroSecondaryText }}>{personalContent.suggestion}</p>
                  {personalContent.nudge && <p className="text-xs mt-1.5 italic" style={{ color: 'rgba(200,146,74,0.55)' }}>{personalContent.nudge}</p>}
                  {(personalContent as any).action && (
                    <div className="mt-3">
                      <Link
                        href={(personalContent as any).action.href}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors"
                        style={{
                          background: (personalContent as any).action.type === 'primary' ? 'var(--brand-primary)' : 'rgba(200,146,74,0.12)',
                          color: (personalContent as any).action.type === 'primary' ? '#1c1c1a' : 'var(--brand-primary)',
                          border: (personalContent as any).action.type === 'primary' ? 'none' : '1px solid rgba(200,146,74,0.2)'
                        }}
                      >
                        {(personalContent as any).action.label}
                        <ChevronRight size={12} strokeWidth={3} />
                      </Link>
                    </div>
                  )}
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

      {/* ── Festival Story Sheet ───────────────────────────────────────────── */}
      <AnimatePresence>
        {(() => {
          const _activeStory = activeStoryFestival ? getFestivalStory(activeStoryFestival.name) : null;
          const _activeDays  = activeStoryFestival ? daysFromNow(activeStoryFestival.date) : null;
          return activeStoryFestival && _activeStory ? (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            onClick={() => setActiveStoryFestival(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          >
            <motion.div
              className="relative w-full overflow-y-auto rounded-t-[2rem] pb-10"
              style={{
                maxHeight: '88dvh',
                background: 'linear-gradient(180deg, var(--surface-raised) 0%, var(--card-bg) 100%)',
                borderTop: '1px solid rgba(200, 146, 74, 0.22)',
                boxShadow: '0 -24px 60px rgba(0,0,0,0.28)',
              }}
              onClick={e => e.stopPropagation()}
              initial={{ y: 56, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              transition={{ duration: 0.34, ease: [0.34, 1.26, 0.64, 1] }}
            >
              {/* Drag handle */}
              <div className="sticky top-0 flex justify-center pt-3 pb-2 z-10"
                style={{ background: 'var(--surface-raised)' }}>
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(200,146,74,0.30)' }} />
              </div>

              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-1 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl" aria-hidden="true">{_activeStory.emoji}</span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: 'var(--brand-primary)', marginBottom: '2px' }}>
                      {_activeDays === 0 ? 'Today' : `In ${_activeDays} day${_activeDays === 1 ? '' : 's'}`}
                    </p>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-cream)', lineHeight: 1.2 }}>
                      {activeStoryFestival.name}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStoryFestival(null)}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: 'rgba(200,146,74,0.10)' }}
                  aria-label="Close"
                >
                  <X size={16} style={{ color: 'var(--text-muted-warm)' }} />
                </button>
              </div>

              <div className="px-6 space-y-6 pb-4">
                {/* Origin */}
                <section>
                  <h3 className="festival-story-section-label">Origin</h3>
                  <p className="festival-story-prose">{_activeStory.origin}</p>
                </section>

                {/* Significance */}
                <section>
                  <h3 className="festival-story-section-label">Spiritual Significance</h3>
                  <p className="festival-story-prose">{_activeStory.significance}</p>
                </section>

                {/* Shloka block */}
                <section
                  className="rounded-[1.4rem] p-5"
                  style={{ background: 'rgba(200,146,74,0.09)', border: '1px solid rgba(200,146,74,0.18)' }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-3"
                    style={{ color: 'var(--brand-primary)' }}>
                    Sacred Verse
                  </p>
                  <p className="festival-story-verse">{_activeStory.shloka.text}</p>
                  {getTransliteration(_activeStory.shloka.text, _activeStory.shloka.transliteration || '', transliterationLanguage ?? 'en') !== _activeStory.shloka.text && (
                    <p className="festival-story-transliteration">
                      {getTransliteration(_activeStory.shloka.text, _activeStory.shloka.transliteration || '', transliterationLanguage ?? 'en')}
                    </p>
                  )}
                  <p className="festival-story-prose mt-3 italic">&ldquo;{_activeStory.shloka.translation}&rdquo;</p>
                  <p className="text-[10px] mt-2" style={{ color: 'var(--text-dim)' }}>
                    — {_activeStory.shloka.source}
                  </p>
                </section>

                {/* Rituals */}
                <section>
                  <h3 className="festival-story-section-label">How to Observe</h3>
                  <ul className="space-y-2 mt-1">
                    {_activeStory.rituals.map((ritual, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span style={{ color: 'var(--brand-primary)', fontSize: '0.8rem', marginTop: '2px' }}>🪔</span>
                        <p className="festival-story-prose" style={{ margin: 0 }}>{ritual}</p>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Practice CTA */}
                <section
                  className="rounded-[1.4rem] p-5"
                  style={{ background: 'rgba(212,120,74,0.10)', border: '1px solid rgba(212,120,74,0.20)' }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-2"
                    style={{ color: 'var(--brand-primary-strong)' }}>
                    Your Practice Today
                  </p>
                  <p className="festival-story-prose">{_activeStory.practice}</p>
                </section>
              </div>
            </motion.div>
          </motion.div>
          ) : null;
        })()}
      </AnimatePresence>

      {/* ── Daily Quiz Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isQuizModalOpen && quiz && quiz !== 'loading' && quiz !== 'error' && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            onClick={() => setQuizModalOpen(false)}
          >
            <motion.div
              className="relative w-full max-h-[90dvh] rounded-t-[2.5rem] overflow-y-auto"
              style={{
                background: 'linear-gradient(180deg, var(--surface-raised) 0%, var(--card-bg) 100%)',
                borderTop: '1px solid rgba(200, 146, 74, 0.25)',
                boxShadow: '0 -24px 64px rgba(0,0,0,0.4)',
              }}
              onClick={e => e.stopPropagation()}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Handle */}
              <div className="sticky top-0 z-20 flex justify-center pt-3 pb-2 bg-inherit">
                <div className="w-12 h-1.5 rounded-full bg-[rgba(200,146,74,0.2)]" />
              </div>

              <div className="px-7 pt-2 pb-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
                      {tradition ? `${tradition} Spark` : 'Daily Spark'}
                    </span>
                    <h2 className="text-2xl font-bold theme-ink font-serif mt-1">Do You Know?</h2>
                  </div>
                  <button
                    onClick={() => setQuizModalOpen(false)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5"
                  >
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-8">
                  <p className="text-xl font-medium leading-tight theme-ink">{quiz.question}</p>

                  {/* Type: Fact */}
                  {quiz.type === 'fact' && (
                    <div className="space-y-6">
                      <div className="p-6 rounded-3xl bg-[rgba(200,146,74,0.06)] border border-[rgba(200,146,74,0.12)]">
                        <p className="text-base leading-relaxed theme-ink">{quiz.fact}</p>
                      </div>
                      <p className="text-[11px] uppercase tracking-widest text-center opacity-40">Source: {quiz.source}</p>
                    </div>
                  )}

                  {/* Type: Quiz */}
                  {quiz.type === 'quiz' && (
                    <div className="space-y-4">
                      {quiz.options?.map((opt, i) => {
                        const isAnswered = quizAnswered !== null;
                        const isChosen = quizAnswered === i;
                        const isCorrect = i === quiz.answerIndex;
                        const showResult = isAnswered && (isChosen || isCorrect);

                        return (
                          <button
                            key={i}
                            disabled={isAnswered}
                            onClick={() => handleQuizAnswer(i)}
                            className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all border text-left
                              ${!isAnswered ? 'bg-[var(--surface-soft)] border-black/5 hover:border-[var(--brand-primary)]/30' : ''}
                              ${isAnswered && isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : ''}
                              ${isAnswered && isChosen && !isCorrect ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' : ''}
                              ${isAnswered && !isChosen && !isCorrect ? 'opacity-40 grayscale-[0.5]' : ''}
                            `}
                          >
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border
                              ${!isAnswered ? 'bg-white/50 dark:bg-black/20 border-black/5' : ''}
                              ${isAnswered && isCorrect ? 'bg-emerald-500 text-white border-emerald-500' : ''}
                              ${isAnswered && isChosen && !isCorrect ? 'bg-rose-500 text-white border-rose-500' : ''}
                            `}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1 font-medium">{opt}</span>
                            {isAnswered && isCorrect && <span className="text-xl">✓</span>}
                            {isAnswered && isChosen && !isCorrect && <span className="text-xl">✗</span>}
                          </button>
                        );
                      })}

                      {quizAnswered !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-8 p-6 rounded-3xl bg-[var(--surface-soft)] border border-black/5"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-primary)] block mb-3">
                            The Wisdom Behind
                          </span>
                          <p className="text-sm leading-relaxed theme-ink opacity-90">{quiz.explanation}</p>
                          <p className="text-[11px] opacity-40 mt-6 uppercase tracking-widest">Source: {quiz.source}</p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                {quizAnswered !== null && (
                   <div className="mt-12 text-center">
                      <p className="text-xs text-muted-foreground">
                        Wisdom grows when shared. Come back tomorrow for a new spark.
                      </p>
                   </div>
                )}
              </div>
            </motion.div>
          </motion.div>
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
