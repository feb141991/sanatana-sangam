'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Session {
  date: string;
  rounds: number;
  bead_count: number;
  duration_secs: number;
  mantra_id: string;
  created_at: string;
}

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

// ── Main component ────────────────────────────────────────────────────────────
export default function InsightsClient({ sessions }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const [filter, setFilter] = useState<FilterKey>('30d');

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
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    return d.toISOString().slice(0, 10);
  }, [days]);

  const filtered = useMemo(() =>
    sessions.filter(s => s.date >= cutoff),
    [sessions, cutoff]
  );

  // Aggregate stats
  const stats = useMemo(() => {
    const totalBeads    = filtered.reduce((a, s) => a + (s.bead_count ?? 0), 0);
    const totalSessions = filtered.length;
    const totalSecs     = filtered.reduce((a, s) => a + (s.duration_secs ?? 0), 0);
    const avgPerDay     = days > 0 ? Math.round(totalBeads / days) : 0;
    return { totalBeads, totalSessions, totalSecs, avgPerDay };
  }, [filtered, days]);

  // Consistency: % of days in range that had a session
  const consistency = useMemo(() => {
    const dateSet = new Set(filtered.map(s => s.date));
    return days > 0 ? Math.round((dateSet.size / days) * 100) : 0;
  }, [filtered, days]);

  // Day-of-week chart: how many sessions on each day (normalized to 0–1)
  const dowData = useMemo(() => {
    const counts = new Array(7).fill(0);
    for (const s of filtered) {
      const dow = new Date(s.date + 'T12:00:00').getDay();
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
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: isDark ? 'rgba(200,146,74,0.10)' : 'rgba(122,74,30,0.08)' }}>
            <Calendar size={16} style={{ color: amber }} />
          </div>
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

        {isEmpty ? (
          // ── Empty state ────────────────────────────────────────────────
          <div className="px-5 pt-10 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">📿</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, color: text }}>
              No sessions yet
            </p>
            <p className="text-sm leading-relaxed" style={{ color: sub, maxWidth: 260 }}>
              Complete your first Japa session and your practice story will appear here.
            </p>
            <button
              onClick={() => router.back()}
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
                <div className="flex items-baseline gap-2 mb-5">
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, color: text }}>
                    {consistency}%
                  </span>
                  <span className="text-sm font-semibold" style={{ color: amber }}>{consistencyLabel}</span>
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

            {/* ── Recent sessions list ─────────────────────────────────── */}
            <div className="px-5">
              <p className="text-[12px] font-semibold uppercase tracking-wide mb-3 px-1" style={{ color: sub }}>
                Recent Sessions
              </p>
              <div className="space-y-2">
                {filtered.slice(0, 12).map((s, i) => {
                  const dateObj = new Date(s.date + 'T12:00:00');
                  const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                  const dow     = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
                  return (
                    <motion.div
                      key={`${s.date}-${i}`}
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
                          {s.rounds} mala{s.rounds !== 1 ? 's' : ''} · {fmtNum(s.bead_count)} beads
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: sub }}>
                          {s.duration_secs > 0 ? fmtTime(s.duration_secs) : ''}
                          {s.mantra_id ? ` · ${s.mantra_id.replace(/_/g, ' ')}` : ''}
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
