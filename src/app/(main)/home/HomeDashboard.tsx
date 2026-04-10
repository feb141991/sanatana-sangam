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
import { buildPersonalizedPaths } from '@/lib/seeking-paths';
import type { GuidedPathProgressRow, GuidedPathStatus } from '@/lib/guided-paths';
import { buildGuidedPathStatusMap } from '@/lib/guided-paths';
import { useLocation } from '@/lib/LocationContext';
import { createClient } from '@/lib/supabase';
import { APP } from '@/lib/config';
import { MotionItem, MotionStagger } from '@/components/motion/MotionPrimitives';

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
  accentStrong: string;
}

interface HomeFeatureItem {
  label: string;
  icon: string;
  href: string;
  desc: string;
  eyebrow: string;
  theme: keyof typeof HOME_THEMES;
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
  customGreeting:    string | null;
  guidedPathProgress: GuidedPathProgressRow[];
  showFirstTimeGuidance: boolean;
}

const quickAccessItems: HomeFeatureItem[] = [
  { label: 'Tirtha', icon: '🛕', href: '/tirtha-map', desc: 'Find sacred places near you', eyebrow: 'Go Out', theme: 'tirtha' },
  { label: 'Mandali', icon: '🏡', href: '/mandali', desc: 'Your local sangam', eyebrow: 'People', theme: 'mandali' },
  { label: 'Kul', icon: '❤️', href: '/kul', desc: 'Family sadhana together', eyebrow: 'Family', theme: 'kul' },
  { label: 'Pathshala', icon: '📖', href: '/library', desc: 'Tradition-first study tracks', eyebrow: 'Study', theme: 'pathshala' },
  { label: 'Bhakti', icon: '✨', href: '/bhakti', desc: 'Enter Zen or Mala with fewer distractions', eyebrow: 'Practice', theme: 'bhakti' },
];

const HOME_THEMES: Record<string, FeatureTheme> = {
  panchang: {
    surface: 'linear-gradient(135deg, #f8efe7 0%, #fffdfa 100%)',
    border: 'rgba(124, 58, 45, 0.16)',
    iconWell: 'rgba(124, 58, 45, 0.1)',
    accent: 'var(--brand-primary)',
    accentStrong: 'var(--brand-primary-strong)',
  },
  pathshala: {
    surface: 'linear-gradient(135deg, #f6f0e7 0%, #fffdfa 100%)',
    border: 'rgba(138, 106, 47, 0.16)',
    iconWell: 'rgba(138, 106, 47, 0.1)',
    accent: '#8a6a2f',
    accentStrong: '#6f5421',
  },
  bhakti: {
    surface: 'linear-gradient(135deg, #f4ece6 0%, #fffdfb 100%)',
    border: 'rgba(124, 58, 45, 0.14)',
    iconWell: 'rgba(124, 58, 45, 0.08)',
    accent: 'var(--brand-primary)',
    accentStrong: 'var(--brand-primary-strong)',
  },
  kul: {
    surface: 'linear-gradient(135deg, #eef2ef 0%, #ffffff 100%)',
    border: 'rgba(107, 138, 122, 0.18)',
    iconWell: 'rgba(107, 138, 122, 0.1)',
    accent: 'var(--brand-secondary)',
    accentStrong: '#557060',
  },
  mandali: {
    surface: 'linear-gradient(135deg, #f3efea 0%, #ffffff 100%)',
    border: 'rgba(107, 90, 77, 0.16)',
    iconWell: 'rgba(107, 90, 77, 0.1)',
    accent: 'var(--brand-earth)',
    accentStrong: '#56493f',
  },
  tirtha: {
    surface: 'linear-gradient(135deg, #f3eee7 0%, #fffdf9 100%)',
    border: 'rgba(111, 84, 33, 0.16)',
    iconWell: 'rgba(111, 84, 33, 0.1)',
    accent: '#7a5e2a',
    accentStrong: '#604a22',
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
        className="w-full bg-white rounded-t-3xl shadow-2xl p-6 space-y-5"
        onClick={e => e.stopPropagation()}
        initial={prefersReducedMotion ? undefined : { y: 28, opacity: 0.96 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { y: 18, opacity: 0.98 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-gray-900">Invite Friends & Family</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed">
          Share Sanatana Sangam with your family and friends. They can use your invite code while joining.
        </p>

        {/* Invite code display */}
        <div
          className="rounded-2xl p-5 text-center border"
          style={{
            background: 'linear-gradient(135deg, rgba(243, 231, 226, 0.72), rgba(255, 255, 255, 0.96))',
            borderColor: 'rgba(124, 58, 45, 0.12)',
          }}
        >
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Your Invite Code</p>
          <p className="font-display font-bold text-3xl tracking-widest" style={{ color: 'var(--brand-primary-strong)' }}>{code}</p>
          <p className="text-xs text-gray-400 mt-2">{link}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={share}
            className="py-3 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}>
            Share 🙏
          </button>
          <button onClick={async () => {
            await navigator.clipboard.writeText(code);
            toast.success('Code copied!');
          }}
            className="py-3 font-semibold rounded-xl border transition text-sm"
            style={{
              color: 'var(--brand-primary)',
              borderColor: 'rgba(124, 58, 45, 0.18)',
              background: 'rgba(255,255,255,0.88)',
            }}>
            Copy Code
          </button>
        </div>

        <p className="text-xs text-center text-gray-400">
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
        className="relative w-80 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        initial={prefersReducedMotion ? undefined : { y: 16, opacity: 0.98, scale: 0.99 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1, scale: 1 }}
        exit={prefersReducedMotion ? undefined : { y: 12, opacity: 0.98, scale: 0.99 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <button onClick={() => setViewDate(v => subMonths(v, 1))}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <button onClick={() => setShowYearPicker(v => !v)}
            className="flex items-center gap-1 font-bold text-gray-900 text-base">
            {fmtDate(viewDate, 'MMMM yyyy')}
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          <button onClick={() => setViewDate(v => addMonths(v, 1))}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Calendar content — naturally sized, no overflow needed */}
        {showYearPicker ? (
          <div className="grid grid-cols-4 gap-2 p-4">
            {years.map(y => (
              <button key={y}
                onClick={() => { setViewDate(d => new Date(y, d.getMonth(), 1)); setShowYearPicker(false); }}
                className="py-2 rounded-xl text-xs font-medium transition"
                style={y === viewDate.getFullYear()
                  ? { background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: 'white' }
                  : { background: '#f9fafb', color: '#374151' }}>
                {y}
              </button>
            ))}
          </div>
        ) : (
          <div className="px-3 pt-2 pb-4">
            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map(d => (
                <div key={d} className="text-center text-[10px] text-gray-400 font-medium py-1">{d}</div>
              ))}
            </div>
            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {calDays.map(day => {
                const inMonth    = isSameMonth(day, viewDate);
                const isSelected = isSameDay(day, selectedDate);
                const isToday    = isDayToday(day);
                return (
                  <button key={day.toString()}
                    onClick={() => { onSelect(day); onClose(); }}
                    className="h-8 w-8 mx-auto rounded-full text-xs flex items-center justify-center transition active:scale-95"
                    style={
                      isSelected ? { background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: 'white', fontWeight: 700 } :
                      isToday    ? { border: '1.5px solid var(--brand-primary)', color: 'var(--brand-primary)', fontWeight: 700 } :
                      !inMonth   ? { color: '#d1d5db' } :
                                   { color: '#1f2937' }
                    }>
                    {fmtDate(day, 'd')}
                  </button>
                );
              })}
            </div>
            {/* Jump to today */}
            <div className="mt-3 flex justify-center">
          <button onClick={() => { onSelect(new Date()); onClose(); }}
            className="text-xs px-5 py-1.5 rounded-full border border-gray-200 text-gray-500 transition font-medium"
            style={{ borderColor: 'rgba(124, 58, 45, 0.16)', color: 'var(--brand-primary)' }}>
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
            <div className="sticky top-0 z-10 bg-white/88 backdrop-blur px-5 py-4 border-b border-white/60 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-gray-900 text-lg">Choose your greeting</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Suggested for {pathLabel}. You can stay on auto or save a personal greeting.
                </p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center hover:bg-white transition">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="clay-card rounded-[1.6rem] p-4">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  {previewTone}
                </p>
                <p className="font-display text-xl font-bold text-gray-900 mt-1">{previewGreeting}</p>
                <p className="text-xs text-gray-500 mt-1">This is what will appear in your home greeting.</p>
              </div>

              <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
                <button
                  onClick={() => { setSelected(null); setCustom(''); }}
                  className={`w-full text-left px-4 py-3 rounded-2xl border text-sm transition ${
                    selected === null
                      ? 'font-medium'
                      : 'border-gray-100 text-gray-600 hover:border-[#d0a15a]/40'
                  }`}
                  style={selected === null ? {
                    borderColor: 'var(--brand-primary)',
                    background: 'var(--brand-primary-soft)',
                    color: 'var(--brand-primary-strong)',
                  } : undefined}
                >
                  <span className="block font-semibold">✨ Auto</span>
                  <span className="block text-xs mt-0.5 text-gray-500">Rotate a suggested greeting from your tradition.</span>
                </button>

                <div className="pt-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-2">
                    Suggested for {pathLabel}
                  </p>
                  <div className="space-y-2">
                    {pool.map((g) => (
                      <button
                        key={g}
                        onClick={() => { setSelected(g); setCustom(''); }}
                        className={`w-full text-left px-4 py-3 rounded-2xl border text-sm transition ${
                          selected === g
                            ? 'font-medium'
                            : 'border-gray-100 text-gray-700 hover:border-[#d0a15a]/40'
                        }`}
                        style={selected === g ? {
                          borderColor: 'var(--brand-primary)',
                          background: 'var(--brand-primary-soft)',
                          color: 'var(--brand-primary-strong)',
                        } : undefined}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1.5">Or write your own greeting:</p>
                <input
                  type="text"
                  placeholder="e.g. Jai Mahakal! 🔱"
                  value={custom}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setCustom(nextValue);
                    setSelected(nextValue.trim() || null);
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[color:var(--brand-primary)] outline-none text-sm"
                />
              </div>

              <button
                onClick={() => { onSave(selected); onClose(); }}
                className="glass-button-primary w-full py-3 text-white font-semibold rounded-2xl hover:opacity-90 transition"
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
        className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        initial={prefersReducedMotion ? undefined : { y: 26, opacity: 0.98 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { y: 18, opacity: 0.98 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} style={{ color: 'var(--brand-primary)' }} />
            <div>
              <h2 className="font-display font-bold text-gray-900 text-base">Parva Calendar</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">{calendarMeta.label} · {calendarMeta.coverage}</p>
            </div>
            {onDateSelect && <span className="text-xs ml-1" style={{ color: 'var(--brand-primary)' }}>tap date → view Panchang</span>}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 pb-8">
          <div className="rounded-2xl border px-3 py-2.5 text-xs leading-relaxed text-gray-600" style={{ background: 'rgba(223, 156, 171, 0.09)', borderColor: 'rgba(223, 156, 171, 0.2)' }}>
            <span className="font-semibold text-gray-800">Calendar note:</span> {calendarMeta.sourceNote}
          </div>
          {upcoming.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-1">Upcoming</p>
              {upcoming.map(f => {
                const days = daysFromNow(f.date);
                return (
                  <div key={f.name + f.date}
                    onClick={() => { if (onDateSelect) { onDateSelect(new Date(f.date + 'T00:00:00')); onClose(); } }}
                    className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3 transition cursor-pointer active:scale-95">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: 'rgba(124, 58, 45, 0.08)' }}>
                      {f.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 leading-tight">{f.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatFestDate(f.date)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {days === 0 ? (
                        <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ background: 'var(--brand-primary)' }}>Today</span>
                      ) : days === 1 ? (
                        <span className="text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>Tomorrow</span>
                      ) : (
                        <span className="text-xs text-gray-400">{days}d</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {past.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">Past</p>
              {past.map(f => (
                <div key={f.name + f.date}
                  className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3 opacity-60">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gray-100">{f.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-600 leading-tight">{f.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatFestDate(f.date)}</p>
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
  customGreeting,
  guidedPathProgress,
  showFirstTimeGuidance,
}: Props) {
  const supabase = createClient();
  const router   = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const shlokaRef = useRef<HTMLDivElement | null>(null);
  const festivalsRef = useRef<HTMLDivElement | null>(null);

  const [shlokaExpanded,    setShlokaExpanded]    = useState(false);
  const [panchang,          setPanchang]          = useState<Panchang>(initialPanchang);
  const [calendarOpen,      setCalendarOpen]      = useState(false);
  const [datePickerOpen,    setDatePickerOpen]    = useState(false);
  const [greetingSheetOpen, setGreetingSheetOpen] = useState(false);
  const [inviteOpen,        setInviteOpen]        = useState(false);
  const [localGreeting,     setLocalGreeting]     = useState<string | null>(customGreeting);
  const [guidedPathStatusMap, setGuidedPathStatusMap] = useState<Record<string, GuidedPathStatus>>(
    () => buildGuidedPathStatusMap(guidedPathProgress)
  );
  const [guidedPathBusyId, setGuidedPathBusyId] = useState<string | null>(null);
  const [streak,           setStreak]           = useState(initialStreak);
  const [selectedDate,     setSelectedDate]     = useState<Date>(new Date());
  const [readToday,        setReadToday]        = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return lastShlokaDate === today;
  });

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

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (!focus) return;

    const timer = window.setTimeout(() => {
      if (focus === 'shloka') {
        setShlokaExpanded(true);
        shlokaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const personalizedPaths = buildPersonalizedPaths({
    seeking,
    spiritualLevel,
    city: displayCity || null,
  });
  const visiblePersonalizedPaths = personalizedPaths.filter((path) => {
    const status = guidedPathStatusMap[path.id];
    return status !== 'dismissed' && status !== 'completed';
  });
  const hiddenPersonalizedCount = personalizedPaths.length - visiblePersonalizedPaths.length;
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

  async function updateGuidedPath(pathId: string, status: GuidedPathStatus) {
    const previousState = { ...guidedPathStatusMap };
    const now = new Date().toISOString();

    setGuidedPathBusyId(pathId);
    setGuidedPathStatusMap((current) => ({ ...current, [pathId]: status }));

    const { error } = await supabase
      .from('guided_path_progress')
      .upsert({
        user_id: userId,
        path_id: pathId,
        status,
        updated_at: now,
        last_interacted_at: now,
        completed_at: status === 'completed' ? now : null,
      }, {
        onConflict: 'user_id,path_id',
      });

    setGuidedPathBusyId(null);

    if (error) {
      setGuidedPathStatusMap(previousState);
      toast.error(error.message);
      return;
    }

    toast.success(status === 'completed' ? 'Path marked complete.' : 'Path hidden for now.');
  }

  async function resetGuidedPaths() {
    const pathIds = personalizedPaths.map((path) => path.id);
    if (pathIds.length === 0) return;

    setGuidedPathBusyId('reset-all');
    const previousState = { ...guidedPathStatusMap };
    setGuidedPathStatusMap({});

    const { error } = await supabase
      .from('guided_path_progress')
      .delete()
      .eq('user_id', userId)
      .in('path_id', pathIds);

    setGuidedPathBusyId(null);

    if (error) {
      setGuidedPathStatusMap(previousState);
      toast.error(error.message);
      return;
    }

    toast.success('Guided paths restored.');
  }

  // ── Shloka streak ──────────────────────────────────────────────────────────
  async function markShlokaRead() {
    if (readToday || !userId) return;
    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

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

    toast.success(`🔥 ${newStreak}-day streak! +5 seva points`);
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

  const homeHeroTheme = HOME_THEMES.pathshala;
  const panchangTheme = HOME_THEMES.panchang;
  const sacredTextTheme = tradition === 'hindu' ? HOME_THEMES.pathshala : HOME_THEMES.bhakti;
  const heroPrimaryCards = quickAccessItems.slice(0, 3);
  const heroSecondaryCards = quickAccessItems.slice(3);

  return (
    <div className="space-y-5 pb-2 fade-in">
      <div
        className="relative overflow-hidden rounded-[2rem] border px-4 py-5 sm:px-5 sm:py-6"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(246,240,231,0.95) 48%, rgba(255,255,255,0.98) 100%)',
          borderColor: homeHeroTheme.border,
          boxShadow: '0 22px 46px rgba(28, 26, 23, 0.08)',
        }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          initial={prefersReducedMotion ? undefined : { opacity: 0.64, scale: 1.04 }}
          animate={prefersReducedMotion ? undefined : { opacity: [0.62, 0.78, 0.62], scale: [1.04, 1.08, 1.04] }}
          transition={prefersReducedMotion ? undefined : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(circle at 24% 10%, rgba(138, 106, 47, 0.14), transparent 34%), radial-gradient(circle at 78% 14%, rgba(124, 58, 45, 0.12), transparent 32%)',
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-10 top-4 h-36 w-36 rounded-full blur-3xl"
          initial={prefersReducedMotion ? undefined : { opacity: 0.24, y: 0 }}
          animate={prefersReducedMotion ? undefined : { opacity: [0.18, 0.32, 0.18], y: [0, 8, 0] }}
          transition={prefersReducedMotion ? undefined : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'rgba(124, 58, 45, 0.16)' }}
        />

        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.24em] font-semibold" style={{ color: homeHeroTheme.accent }}>
            Sanatana Sangam
          </p>
          <button
            onClick={() => setGreetingSheetOpen(true)}
            className="group mt-1 -ml-1 rounded-2xl px-1 py-1 flex items-center gap-1.5 text-left transition"
          >
            <h1 className="font-display text-[1.68rem] sm:text-[1.98rem] font-bold text-gray-900 leading-[1.02]">
              {greeting}, {userName.split(' ')[0]}!
            </h1>
            <Pencil size={13} className="text-gray-300 group-hover:text-[color:var(--brand-primary)] transition flex-shrink-0 mt-1" />
          </button>
          <p className="mt-2 max-w-[38rem] text-sm text-gray-600 leading-relaxed">
            Open the day through sacred time, study, practice, family, and community without the dashboard clutter.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: homeHeroTheme.iconWell, color: homeHeroTheme.accentStrong }}
            >
              Today
            </span>
            {displayCity && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-white/90 text-gray-600 border border-black/5">
                <MapPin size={12} style={{ color: homeHeroTheme.accent }} />
                {displayCity}
                {coords && <span className="text-[10px] text-gray-400">live</span>}
              </span>
            )}
            <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium bg-white/90 text-gray-500 border border-black/5">
              {showFirstTimeGuidance ? greetingMode : 'Calm return loop'}
            </span>
          </div>

          <MotionStagger className="mt-5 grid gap-3 sm:grid-cols-3" delay={0.05}>
            {heroPrimaryCards.map((item) => {
              const theme = HOME_THEMES[item.theme];
              return (
                <MotionItem key={item.href}>
                  <Link
                    href={item.href}
                    className="group relative overflow-hidden rounded-[1.45rem] border px-4 py-4 transition"
                    style={{
                      background: theme.surface,
                      borderColor: theme.border,
                      boxShadow: '0 14px 28px rgba(28, 26, 23, 0.06)',
                    }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-14 opacity-80"
                      style={{ background: `linear-gradient(180deg, ${theme.iconWell}, transparent)` }}
                    />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: theme.accent }}>
                          {item.eyebrow}
                        </span>
                        <span className="flex h-10 w-10 items-center justify-center rounded-[1rem] text-lg" style={{ background: theme.iconWell }}>
                          {item.icon}
                        </span>
                      </div>
                      <p className="mt-5 text-base font-semibold leading-tight" style={{ color: theme.accentStrong }}>
                        {item.label}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                </MotionItem>
              );
            })}
          </MotionStagger>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-5">
          <div
            className="rounded-[1.95rem] overflow-hidden border shadow-sm"
            style={{ background: panchangTheme.surface, borderColor: panchangTheme.border, boxShadow: '0 20px 40px rgba(28, 26, 23, 0.07)' }}
          >
            <div className="px-4 pt-4 pb-3 flex items-center gap-2">
              <span className="text-base">🪔</span>
              <span className="text-[11px] font-medium tracking-[0.16em] uppercase" style={{ color: panchangTheme.accent }}>
                {isToday ? 'Aaj Ka Panchang' : 'Panchang'}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => navigateDay(-1)} className="w-7 h-7 rounded-full flex items-center justify-center transition" style={{ background: panchangTheme.iconWell }}>
                  <ChevronLeft size={14} color={panchangTheme.accentStrong} />
                </button>
                <button onClick={() => setDatePickerOpen(true)} className="text-xs min-w-[92px] text-center font-medium transition underline-offset-2 hover:underline" style={{ color: panchangTheme.accentStrong }}>
                  {isToday ? 'Today' : selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </button>
                <button onClick={() => navigateDay(1)} className="w-7 h-7 rounded-full flex items-center justify-center transition" style={{ background: panchangTheme.iconWell }}>
                  <ChevronRight size={14} color={panchangTheme.accentStrong} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 px-4">
              {[
                { label: 'Tithi', value: panchang.tithi },
                { label: 'Nakshatra', value: panchang.nakshatra },
                { label: 'Yoga', value: panchang.yoga },
                { label: 'Rahu Kaal', value: panchang.rahuKaal },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.2rem] border px-3 py-3"
                  style={{ background: 'rgba(255,255,255,0.72)', borderColor: panchangTheme.border }}
                >
                  <p className="text-[10px] uppercase tracking-[0.14em] text-gray-400 font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold leading-snug" style={{ color: panchangTheme.accentStrong }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mx-4 mt-3 rounded-[1.3rem] border px-3 py-3 flex items-center justify-between gap-3" style={{ background: 'rgba(255,255,255,0.7)', borderColor: panchangTheme.border }}>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-gray-400 font-semibold">Day flow</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: panchangTheme.accentStrong }}>
                  {panchang.sunrise} to {panchang.sunset}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/panchang" className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition" style={{ background: panchangTheme.iconWell, color: panchangTheme.accentStrong }}>
                  <CalendarDays size={12} /> Open
                </Link>
                <button onClick={sharePanchang} className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ background: panchangTheme.iconWell }} title="Share Panchang">
                  <Share2 size={13} color={panchangTheme.accentStrong} />
                </button>
              </div>
            </div>

            <div className="px-4 py-4 text-[11px] text-gray-500 leading-relaxed">
              {PANCHANG_TRUST_META.precisionLabel}. {PANCHANG_TRUST_META.guidanceNote}
            </div>
          </div>

          <div
            ref={shlokaRef}
            className="rounded-[1.9rem] border p-4"
            style={{
              borderColor: sacredTextTheme.border,
              background: sacredTextTheme.surface,
              boxShadow: '0 18px 34px rgba(28, 26, 23, 0.05)',
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: sacredTextTheme.accent }}>
                  Daily Reading
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg">{sacredTextMeta.icon}</span>
                  <span className="font-display font-semibold text-gray-900 text-base">{sacredTextMeta.label}</span>
                  {streak > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full border" style={{ color: 'var(--brand-primary)', background: 'var(--brand-primary-soft)', borderColor: 'rgba(124, 58, 45, 0.12)' }}>
                      🔥 {streak}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={shareShloka} className="w-8 h-8 rounded-full border flex items-center justify-center hover:opacity-80 transition" style={{ background: sacredTextMeta.accentLight, borderColor: sacredTextTheme.border }} title={`Share ${sacredTextMeta.shareLabel}`}>
                <Share2 size={13} style={{ color: sacredTextMeta.accentColour }} />
              </button>
            </div>

            <p className="font-devanagari leading-relaxed text-base mb-2 whitespace-pre-line" style={{ color: sacredTextMeta.accentColour }}>
              {sacredText ? sacredText.original : shloka.sanskrit}
            </p>
            <p className="text-sm text-gray-500 italic leading-relaxed mb-3 whitespace-pre-line">
              {sacredText ? sacredText.transliteration : shloka.transliteration}
            </p>

            <div className="flex items-center justify-between gap-3">
              <button onClick={() => setShlokaExpanded(!shlokaExpanded)} className="flex items-center gap-1 text-xs font-medium" style={{ color: sacredTextMeta.accentColour }}>
                {shlokaExpanded ? 'Hide meaning' : 'Show meaning'}
                {shlokaExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              <button
                onClick={markShlokaRead}
                disabled={readToday}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${readToday ? 'cursor-default' : 'text-white hover:opacity-90'}`}
                style={readToday
                  ? { background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)', border: '1px solid rgba(124, 58, 45, 0.14)' }
                  : { background: sacredTextMeta.accentColour }}
              >
                {readToday ? '✓ Read today' : `${sacredTextMeta.icon} Mark as read`}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {shlokaExpanded && (
                <motion.div
                  className="mt-3 pt-3 border-t"
                  style={{ borderColor: sacredTextMeta.accentLight }}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, height: 0, y: -6 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, height: 'auto', y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {sacredText ? sacredText.meaning : shloka.meaning}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-5">
          <div
            ref={festivalsRef}
            className="rounded-[1.9rem] border overflow-hidden"
            style={{ background: HOME_THEMES.tirtha.surface, borderColor: HOME_THEMES.tirtha.border, boxShadow: '0 18px 34px rgba(28, 26, 23, 0.05)' }}
          >
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: HOME_THEMES.tirtha.accent }}>
                  Festival Window
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900">Coming up</p>
              </div>
              <button onClick={() => setCalendarOpen(true)} className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: HOME_THEMES.tirtha.accentStrong }}>
                <CalendarDays size={11} /> All Festivals
              </button>
            </div>
            {festival && daysUntilFestival !== null ? (
              <div className="px-4 pb-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-[1rem] flex items-center justify-center text-2xl" style={{ background: HOME_THEMES.tirtha.iconWell }}>
                  {festival.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-gray-900 text-base leading-tight">{festival.name}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{festival.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-2xl" style={{ color: HOME_THEMES.tirtha.accentStrong }}>
                    {daysUntilFestival === 0 ? '🎉' : daysUntilFestival}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {daysUntilFestival === 0 ? 'Today' : daysUntilFestival === 1 ? 'Tomorrow' : 'days'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 pb-4 text-sm text-gray-500">
                Open the Parva calendar to browse upcoming observances.
              </div>
            )}
            <div className="px-4 pb-4 text-[11px] text-gray-500 leading-relaxed">
              {festivalCalendarMeta.sourceNote}
            </div>
          </div>

          <div className="rounded-[1.9rem] border p-4" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7f4ef 100%)', borderColor: 'rgba(17, 24, 39, 0.08)', boxShadow: '0 18px 34px rgba(28, 26, 23, 0.05)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-gray-400">MVPs</p>
                <p className="mt-1 text-base font-semibold text-gray-900">Go deeper</p>
              </div>
            </div>

            <MotionStagger className="grid gap-3" delay={0.06}>
              {heroSecondaryCards.map((item) => {
                const theme = HOME_THEMES[item.theme];
                return (
                  <MotionItem key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-3 rounded-[1.35rem] border px-3.5 py-3.5 transition"
                      style={{ background: theme.surface, borderColor: theme.border }}
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] text-xl" style={{ background: theme.iconWell }}>
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: theme.accent }}>{item.eyebrow}</p>
                        <p className="mt-1 text-sm font-semibold leading-tight" style={{ color: theme.accentStrong }}>{item.label}</p>
                        <p className="mt-1 text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </Link>
                  </MotionItem>
                );
              })}
            </MotionStagger>
          </div>
        </div>
      </div>

      {showFirstTimeGuidance && personalizedPaths.length > 0 && (
        <section className="space-y-2">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Start here</p>
            <p className="text-sm text-gray-600 mt-0.5">
              These first steps are based on what you chose during signup. Once you settle in, Home stays lighter and the rest can come through reminders.
            </p>
          </div>

          {visiblePersonalizedPaths.length > 0 ? (
            <MotionStagger className="grid gap-3" delay={0.04}>
              {visiblePersonalizedPaths.map((path) => (
                <MotionItem key={path.id}>
                  <div className={`clay-card ${path.accentClass} rounded-[1.8rem] p-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-primary)' }}>
                          {path.eyebrow}
                        </p>
                        <h2 className="font-display text-lg font-bold text-gray-900 mt-1">{path.title}</h2>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {path.badges.map((badge) => (
                          <span key={badge} className="clay-pill text-[11px] font-medium" style={{ color: 'var(--brand-primary)' }}>
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed mt-2">{path.description}</p>

                    <div className="grid gap-2 sm:grid-cols-2 mt-4">
                      {path.actions.map((action) => (
                        <Link
                          key={`${path.id}-${action.href}`}
                          href={action.href}
                          className="clay-action rounded-2xl px-4 py-3 flex items-center gap-3 transition hover:-translate-y-0.5"
                        >
                          <span className="clay-icon-well text-base">{action.icon}</span>
                          <span className="text-sm font-semibold text-gray-800">{action.label}</span>
                        </Link>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/55">
                      <p className="text-xs text-gray-500">
                        Keep this visible until you complete it, or hide it for later.
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => updateGuidedPath(path.id, 'dismissed')}
                          disabled={guidedPathBusyId === path.id}
                          className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 border border-white/70 bg-white/55 hover:bg-white transition disabled:opacity-50"
                        >
                          Later
                        </button>
                        <button
                          type="button"
                          onClick={() => updateGuidedPath(path.id, 'completed')}
                          disabled={guidedPathBusyId === path.id}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold text-white glass-button-primary disabled:opacity-50"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </MotionItem>
              ))}
            </MotionStagger>
          ) : (
            <div className="glass-panel rounded-[1.75rem] px-4 py-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Your guided paths are tucked away</p>
                <p className="text-xs text-gray-500 mt-1">
                  {hiddenPersonalizedCount} path{hiddenPersonalizedCount === 1 ? '' : 's'} completed or dismissed. Bring them back anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={resetGuidedPaths}
                disabled={guidedPathBusyId === 'reset-all'}
                className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
                style={{ color: 'var(--brand-primary)' }}
              >
                Show again
              </button>
            </div>
          )}
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/vichaar-sabha"
          className="block rounded-[1.7rem] border p-4 transition-colors"
          style={{ borderColor: HOME_THEMES.pathshala.border, background: HOME_THEMES.pathshala.surface }}>
          <span className="text-lg">💬</span>
          <p className="font-semibold text-sm mt-1" style={{ color: 'var(--brand-primary)' }}>Join the Vichaar Sabha</p>
          <p className="text-xs text-gray-500 mt-0.5">Discuss dharma, share wisdom, ask questions</p>
        </Link>

        <button onClick={() => setInviteOpen(true)}
          className="w-full rounded-[1.7rem] border p-4 text-left transition-colors"
          style={{ borderColor: HOME_THEMES.kul.border, background: HOME_THEMES.kul.surface }}>
          <span className="text-lg">🙏</span>
          <p className="font-semibold text-sm mt-1" style={{ color: 'var(--brand-primary)' }}>Invite Friends & Family</p>
          <p className="text-xs text-gray-500 mt-0.5">Share Sanatana Sangam without leaving the app shell.</p>
        </button>
      </div>

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
