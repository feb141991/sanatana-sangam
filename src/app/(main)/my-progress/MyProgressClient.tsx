'use client';

import SacredIcon, { SacredIconName } from '@/components/ui/SacredIcon';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Lock, TrendingUp, TrendingDown, Minus, Calendar, Activity, Sparkles, Share2, ExternalLink, Target, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { localSpiritualDate } from '@/lib/sacred-time';
import PageIntro from '@/components/ui/PageIntro';
import SankalpaCompletionCeremony from '@/components/home/SankalpaCompletionCeremony';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ReportData {
  curMonthStart: string;
  curMonthEnd:   string;
  curSessions:   number;
  curRounds:     number;
  curBeads:      number;
  curNityaDays:  number;
  curDaysElapsed: number;
  prevSessions:  number;
  prevRounds:    number;
  prevBeads:     number;
  topMantra:     string | null;
}

interface Props {
  userName:         string;
  tradition:        string | null;
  isPro:            boolean;
  streak:           number;
  heatmap:          { date: string; japa: boolean; nitya: boolean }[];
  sixMonthHeatmap?: { date: string; japa: boolean; nitya: boolean }[];
  japa30dSessions:  number;
  japa30dRounds:    number;
  japa30dBeads:     number;
  japa30dMins:      number;
  topMantra:        string | null;
  dowCounts:        number[];
  totalJapaSessions: number;
  nitya30dDays:     number;
  sevaScore?:       number;
  weeklySevaScore?: number;
  mandaliPostCount?: number;
  kulTasksDone?:    number;
  report:           ReportData;
  sankalpas:        any[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pct(a: number, b: number) {
  if (!b) return 0;
  return Math.round(((a - b) / b) * 100);
}

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function monthName(iso: string) {
  return new Date(iso).toLocaleString('default', { month: 'long', year: 'numeric' });
}

// ── 28-day Sparkline line graph ───────────────────────────────────────────────
function SparklineView({ days, isDark }: { days: Props['heatmap']; isDark: boolean }) {
  const amber   = 'rgba(197, 160, 89,';
  const sub     = isDark ? 'rgba(245,210,130,0.35)' : 'rgba(100,60,10,0.40)';

  // Build 28-day japa presence array (oldest → newest)
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date)).slice(-28);
  const W = 300; const H = 72; const pad = 8;
  const n = sorted.length;
  if (n < 2) return <p className="text-center text-xs py-4" style={{ color: sub }}>Not enough data yet</p>;

  const stepX = (W - pad * 2) / (n - 1);
  // smooth path: japa = 1 → top zone; none = 0 → bottom
  const pts = sorted.map((d, i) => ({
    x: pad + i * stepX,
    y: d.japa ? H * 0.18 : H * 0.82,
    japa: d.japa,
    date: d.date,
  }));

  // Catmull-rom smooth path
  function catmullRom(p: typeof pts) {
    if (p.length < 2) return '';
    let d = `M ${p[0].x} ${p[0].y}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[Math.max(i - 1, 0)];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[Math.min(i + 2, p.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  const linePath = catmullRom(pts);
  const areaPath = linePath + ` L ${pts[n - 1].x} ${H} L ${pts[0].x} ${H} Z`;
  const todayIso = new Date().toISOString().slice(0, 10);

  const streak = sorted.reduceRight((acc, d) => {
    if (acc.done) return acc;
    if (d.japa) { acc.count++; return acc; }
    acc.done = true; return acc;
  }, { count: 0, done: false }).count;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="spkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`${amber}0.35)`} />
            <stop offset="100%" stopColor={`${amber}0.00)`} />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <motion.path d={areaPath} fill="url(#spkGrad)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
        {/* Line */}
        <motion.path d={linePath} fill="none"
          stroke={`${amber}0.80)`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
        {/* Dots for each day */}
        {pts.map((pt, i) => (
          <circle key={i}
            cx={pt.x} cy={pt.y} r={pt.date === todayIso ? 4 : pt.japa ? 3 : 2}
            fill={pt.japa ? `${amber}0.90)` : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'}
            stroke={pt.date === todayIso ? `${amber}1.0)` : 'none'}
            strokeWidth={1.5}
          />
        ))}
        {/* Horizontal guide lines */}
        <line x1={pad} y1={H * 0.18} x2={W - pad} y2={H * 0.18}
          stroke={`${amber}0.08)`} strokeWidth={1} strokeDasharray="3,4" />
        <line x1={pad} y1={H * 0.82} x2={W - pad} y2={H * 0.82}
          stroke={`${amber}0.08)`} strokeWidth={1} strokeDasharray="3,4" />
        {/* "Done" / "Rest" labels */}
        <text x={W - pad + 3} y={H * 0.18 + 4} fontSize={8} fill={`${amber}0.45)`}>Japa</text>
        <text x={W - pad + 3} y={H * 0.82 + 4} fontSize={8} fill={`${amber}0.28)`}>Rest</text>
      </svg>

      {/* Week labels */}
      <div className="flex justify-between mt-1 px-2">
        {['4w ago', '3w ago', '2w ago', 'This week'].map(l => (
          <span key={l} className="text-[9px]" style={{ color: sub }}>{l}</span>
        ))}
      </div>

      {/* Quick stats row */}
      <div className="flex gap-2 mt-3">
        {[
          { val: `${sorted.filter(d => d.japa).length}`, label: 'days active' },
          { val: `${streak}`, label: 'current streak' },
          { val: `${Math.round((sorted.filter(d => d.japa).length / Math.max(sorted.length, 1)) * 100)}%`, label: 'consistency' },
        ].map(({ val, label }) => (
          <div key={label} className="flex-1 text-center rounded-xl py-1.5"
            style={{ background: isDark ? 'rgba(197, 160, 89,0.07)' : 'rgba(197, 160, 89,0.06)' }}>
            <p className="text-[13px] font-bold" style={{ color: isDark ? '#f5dfa0' : '#1a0a02' }}>{val}</p>
            <p className="text-[8px] mt-0.5" style={{ color: sub }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 6-Month GitHub-Style Contribution Heatmap ─────────────────────────────────
// 26 weeks × 7 days grid. Columns = weeks (oldest → newest), rows = Sun–Sat.
function SixMonthHeatmap({
  days, isDark,
}: {
  days: Props['heatmap']; isDark: boolean;
}) {
  const amber  = '#C5A059';
  const green  = '#8fb46e';
  const dimBg  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const sub    = isDark ? 'rgba(245,210,130,0.38)' : 'rgba(100,60,10,0.45)';

  const dayMap = useMemo(() => {
    const m: Record<string, { japa: boolean; nitya: boolean }> = {};
    days.forEach(d => { m[d.date] = { japa: d.japa, nitya: d.nitya }; });
    return m;
  }, [days]);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Build 26 full weeks anchored to today (Sunday start)
  const weeks = useMemo(() => {
    // Find the most recent Sunday (or today if Sunday)
    const anchor = new Date();
    anchor.setDate(anchor.getDate() - anchor.getDay()); // roll back to Sunday
    // Build 26 weeks going backwards
    const allWeeks: (string | null)[][] = [];
    for (let w = 25; w >= 0; w--) {
      const week: (string | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(anchor);
        date.setDate(anchor.getDate() - w * 7 + d);
        const iso = date.toISOString().slice(0, 10);
        // Only include dates within our data window
        week.push(iso <= todayIso ? iso : null);
      }
      allWeeks.push(week);
    }
    return allWeeks;
  }, [todayIso]);

  // Month labels for the top axis
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDate = week.find(d => d !== null);
      if (!firstDate) return;
      const m = new Date(firstDate + 'T12:00:00Z').getUTCMonth();
      if (m !== lastMonth) {
        labels.push({
          label: new Date(firstDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short' }),
          weekIndex: wi,
        });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  function cellColor(iso: string | null): string {
    if (!iso) return 'transparent';
    const d = dayMap[iso];
    if (!d) return dimBg;
    if (d.japa && d.nitya) return amber;
    if (d.japa)            return `${amber}bb`;
    if (d.nitya)           return `${green}99`;
    return dimBg;
  }

  const totalJapa  = days.filter(d => d.japa).length;
  const totalNitya = days.filter(d => d.nitya).length;
  const longestRun = useMemo(() => {
    let max = 0, cur = 0;
    const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
    for (const d of sorted) {
      if (d.japa) { cur++; max = Math.max(max, cur); } else cur = 0;
    }
    return max;
  }, [days]);

  return (
    <div>
      {/* Stats row */}
      <div className="flex gap-4 mb-3 text-[11px]" style={{ color: sub }}>
        <span><span style={{ color: amber }} className="font-bold">{totalJapa}</span> japa days</span>
        <span><span style={{ color: green }} className="font-bold">{totalNitya}</span> nitya days</span>
        <span>best run: <span className="font-bold" style={{ color: isDark ? '#f5dfa0' : '#2a1002' }}>{longestRun}</span></span>
      </div>

      {/* Month labels */}
      <div className="relative h-4 mb-1" style={{ minWidth: 0 }}>
        {monthLabels.map(({ label, weekIndex }) => (
          <span
            key={label + weekIndex}
            className="absolute text-[9px]"
            style={{
              left: `${(weekIndex / 26) * 100}%`,
              color: sub,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Grid: columns = weeks, rows = Sun(0)…Sat(6) */}
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((iso, di) => (
              <div
                key={di}
                title={iso ? `${iso}${dayMap[iso]?.japa ? ' · Japa' : ''}${dayMap[iso]?.nitya ? ' · Nitya' : ''}` : ''}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: cellColor(iso),
                  outline: iso === todayIso ? `1.5px solid ${amber}` : 'none',
                  outlineOffset: 1,
                  cursor: iso ? 'default' : 'default',
                  opacity: iso ? 1 : 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2.5 text-[10px]" style={{ color: sub }}>
        <span className="flex items-center gap-1">
          <span style={{ width: 10, height: 10, borderRadius: 2, background: dimBg, display: 'inline-block' }} /> None
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 10, height: 10, borderRadius: 2, background: `${amber}bb`, display: 'inline-block' }} /> Japa
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 10, height: 10, borderRadius: 2, background: `${green}99`, display: 'inline-block' }} /> Nitya
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 10, height: 10, borderRadius: 2, background: amber, display: 'inline-block' }} /> Both
        </span>
      </div>
    </div>
  );
}

// ── Interactive Activity Calendar ─────────────────────────────────────────────
function InteractiveCalendar({
  days, isDark,
}: {
  days: Props['heatmap']; isDark: boolean;
}) {
  const dayMap = useMemo(() => {
    const m: Record<string, { japa: boolean; nitya: boolean }> = {};
    days.forEach(d => { m[d.date] = { japa: d.japa, nitya: d.nitya }; });
    return m;
  }, [days]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const amber = 'rgba(197, 160, 89,';
  const green = 'rgba(140,180,100,';
  const dimBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const sub   = isDark ? 'rgba(245,210,130,0.38)' : 'rgba(100,60,10,0.45)';

  function DayDetail({ iso }: { iso: string }) {
    const d = dayMap[iso];
    const hasAny = d?.japa || d?.nitya;
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="mt-3 rounded-xl px-4 py-2.5 text-center text-xs"
        style={{ background: isDark ? 'rgba(197, 160, 89,0.10)' : 'rgba(197, 160, 89,0.08)' }}
      >
        <span style={{ color: isDark ? '#f5dfa0' : '#2a1002', fontWeight: 600 }}>
          {new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
        <br />
        <span style={{ color: isDark ? 'rgba(245,210,130,0.65)' : 'rgba(100,55,10,0.65)' }}>
          {d?.japa ? 'Japa' : ''}
          {d?.japa && d?.nitya ? ' · ' : ''}
          {d?.nitya ? 'Nitya' : ''}
          {!hasAny ? 'Rest day' : ''}
        </span>
      </motion.div>
    );
  }

  // Must be declared before any conditional returns (Rules of Hooks)
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

  const monthLabel = new Date(calMonth.year, calMonth.month, 1)
    .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  // ── Full month calendar grid ─────────────────────────────────────────────────
  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}
        >
          <ChevronLeft size={14} style={{ color: `${amber}0.80)` }} />
        </button>
        <p className="text-[13px] font-semibold" style={{ color: isDark ? '#f5dfa0' : '#1a0a02', fontFamily: 'var(--font-serif)' }}>
          {monthLabel}
        </p>
        <button
          onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}
        >
          <ChevronRight size={14} style={{ color: `${amber}0.80)` }} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold" style={{ color: sub }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {calDays.map((iso, i) => {
          if (!iso) return <div key={i} />;
          const d = dayMap[iso];
          const both = d?.japa && d?.nitya;
          const isToday    = iso === todayIso;
          const isSelected = iso === selectedDay;
          const bg = isSelected
            ? `${amber}0.90)`
            : both         ? `${amber}0.65)`
            : d?.japa      ? isDark ? `${amber}0.30)` : `${amber}0.22)`
            : d?.nitya     ? isDark ? `${green}0.30)` : `${green}0.22)`
            : 'transparent';
          const color = isSelected
            ? '#fff'
            : (d?.japa || d?.nitya)
              ? isDark ? 'rgba(245,210,130,0.92)' : '#3a1a02'
              : isDark ? 'rgba(245,210,130,0.25)' : 'rgba(100,55,10,0.30)';
          return (
            <motion.button
              key={iso}
              onClick={() => setSelectedDay(isSelected ? null : iso)}
              whileTap={{ scale: 0.88 }}
              className="aspect-square flex items-center justify-center rounded-full text-[11px] transition-all"
              style={{
                background: bg,
                color,
                border: isToday ? `1.5px solid ${amber}0.70)` : 'none',
                fontWeight: isToday || isSelected ? 700 : 400,
              }}
            >
              {new Date(iso + 'T12:00:00').getDate()}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 justify-center">
        {[
          { color: `${amber}0.65)`, label: 'Both' },
          { color: `${amber}0.30)`, label: 'Japa' },
          { color: `${green}0.30)`, label: 'Nitya' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: sub }}>{label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedDay && <DayDetail iso={selectedDay} />}
      </AnimatePresence>
    </div>
  );
}

// ── Day-of-week bar chart ─────────────────────────────────────────────────────
function DowChart({ counts, isDark }: { counts: number[]; isDark: boolean }) {
  const max = Math.max(...counts, 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height: 64 }}>
      {counts.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            className="w-full rounded-t-[4px]"
            style={{ background: 'rgba(197, 160, 89,0.55)' }}
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 48}px` }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          />
          <span className="text-[10px] font-semibold"
            style={{ color: isDark ? 'rgba(197, 160, 89,0.45)' : 'rgba(100,65,20,0.50)' }}>
            {DAY_LABELS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Trend badge ───────────────────────────────────────────────────────────────
function Trend({ cur, prev }: { cur: number; prev: number }) {
  const delta = pct(cur, prev);
  if (!prev) return null;
  const up = delta > 0;
  const flat = delta === 0;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5"
      style={{
        background: flat ? 'rgba(160,160,160,0.12)' : up ? 'rgba(80,180,80,0.14)' : 'rgba(220,60,60,0.12)',
        color:      flat ? '#aaa' : up ? '#4caf50' : '#e57373',
      }}>
      {flat ? <Minus size={10} /> : up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {flat ? 'same' : `${up ? '+' : ''}${delta}%`}
    </span>
  );
}

// ── Achievement Shields ───────────────────────────────────────────────────────
const shieldIconMap: Record<string, SacredIconName> = {
  '🔥': 'flame', '🪔': 'flame', '🌟': 'star', '📿': 'japa', '🙏': 'flower', '🌱': 'tree',
  '🌕': 'moon', '⚡': 'sparkles', '🔆': 'sun', '💎': 'shield', '🕯️': 'flame', '☀️': 'sun'
};

const STREAK_SHIELDS = [
  { threshold: 7,   name: 'Saptāha',    emoji: '🔥', desc: '7-day streak'    },
  { threshold: 9,   name: 'Navarātri',  emoji: '🪔', desc: '9-day streak'    },
  { threshold: 21,  name: 'Niyama',     emoji: '🕯️',  desc: '21-day streak'   },
  { threshold: 40,  name: 'Chālisā',   emoji: '🌟', desc: '40-day streak'   },
  { threshold: 54,  name: 'Ardha Mālā',emoji: '📿', desc: '54-day streak'   },
  { threshold: 108, name: 'Pūrṇa Mālā',emoji: '🙏', desc: '108-day streak'  },
  { threshold: 365, name: 'Varsha',     emoji: '☀️',  desc: '365-day streak'  },
];

const SESSION_SHIELDS = [
  { threshold: 7,    name: 'Prārambha', emoji: '🌱', desc: '7 sessions'    },
  { threshold: 21,   name: 'Abhyāsa',  emoji: '⚡', desc: '21 sessions'   },
  { threshold: 40,   name: 'Tapas',    emoji: '🔆', desc: '40 sessions'   },
  { threshold: 108,  name: 'Mālā',     emoji: '📿', desc: '108 sessions'  },
{ threshold: 365,  name: 'Varshika', emoji: '🌕', desc: '365 sessions'  },
  { threshold: 1000, name: 'Sahasra',  emoji: '💎', desc: '1000 sessions' },
];

function ShieldBadgesPreview({
  streak, totalSessions, isDark,
}: {
  streak: number; totalSessions: number; isDark: boolean;
}) {
  const h1      = isDark ? '#f5dfa0' : '#1a0a02';
  const muted   = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';
  // Shields — gold sanctuary gradient
  const cardBg  = isDark
    ? 'linear-gradient(150deg, rgba(44,36,20,0.98) 0%, rgba(34,28,16,0.96) 100%)'
    : 'linear-gradient(150deg, rgba(255,246,220,0.97) 0%, rgba(250,235,195,0.99) 100%)';
  const cardBdr = isDark ? 'rgba(197, 160, 89,0.22)' : 'rgba(197, 160, 89,0.24)';

  const streakEarned  = STREAK_SHIELDS.filter(s => streak >= s.threshold).length;
  const sessionEarned = SESSION_SHIELDS.filter(s => totalSessions >= s.threshold).length;
  const totalEarned   = streakEarned + sessionEarned;
  const totalShields  = STREAK_SHIELDS.length + SESSION_SHIELDS.length;

  const nextStreak  = STREAK_SHIELDS.find(s => streak < s.threshold);
  const nextSession = SESSION_SHIELDS.find(s => totalSessions < s.threshold);

  return (
    <motion.div 
      className="rounded-[2.2rem] p-6 divine-glass-card-premium" 
      style={{ background: cardBg, border: `1px solid ${cardBdr}`, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', perspective: 1000 }}
      whileHover={{ rotateX: 1, rotateY: -1, scale: 1.005 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-500/70">
            Achievement Shields
          </p>
          <p className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-serif)', color: h1 }}>
            {totalEarned} / {totalShields} <span className="text-[10px] font-normal opacity-40">earned</span>
          </p>
        </div>
        <Link href="/my-progress/shields"
          className="rounded-full px-4 py-2 text-[11px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500">
          Shields →
        </Link>
      </div>

      {/* Mini shields row — Premium Revamp */}
      <div className="flex gap-2.5 mb-6">
        {STREAK_SHIELDS.map(shield => {
          const earned = streak >= shield.threshold;
          const isMilestone = shield.threshold === 7 || shield.threshold === 9;
          return (
            <div key={shield.threshold} className="flex-1 flex flex-col items-center gap-1.5">
              <motion.div
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-xl relative overflow-hidden"
                initial={false}
                animate={{ 
                  scale: earned ? 1 : 0.95,
                  boxShadow: earned && isMilestone ? '0 0 15px rgba(251, 191, 36, 0.4)' : 'none'
                }}
                whileHover={shield.threshold === 9 ? {
                  scale: 2.2,
                  rotate: [0, -10, 10, -5, 5, 0],
                  transition: { type: 'spring', stiffness: 600, damping: 12 }
                } : shield.threshold === 7 ? {
                  scale: 1.8,
                  y: -5,
                  transition: { type: 'spring', stiffness: 500 }
                } : { scale: 1.1 }}
                style={{
                  background: earned
                    ? isDark ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.1)'
                    : 'rgba(255,255,255,0.03)',
                  border: earned
                    ? `1px solid ${isMilestone ? '#f59e0b' : 'rgba(251,191,36,0.25)'}`
                    : '1px solid rgba(255,255,255,0.05)',
                  filter: earned ? 'none' : 'grayscale(1) opacity(0.2)',
                }}
              >
                <SacredIcon name={shieldIconMap[shield.emoji]} size={16} />
                {earned && isMilestone && (
                  <motion.div 
                    className="absolute inset-0"
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ background: 'white' }}
                  />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Next milestone progress */}
      {(nextStreak || nextSession) && (() => {
        const next = nextStreak ?? nextSession!;
        const val  = nextStreak ? streak : totalSessions;
        const pct  = Math.min(100, Math.round((val / next.threshold) * 100));
        return (
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                Target: <span className="text-amber-500">{next.name}</span>
              </span>
              <span className="text-[10px] font-bold text-white/40">
                {val}/{next.threshold}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,rgba(197, 160, 89,0.75),rgba(212,100,20,0.85))' }}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
            </div>
          </div>
        );
      })()}
      {!nextStreak && !nextSession && (
        <p className="text-center text-sm" style={{ color: 'rgba(197, 160, 89,0.70)', fontFamily: 'var(--font-serif)' }}>
          सर्वसिद्धि — All shields earned! 🙏
        </p>
      )}
    </motion.div>
  );
}

// ── Advanced Analytics (Zenith) ───────────────────────────────────────────────
interface AdvancedData {
  quiz:  { total_answered: number; accuracy_pct: number; by_tradition: { tradition: string; answered: number; accuracy_pct: number }[] };
  mood:  { total_checkins: number; most_frequent_mood: string | null; mood_frequency: { mood: string; count: number }[]; action_rate_pct: number };
  vrat:  { total_observed: number; unique_vratas: number; last_30_days: number; recent: { vrat_id: string; vrat_name: string; date: string; karma_earned: number }[] };
  karma: { current_total: number; seva_score: number; last_30_days_earned: number; breakdown: { reason: string; total: number }[] };
}

const MOOD_EMOJI: Record<string, string> = {
  peaceful: '🕊️', grateful: '🙏', focused: '🎯', energised: '⚡',
  anxious: '😰', sad: '😔', distracted: '🌀', angry: '🔥',
  neutral: '😐', hopeful: '🌱', joyful: '😊', tired: '😴',
};

const KARMA_REASON_LABELS: Record<string, string> = {
  japa_complete:       'Japa',
  quiz_complete:       'Quiz',
  nitya_karma:         'Nitya Karma',
  pathshala_lesson:    'Pathshala',
  sankalpa_complete:   'Sankalpa',
  vrat_complete:       'Vrat',
  mala_session:        'Mala Session',
  streak_milestone:    'Streak',
  profile_complete:    'Profile',
  seva:                'Seva',
  referral:            'Referral',
  kul_event:           'Kul Event',
};

function AdvancedAnalyticsSection({ isPro, isDark }: { isPro: boolean; isDark: boolean }) {
  const [data, setData]       = useState<AdvancedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const h1    = isDark ? '#f5dfa0' : '#1a0a02';
  const muted = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';
  const amber = 'rgba(197,160,89,';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)';
  const cardBdr = isDark ? 'rgba(197,160,89,0.14)' : 'rgba(180,120,40,0.14)';

  useEffect(() => {
    if (!isPro) return;
    setLoading(true);
    fetch('/api/analytics/advanced')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Could not load analytics'))
      .finally(() => setLoading(false));
  }, [isPro]);

  // ── Locked preview for non-pro users ─────────────────────────────────────
  if (!isPro) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
        className="mb-8 relative overflow-hidden rounded-[1.8rem]"
        style={{ background: isDark ? 'rgba(197,160,89,0.06)' : 'rgba(197,160,89,0.04)', border: `1px solid rgba(197,160,89,0.22)` }}
      >
        {/* Blurred preview */}
        <div className="p-5 blur-[5px] pointer-events-none select-none">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: `${amber}0.70)` }}>
            ✦ Advanced Analytics
          </p>
          <div className="grid grid-cols-2 gap-3">
            {['Quiz Accuracy', 'Mood Pattern', 'Vrat Practice', 'Karma Flow'].map(label => (
              <div key={label} className="rounded-xl p-3" style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
                <div className="h-8 w-12 rounded-full mb-2" style={{ background: `${amber}0.15)` }} />
                <p className="text-xs font-medium" style={{ color: h1 }}>{label}</p>
                <p className="text-[10px]" style={{ color: muted }}>—</p>
              </div>
            ))}
          </div>
        </div>
        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
          <Lock size={22} style={{ color: `${amber}0.80)` }} />
          <div className="text-center">
            <p className="font-serif text-base font-semibold" style={{ color: h1 }}>Advanced Analytics</p>
            <p className="text-xs mt-1" style={{ color: muted }}>Quiz accuracy, mood patterns, vrat history, karma flow — all in one place.</p>
          </div>
          <Link
            href="/settings/subscription"
            className="px-6 py-2.5 rounded-full text-xs font-bold transition-opacity hover:opacity-90"
            style={{ background: `${amber}0.90)`, color: '#1c1208' }}
          >
            Upgrade to Zenith →
          </Link>
        </div>
      </motion.section>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <motion.section
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="mb-8 rounded-[1.8rem] p-5"
        style={{ background: cardBg, border: `1px solid ${cardBdr}` }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-4" style={{ color: `${amber}0.70)` }}>
          ✦ Advanced Analytics
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => (
            <div key={i} className="rounded-xl p-3 animate-pulse" style={{ background: `${amber}0.07)`, border: `1px solid ${amber}0.10)` }}>
              <div className="h-14 rounded-lg" style={{ background: `${amber}0.10)` }} />
            </div>
          ))}
        </div>
      </motion.section>
    );
  }

  if (error || !data) return null;

  const { quiz, mood, vrat, karma } = data;

  // Quiz accuracy ring (SVG)
  const R = 28, CX = 36, CY = 36;
  const circ = 2 * Math.PI * R;
  const quizDash = (quiz.accuracy_pct / 100) * circ;

  // Mood frequency bars
  const topMoods = mood.mood_frequency.slice(0, 4);
  const maxMoodCount = topMoods[0]?.count || 1;

  // Karma breakdown bars
  const topKarma = karma.breakdown.slice(0, 4);
  const maxKarma = topKarma[0]?.total || 1;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
      className="mb-8 rounded-[1.8rem] overflow-hidden"
      style={{ background: isDark ? 'rgba(197,160,89,0.04)' : 'rgba(255,253,245,0.96)', border: `1px solid rgba(197,160,89,0.20)` }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: `${amber}0.80)` }}>
          ✦ Advanced Analytics
        </p>
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${amber}0.12)`, color: `${amber}0.85)` }}>
          Zenith
        </span>
      </div>

      <div className="px-5 pb-5 grid grid-cols-2 gap-3">

        {/* ── Quiz accuracy ring ── */}
        <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: `${amber}0.65)` }}>Quiz</p>
          <div className="flex items-center gap-3">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx={CX} cy={CY} r={R} fill="none" stroke={`${amber}0.12)`} strokeWidth="7" />
              <circle cx={CX} cy={CY} r={R} fill="none"
                stroke={quiz.total_answered > 0 ? `${amber}0.85)` : `${amber}0.15)`}
                strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${quizDash} ${circ - quizDash}`}
                strokeDashoffset={circ / 4}
                style={{ transition: 'stroke-dasharray 0.9s ease' }}
              />
              <text x={CX} y={CY + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill={quiz.total_answered > 0 ? (isDark ? '#f5dfa0' : '#1a0a02') : `${amber}0.30)`}>
                {quiz.total_answered > 0 ? `${quiz.accuracy_pct}%` : '—'}
              </text>
            </svg>
            <div>
              <p className="text-xs font-semibold" style={{ color: h1 }}>
                {quiz.total_answered > 0 ? 'Accuracy' : 'No data yet'}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: muted }}>{quiz.total_answered} answered</p>
              {quiz.by_tradition.length > 0 && (
                <p className="text-[9px] mt-1" style={{ color: muted }}>
                  Best: {quiz.by_tradition.sort((a, b) => b.accuracy_pct - a.accuracy_pct)[0]?.tradition ?? '—'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Mood frequency ── */}
        <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#10b981' }}>Mood</p>
          {mood.total_checkins === 0 ? (
            <div className="flex items-center justify-center h-14">
              <p className="text-[10px]" style={{ color: muted }}>No check-ins yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {topMoods.slice(0, 3).map(({ mood: m, count }) => (
                <div key={m} className="flex items-center gap-1.5">
                  <span className="text-[12px] w-4">{MOOD_EMOJI[m] ?? '🫧'}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'rgba(16,185,129,0.70)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((count / maxMoodCount) * 100)}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="text-[9px] w-3 text-right" style={{ color: muted }}>{count}</span>
                </div>
              ))}
              <p className="text-[9px] mt-1" style={{ color: muted }}>{mood.action_rate_pct}% acted on mood</p>
            </div>
          )}
        </div>

        {/* ── Vrat practice ── */}
        <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9575cd' }}>Vrat</p>
          {vrat.total_observed === 0 ? (
            <div>
              <p className="text-[10px]" style={{ color: muted }}>No vratas recorded</p>
              <Link href="/vrat/ekadashi" className="text-[9px] mt-1 block" style={{ color: `${amber}0.75)` }}>
                Start with Ekadashi →
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-bold font-serif" style={{ color: h1 }}>{vrat.total_observed}</p>
              <p className="text-[10px]" style={{ color: muted }}>total observations</p>
              <p className="text-[9px] mt-1" style={{ color: muted }}>
                {vrat.unique_vratas} unique · {vrat.last_30_days} this month
              </p>
              {vrat.recent[0] && (
                <p className="text-[9px] mt-1.5 truncate" style={{ color: `${amber}0.70)` }}>
                  Last: {vrat.recent[0].vrat_name}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Karma breakdown ── */}
        <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: `${amber}0.70)` }}>Karma</p>
          {karma.last_30_days_earned === 0 && topKarma.length === 0 ? (
            <div>
              <p className="text-2xl font-bold font-serif" style={{ color: h1 }}>{karma.current_total}</p>
              <p className="text-[10px]" style={{ color: muted }}>total points</p>
              <p className="text-[9px] mt-1" style={{ color: muted }}>Seva: {karma.seva_score}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {topKarma.slice(0, 3).map(({ reason, total }) => (
                <div key={reason} className="flex items-center gap-1.5">
                  <span className="text-[9px] w-14 truncate" style={{ color: muted }}>
                    {KARMA_REASON_LABELS[reason] ?? reason}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${amber}0.10)` }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `${amber}0.75)` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((total / maxKarma) * 100)}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="text-[9px]" style={{ color: muted }}>{total}</span>
                </div>
              ))}
              {karma.last_30_days_earned > 0 && (
                <p className="text-[9px] mt-0.5" style={{ color: muted }}>+{karma.last_30_days_earned} this month</p>
              )}
            </div>
          )}
        </div>

      </div>
    </motion.section>
  );
}

// ── AI explanation hook ────────────────────────────────────────────────────────
function useAiExplain() {
  const [loading, setLoading] = useState(false);
  const [text,    setText]    = useState<string | null>(null);

  const explain = useCallback(async (prompt: string) => {
    if (loading || text) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: 'You are a wise spiritual guide. Interpret the user\'s sadhana (spiritual practice) data in 2–3 sentences — warm, encouraging, specific. No bullet points. Use Sanskrit terms naturally.',
        }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setText(json.reply ?? json.content ?? json.message ?? 'Could not generate interpretation.');
    } catch {
      setText('Could not generate AI interpretation right now. Trust your practice — the data speaks for itself.');
    } finally {
      setLoading(false);
    }
  }, [loading, text]);

  return { loading, text, explain, reset: () => setText(null) };
}

// ── Premium Report Modal ──────────────────────────────────────────────────────
function ReportModal({ report, isPro, onClose, isDark, streak }: {
  report: ReportData; isPro: boolean; onClose: () => void; isDark: boolean; streak: number;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const japaAi   = useAiExplain();
  const nityaAi  = useAiExplain();

  const bg     = isDark ? '#130e08' : '#fdf6ec';
  const card   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.92)';
  const border = isDark ? 'rgba(197, 160, 89,0.14)' : 'rgba(180,120,40,0.14)';
  const h1     = isDark ? '#f5dfa0' : '#1a0a02';
  const muted  = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';

  const nityaRate = report.curDaysElapsed
    ? Math.round((report.curNityaDays / report.curDaysElapsed) * 100)
    : 0;

  const highlights: string[] = [];
  if (report.curRounds >= 21) highlights.push(`Completed ${report.curRounds} japa rounds — steadfast sādhaka 🙏`);
  if (nityaRate >= 80)        highlights.push(`${nityaRate}% Nitya Karma completion — consistent dharmic practice`);
  if (report.curSessions >= 10) highlights.push(`${report.curSessions} japa sessions this month — strong habit`);
  if (report.topMantra)       highlights.push(`Favourite mantra: "${report.topMantra}"`);
  if (!highlights.length)     highlights.push('Every step on the path of sādhana matters. Keep going. 🕉️');

  function handlePrint() { window.print(); }

  function handleShare() {
    const nityaRate2 = report.curDaysElapsed
      ? Math.round((report.curNityaDays / report.curDaysElapsed) * 100)
      : 0;
    const text = `🕉️ ${monthName(report.curMonthStart)} Sādhana Report\n🔥 ${streak}-day streak\n🪷 ${report.curSessions} japa sessions · ${report.curRounds} rounds\n🌅 ${nityaRate2}% Nitya Karma\nPracticed with Shoonaya 🙏`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'My Sadhana Report', text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {});
    }
  }

  if (!isPro) {
    return (
      <motion.div
        className="fixed inset-0 z-[90] flex items-end justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
          className="relative z-10 w-full max-w-lg rounded-t-[2rem] p-6 pb-10 text-center"
          style={{ background: isDark ? '#1a0e08' : '#fdf6ec', border: `1px solid ${border}` }}>
          <div className="text-4xl mb-3">📊</div>
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: h1 }}>
            Sadhana Report
          </h2>
          <p className="mt-2 text-sm" style={{ color: muted }}>
            A beautiful monthly summary of your entire practice — all pillars, trends, highlights — available with Shoonaya Pro.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Lock size={14} className="mx-auto" style={{ color: 'rgba(197, 160, 89,0.6)' }} />
            <p className="text-xs" style={{ color: 'rgba(197, 160, 89,0.7)' }}>Premium Feature</p>
          </div>
          <button onClick={onClose} className="mt-4 text-xs" style={{ color: muted }}>Close</button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[90] overflow-y-auto"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Backdrop */}
      <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 min-h-screen flex items-start justify-center px-4 py-8">
        <div ref={printRef} className="w-full max-w-lg print:shadow-none"
          style={{ background: bg, borderRadius: '1.5rem', overflow: 'hidden' }}>

          {/* ── Report header ── */}
          <div className="px-6 pt-7 pb-5"
            style={{ background: isDark ? 'linear-gradient(160deg,rgba(60,28,8,0.9),rgba(30,16,6,0.95))' : 'linear-gradient(160deg,rgba(255,235,200,0.98),rgba(250,220,175,0.99))' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: 'rgba(197, 160, 89,0.65)' }}>Sadhana Report</p>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600, color: h1, lineHeight: 1.2 }}>
                  {monthName(report.curMonthStart)}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleShare}
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: isDark ? 'rgba(197, 160, 89,0.12)' : 'rgba(197, 160, 89,0.10)', border: `1px solid ${border}` }} aria-label="Share">
                  <Share2 size={15} style={{ color: 'rgba(197, 160, 89,0.75)' }} />
                </button>
                <div className="text-3xl">🕉️</div>
              </div>
            </div>
            {/* Streak hero */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 flex-shrink-0"
                style={{
                  background: streak > 0
                    ? (isDark ? 'rgba(200,100,20,0.18)' : 'rgba(255,140,40,0.12)')
                    : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                  border: `1.5px solid ${streak > 0 ? 'rgba(220,120,40,0.30)' : border}`,
                }}>
                <motion.span
                  className="text-2xl leading-none select-none"
                  animate={streak > 0 ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
                  🔥
                </motion.span>
                <div>
                  <p className="text-2xl font-bold leading-none"
                    style={{ fontFamily: 'var(--font-serif)', color: streak > 0 ? (isDark ? '#f5c87a' : '#b45309') : muted }}>
                    {streak}
                  </p>
                  <p className="text-[10px] mt-0.5 whitespace-nowrap" style={{ color: muted }}>
                    {streak === 0 ? 'Start your streak' : `day${streak !== 1 ? 's' : ''} streak`}
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs leading-snug" style={{ color: muted }}>
                  {streak === 0
                    ? 'Begin today — every great sādhaka started with day one.'
                    : streak < 7
                    ? 'Keep going — a week of consistency changes the mind.'
                    : streak < 21
                    ? 'One week complete! Habits form at 21 days — you\'re on the path.'
                    : streak < 40
                    ? 'Three weeks of discipline — your Niyama is taking root.'
                    : streak < 108
                    ? `${streak} days of unbroken sādhana — a true Abhyāsa.`
                    : 'Pūrṇa Mālā 🙏 — 108 days of unbroken devotion. Extraordinary.'}
                </p>
              </div>
            </div>

            {/* Summary pills */}
            <div className="mt-3 flex gap-2 flex-wrap">
              {[
                { label: 'Sessions', value: String(report.curSessions) },
                { label: 'Rounds',   value: String(report.curRounds)   },
                { label: 'Beads',    value: fmt(report.curBeads)        },
                { label: 'Nitya',    value: `${nityaRate}%`             },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl px-3 py-1.5 text-center"
                  style={{ background: isDark ? 'rgba(197, 160, 89,0.12)' : 'rgba(197, 160, 89,0.10)', border: `1px solid ${border}` }}>
                  <p className="text-base font-bold" style={{ color: h1 }}>{value}</p>
                  <p className="text-[10px]" style={{ color: muted }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">

            {/* ── Japa vs prev month ── */}
            <motion.div whileTap={{ scale: 0.99 }} className="rounded-[1.2rem] p-4 cursor-pointer"
              style={{ background: card, border: `1px solid ${border}` }}
              onClick={() => japaAi.explain(`This user's japa practice this month: ${report.curSessions} sessions, ${report.curRounds} rounds, ${report.curBeads} beads${report.topMantra ? `, favourite mantra: ${report.topMantra}` : ''}. Last month was ${report.prevSessions} sessions, ${report.prevRounds} rounds, ${report.prevBeads} beads. Current streak: ${streak} days. Interpret this data as a spiritual guide.`)}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'rgba(197, 160, 89,0.7)' }}>
                  <SacredIcon name="japa" size={14} /> Japa Practice
                </p>
                <div className="flex items-center gap-2">
                  <Link href="/bhakti/mala/insights" onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5"
                    style={{ color: 'rgba(197, 160, 89,0.6)', background: 'rgba(197, 160, 89,0.08)', border: '1px solid rgba(197, 160, 89,0.14)' }}>
                    <ExternalLink size={9} /> Insights
                  </Link>
                  <span className="text-[10px]" style={{ color: muted }}>Tap for AI ✨</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Sessions', cur: report.curSessions, prev: report.prevSessions },
                  { label: 'Rounds',   cur: report.curRounds,   prev: report.prevRounds   },
                  { label: 'Beads',    cur: report.curBeads,    prev: report.prevBeads,   fmt: true },
                ].map(({ label, cur, prev, fmt: doFmt }) => (
                  <div key={label}>
                    <p className="text-lg font-bold" style={{ color: h1 }}>{doFmt ? fmt(cur) : cur}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: muted }}>{label}</p>
                    <div className="mt-1"><Trend cur={cur} prev={prev} /></div>
                  </div>
                ))}
              </div>
              {report.topMantra && (
                <p className="mt-3 text-xs pt-3" style={{ color: muted, borderTop: `1px solid ${border}` }}>
                  Most chanted: <span style={{ color: h1 }}>{report.topMantra}</span>
                </p>
              )}
              {/* AI explanation — Premium Revamp */}
              <AnimatePresence>
                {(japaAi.loading || japaAi.text) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mt-4 p-4 rounded-[1.5rem]" 
                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}
                  >
                    {japaAi.loading
                      ? <div className="flex items-center gap-2">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                            <Sparkles size={14} className="text-amber-500" />
                          </motion.div>
                          <span className="text-[11px] font-bold text-amber-500/70">Consulting Divine Wisdom…</span>
                        </div>
                      : <div className="relative">
                          <Sparkles size={12} className="absolute -top-1 -left-1 text-amber-500/40" />
                          <p className="text-[13px] leading-relaxed italic" style={{ color: h1, fontFamily: 'var(--font-serif)' }}>{japaAi.text}</p>
                        </div>
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Nitya Karma ── */}
            <motion.div whileTap={{ scale: 0.99 }} className="rounded-[1.2rem] p-4 cursor-pointer"
              style={{ background: card, border: `1px solid ${border}` }}
              onClick={() => nityaAi.explain(`This user completed Nitya Karma (daily dharmic duties) on ${report.curNityaDays} out of ${report.curDaysElapsed} days this month (${nityaRate}% completion rate). Their overall streak is ${streak} days. Interpret this as a spiritual guide.`)}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'rgba(197, 160, 89,0.7)' }}>
                  <SacredIcon name="sunrise" size={14} /> Nitya Karma
                </p>
                <div className="flex items-center gap-2">
                  <Link href="/nitya-karma/insights" onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5"
                    style={{ color: 'rgba(197, 160, 89,0.6)', background: 'rgba(197, 160, 89,0.08)', border: '1px solid rgba(197, 160, 89,0.14)' }}>
                    <ExternalLink size={9} /> Insights
                  </Link>
                  <span className="text-[10px]" style={{ color: muted }}>Tap for AI ✨</span>
                </div>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-3xl font-bold font-serif" style={{ color: h1 }}>{nityaRate}%</p>
                  <p className="text-[10px] mt-0.5" style={{ color: muted }}>Completion rate</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-serif" style={{ color: h1 }}>{report.curNityaDays}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: muted }}>Days completed</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs" style={{ color: muted }}>of {report.curDaysElapsed} days elapsed</p>
                </div>
              </div>
              <AnimatePresence>
                {(nityaAi.loading || nityaAi.text) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mt-4 p-4 rounded-[2.2rem]" 
                    style={{ background: 'rgba(140,180,100,0.08)', border: '1px solid rgba(140,180,100,0.15)' }}
                  >
                    {nityaAi.loading
                      ? <div className="flex items-center gap-2">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                            <Sparkles size={14} className="text-green-500" />
                          </motion.div>
                          <span className="text-[11px] font-bold text-green-500/70">Analyzing Dharmic Rhythm…</span>
                        </div>
                      : <div className="relative">
                          <Sparkles size={12} className="absolute -top-1 -left-1 text-green-500/40" />
                          <p className="text-[13px] leading-relaxed italic" style={{ color: h1, fontFamily: 'var(--font-serif)' }}>{nityaAi.text}</p>
                        </div>
                    }
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-4 h-2 rounded-full overflow-hidden bg-white/5">
                <motion.div className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,rgba(140,180,100,0.8),rgba(100,160,70,0.9))' }}
                  initial={{ width: 0 }} animate={{ width: `${nityaRate}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
              </div>
              <AnimatePresence>
                {(nityaAi.loading || nityaAi.text) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                    {nityaAi.loading
                      ? <div className="flex items-center gap-2"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Sparkles size={12} style={{ color: 'rgba(197, 160, 89,0.6)' }} /></motion.div><span className="text-[11px]" style={{ color: muted }}>Interpreting…</span></div>
                      : <p className="text-[12px] leading-relaxed italic" style={{ color: isDark ? 'rgba(245,215,160,0.80)' : '#3a1a06' }}>{nityaAi.text}</p>
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Highlights ── */}
            <div className="rounded-[1.2rem] p-4" style={{ background: card, border: `1px solid ${border}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'rgba(197, 160, 89,0.7)' }}>✨ Highlights</p>
              <ul className="space-y-2">
                {highlights.map((h, i) => (
                  <li key={i} className="text-sm leading-snug" style={{ color: isDark ? 'rgba(245,215,160,0.85)' : '#2a1002' }}>
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Sanskrit encouragement ── */}
            <div className="text-center py-2">
              <p className="text-sm" style={{ fontFamily: 'var(--font-serif)', color: 'rgba(197, 160, 89,0.55)', fontStyle: 'italic' }}>
                योगः कर्मसु कौशलम् — Excellence in action is yoga.
              </p>
            </div>
          </div>

          {/* ── Print footer ── */}
          <div className="px-6 pb-6 flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-medium"
              style={{ background: 'linear-gradient(135deg,rgba(212,100,20,0.9),rgba(197, 160, 89,0.85))', color: '#1c1208' }}>
              <Download size={14} />
              Save as PDF
            </button>
            <button onClick={onClose}
              className="rounded-full px-5 py-3 text-sm"
              style={{ color: muted, border: `1px solid ${border}` }}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .fixed.inset-0.z-\\[90\\] { display: block !important; position: static !important; }
          .fixed.inset-0.bg-black\\/60 { display: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MyProgressClient({
  userName,
  tradition,
  isPro,
  streak,
  heatmap,
  sixMonthHeatmap,
  japa30dSessions,
  japa30dRounds,
  japa30dBeads,
  japa30dMins,
  topMantra,
  dowCounts,
  totalJapaSessions,
  nitya30dDays,
  sevaScore,
  weeklySevaScore,
  mandaliPostCount,
  kulTasksDone,
  report,
  sankalpas,
}: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark    = resolvedTheme === 'dark';
  const [showReport, setShowReport]     = useState(false);
  const [calView, setCalView] = useState<'calendar' | 'sparkline'>('calendar');
  const [midpointRefreshKey, setMidpointRefreshKey] = useState(0);

  const [completionCeremony, setCompletionCeremony] = useState<{
    open: boolean;
    title: string;
    durationDays: number;
  }>({ open: false, title: '', durationDays: 0 });

  const [checkinMap, setCheckinMap] = useState<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    const activeSankalpas = sankalpas.filter((s) => s.status === 'active');
    if (activeSankalpas.length === 0) return;

    async function fetchCheckins() {
      try {
        const promises = activeSankalpas.map(async (s) => {
          const res = await fetch(`/api/sankalpa/checkin?sankalpa_id=${s.id}`);
          if (!res.ok) throw new Error(`Failed to fetch checkin for sankalpa ${s.id}`);
          const data = await res.json();
          return { id: s.id, dates: new Set<string>(data.checkins || []) };
        });

        const results = await Promise.all(promises);
        setCheckinMap((prev) => {
          const next = new Map(prev);
          for (const res of results) {
            next.set(res.id, res.dates);
          }
          return next;
        });
      } catch (err) {
        console.error('[MyProgressClient] load checkins failed:', err);
      }
    }

    fetchCheckins();
  }, [sankalpas]);

  function hasFiredCompletion(id: string) {
    try { return localStorage.getItem(`shoonaya-sankalpa-completed-${id}`) === 'true'; }
    catch { return false; }
  }

  async function handleComplete(id: string, title: string, durationDays: number) {
    try {
      localStorage.setItem(`shoonaya-sankalpa-completed-${id}`, 'true');
    } catch {}
    
    setCompletionCeremony({ open: true, title, durationDays });
    
    fetch('/api/sankalpa/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sankalpa_id: id }),
    }).catch(console.error);
  }

  const handleCheckin = useCallback(async (sankalpaId: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setCheckinMap((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(sankalpaId) ?? []);
      set.add(todayStr);
      next.set(sankalpaId, set);
      return next;
    });

    try {
      await fetch('/api/sankalpa/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sankalpa_id: sankalpaId }),
      });
      toast.success('Checked in! 🙏');
    } catch (err) {
      console.error('[sankalpa/checkin] Failed to checkin:', err);
    }
  }, []);

  const hasMidpointReflection = useCallback((sankalpaId: string) => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`shoonaya-midpoint-${sankalpaId}`) === 'done';
  }, []);

  const handleMidpointReaction = useCallback((sankalpaId: string, mood: 'strong' | 'struggling' | 'grateful') => {
    try {
      localStorage.setItem(`shoonaya-midpoint-${sankalpaId}`, 'done');
    } catch {
      // keep UI-only fallback
    }

    setMidpointRefreshKey((current) => current + 1);

    fetch('/api/sankalpa/reflection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sankalpa_id: sankalpaId, mood, reflection_type: 'midpoint' }),
    }).catch(console.error);

    const messages = {
      strong: 'Stay the course. The divine sees your effort. 🙏',
      struggling: 'Even struggle is sadhana. Keep going. 🌱',
      grateful: 'Gratitude itself is the fruit. Keep walking. ✨',
    } as const;

    toast.success(messages[mood]);
  }, []);

  // ── Page + shared tokens ──────────────────────────────────────────────────
  const pageBg  = isDark
    ? 'linear-gradient(165deg,#0e0a05 0%,#17100a 50%,#1a1208 100%)'
    : 'linear-gradient(165deg,#fdf6ee 0%,#f5e8d5 50%,#f0dfc8 100%)';
  const h1      = isDark ? '#f5dfa0' : '#1a0a02';
  const muted   = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';
  const dimText = isDark ? 'rgba(245,210,130,0.30)' : 'rgba(100,55,10,0.35)';
  const amber   = 'rgba(197, 160, 89,0.70)';

  // ── Per-card sanctuary gradients (mirrors HOME_THEMES) ────────────────────
  // Calendar — panchang: dawn amber
  const cardCalBg  = isDark
    ? 'linear-gradient(150deg, rgba(52,42,28,0.97) 0%, rgba(38,32,22,0.96) 100%)'
    : 'linear-gradient(150deg, rgba(255,246,232,0.97) 0%, rgba(250,236,210,0.99) 100%)';
  const cardCalBdr = isDark ? 'rgba(197, 160, 89,0.22)' : 'rgba(197, 160, 89,0.22)';

  // Japa — bhakti: soft terracotta
  const cardJapaBg  = isDark
    ? 'linear-gradient(150deg, rgba(46,34,26,0.98) 0%, rgba(36,28,22,0.96) 100%)'
    : 'linear-gradient(150deg, rgba(255,240,228,0.97) 0%, rgba(248,226,205,0.99) 100%)';
  const cardJapaBdr = isDark ? 'rgba(212,120,74,0.20)' : 'rgba(212,120,74,0.22)';

  // Nitya Karma — mandali: forest-warm green
  const cardNityaBg  = isDark
    ? 'linear-gradient(150deg, rgba(26,34,28,0.98) 0%, rgba(22,28,24,0.96) 100%)'
    : 'linear-gradient(150deg, rgba(236,248,236,0.97) 0%, rgba(220,238,220,0.99) 100%)';
  const cardNityaBdr = isDark ? 'rgba(100,140,100,0.22)' : 'rgba(100,140,100,0.28)';

  // Pathshala mini — deep ink
  const cardPathBg  = isDark
    ? 'linear-gradient(150deg, rgba(30,30,28,0.99) 0%, rgba(24,24,22,0.97) 100%)'
    : 'linear-gradient(150deg, rgba(235,238,248,0.97) 0%, rgba(225,228,240,0.99) 100%)';
  const cardPathBdr = isDark ? 'rgba(197, 160, 89,0.18)' : 'rgba(130,130,200,0.22)';

  // Bhakti mini — warm rose-terracotta
  const cardBhaktiBg  = isDark
    ? 'linear-gradient(150deg, rgba(46,28,30,0.98) 0%, rgba(36,22,24,0.96) 100%)'
    : 'linear-gradient(150deg, rgba(248,234,238,0.97) 0%, rgba(240,220,226,0.99) 100%)';
  const cardBhaktiBdr = isDark ? 'rgba(196,100,120,0.20)' : 'rgba(196,100,120,0.22)';

  // Practice Rhythm — kul: warm earth
  const cardRhythmBg  = isDark
    ? 'linear-gradient(150deg, rgba(38,32,26,0.98) 0%, rgba(30,26,20,0.96) 100%)'
    : 'linear-gradient(150deg, rgba(255,242,224,0.97) 0%, rgba(250,232,205,0.99) 100%)';
  const cardRhythmBdr = isDark ? 'rgba(157,120,74,0.22)' : 'rgba(157,120,74,0.25)';

  // ── Stats ─────────────────────────────────────────────────────────────────
  const nityaRate   = Math.round((nitya30dDays / 30) * 100);
  // Use actual heatmap window as denominator (accounts for new users with < 28 days)
  const japaActiveDays = heatmap.filter(d => d.japa).length;
  const japaRate       = Math.round((japaActiveDays / Math.max(heatmap.length, 1)) * 100);
  const activeDays     = heatmap.filter(d => d.japa || d.nitya).length;
  // Does user have sessions outside the 30-day window?
  const hasOlderSessions = japa30dSessions === 0 && totalJapaSessions > 0;

  return (
    <>
      <PageIntro
        pageKey="sankalpa"
        steps={[
          { emoji: '🕯️', title: 'Sankalpa', body: 'A sacred vow or intention. Set one and the app will track your journey.' },
          { emoji: '📅', title: 'Sacred durations', body: '11, 21, 40, or 108 days — each tied to a cycle of spiritual significance.' },
          { emoji: '🌓', title: 'Mid-point check-in', body: "At the halfway point, we'll ask how you're feeling. Your answer is private." },
        ]}
      />
      <div className="min-h-screen pb-28" style={{ background: pageBg }}>
        {/* Safe area */}
        <div style={{ height: 'max(env(safe-area-inset-top,0px),16px)' }} />

        {/* ── Top bar — Premium Revamp ── */}
        <div className="relative overflow-hidden pt-8 pb-12 px-6">
          {/* 3D Background Pulse */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <motion.div 
              className="absolute -top-24 -left-24 w-64 h-64 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)' }}
            />
          </div>

          <div className="relative flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 relative"
            >
              {/* The 9D Sadhana Sphere */}
              <motion.div
                className="w-32 h-32 rounded-full relative z-10"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #fcd34d 0%, #d97706 50%, #78350f 100%)',
                  boxShadow: '0 0 40px rgba(251, 191, 36, 0.3), inset -10px -10px 30px rgba(0,0,0,0.5)',
                }}
                whileHover={{ 
                  scale: 1.15, 
                  rotateY: 720,
                  transition: { duration: 1.2, ease: "easeOut" }
                }}
                animate={streak >= 9 ? {
                  rotateY: 360,
                  scale: [1, 1.05, 1],
                  boxShadow: '0 0 60px rgba(251, 191, 36, 0.5), inset -10px -10px 30px rgba(0,0,0,0.5)'
                } : { rotateY: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
              {/* Outer Rings */}
              <motion.div 
                className="absolute inset-0 -m-4 border border-amber-500/20 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-0 -m-8 border border-amber-500/10 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-[11px] tracking-[0.25em] uppercase font-bold text-amber-500/60 mb-2">Sādhana Trajectory</p>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 800, color: h1, letterSpacing: '-0.02em' }}>
                {userName}
              </h1>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-amber-500" style={{ fontFamily: 'var(--font-serif)' }}>{streak}</p>
                  <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Streak</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-black text-amber-200" style={{ fontFamily: 'var(--font-serif)' }}>{Math.floor(streak / 9)}</p>
                  <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Navarātri</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-300" style={{ fontFamily: 'var(--font-serif)' }}>{Math.floor(streak / 7)}</p>
                  <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Saptāha</p>
                </div>
              </div>
            </motion.div>
          </div>

          <button onClick={() => router.back()}
            className="absolute top-8 left-6 w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-xl">
            <ChevronLeft size={20} className="text-amber-500" />
          </button>
        </div>

        <div className="px-4 space-y-4">

          {/* ── Signal Summary ── */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
              { label: 'Streak', val: `${streak}d`, icon: 'flame' as SacredIconName },
              { label: 'Seva Points', val: sevaScore ?? 0, icon: 'heart' as SacredIconName },
              { label: 'Posts', val: mandaliPostCount ?? 0, icon: 'mandali' as SacredIconName },
              { label: 'Kul Tasks', val: kulTasksDone ?? 0, icon: 'kul' as SacredIconName },
            ].map(item => (
              <div key={item.label} className="rounded-2xl px-4 py-3 flex-col flex-shrink-0 flex items-center justify-center min-w-[80px]"
                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(197,160,89,0.12)' }}>
                <SacredIcon name={item.icon} size={14} style={{ color: '#C5A059' }} className="mb-1" />
                <span className="text-xl font-bold" style={{ color: 'var(--divine-text)' }}>{item.val}</span>
                <span className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'rgba(197,160,89,0.55)' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* ── 9-Day Rhythm Card — Premium Addition ── */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[2.2rem] p-6 divine-glass-card-premium"
            style={{ 
              background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(0,0,0,0) 100%)',
              border: '1px solid rgba(251,191,36,0.15)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              perspective: 1000
            }}
            whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber-500/70">9-Day Rhythm</h2>
                <p className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-serif)', color: h1 }}>Navarātri Readiness</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Sparkles size={24} className="text-amber-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Current Cycle', val: `${(streak % 9) + 1}/9`, icon: 'sparkles' as SacredIconName },
                { label: 'Intensity', val: streak > 40 ? 'High' : 'Steady', icon: 'flame' as SacredIconName },
                { label: 'Focus', val: 'Devotion', icon: 'heart' as SacredIconName },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className="mb-1"><SacredIcon name={item.icon} size={22} strokeWidth={1.6} style={{ color: 'var(--brand-primary)' }} /></div>
                  <p className="text-lg font-bold" style={{ color: h1 }}>{item.val}</p>
                  <p className="text-[9px] uppercase tracking-tighter text-white/30 font-bold">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[12px] leading-relaxed italic text-amber-200/80">
                &ldquo;{streak >= 9 ? 'You have completed a full Navarātri cycle. Your spirit is attuned to the divine rhythm.' : 'You are approaching your first Navarātri milestone. Every breath is a step toward liberation.'}&rdquo;
              </p>
            </div>
          </motion.section>

          {/* ── 6-Month History — GitHub-style heatmap ── */}
          {sixMonthHeatmap && sixMonthHeatmap.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
              className="rounded-[2rem] p-5 overflow-hidden"
              style={{
                background: isDark ? 'rgba(30,18,4,0.65)' : 'rgba(255,248,235,0.80)',
                border: isDark ? '1px solid rgba(197,160,89,0.14)' : '1px solid rgba(197,160,89,0.22)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: amber + 'aa' }}>
                    6-Month History
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: muted }}>
                    26 weeks · Japa & Nitya
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto pb-1">
                <SixMonthHeatmap days={sixMonthHeatmap} isDark={isDark} />
              </div>
            </motion.section>
          )}

          {/* ── Activity Calendar ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[2.2rem] p-6 divine-glass-card-premium"
            style={{ background: cardCalBg, border: `1px solid ${cardCalBdr}`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', perspective: 1000 }}
            whileHover={{ scale: 1.005 }}
          >
            {/* ... calendar content ... */}

            {/* Compact header: title + streak pill + stats + toggle */}
            <div className="flex items-center gap-2 mb-3">
              {/* Label + streak inline */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: muted }}>Sādhana Calendar</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <motion.span
                    style={{ fontSize: '1rem' }}
                    animate={streak > 0 ? { scale: [1, 1.18, 1] } : {}}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                  >
                    🔥
                  </motion.span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, color: h1 }}>
                    {streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''}` : 'Start your streak'}
                  </span>
                </div>
              </div>

              {/* Stat pills */}
              <div className="flex items-center gap-1.5">
                <div className="rounded-lg px-2 py-1 text-center" style={{ background: isDark ? 'rgba(197, 160, 89,0.12)' : 'rgba(197, 160, 89,0.10)', border: `1px solid rgba(197, 160, 89,0.18)` }}>
                  <p className="text-[13px] font-bold leading-none" style={{ color: h1 }}>{activeDays}</p>
                  <p className="text-[8px] mt-0.5" style={{ color: muted }}>active</p>
                </div>
                <div className="rounded-lg px-2 py-1 text-center" style={{ background: isDark ? 'rgba(140,180,100,0.10)' : 'rgba(140,180,100,0.10)', border: '1px solid rgba(140,180,100,0.18)' }}>
                  <p className="text-[13px] font-bold leading-none" style={{ color: h1 }}>{nityaRate}%</p>
                  <p className="text-[8px] mt-0.5" style={{ color: muted }}>nitya</p>
                </div>
              </div>

              {/* View toggle: Calendar / Sparkline */}
              <div className="flex items-center gap-1 p-0.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                <button
                  onClick={() => setCalView('calendar')}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                  style={{ background: calView === 'calendar' ? 'rgba(197, 160, 89,0.22)' : 'transparent' }}
                  aria-label="Month calendar"
                >
                  <Calendar size={12} style={{ color: amber }} />
                </button>
                <button
                  onClick={() => setCalView('sparkline')}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                  style={{ background: calView === 'sparkline' ? 'rgba(197, 160, 89,0.22)' : 'transparent' }}
                  aria-label="Activity graph"
                >
                  <Activity size={12} style={{ color: amber }} />
                </button>
              </div>
            </div>

            {/* Calendar / Sparkline toggle view */}
            <AnimatePresence mode="wait">
              <motion.div
                key={calView}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {calView === 'calendar'
                  ? <InteractiveCalendar days={heatmap} isDark={isDark} />
                  : <SparklineView days={heatmap} isDark={isDark} />
                }
              </motion.div>
            </AnimatePresence>
          </motion.section>

          {/* ── Practice pillars ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
            className="space-y-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] px-2 text-amber-500/50">
              Practice Pillars · 30 Days
            </p>

            {/* Japa card — Premium Revamp */}
            <motion.div 
              className="rounded-[2.2rem] p-6 divine-glass-card-premium" 
              style={{ background: cardJapaBg, border: `1px solid ${cardJapaBdr}`, boxShadow: '0 20px 40px rgba(0,0,0,0.35)', perspective: 1000 }}
              whileHover={{ rotateX: 1, rotateY: 1, scale: 1.01 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🪷</span>
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-amber-500/70">Japa</h2>
                    <p className="text-[10px] text-white/30 uppercase tracking-tight">Mantra Repetition</p>
                  </div>
                </div>
                <Link href="/bhakti/mala/insights"
                  className="rounded-full px-4 py-2 text-[11px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  Insights →
                </Link>
              </div>

              {japa30dSessions === 0 ? (
                <div className="text-center py-6">
                  <p className="text-3xl mb-3">📿</p>
                  <p className="text-sm font-bold" style={{ color: h1 }}>No sessions this cycle</p>
                  <Link href="/bhakti/mala"
                    className="inline-flex items-center mt-4 rounded-full px-6 py-2 text-[11px] font-bold bg-amber-500 text-black">
                    Begin Japa →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { val: String(japa30dSessions), sub: 'sessions' },
                      { val: fmt(japa30dBeads),       sub: 'beads'    },
                      { val: japa30dRounds > 0 ? String(japa30dRounds) : '—', sub: 'rounds' },
                      { val: japa30dMins > 0 ? `${japa30dMins}m` : '—',       sub: 'time'   },
                    ].map(({ val, sub: s }) => (
                      <div key={s} className="text-center rounded-2xl py-3 bg-white/5 border border-white/5">
                        <p className="text-xl font-bold" style={{ color: h1, fontFamily: 'var(--font-serif)' }}>{val}</p>
                        <p className="text-[9px] mt-1 font-bold uppercase tracking-tighter text-white/30">{s}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Consistency</span>
                      <span className="text-[10px] font-bold text-amber-500">{japaRate}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-white/5">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
                        initial={{ width: 0 }} animate={{ width: `${japaRate}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </>
              )}
            </motion.div>

            {/* Nitya Karma card — Premium Revamp */}
            <motion.div 
              className="rounded-[2.2rem] p-6 divine-glass-card-premium" 
              style={{ background: cardNityaBg, border: `1px solid ${cardNityaBdr}`, boxShadow: '0 20px 40px rgba(0,0,0,0.35)', perspective: 1000 }}
              whileHover={{ rotateX: 1, rotateY: -1, scale: 1.01 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🌅</span>
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-green-500/70">Nitya Karma</h2>
                    <p className="text-[10px] text-white/30 uppercase tracking-tight">Daily Dharma</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/nitya-karma/insights"
                    className="rounded-full px-3 py-1.5 text-[11px] font-bold bg-green-500/10 border border-green-500/20 text-green-500">
                    Insights
                  </Link>
                  <Link href="/nitya-karma"
                    className="rounded-full px-4 py-1.5 text-[11px] font-bold bg-green-500 text-black">
                    Open →
                  </Link>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { val: String(nitya30dDays), sub: 'completed' },
                  { val: `${nityaRate}%`,      sub: 'rate'      },
                  { val: `${30 - nitya30dDays}`, sub: 'remaining' },
                ].map(({ val, sub: s }) => (
                  <div key={s} className="text-center rounded-2xl py-3 bg-white/5 border border-white/5">
                    <p className="text-xl font-bold" style={{ color: h1, fontFamily: 'var(--font-serif)' }}>{val}</p>
                    <p className="text-[9px] mt-1 font-bold uppercase tracking-tighter text-white/30">{s}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Momentum</span>
                <span className="text-[10px] font-bold text-green-500">{nityaRate}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400"
                  initial={{ width: 0 }} animate={{ width: `${nityaRate}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                />
              </div>
            </motion.div>

            {/* Pathshala + Bhakti mini cards */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/pathshala/insights"
                className="block rounded-[1.6rem] p-4"
                style={{ background: cardPathBg, border: `1px solid ${cardPathBdr}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.30)' : '0 1px 12px rgba(0,0,0,0.06)' }}>
                <div className="h-0.5 rounded-full mb-3" style={{ background: 'rgba(80,160,200,0.55)' }} />
                <span className="text-xl block mb-2">📖</span>
                <p className="text-sm font-semibold" style={{ color: h1 }}>Pathshala</p>
                <p className="text-[10px] mt-0.5" style={{ color: muted }}>Study paths</p>
                <p className="text-[10px] mt-3 font-medium" style={{ color: 'rgba(80,160,200,0.70)' }}>Open →</p>
              </Link>
              <Link href="/bhakti/insights"
                className="block rounded-[1.6rem] p-4"
                style={{ background: cardBhaktiBg, border: `1px solid ${cardBhaktiBdr}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.30)' : '0 1px 12px rgba(0,0,0,0.06)' }}>
                <div className="h-0.5 rounded-full mb-3" style={{ background: 'rgba(196,120,154,0.55)' }} />
                <span className="text-xl block mb-2">🪷</span>
                <p className="text-sm font-semibold" style={{ color: h1 }}>Bhakti</p>
                <p className="text-[10px] mt-0.5" style={{ color: muted }}>Devotion insights</p>
                <p className="text-[10px] mt-3 font-medium" style={{ color: 'rgba(196,120,154,0.70)' }}>Open →</p>
              </Link>
            </div>
            {/* Kul + Mandali mini cards */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Link href="/kul"
                className="block rounded-[1.6rem] p-4"
                style={{ background: cardPathBg, border: `1px solid ${cardPathBdr}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.30)' : '0 1px 12px rgba(0,0,0,0.06)' }}>
                <div className="h-0.5 rounded-full mb-3" style={{ background: 'rgba(197,160,89,0.55)' }} />
                <span className="block mb-2"><SacredIcon name="kul" size={20} /></span>
                <p className="text-sm font-semibold" style={{ color: h1 }}>Kul</p>
                <p className="text-[10px] mt-0.5" style={{ color: muted }}>{kulTasksDone ?? 0} tasks done</p>
                <p className="text-[10px] mt-3 font-medium" style={{ color: 'rgba(197,160,89,0.70)' }}>Open →</p>
              </Link>
              <Link href="/mandali"
                className="block rounded-[1.6rem] p-4"
                style={{ background: cardBhaktiBg, border: `1px solid ${cardBhaktiBdr}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.30)' : '0 1px 12px rgba(0,0,0,0.06)' }}>
                <div className="h-0.5 rounded-full mb-3" style={{ background: 'rgba(196,120,154,0.55)' }} />
                <span className="block mb-2"><SacredIcon name="mandali" size={20} /></span>
                <p className="text-sm font-semibold" style={{ color: h1 }}>Mandali</p>
                <p className="text-[10px] mt-0.5" style={{ color: muted }}>{mandaliPostCount ?? 0} posts</p>
                <p className="text-[10px] mt-3 font-medium" style={{ color: 'rgba(196,120,154,0.70)' }}>Open →</p>
              </Link>
            </div>
          </motion.section>

          {/* ── Advanced Analytics (Zenith) ── */}
          <AdvancedAnalyticsSection isPro={isPro} isDark={isDark} />

          {/* ── Quiz Mastery ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="mb-8"
          >
            <Link href="/quiz">
              <div className="rounded-[1.8rem] p-5 relative overflow-hidden group" 
                style={{ 
                  background: isDark ? 'rgba(126, 87, 194, 0.08)' : 'rgba(126, 87, 194, 0.05)',
                  border: `1px solid ${isDark ? 'rgba(126, 87, 194, 0.2)' : 'rgba(126, 87, 194, 0.15)'}`,
                  boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.35)' : '0 2px 16px rgba(0,0,0,0.07)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] flex items-center gap-1.5" style={{ color: '#9575cd' }}>
                      <SacredIcon name="brain" size={14} /> Quiz Mastery
                    </p>
                    <p className="text-[13px] font-bold mt-0.5" style={{ color: h1 }}>
                      Track your spiritual knowledge
                    </p>
                  </div>
                  <ChevronRight size={18} style={{ color: '#9575cd' }} />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1 rounded-xl p-3 bg-white/5 border border-white/5">
                    <p className="text-[10px] text-[color:var(--brand-muted)] mb-1">Knowledge Hub</p>
                    <p className="text-sm font-bold flex items-center gap-1.5">
                      <Target size={14} style={{ color: '#9575cd' }} />
                      View Stats
                    </p>
                  </div>
                  <div className="flex-1 rounded-xl p-3 bg-white/5 border border-white/5">
                    <p className="text-[10px] text-[color:var(--brand-muted)] mb-1">Streak</p>
                    <p className="text-sm font-bold flex items-center gap-1.5">
                      <Flame size={14} className="text-orange-500" />
                      Historical log
                    </p>
                  </div>
                </div>
                
                {/* Ambient glow */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 blur-[40px] rounded-full opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{ background: '#7e57c2' }}
                />
              </div>
            </Link>
          </motion.section>

          {/* ── Mood Insights ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}
            className="mb-8"
          >
            <Link href="/my-progress/mood">
              <div className="rounded-[1.8rem] p-5 relative overflow-hidden group" 
                style={{ 
                  background: isDark ? 'rgba(52, 211, 153, 0.08)' : 'rgba(52, 211, 153, 0.05)',
                  border: `1px solid ${isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(52, 211, 153, 0.15)'}`,
                  boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.35)' : '0 2px 16px rgba(0,0,0,0.07)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] flex items-center gap-1.5" style={{ color: '#10b981' }}>
                      <SacredIcon name="flower" size={14} /> Mood Insights
                    </p>
                    <p className="text-[13px] font-bold mt-0.5" style={{ color: h1 }}>
                      Track your emotional journey
                    </p>
                  </div>
                  <ChevronRight size={18} style={{ color: '#10b981' }} />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1 rounded-xl p-3 bg-white/5 border border-white/5">
                    <p className="text-[10px] text-[color:var(--brand-muted)] mb-1">Weekly & Monthly</p>
                    <p className="text-sm font-bold flex items-center gap-1.5">
                      <Activity size={14} style={{ color: '#10b981' }} />
                      Pattern Stats
                    </p>
                  </div>
                  <div className="flex-1 rounded-xl p-3 bg-white/5 border border-white/5">
                    <p className="text-[10px] text-[color:var(--brand-muted)] mb-1">AI Guided</p>
                    <p className="text-sm font-bold flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      Reflections
                    </p>
                  </div>
                </div>
                
                {/* Ambient glow */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 blur-[40px] rounded-full opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{ background: '#10b981' }}
                />
              </div>
            </Link>
          </motion.section>

          {/* ── Achievement Shields (compact preview → full page) ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
            <ShieldBadgesPreview
              streak={streak}
              totalSessions={totalJapaSessions}
              isDark={isDark}
            />
          </motion.section>

          {/* ── Day-of-week chart ── */}
          <motion.section
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.30 }}
            className="rounded-[1.8rem] p-5 mb-8"
            style={{ background: cardRhythmBg, border: `1px solid ${cardRhythmBdr}`, boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.35)' : '0 2px 16px rgba(0,0,0,0.07)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-0.5" style={{ color: amber }}>
              Practice Rhythm
            </p>
            <p className="text-[10px] mb-4" style={{ color: muted }}>Which days you sit for japa (last 30 days)</p>
            <DowChart counts={dowCounts} isDark={isDark} />
          </motion.section>

          {/* ── Sankalpa History ── */}
          {sankalpas && sankalpas.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="mb-8 rounded-[1.8rem] p-5"
              style={{ 
                background: isDark ? 'rgba(197, 160, 89, 0.05)' : 'rgba(197, 160, 89, 0.03)',
                border: `1px solid ${isDark ? 'rgba(197, 160, 89, 0.15)' : 'rgba(197, 160, 89, 0.1)'}`,
              }}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--brand-primary)' }}>
                    🌅 Sankalpa History
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sankalpas.filter(s => s.status === 'completed').length}/{sankalpas.length} completed
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {sankalpas.map(s => {
                  const startDate = new Date(s.start_date);
                  const endDate = new Date(s.end_date);
                  const todayStr = localSpiritualDate(Intl.DateTimeFormat().resolvedOptions().timeZone, 4);
                  const today = new Date(todayStr);
                  
                  // days elapsed and remaining
                  const diffTime = endDate.getTime() - today.getTime();
                  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const totalDays = s.target_days;
                  
                  let progress = 0;
                  if (s.status === 'completed') progress = 100;
                  else if (s.status === 'abandoned') progress = 0;
                  else {
                    const elapsed = totalDays - daysRemaining;
                    progress = Math.max(0, Math.min(100, Math.round((elapsed / totalDays) * 100)));
                  }

                  const isMidpoint = s.status === 'active'
                    && progress >= 48
                    && progress <= 52
                    && !hasMidpointReflection(s.id);
                  const isOverdue = s.status === 'active' && daysRemaining < 0;
                  const isComplete = s.status === 'active' && daysRemaining <= 0;
                  const shortenedText = s.text.length > 30 ? `${s.text.slice(0, 30)}...` : s.text;

                  return (
                    <div key={`${s.id}-${midpointRefreshKey}`} className="space-y-3">
                      <AnimatePresence initial={false}>
                        {isMidpoint && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="rounded-2xl border p-4 mb-3"
                            style={{ background: 'rgba(197,160,89,0.06)', borderColor: 'rgba(197,160,89,0.20)' }}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60 mb-1">
                              Halfway ✦ {shortenedText}
                            </p>
                            <p className="text-sm font-medium text-white/80 mb-3">
                              You&apos;re halfway through your sankalpa. How are you feeling?
                            </p>
                            <div className="flex gap-2">
                              {[
                                { key: 'strong', emoji: '💪', label: 'Strong' },
                                { key: 'struggling', emoji: '😤', label: 'Struggling' },
                                { key: 'grateful', emoji: '🙏', label: 'Grateful' },
                              ].map(({ key, emoji, label }) => (
                                <button
                                  key={key}
                                  onClick={() => handleMidpointReaction(s.id, key as 'strong' | 'struggling' | 'grateful')}
                                  className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-colors"
                                  style={{ borderColor: 'rgba(197,160,89,0.15)', background: 'rgba(255,255,255,0.03)' }}
                                >
                                  <span className="text-xl">{emoji}</span>
                                  <span className="text-[10px] font-medium text-white/50">{label}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="relative bg-black/5 dark:bg-white/5 p-4 rounded-[2rem] overflow-hidden border border-black/5 dark:border-white/10 shadow-sm">
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <p className="text-base font-serif leading-snug theme-ink font-medium">&ldquo;{s.text}&rdquo;</p>
                          <p className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wide">
                            {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          {s.status === 'completed' ? (
                            <span className="inline-block text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20">Completed</span>
                          ) : s.status === 'abandoned' ? (
                            <span className="inline-block text-[10px] uppercase font-bold tracking-wider bg-black/5 dark:bg-white/5 text-muted-foreground px-2.5 py-1 rounded-md border border-black/10 dark:border-white/10">Abandoned</span>
                          ) : isOverdue ? (
                            <span className="inline-block text-[10px] uppercase font-bold tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md border border-red-500/20">Overdue</span>
                          ) : (
                            <div>
                              <span className={`text-xl font-black font-serif ${daysRemaining <= 7 ? 'text-yellow-500' : 'text-amber-500/80'}`}>{daysRemaining}</span>
                              <p className="text-[9px] uppercase tracking-tighter text-muted-foreground font-bold leading-tight">Days<br/>Left</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <span>Progress</span>
                          <span className="text-amber-500/80">{progress}%</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                          <motion.div
                            className="h-full rounded-full bg-amber-500"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${progress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      {/* Timeline View */}
                      {s.status === 'active' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between px-2">
                            {[...Array(7)].map((_, i) => {
                              const todayIndex = (today.getDay() + 6) % 7;
                              const isToday = i === todayIndex;
                              const isPast = i < todayIndex;
                              
                              const dayOffset = i - todayIndex;
                              const circleDate = new Date(today);
                              circleDate.setDate(circleDate.getDate() + dayOffset);
                              const yyyy = circleDate.getFullYear();
                              const mm = String(circleDate.getMonth() + 1).padStart(2, '0');
                              const dd = String(circleDate.getDate()).padStart(2, '0');
                              const dateStr = `${yyyy}-${mm}-${dd}`;

                              const checkedIn = checkinMap.get(s.id)?.has(dateStr) ?? false;

                              if (checkedIn) {
                                return (
                                  <div key={i} className="flex flex-col items-center gap-1.5 relative">
                                    <div 
                                      className="w-[20px] h-[20px] rounded-full flex items-center justify-center bg-[#C5A059] text-white text-[10px] font-bold shadow-lg shadow-black/20 select-none"
                                    >
                                      ✓
                                    </div>
                                    <span className="text-[8px] text-black/40 dark:text-white/30">{['M','T','W','T','F','S','S'][i]}</span>
                                  </div>
                                );
                              }

                              if (isToday) {
                                return (
                                  <div key={i} className="flex flex-col items-center gap-1.5 relative">
                                    <button
                                      onClick={() => handleCheckin(s.id)}
                                      className="w-[20px] h-[20px] rounded-full border-2 border-[#C5A059] animate-pulse transition-all duration-300 cursor-pointer bg-transparent"
                                      style={{ boxShadow: '0 0 8px rgba(197,160,89,0.4)' }}
                                      title="Tap to check-in today"
                                    />
                                    <span className="text-[8px] text-[#C5A059] font-bold">{['M','T','W','T','F','S','S'][i]}</span>
                                  </div>
                                );
                              }

                              if (isPast) {
                                return (
                                  <div key={i} className="flex flex-col items-center gap-1.5 relative">
                                    <div 
                                      className="w-[20px] h-[20px] rounded-full border border-[#C5A059]/20 bg-transparent opacity-60"
                                    />
                                    <span className="text-[8px] text-black/40 dark:text-white/30">{['M','T','W','T','F','S','S'][i]}</span>
                                  </div>
                                );
                              }

                              // isFuture
                              return (
                                <div key={i} className="flex flex-col items-center gap-1.5 relative">
                                  <div 
                                    className="w-[20px] h-[20px] rounded-full border border-[#C5A059]/20 bg-transparent opacity-30"
                                  />
                                  <span className="text-[8px] text-black/20 dark:text-white/10">{['M','T','W','T','F','S','S'][i]}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {isComplete && !hasFiredCompletion(s.id) && (
                        <button
                          onClick={() => handleComplete(s.id, s.text, s.target_days)}
                          className="w-full mt-3 rounded-full py-3 font-bold text-black text-sm cursor-pointer transition-transform active:scale-95"
                          style={{ background: '#C5A059' }}
                        >
                          Mark as Fulfilled ✨
                        </button>
                      )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* ── Monthly Sadhana Report CTA ── */}
          <motion.section
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.40 }}
            className="rounded-[2rem] p-5 text-center"
            style={{ background: isDark ? 'linear-gradient(140deg,rgba(50,28,8,0.95),rgba(28,16,6,0.98))' : 'linear-gradient(140deg,rgba(255,238,210,0.98),rgba(245,222,185,0.99))', border: '1px solid rgba(197, 160, 89,0.22)' }}>
            <p className="text-2xl mb-2">📊</p>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: h1 }}>
              Monthly Sadhana Report
            </h3>
            <p className="text-sm mt-1.5 mb-4" style={{ color: muted }}>
              A full breakdown of your month — japa trends, Nitya karma rate, highlights, and a PDF you can keep.
            </p>
            <button
              onClick={() => setShowReport(true)}
              className="w-full rounded-full py-3 text-sm font-medium flex items-center justify-center gap-2"
              style={{
                background: isPro
                  ? 'linear-gradient(135deg,rgba(212,100,20,0.92),rgba(197, 160, 89,0.88))'
                  : 'rgba(197, 160, 89,0.10)',
                color: isPro ? '#1c1208' : 'rgba(197, 160, 89,0.8)',
                border: isPro ? 'none' : '1px solid rgba(197, 160, 89,0.28)',
              }}>
              {!isPro && <Lock size={13} />}
              {isPro ? 'Generate Report' : 'Upgrade to Pro'}
            </button>
          </motion.section>

        </div>
      </div>

      <AnimatePresence>
        {showReport && (
          <ReportModal
            report={report}
            isPro={isPro}
            onClose={() => setShowReport(false)}
            isDark={isDark}
            streak={streak}
          />
        )}
      </AnimatePresence>

      <SankalpaCompletionCeremony
        isOpen={completionCeremony.open}
        onClose={() => {
          setCompletionCeremony(prev => ({ ...prev, open: false }));
          router.refresh();
        }}
        sankalpaTitle={completionCeremony.title}
        durationDays={completionCeremony.durationDays}
        tradition={tradition ?? 'hindu'}
      />
    </>
  );
}
