'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Calendar, ChevronRight } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { localSpiritualDate } from '@/lib/sacred-time';
import {
  type MalaSessionRow as Session,
  malaSessionBeads as sessionBeads,
  malaSessionDate as sessionDate,
  malaSessionDurationSeconds as sessionSecs,
  malaSessionCompletionType as sessionCompletionType,
  malaSessionMalaId as sessionMalaId,
  malaSessionMantra as sessionMantra,
  malaSessionRounds as sessionRounds,
  malaSessionSpiritualWindow as sessionSpiritualWindow,
} from '@/lib/mala-sessions';

interface Props {
  sessions: Session[];
}

// ── Time filter options ───────────────────────────────────────────────────────
type FilterKey = '1d' | '7d' | '30d' | '90d' | '1y';
const FILTERS: { key: FilterKey; label: string; days: number }[] = [
  { key: '1d',  label: 'Today',    days: 1   },
  { key: '7d',  label: '7 Days',   days: 7   },
  { key: '30d', label: '30 Days',  days: 30  },
  { key: '90d', label: '90 Days',  days: 90  },
  { key: '1y',  label: '1 Year',   days: 365 },
];

// ── Day-of-week bar chart ─────────────────────────────────────────────────────
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MALA_LABELS: Record<string, string> = {
  sandalwood: 'Sandalwood',
  rudraksha: 'Rudraksha',
  rose_quartz: 'Rose quartz',
  tulsi: 'Tulsi',
  crystal: 'Crystal',
};
const MANTRA_LABELS: Record<string, string> = {
  gayatri: 'Gayatri Mantra',
  om_namah_shivaya: 'Om Namah Shivaya',
  om_namo_narayanaya: 'Om Namo Narayanaya',
  hare_krishna: 'Hare Krishna Mahamantra',
  mahamrityunjaya: 'Mahamrityunjaya',
  om_mani: 'Om Mani Padme Hum',
  waheguru: 'Waheguru Simran',
  namokar: 'Namokar Mantra',
};
const WINDOW_LABELS: Record<string, string> = {
  brahma_muhurta: 'Brahma muhurta',
  morning: 'Morning',
  midday: 'Midday',
  sandhya: 'Sandhya',
  night: 'Night',
};

function DayOfWeekChart({ data, isDark, amber }: {
  data: number[]; // 0=Sun … 6=Sat, values 0-1 (fraction of weeks)
  isDark: boolean;
  amber: string;
}) {
  const max = Math.max(...data, 0.01);
  return (
    <div className="flex items-end gap-2" style={{ height: 80 }}>
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <motion.div
            className="w-full rounded-t-md"
            style={{ background: amber }}
            initial={{ height: 0 }}
            animate={{ height: `${(val / max) * 64}px` }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          />
          <span className="text-[10px] font-semibold" style={{ color: isDark ? 'rgba(200,146,74,0.55)' : 'rgba(100,65,25,0.55)' }}>
            {DAY_LABELS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, isDark, amber, sub }: {
  label: string; value: string; isDark: boolean; amber: string; sub: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{
        background: isDark ? 'var(--card-bg)' : 'rgba(255,255,255,0.90)',
        borderColor: isDark ? 'rgba(200,146,74,0.12)' : 'rgba(0,0,0,0.07)',
        boxShadow: isDark ? 'none' : '0 1px 8px rgba(0,0,0,0.06)',
      }}
    >
      <p className="text-[11px] font-medium mb-1" style={{ color: sub }}>{label}</p>
      <p className="font-bold" style={{ fontSize: '1.6rem', color: isDark ? 'rgba(245,225,185,0.97)' : '#1A1208', lineHeight: 1.1, fontFamily: 'var(--font-serif)' }}>
        {value}
      </p>
    </div>
  );
}

// ── Format helpers ────────────────────────────────────────────────────────────
function fmtTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${n}`;
}

function getBestTimeOfDay(sessions: Session[]): string {
  // Group by hour of created_at
  const hourCounts = new Array(24).fill(0);
  let hasTime = false;
  for (const s of sessions) {
    if (!s.created_at) continue;
    const d = new Date(s.created_at);
    if (!isNaN(d.getTime())) {
      hourCounts[d.getHours()]++;
      hasTime = true;
    }
  }
  if (!hasTime) return '—';

  // Find peak 2-hour block
  let best = 0;
  let bestCount = 0;
  for (let h = 0; h < 24; h++) {
    const c = hourCounts[h] + (hourCounts[(h + 1) % 24] ?? 0);
    if (c > bestCount) { bestCount = c; best = h; }
  }
  const fmt = (h: number) => {
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:00 ${ampm}`;
  };
  return `${fmt(best)} – ${fmt((best + 2) % 24)}`;
}

// ── Month calendar view (interactive) ────────────────────────────────────────
function CalendarMonthView({ sessions, isDark, amber, text, sub, borderCol, surface }: {
  sessions: Session[]; isDark: boolean; amber: string; text: string; sub: string; borderCol: string; surface: string;
}) {
  const now = new Date();
  const [calMonth, setCalMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const dateMap = useMemo(() => {
    const m: Record<string, Session[]> = {};
    sessions.forEach(s => {
      const key = sessionDate(s);
      if (!key) return;
      if (!m[key]) m[key] = [];
      m[key].push(s);
    });
    return m;
  }, [sessions]);

  const calDays = useMemo(() => {
    const first = new Date(calMonth.year, calMonth.month, 1);
    const last  = new Date(calMonth.year, calMonth.month + 1, 0);
    const cells: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= last.getDate(); d++) {
      const iso = `${calMonth.year}-${String(calMonth.month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      cells.push(iso);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calMonth]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const monthLabel = new Date(calMonth.year, calMonth.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCalMonth(m => {
    const d = new Date(m.year, m.month - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setCalMonth(m => {
    const d = new Date(m.year, m.month + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const selectedSessions = selected ? (dateMap[selected] ?? []) : [];

  return (
    <div className="px-5 pb-5">
      <div className="rounded-2xl p-5 border" style={{ background: surface, borderColor: borderCol, boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
            <ChevronLeft size={16} style={{ color: amber }} />
          </button>
          <p className="text-[13px] font-semibold" style={{ color: text, fontFamily: 'var(--font-serif)' }}>{monthLabel}</p>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
            <ChevronRight size={16} style={{ color: amber }} />
          </button>
        </div>

        {/* DOW headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold" style={{ color: sub }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {calDays.map((iso, i) => {
            if (!iso) return <div key={i} />;
            const sess = dateMap[iso];
            const hasSession = !!sess;
            const isToday = iso === todayIso;
            const isSelected = iso === selected;
            return (
              <motion.button
                key={iso}
                onClick={() => setSelected(isSelected ? null : iso)}
                whileTap={{ scale: 0.88 }}
                className="aspect-square flex items-center justify-center rounded-full text-[11px] font-semibold transition-all"
                style={{
                  background: isSelected
                    ? amber
                    : hasSession
                      ? isDark ? 'rgba(200,146,74,0.35)' : 'rgba(200,146,74,0.22)'
                      : 'transparent',
                  color: isSelected
                    ? '#fff'
                    : hasSession
                      ? amber
                      : isDark ? 'rgba(245,210,130,0.35)' : 'rgba(100,55,10,0.40)',
                  border: isToday ? `1.5px solid ${amber}` : 'none',
                  fontWeight: isToday || isSelected ? 700 : 500,
                }}
              >
                {new Date(iso + 'T12:00:00').getDate()}
              </motion.button>
            );
          })}
        </div>

        {/* Selected day details */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-xl p-3"
              style={{ background: isDark ? 'rgba(200,146,74,0.10)' : 'rgba(200,146,74,0.08)' }}
            >
              <p className="text-[11px] font-semibold mb-2" style={{ color: amber }}>
                {new Date(selected + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {selectedSessions.length === 0 ? (
                <p className="text-[11px]" style={{ color: sub }}>No japa session this day.</p>
              ) : selectedSessions.map((s, i) => (
                <div key={i} className="text-[11px]" style={{ color: text }}>
                  {sessionRounds(s)} mala{sessionRounds(s) !== 1 ? 's' : ''} · {sessionBeads(s)} beads
                  {sessionSecs(s) > 0 && ` · ${Math.round(sessionSecs(s) / 60)}m`}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: amber, opacity: 0.6 }} />
            <span className="text-[10px]" style={{ color: sub }}>Japa done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border" style={{ borderColor: amber }} />
            <span className="text-[10px]" style={{ color: sub }}>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function InsightsClient({ sessions }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const [filter, setFilter] = useState<FilterKey>('30d');
  const [showCalendar, setShowCalendar] = useState(false);

  // Theme tokens
  const bg    = isDark ? '#06060A' : '#F5F0E8';
  const surface = isDark ? 'rgba(14,12,8,0.94)' : 'rgba(255,255,255,0.92)';
  const text  = isDark ? 'rgba(245,225,185,0.97)' : '#1A1208';
  const sub   = isDark ? 'rgba(200,146,74,0.58)' : 'rgba(80,50,15,0.60)';
  const amber = isDark ? '#C8924A' : '#7A4A1E';
  const borderCol = isDark ? 'rgba(200,146,74,0.12)' : 'rgba(0,0,0,0.07)';

  // Filter sessions by date range
  const days = FILTERS.find(f => f.key === filter)?.days ?? 30;
  const cutoff = useMemo(() => {
    const tz = typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC';
    const spiritualToday = localSpiritualDate(tz, 4);
    if (days === 1) return spiritualToday; // just today (spiritual)
    const d = new Date(`${spiritualToday}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (days - 1));
    return d.toISOString().slice(0, 10);
  }, [days]);

  const filtered = useMemo(() =>
    // Use date if set (new sessions), fall back to created_at date for pre-migration rows
    sessions.filter(s => sessionDate(s) >= cutoff),
    [sessions, cutoff]
  );

  // Aggregate stats — schema-agnostic via accessor helpers
  const stats = useMemo(() => {
    const totalBeads    = filtered.reduce((a, s) => a + sessionBeads(s), 0);
    const totalSessions = filtered.length;
    const totalSecs     = filtered.reduce((a, s) => a + sessionSecs(s), 0);
    const avgPerDay     = days > 0 ? Math.round(totalBeads / days) : 0;
    const malaFreq: Record<string, number> = {};
    const mantraFreq: Record<string, number> = {};
    const windowFreq: Record<string, number> = {};
    let completedSessions = 0;
    filtered.forEach(s => {
      const mala = sessionMalaId(s);
      if (mala) malaFreq[mala] = (malaFreq[mala] ?? 0) + 1;
      const mantra = sessionMantra(s);
      if (mantra) mantraFreq[mantra] = (mantraFreq[mantra] ?? 0) + 1;
      const spiritualWindow = sessionSpiritualWindow(s);
      if (spiritualWindow) windowFreq[spiritualWindow] = (windowFreq[spiritualWindow] ?? 0) + 1;
      if (sessionCompletionType(s) === 'target_completed' || sessionRounds(s) > 0) completedSessions++;
    });
    const malas = Object.entries(malaFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topMala = malas[0]?.[0] ?? null;
    const mantras = Object.entries(mantraFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topMantra = mantras[0]?.[0] ?? null;
    const windows = Object.entries(windowFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topWindow = windows[0]?.[0] ?? null;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    return { totalBeads, totalSessions, totalSecs, avgPerDay, malas, topMala, mantras, topMantra, windows, topWindow, completionRate };
  }, [filtered, days]);

  // Consistency: % of days in range that had a session
  const consistency = useMemo(() => {
    const dateSet = new Set(filtered.map(s => sessionDate(s)).filter(Boolean));
    return days > 0 ? Math.round((dateSet.size / days) * 100) : 0;
  }, [filtered, days]);

  // Day-of-week chart: how many sessions on each day (normalized to 0–1)
  const dowData = useMemo(() => {
    const counts = new Array(7).fill(0);
    for (const s of filtered) {
      const dateKey = sessionDate(s);
      if (!dateKey) continue;
      const dow = new Date(dateKey + 'T12:00:00').getDay();
      counts[dow]++;
    }
    // Normalize to 0-1
    const mx = Math.max(...counts, 1);
    return counts.map(c => c / mx);
  }, [filtered]);

  // Best time of day
  const bestTime = useMemo(() => getBestTimeOfDay(filtered), [filtered]);

  // Consistency label
  const consistencyLabel =
    consistency >= 90 ? 'Excellent' :
    consistency >= 70 ? 'Great' :
    consistency >= 50 ? 'Good' :
    consistency >= 30 ? 'Building' :
    'Getting Started';

  const isEmpty = filtered.length === 0;
  const daysSinceLastPractice = useMemo(() => {
    const latest = [...sessions].map(s => sessionDate(s)).filter(Boolean).sort().at(-1);
    if (!latest) return null;
    const today = localSpiritualDate(typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC', 4);
    const diff = new Date(`${today}T12:00:00Z`).getTime() - new Date(`${latest}T12:00:00Z`).getTime();
    return Math.max(0, Math.floor(diff / 86400000));
  }, [sessions]);
  const recommendedNextPractice = stats.topMantra
    ? `Return to ${MANTRA_LABELS[stats.topMantra] ?? stats.topMantra.replace(/_/g, ' ')} at ${stats.topWindow ? WINDOW_LABELS[stats.topWindow] ?? stats.topWindow : bestTime !== '—' ? bestTime : 'your usual time'}.`
    : 'Start with one mala today so Shoonaya can learn your rhythm.';
  const streakRisk = daysSinceLastPractice == null
    ? 'No rhythm yet'
    : daysSinceLastPractice === 0
      ? 'Protected today'
      : daysSinceLastPractice === 1
        ? 'Practice today to protect the rhythm'
        : 'High risk: restart with one short mala';

  return (
    <div style={{ background: bg, minHeight: '100dvh', marginLeft: '-0.75rem', marginRight: '-0.75rem', marginTop: '-0.5rem' }}>
      <div className="pb-32">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 pt-14 pb-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}
          >
            <ChevronLeft size={20} style={{ color: amber }} />
          </button>
          <div className="flex-1">
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase" style={{ color: sub }}>
              Japa Practice
            </p>
            <h1 className="text-[1.7rem] font-bold leading-tight" style={{ color: text, fontFamily: 'var(--font-serif)' }}>
              Insights
            </h1>
          </div>
          <button
            onClick={() => setShowCalendar(v => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{
              background: showCalendar
                ? (isDark ? 'rgba(200,146,74,0.22)' : 'rgba(122,74,30,0.14)')
                : (isDark ? 'rgba(200,146,74,0.10)' : 'rgba(122,74,30,0.08)'),
              border: showCalendar ? `1.5px solid ${amber}` : 'none',
            }}
            aria-label="Toggle calendar view"
          >
            <Calendar size={16} style={{ color: amber }} />
          </button>
        </div>

        {/* ── Filter pills ───────────────────────────────────────────────── */}
        <div className="px-5 pb-5">
          <div
            className="flex rounded-2xl p-1"
            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }}
          >
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all"
                style={{
                  background: filter === f.key
                    ? (isDark ? 'rgba(200,146,74,0.18)' : 'rgba(255,255,255,0.95)')
                    : 'transparent',
                  color: filter === f.key ? amber : sub,
                  boxShadow: filter === f.key
                    ? (isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.10)')
                    : 'none',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Calendar month view (toggleable) ──────────────────────── */}
        <AnimatePresence>
          {showCalendar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28 }}
              style={{ overflow: 'hidden' }}
            >
              <CalendarMonthView
                sessions={sessions}
                isDark={isDark}
                amber={amber}
                text={text}
                sub={sub}
                borderCol={borderCol}
                surface={surface}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isEmpty ? (
          // ── Empty state ────────────────────────────────────────────────
          <div className="px-5 pt-10 flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full border flex items-center justify-center" style={{ borderColor: `${amber}30`, background: `${amber}12` }}>
              <Calendar size={24} style={{ color: amber }} />
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, color: text }}>
              No sessions yet
            </p>
            <p className="text-sm leading-relaxed" style={{ color: sub, maxWidth: 260 }}>
              Complete your first Japa session and your practice story will appear here.
            </p>
            <button
              onClick={() => router.push('/bhakti/mala')}
              className="mt-2 px-6 py-3 rounded-2xl font-semibold text-sm"
              style={{ background: isDark ? 'rgba(200,146,74,0.14)' : 'rgba(122,74,30,0.10)', color: amber, border: `1px solid ${amber}30` }}
            >
              Begin Practice
            </button>
          </div>
        ) : (
          <>
            {/* ── Overview section ────────────────────────────────────── */}
            <div className="px-5 mb-5">
              <div
                className="rounded-2xl p-5 border"
                style={{ background: surface, borderColor: borderCol, boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}
              >
                <p className="text-[12px] font-semibold uppercase tracking-wide mb-4" style={{ color: sub }}>
                  Overview ({FILTERS.find(f => f.key === filter)?.label})
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label="Total Repetitions"
                    value={fmtNum(stats.totalBeads)}
                    isDark={isDark} amber={amber} sub={sub}
                  />
                  <StatCard
                    label="Total Sessions"
                    value={`${stats.totalSessions}`}
                    isDark={isDark} amber={amber} sub={sub}
                  />
                  <StatCard
                    label="Avg. Per Day"
                    value={fmtNum(stats.avgPerDay)}
                    isDark={isDark} amber={amber} sub={sub}
                  />
                  <StatCard
                    label="Total Time"
                    value={stats.totalSecs > 0 ? fmtTime(stats.totalSecs) : '—'}
                    isDark={isDark} amber={amber} sub={sub}
                  />
                </div>
              </div>
            </div>

            {/* ── Practice Consistency ─────────────────────────────────── */}
            <div className="px-5 mb-5">
              <div
                className="rounded-2xl p-5 border"
                style={{ background: surface, borderColor: borderCol, boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}
              >
                <p className="text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: sub }}>
                  Practice Consistency
                </p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, color: text }}>
                    {consistency}%
                  </span>
                  <span className="text-sm font-semibold" style={{ color: amber }}>{consistencyLabel}</span>
                </div>
                {/* Consistency progress bar */}
                <div className="mb-5">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, rgba(200,146,74,0.6), rgba(212,100,20,0.90))` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${consistency}%` }}
                      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: isDark ? 'rgba(200,146,74,0.45)' : 'rgba(100,65,25,0.50)' }}>
                    {days > 0
                      ? `Practiced on ${Math.round((consistency / 100) * days)} of ${days} days`
                      : 'Select a time range'}
                  </p>
                </div>
                <DayOfWeekChart data={dowData} isDark={isDark} amber={amber} />
              </div>
            </div>

            {/* ── Best Time of Day ─────────────────────────────────────── */}
            {bestTime !== '—' && (
              <div className="px-5 mb-5">
                <div
                  className="rounded-2xl p-5 border"
                  style={{ background: surface, borderColor: borderCol, boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}
                >
                  <p className="text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: sub }}>
                    Best Time of Day
                  </p>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: text }}>
                    {bestTime}
                  </p>
                  <p className="text-xs mt-2" style={{ color: sub }}>
                    You are most consistent at this time.
                  </p>
                </div>
              </div>
            )}

            {/* ── Practice dashboard intelligence ─────────────────────── */}
            <div className="px-5 mb-5">
              <div
                className="rounded-2xl p-5 border"
                style={{ background: surface, borderColor: borderCol, boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}
              >
                <p className="text-[12px] font-semibold uppercase tracking-wide mb-4" style={{ color: sub }}>
                  Practice dashboard
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Completion rate" value={`${stats.completionRate}%`} isDark={isDark} amber={amber} sub={sub} />
                  <StatCard label="Streak risk" value={daysSinceLastPractice === 0 ? 'Low' : daysSinceLastPractice === 1 ? 'Medium' : 'High'} isDark={isDark} amber={amber} sub={sub} />
                </div>
                <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: `${amber}1f`, background: `${amber}08` }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: sub }}>Recommended next practice</p>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: text }}>{recommendedNextPractice}</p>
                  <p className="mt-2 text-[11px]" style={{ color: sub }}>{streakRisk}</p>
                </div>
              </div>
            </div>

            {/* ── Mantra and spiritual-time preference ─────────────────── */}
            {(stats.mantras.length > 0 || stats.windows.length > 0) && (
              <div className="px-5 mb-5">
                <div
                  className="rounded-2xl p-5 border"
                  style={{ background: surface, borderColor: borderCol, boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}
                >
                  <p className="text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: sub }}>
                    Practice preference
                  </p>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: text }}>
                    {stats.topMantra ? MANTRA_LABELS[stats.topMantra] ?? stats.topMantra.replace(/_/g, ' ') : 'Learning your mantra'}
                  </p>
                  <div className="mt-4 grid gap-3">
                    {stats.mantras.slice(0, 3).map(([mantra, count]) => (
                      <div key={mantra} className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-semibold" style={{ color: text }}>{MANTRA_LABELS[mantra] ?? mantra.replace(/_/g, ' ')}</span>
                        <span className="text-[11px]" style={{ color: sub }}>{count} session{count !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                    {stats.windows.slice(0, 3).map(([windowKey, count]) => (
                      <div key={windowKey} className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-semibold" style={{ color: text }}>{WINDOW_LABELS[windowKey] ?? windowKey}</span>
                        <span className="text-[11px]" style={{ color: sub }}>{count} session{count !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Mala preference ─────────────────────────────────────── */}
            {stats.malas.length > 0 && (
              <div className="px-5 mb-5">
                <div
                  className="rounded-2xl p-5 border"
                  style={{ background: surface, borderColor: borderCol, boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}
                >
                  <p className="text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: sub }}>
                    Mala style
                  </p>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: text }}>
                    {stats.topMala ? MALA_LABELS[stats.topMala] ?? stats.topMala.replace(/_/g, ' ') : 'Not tracked yet'}
                  </p>
                  <div className="mt-4 space-y-2">
                    {stats.malas.map(([mala, count]) => (
                      <div key={mala} className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-semibold" style={{ color: text }}>
                          {MALA_LABELS[mala] ?? mala.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px]" style={{ color: sub }}>
                          {count} session{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-3" style={{ color: sub }}>
                    We can use this later to tune reminders around your preferred mala style and practice time.
                  </p>
                </div>
              </div>
            )}

            {/* ── Recent sessions list ─────────────────────────────────── */}
            <div className="px-5">
              <p className="text-[12px] font-semibold uppercase tracking-wide mb-3 px-1" style={{ color: sub }}>
                Recent Sessions
              </p>
              <div className="space-y-2">
                {filtered.slice(0, 12).map((s, i) => {
                  const dateKey = sessionDate(s) || '1970-01-01';
                  const dateObj = new Date(dateKey + 'T12:00:00');
                  const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                  const dow     = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
                  return (
                    <motion.div
                      key={`${sessionDate(s)}-${i}`}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 border"
                      style={{ background: isDark ? 'var(--card-bg)' : 'rgba(255,255,255,0.90)', borderColor: borderCol }}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                    >
                      {/* Date bubble */}
                      <div className="flex flex-col items-center w-10 flex-shrink-0">
                        <span className="text-[9px] font-bold uppercase" style={{ color: amber }}>{dow}</span>
                        <span className="text-[15px] font-bold" style={{ color: text }}>
                          {dateObj.getDate()}
                        </span>
                        <span className="text-[9px]" style={{ color: sub }}>
                          {dateObj.toLocaleDateString('en-GB', { month: 'short' })}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-9 flex-shrink-0" style={{ background: isDark ? 'rgba(200,146,74,0.15)' : 'rgba(0,0,0,0.08)' }} />

                      {/* Stats */}
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold" style={{ color: text }}>
                          {sessionRounds(s)} mala{sessionRounds(s) !== 1 ? 's' : ''} · {fmtNum(sessionBeads(s))} beads
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: sub }}>
                          {sessionSecs(s) > 0 ? fmtTime(sessionSecs(s)) : ''}
                          {sessionMantra(s) ? ` · ${sessionMantra(s)!.replace(/_/g, ' ')}` : ''}
                          {sessionMalaId(s) ? ` · ${MALA_LABELS[sessionMalaId(s)!] ?? sessionMalaId(s)!.replace(/_/g, ' ')}` : ''}
                        </p>
                      </div>

                      {/* Mini indicator */}
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: amber }}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
