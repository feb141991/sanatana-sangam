'use client';

import { buildShoonayaShareCardData, shareShoonayaShareCard } from '@/lib/share/shoonaya-card-data';
import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { getTraditionMeta } from '@/lib/tradition-config';
import {
  type NityaCardType,
} from '@/lib/share/generate-share-image';
import {
  buildNityaShareCardData,
  shareNityaCardImage,
  type NityaShareStats,
} from '@/lib/share/nitya-card-data';

interface LogRow { log_date: string; step_id: string; created_at: string; }
interface Props  { logs: LogRow[]; tradition: string; userName: string; }

type Filter = '1d' | '7d' | '30d' | '90d';
type Milestone = { at: number; label: string };
type NityaStats = NityaShareStats & {
  activeDays: number;
  totalSteps: number;
  avgPerDay: string;
  completionRate: number;
  streak: number;
  bestStreak: number;
  dow: number[];
  topStep: string | null;
  uniqueSteps: number;
  peakHour: number | null;
  peakHourLabel: string;
  isBrahmaMuhurta: boolean;
  consistencyScore: number;
  bestStep: string | null;
  bestStepLabel: string | null;
  bestStepCount: number;
  weakestStep: string | null;
  weakestStepLabel: string | null;
  weakestStepCount: number;
  fullMorningDays: number;
  fullMorningRate: number;
  thisWeekActive: number;
  lastWeekActive: number;
  weekOverWeekDelta: number;
  longestGap: number;
  milestoneLabel: string;
  nextMilestoneAt: number;
  stepsCompletedToday: number;
};

const FILTERS: { key: Filter; label: string; days: number }[] = [
  { key: '1d',  label: 'Today',   days: 1  },
  { key: '7d',  label: '7 Days',  days: 7  },
  { key: '30d', label: '30 Days', days: 30 },
  { key: '90d', label: '90 Days', days: 90 },
];

const DAY_LABELS = ['S','M','T','W','T','F','S'];
const MORNING_STEP_IDS = new Set([
  'woke_brahma_muhurta',
  'snana_done',
  'tilak_done',
  'sandhya_done',
  'japa_done',
  'aarti_done',
  'shloka_done',
]);

const STEP_LABELS_HUMAN: Record<string, string> = {
  woke_brahma_muhurta: 'Brahma Muhurta',
  snana_done:          'Snana',
  tilak_done:          'Tilak & Sankalpa',
  sandhya_done:        'Vandana',
  japa_done:           'Japa',
  aarti_done:          'Puja & Aarti',
  shloka_done:         'Svadhyaya',
  madhyahn_done:       'Madhyahn Sandhya',
  sandhya_diya_done:   'Sandhya Diya',
  evening_vandana_done:'Evening Vandana',
  svadhyaya_ratri_done:'Ratri Svadhyaya',
  shayana_done:        'Shayana Mantra',
};

const MILESTONES_BY_TRADITION: Record<string, Milestone[]> = {
  hindu: [
    { at: 0, label: 'Seeker' },
    { at: 7, label: 'Shishya' },
    { at: 21, label: 'Sadhu' },
    { at: 40, label: 'Tapasvi' },
    { at: 108, label: 'Rishi' },
  ],
  sikh: [
    { at: 0, label: 'Seeker' },
    { at: 7, label: 'Sewak' },
    { at: 21, label: 'Gurmukh' },
    { at: 40, label: 'Khalsa' },
    { at: 108, label: 'Gursikh' },
  ],
  buddhist: [
    { at: 0, label: 'Seeker' },
    { at: 7, label: 'Kalyana-mitta' },
    { at: 21, label: 'Ariyasavaka' },
    { at: 40, label: 'Sotapanna' },
    { at: 108, label: 'Arahat' },
  ],
  jain: [
    { at: 0, label: 'Seeker' },
    { at: 7, label: 'Shravak' },
    { at: 21, label: 'Muni-path' },
    { at: 40, label: 'Vrati' },
    { at: 108, label: 'Mahasadhak' },
  ],
};

const SHARE_TILES: Array<{
  type: NityaCardType;
  icon: string;
  name: string;
  subtitle: (stats: NityaStats) => string;
  requiresToday?: boolean;
}> = [
  { type: 'streak_milestone', icon: '🔥', name: 'Streak Card', subtitle: (stats) => `Your ${stats.streak}-day streak` },
  { type: 'week_summary', icon: '📅', name: 'Week Summary', subtitle: () => 'This week\'s practice' },
  { type: 'morning_complete', icon: '✅', name: 'This Morning', subtitle: () => 'Today\'s completion', requiresToday: true },
  { type: 'sadhana_quote', icon: '🕉️', name: 'Sacred Quote', subtitle: () => 'Quote + your streak' },
  { type: 'monthly_report', icon: '📊', name: 'Month Report', subtitle: () => 'Full monthly stats' },
];

function formatHourLabel(hour: number | null) {
  if (hour === null) return 'No pattern yet';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

function addDaysIso(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function resolveMilestone(tradition: string, streak: number) {
  const milestones = MILESTONES_BY_TRADITION[tradition] ?? MILESTONES_BY_TRADITION.hindu;
  const current = milestones.reduce((best, item) => item.at <= streak ? item : best, milestones[0]);
  const next = milestones.find((item) => item.at > streak) ?? milestones[milestones.length - 1];
  return { milestoneLabel: current.label, nextMilestoneAt: next.at };
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function DowChart({ data, amber, isDark }: { data: number[]; amber: string; isDark: boolean }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2" style={{ height: 72 }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <motion.div className="w-full rounded-t-md" style={{ background: amber }}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(4, (v / max) * 58)}px` }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} />
          <span className="text-[10px] font-semibold" style={{ color: isDark ? 'rgba(197, 160, 89,0.5)' : 'rgba(100,65,25,0.5)' }}>
            {DAY_LABELS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Stat card (clickable → drilldown) ────────────────────────────────────────
function StatCard({ label, value, sub, icon, detail, isDark, amber }: {
  label: string; value: string; sub: string; icon: string;
  detail?: string; isDark: boolean; amber: string;
}) {
  const [open, setOpen] = useState(false);
  const border = isDark ? 'rgba(197, 160, 89,0.12)' : 'rgba(0,0,0,0.07)';
  const bg     = isDark ? 'var(--card-bg)'          : 'rgba(255,255,255,0.90)';
  const text   = isDark ? 'rgba(245,225,185,0.97)'  : '#1A1208';

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => detail && setOpen(v => !v)}
      className="rounded-2xl p-4 border"
      style={{ background: bg, borderColor: border, boxShadow: isDark ? 'none' : '0 1px 8px rgba(0,0,0,0.06)', cursor: detail ? 'pointer' : 'default' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium mb-1" style={{ color: sub }}>{label}</p>
          <p className="font-bold" style={{ fontSize: '1.55rem', color: text, lineHeight: 1.1, fontFamily: 'var(--font-serif)' }}>{value}</p>
        </div>
        <span className="text-2xl leading-none mt-0.5">{icon}</span>
      </div>
      <AnimatePresence>
        {open && detail && (
          <motion.p
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="text-[11px] mt-3 pt-3 leading-relaxed"
            style={{ color: sub, borderTop: `1px solid ${border}` }}>
            {detail}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Calendar month view ───────────────────────────────────────────────────────
function CalView({ logs, isDark, amber, text, sub, border, bg }: {
  logs: LogRow[]; isDark: boolean; amber: string; text: string; sub: string; border: string; bg: string;
}) {
  const now = new Date();
  const [cal, setCal] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [sel, setSel]  = useState<string | null>(null);

  const dateMap = useMemo(() => {
    const m: Record<string, number> = {};
    logs.forEach(l => { m[l.log_date] = (m[l.log_date] ?? 0) + 1; });
    return m;
  }, [logs]);

  const cells = useMemo(() => {
    const first = new Date(cal.year, cal.month, 1);
    const last  = new Date(cal.year, cal.month + 1, 0);
    const arr: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= last.getDate(); d++) {
      arr.push(`${cal.year}-${String(cal.month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cal]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const label    = new Date(cal.year, cal.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-2xl p-4 border" style={{ background: bg, borderColor: border, boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}>
      {/* Nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCal(c => { const d = new Date(c.year, c.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
          className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
          <ChevronLeft size={16} style={{ color: amber }} />
        </button>
        <p className="text-[13px] font-semibold" style={{ color: text, fontFamily: 'var(--font-serif)' }}>{label}</p>
        <button onClick={() => setCal(c => { const d = new Date(c.year, c.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
          className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
          <ChevronRight size={16} style={{ color: amber }} />
        </button>
      </div>
      {/* DOW */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S','M','T','W','T','F','S'].map((d,i) => (
          <div key={i} className="text-center text-[9px] font-semibold" style={{ color: sub }}>{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} />;
          const count = dateMap[iso] ?? 0;
          const isToday = iso === todayIso;
          const isSel   = iso === sel;
          return (
            <motion.button key={iso} whileTap={{ scale: 0.88 }} onClick={() => setSel(s => s === iso ? null : iso)}
              className="aspect-square rounded-full flex items-center justify-center text-[11px] font-semibold"
              style={{
                background: isSel ? amber : count > 0 ? `${amber}28` : 'transparent',
                color: isSel ? '#1c1208' : count > 0 ? amber : sub,
                border: isToday ? `1.5px solid ${amber}` : '1.5px solid transparent',
              }}>
              {String(new Date(iso + 'T12:00:00').getDate())}
            </motion.button>
          );
        })}
      </div>
      {/* Detail panel */}
      <AnimatePresence>
        {sel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 text-[11.5px]" style={{ borderTop: `1px solid ${border}`, color: sub }}>
            {dateMap[sel]
              ? <span style={{ color: text }}>{dateMap[sel]} step{dateMap[sel] !== 1 ? 's' : ''} completed on {new Date(sel + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} 🌅</span>
              : <span>No steps logged on {new Date(sel + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShareInsightsSheet({
  open,
  onClose,
  stats,
  tradition,
  userName,
  todayTithi,
  month,
}: {
  open: boolean;
  onClose: () => void;
  stats: NityaStats;
  tradition: string;
  userName: string;
  todayTithi?: string;
  month: string;
}) {
  const [generating, setGenerating] = useState<NityaCardType | null>(null);
  if (typeof document === 'undefined') return null;

  const meta = getTraditionMeta(tradition);
  const tiles = SHARE_TILES.filter((tile) => !tile.requiresToday || stats.stepsCompletedToday > 0);
  const [darkStart, darkEnd] = {
    hindu: ['#120600', '#2a0e00'],
    sikh: ['#00061a', '#000f2e'],
    buddhist: ['#1a0008', '#2d0010'],
    jain: ['#0a0a00', '#1a1a00'],
  }[tradition] ?? ['#120600', '#2a0e00'];

  async function handleTile(type: NityaCardType) {
    if (generating) return;
    setGenerating(type);
    try {
      const data = buildNityaShareCardData({ type, stats, tradition, userName, todayTithi, month });
      await shareNityaCardImage({ type, data, fileName: `shoonaya-${type}.png` });
      onClose();
    } catch (err: unknown) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        toast.error('Could not generate card');
      }
    } finally {
      setGenerating(null);
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
            style={{ zIndex: 9998 }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 rounded-t-[2rem] overflow-hidden"
            style={{
              zIndex: 9999,
              background: 'linear-gradient(180deg, rgba(28,26,22,0.99) 0%, rgba(16,14,12,0.99) 100%)',
              border: '1px solid rgba(197, 160, 89,0.16)',
              borderBottom: 'none',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38, mass: 0.9 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(197, 160, 89,0.25)' }} />
            </div>
            <div className="px-5 pt-3 pb-5">
              <div className="mb-5">
                <p className="text-lg font-semibold text-[color:var(--brand-ink)]">Share your practice</p>
                <p className="mt-1 text-xs text-[color:var(--brand-muted)]">Choose a card to generate and share</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {tiles.map((tile, index) => (
                  <button
                    key={tile.type}
                    type="button"
                    onClick={() => handleTile(tile.type)}
                    disabled={Boolean(generating)}
                    className={`h-[120px] rounded-2xl border p-3 text-center transition active:scale-[0.98] ${index === 4 ? 'col-span-2' : ''}`}
                    style={{
                      width: '100%',
                      background: `linear-gradient(135deg, ${darkStart}, ${darkEnd})`,
                      borderColor: `${meta.accentColour}80`,
                      opacity: generating && generating !== tile.type ? 0.55 : 1,
                    }}
                  >
                    <div className="flex h-full flex-col items-center justify-center">
                      <span className="text-[32px] leading-none">{tile.icon}</span>
                      <span className="mt-3 text-xs font-semibold text-[color:var(--brand-ink)]">{tile.name}</span>
                      <span className="mt-1 text-[10px] text-[color:var(--brand-muted)]">{tile.subtitle(stats)}</span>
                    </div>
                  </button>
                ))}
              </div>

              {generating ? (
                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[color:var(--brand-muted)]">
                  <span
                    className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: `${meta.accentColour}80`, borderTopColor: 'transparent' }}
                  />
                  Crafting your card…
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function NityaInsightsClient({ logs, tradition, userName }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const amber  = '#C5A059';
  const green  = '#6BAE75';
  const text   = isDark ? 'rgba(245,225,185,0.97)' : '#1A1208';
  const sub    = isDark ? 'rgba(200,165,110,0.55)'  : 'rgba(100,65,25,0.55)';
  const border = isDark ? 'rgba(197, 160, 89,0.12)'   : 'rgba(0,0,0,0.07)';
  const bg     = isDark ? 'var(--card-bg)'           : 'rgba(255,255,255,0.90)';
  const pageBg = isDark ? '#120d07'                  : '#fdf6ec';

  const [filter, setFilter] = useState<Filter>('30d');
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [quickGenerating, setQuickGenerating] = useState<NityaCardType | null>(null);
  const days = FILTERS.find(f => f.key === filter)!.days;
  const month = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const cutoff = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - days + 1);
    return d.toISOString().slice(0, 10);
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => logs.filter(l => l.log_date >= cutoff), [logs, cutoff]);

  const stats = useMemo(() => {
    const byDate: Record<string, number> = {};
    const morningStepsByDate: Record<string, Set<string>> = {};
    const hourFreq: Record<number, number> = {};
    filtered.forEach(l => {
      byDate[l.log_date] = (byDate[l.log_date] ?? 0) + 1;
      if (MORNING_STEP_IDS.has(l.step_id)) {
        if (!morningStepsByDate[l.log_date]) morningStepsByDate[l.log_date] = new Set<string>();
        morningStepsByDate[l.log_date].add(l.step_id);
      }
      const created = new Date(l.created_at);
      if (!Number.isNaN(created.getTime())) {
        const hour = created.getHours();
        hourFreq[hour] = (hourFreq[hour] ?? 0) + 1;
      }
    });
    const dates       = Object.keys(byDate).sort();
    const activeDays  = dates.length;
    const totalSteps  = filtered.length;
    const avgPerDay   = activeDays > 0 ? (totalSteps / activeDays).toFixed(1) : '0';
    const completionRate = days > 0 ? Math.round((activeDays / days) * 100) : 0;
    const periodStart = cutoff;
    const periodDates = Array.from({ length: days }, (_, index) => addDaysIso(periodStart, index));

    // Streak
    let streak = 0;
    const d = new Date();
    while (true) {
      const iso = d.toISOString().slice(0, 10);
      if (!byDate[iso]) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }

    // Best streak
    let bestStreak = 0, cur = 0;
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) { cur = 1; continue; }
      const prev = new Date(dates[i - 1] + 'T12:00:00');
      const curr = new Date(dates[i] + 'T12:00:00');
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      cur = diff === 1 ? cur + 1 : 1;
      if (cur > bestStreak) bestStreak = cur;
    }
    if (cur > bestStreak) bestStreak = cur;

    // DOW distribution
    const dow = Array(7).fill(0) as number[];
    filtered.forEach(l => { dow[new Date(l.log_date + 'T12:00:00').getDay()]++; });

    // Most common step
    const stepFreq: Record<string, number> = {};
    filtered.forEach(l => { stepFreq[l.step_id] = (stepFreq[l.step_id] ?? 0) + 1; });
    const topStep = Object.entries(stepFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const uniqueSteps = Object.keys(stepFreq).length;
    const sortedSteps = Object.entries(stepFreq).sort((a, b) => b[1] - a[1]);
    const bestStepEntry = sortedSteps[0] ?? null;
    const weakestStepEntry = [...sortedSteps].sort((a, b) => a[1] - b[1])[0] ?? null;
    const bestStep = bestStepEntry?.[0] ?? null;
    const bestStepCount = bestStepEntry?.[1] ?? 0;
    const weakestStep = weakestStepEntry?.[0] ?? null;
    const weakestStepCount = weakestStepEntry?.[1] ?? 0;
    const bestStepLabel = bestStep ? (STEP_LABELS_HUMAN[bestStep] ?? bestStep.replace(/_/g, ' ')) : null;
    const weakestStepLabel = weakestStep ? (STEP_LABELS_HUMAN[weakestStep] ?? weakestStep.replace(/_/g, ' ')) : null;

    const peakHourEntry = Object.entries(hourFreq)
      .map(([hour, count]) => [Number(hour), count] as const)
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] ?? null;
    const peakHour = peakHourEntry?.[0] ?? null;
    const peakHourLabel = formatHourLabel(peakHour);
    const isBrahmaMuhurta = peakHour !== null && peakHour >= 4 && peakHour <= 6;

    let longestGap = 0;
    let currentGap = 0;
    for (const iso of periodDates) {
      if (byDate[iso]) {
        currentGap = 0;
      } else {
        currentGap++;
        longestGap = Math.max(longestGap, currentGap);
      }
    }

    const multiDayBreaks = Math.max(0, dates.length - 1 === 0 ? 0 : dates.slice(1).reduce((sum, iso, index) => {
      const prev = new Date(`${dates[index]}T12:00:00`);
      const curr = new Date(`${iso}T12:00:00`);
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      return sum + Math.max(0, diff - 1);
    }, 0));
    const gapPenalty = days > 0 ? Math.min(0.35, (multiDayBreaks / days) * 0.5) : 0;
    const consistencyScore = Math.max(0, Math.min(100, Math.round(((activeDays / days) * (1 - gapPenalty)) * 100)));

    const fullMorningDays = Object.values(morningStepsByDate).filter((steps) => steps.size >= 7).length;
    const fullMorningRate = activeDays > 0 ? Math.round((fullMorningDays / activeDays) * 100) : 0;

    const todayIso = new Date().toISOString().slice(0, 10);
    const stepsCompletedToday = filtered.filter((log) => log.log_date === todayIso).length;
    const last7Start = addDaysIso(todayIso, -6);
    const last14Start = addDaysIso(todayIso, -13);
    const lastWeekEnd = addDaysIso(todayIso, -7);
    const thisWeekActive = dates.filter((iso) => iso >= last7Start && iso <= todayIso).length;
    const lastWeekActive = dates.filter((iso) => iso >= last14Start && iso <= lastWeekEnd).length;
    const weekOverWeekDelta = thisWeekActive - lastWeekActive;

    const { milestoneLabel, nextMilestoneAt } = resolveMilestone(tradition, streak);

    return {
      activeDays,
      totalSteps,
      avgPerDay,
      completionRate,
      streak,
      bestStreak,
      dow,
      topStep,
      uniqueSteps,
      peakHour,
      peakHourLabel,
      isBrahmaMuhurta,
      consistencyScore,
      bestStep,
      bestStepLabel,
      bestStepCount,
      weakestStep,
      weakestStepLabel,
      weakestStepCount,
      fullMorningDays,
      fullMorningRate,
      thisWeekActive,
      lastWeekActive,
      weekOverWeekDelta,
      longestGap,
      milestoneLabel,
      nextMilestoneAt,
      stepsCompletedToday,
    };
  }, [filtered, days, cutoff, tradition]);

  async function handleQuickShare(type: NityaCardType) {
    if (quickGenerating) return;
    setQuickGenerating(type);
    try {
      if (type === 'streak_milestone') {
        const data = buildShoonayaShareCardData({
          tradition: tradition || 'universal',
          streakCount: stats.streak,
          title: 'Nitya Karma',
          caption: 'Consecutive days completed',
          userName: userName || 'Seeker',
          date: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        });
        await shareShoonayaShareCard(data, { fileName: 'shoonaya-streak.png', shareText: 'Practicing with Shoonaya 🙏' });
      } else {
        const data = buildNityaShareCardData({ type, stats, tradition, userName, month });
        await shareNityaCardImage({ type, data, fileName: `shoonaya-${type}.png` });
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') toast.error('Could not generate card');
    } finally {
      setQuickGenerating(null);
    }
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: pageBg }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
          <ChevronLeft size={20} style={{ color: amber }} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${amber}99` }}>Nitya Karma</p>
          <h1 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-serif)', color: text }}>Insights</h1>
        </div>
        <button onClick={() => setShareSheetOpen(true)} className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }} aria-label="Share">
          <Share2 size={16} style={{ color: amber }} />
        </button>
      </div>

      {/* Filter pills */}
      <div className="px-4 mb-4 flex gap-2">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all"
            style={{
              background: filter === f.key ? amber : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
              color: filter === f.key ? '#1c1208' : sub,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4">
        {/* Streak hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="rounded-[1.4rem] p-5 border"
          style={{ background: isDark ? 'linear-gradient(135deg,rgba(40,22,8,0.9),rgba(28,15,5,0.95))' : 'linear-gradient(135deg,rgba(255,235,200,0.98),rgba(250,222,175,0.99))', borderColor: `${amber}30` }}>
          <div className="flex items-center gap-4">
            <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2.2, repeat: Infinity }}>
              <span className="text-4xl">🌅</span>
            </motion.div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${amber}80` }}>Current Streak</p>
              <p className="text-4xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: text, lineHeight: 1 }}>
                {stats.streak}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: sub }}>
                {stats.streak === 0 ? 'Start today — consistency is tapas' : `day${stats.streak !== 1 ? 's' : ''} of unbroken dharmic duty`}
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
            <motion.div className="h-full rounded-full" style={{ background: amber }}
              initial={{ width: 0 }} animate={{ width: `${Math.min(100, (stats.completionRate))}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: sub }}>{stats.completionRate}% completion rate over {days} days</p>
        </motion.div>

        <div className="flex flex-wrap gap-2">
          {[
            { type: 'streak_milestone' as const, label: '🔥 Share streak' },
            { type: 'monthly_report' as const, label: '📊 Share month' },
            { type: 'sadhana_quote' as const, label: '🕉️ Share quote' },
          ].map((chip) => (
            <button
              key={chip.type}
              type="button"
              onClick={() => handleQuickShare(chip.type)}
              disabled={Boolean(quickGenerating)}
              className="rounded-full border px-3 py-2 text-[11px] font-semibold transition active:scale-[0.98]"
              style={{
                background: quickGenerating === chip.type ? `${amber}22` : bg,
                borderColor: `${amber}45`,
                color: quickGenerating === chip.type ? amber : text,
                opacity: quickGenerating && quickGenerating !== chip.type ? 0.55 : 1,
              }}
            >
              {quickGenerating === chip.type ? 'Crafting…' : chip.label}
            </button>
          ))}
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Active Days" value={String(stats.activeDays)} sub={sub} icon="📅" isDark={isDark} amber={amber}
            detail={`You completed at least one step on ${stats.activeDays} out of ${days} days. ${stats.activeDays >= days * 0.8 ? 'Exceptional consistency!' : 'Keep building the daily habit — aim for 80%.'}`} />
          <StatCard label="Total Steps" value={String(stats.totalSteps)} sub={sub} icon="✅" isDark={isDark} amber={amber}
            detail={`${stats.totalSteps} individual steps logged. Each small step is an offering to dharma.`} />
          <StatCard label="Best Streak" value={`${stats.bestStreak}d`} sub={sub} icon="🏆" isDark={isDark} amber={amber}
            detail={`Your longest unbroken run was ${stats.bestStreak} consecutive days. Can you beat it?`} />
          <StatCard label="Avg Steps/Day" value={stats.avgPerDay} sub={sub} icon="📊" isDark={isDark} amber={amber}
            detail={`On active days, you average ${stats.avgPerDay} steps. A full Nitya sequence is typically 5–7 steps.`} />
        </div>

        {/* Unique steps */}
        {stats.uniqueSteps > 0 && (
          <div className="rounded-2xl px-4 py-3.5 border flex items-center gap-3"
            style={{ background: bg, borderColor: border }}>
            <span className="text-xl">🔤</span>
            <div>
              <p className="text-[12px] font-semibold" style={{ color: text }}>{stats.uniqueSteps} unique steps practiced</p>
              <p className="text-[11px] mt-0.5" style={{ color: sub }}>
                {stats.topStep ? `Most consistent: "${stats.topStep.replace(/_/g,' ')}"` : 'Build a complete daily sequence'}
              </p>
            </div>
          </div>
        )}

        {/* Consistency */}
        <div className="rounded-2xl p-5 border" style={{ background: bg, borderColor: border }}>
          <div className="flex items-center gap-5">
            <div
              className="relative h-28 w-28 shrink-0 rounded-full"
              style={{
                background: `conic-gradient(${amber} ${stats.consistencyScore}%, ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} 0)`,
              }}
              aria-label={`Consistency score ${stats.consistencyScore} percent`}
            >
              <div
                className="absolute inset-2 rounded-full flex flex-col items-center justify-center text-center"
                style={{ background: bg }}
              >
                <span className="text-2xl font-bold" style={{ color: text, fontFamily: 'var(--font-serif)' }}>
                  {stats.consistencyScore}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: amber }}>
                  {stats.milestoneLabel}
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: `${amber}80` }}>
                Consistency
              </p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: text }}>
                Your practice rhythm scores {stats.consistencyScore}/100 across this period.
              </p>
              <p className="mt-2 text-[11px] leading-relaxed" style={{ color: sub }}>
                Next milestone: {stats.nextMilestoneAt} days ({Math.max(0, stats.nextMilestoneAt - stats.streak)} to go)
              </p>
              <p className="mt-1 text-[11px]" style={{ color: sub }}>
                Peak hour: {stats.peakHourLabel}{stats.isBrahmaMuhurta ? ' · Brahma Muhurta pattern' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Step health */}
        <div className="rounded-2xl p-4 border" style={{ background: bg, borderColor: border }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: `${amber}80` }}>
            Step Health
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 border" style={{ borderColor: `${green}45`, background: isDark ? 'rgba(107,174,117,0.08)' : 'rgba(107,174,117,0.12)' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: green }}>Best step</p>
              <p className="mt-1 text-lg font-semibold" style={{ color: text, fontFamily: 'var(--font-serif)' }}>
                {stats.bestStepLabel ?? 'No steps yet'}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: sub }}>
                {stats.bestStepLabel ? `Your ${stats.bestStepLabel} is your anchor.` : 'Begin one step to reveal your anchor.'}
              </p>
              <p className="mt-2 text-[10px] font-semibold" style={{ color: green }}>{stats.bestStepCount} completions</p>
            </div>
            <div className="rounded-2xl p-4 border" style={{ borderColor: `${amber}45`, background: isDark ? 'rgba(197,160,89,0.08)' : 'rgba(197,160,89,0.12)' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: amber }}>Needs love</p>
              <p className="mt-1 text-lg font-semibold" style={{ color: text, fontFamily: 'var(--font-serif)' }}>
                {stats.weakestStepLabel ?? 'No weak point yet'}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: sub }}>
                {stats.weakestStepLabel ? `Your ${stats.weakestStepLabel} needs more love.` : 'Attempt more steps to see the pattern.'}
              </p>
              <p className="mt-2 text-[10px] font-semibold" style={{ color: amber }}>{stats.weakestStepCount} completions</p>
            </div>
          </div>
          <p className="mt-3 text-[11px]" style={{ color: sub }}>
            Full morning: {stats.fullMorningDays} days · {stats.fullMorningRate}% of active days
          </p>
        </div>

        {/* Week comparison */}
        <div className="rounded-2xl p-4 border" style={{ background: bg, borderColor: border }}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: `${amber}80` }}>
              Week Comparison
            </p>
            <p
              className="text-[11px] font-semibold"
              style={{ color: stats.weekOverWeekDelta > 0 ? green : stats.weekOverWeekDelta === 0 ? amber : 'var(--text-muted-warm)' }}
            >
              {stats.weekOverWeekDelta > 0
                ? `↑ ${stats.weekOverWeekDelta} more day${stats.weekOverWeekDelta === 1 ? '' : 's'} than last week`
                : stats.weekOverWeekDelta < 0
                  ? `↓ ${Math.abs(stats.weekOverWeekDelta)} fewer day${Math.abs(stats.weekOverWeekDelta) === 1 ? '' : 's'}`
                  : 'No change from last week'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            {[
              { label: 'This week', value: stats.thisWeekActive },
              { label: 'Last week', value: stats.lastWeekActive },
            ].map((item) => (
              <div key={item.label}>
                <div className="h-20 rounded-xl flex items-end overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                  <motion.div
                    className="w-full rounded-xl"
                    style={{ background: item.label === 'This week' ? amber : `${amber}80` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(6, (item.value / 7) * 80)}px` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: sub }}>{item.label}</span>
                  <span className="text-sm font-semibold" style={{ color: text }}>{item.value}/7</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px]" style={{ color: sub }}>
            Longest gap in this period: {stats.longestGap} day{stats.longestGap === 1 ? '' : 's'}.
          </p>
        </div>

        {/* Day-of-week chart */}
        <div className="rounded-2xl p-4 border" style={{ background: bg, borderColor: border }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: `${amber}80` }}>
            Practice by Day of Week
          </p>
          <DowChart data={stats.dow} amber={amber} isDark={isDark} />
          <p className="text-[10px] mt-3 text-center" style={{ color: sub }}>
            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][stats.dow.indexOf(Math.max(...stats.dow))]} is your strongest day
          </p>
        </div>

        {/* Calendar */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: `${amber}80` }}>
            Calendar
          </p>
          <CalView logs={logs} isDark={isDark} amber={amber} text={text} sub={sub} border={border} bg={bg} />
        </div>

        {/* Encouragement */}
        <div className="text-center py-3">
          <p className="text-sm italic" style={{ fontFamily: 'var(--font-serif)', color: `${amber}60` }}>
            {stats.completionRate >= 80
              ? 'श्रेयान् स्वधर्मो विगुणः — one\'s own dharma, even imperfect, is superior.'
              : 'योगः कर्मसु कौशलम् — excellence in action is yoga. Keep going.'}
          </p>
        </div>
      </div>
      <ShareInsightsSheet
        open={shareSheetOpen}
        onClose={() => setShareSheetOpen(false)}
        stats={stats}
        tradition={tradition}
        userName={userName}
        month={month}
      />
    </div>
  );
}
