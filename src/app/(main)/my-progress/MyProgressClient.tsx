'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Lock, TrendingUp, TrendingDown, Minus, Calendar, Activity, Sparkles, Share2, ExternalLink, Target, Flame } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';

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
  japa30dSessions:  number;
  japa30dRounds:    number;
  japa30dBeads:     number;
  japa30dMins:      number;
  topMantra:        string | null;
  dowCounts:        number[];
  totalJapaSessions: number;
  nitya30dDays:     number;
  report:           ReportData;
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
  const amber   = 'rgba(200,146,74,';
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
            style={{ background: isDark ? 'rgba(200,146,74,0.07)' : 'rgba(200,146,74,0.06)' }}>
            <p className="text-[13px] font-bold" style={{ color: isDark ? '#f5dfa0' : '#1a0a02' }}>{val}</p>
            <p className="text-[8px] mt-0.5" style={{ color: sub }}>{label}</p>
          </div>
        ))}
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

  const amber = 'rgba(200,146,74,';
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
        style={{ background: isDark ? 'rgba(200,146,74,0.10)' : 'rgba(200,146,74,0.08)' }}
      >
        <span style={{ color: isDark ? '#f5dfa0' : '#2a1002', fontWeight: 600 }}>
          {new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
        <br />
        <span style={{ color: isDark ? 'rgba(245,210,130,0.65)' : 'rgba(100,55,10,0.65)' }}>
          {d?.japa ? '📿 Japa' : ''}
          {d?.japa && d?.nitya ? ' · ' : ''}
          {d?.nitya ? '🌅 Nitya' : ''}
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
            style={{ background: 'rgba(200,146,74,0.55)' }}
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 48}px` }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          />
          <span className="text-[10px] font-semibold"
            style={{ color: isDark ? 'rgba(200,146,74,0.45)' : 'rgba(100,65,20,0.50)' }}>
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
const STREAK_SHIELDS = [
  { threshold: 7,   name: 'Saptāha',    emoji: '🔥', desc: '7-day streak'    },
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
  const cardBdr = isDark ? 'rgba(200,146,74,0.22)' : 'rgba(200,146,74,0.24)';

  const streakEarned  = STREAK_SHIELDS.filter(s => streak >= s.threshold).length;
  const sessionEarned = SESSION_SHIELDS.filter(s => totalSessions >= s.threshold).length;
  const totalEarned   = streakEarned + sessionEarned;
  const totalShields  = STREAK_SHIELDS.length + SESSION_SHIELDS.length;

  const nextStreak  = STREAK_SHIELDS.find(s => streak < s.threshold);
  const nextSession = SESSION_SHIELDS.find(s => totalSessions < s.threshold);

  return (
    <div className="rounded-[1.8rem] p-5" style={{ background: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.38)' : '0 2px 16px rgba(0,0,0,0.07)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgba(200,146,74,0.70)' }}>
            🏅 Achievement Shields
          </p>
          <p className="text-[13px] font-bold mt-0.5" style={{ color: h1 }}>
            {totalEarned} / {totalShields} <span className="text-[10px] font-normal" style={{ color: muted }}>earned</span>
          </p>
        </div>
        <Link href="/my-progress/shields"
          className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold flex items-center gap-1"
          style={{ background: 'rgba(200,146,74,0.12)', color: 'rgba(200,146,74,0.90)', border: '1px solid rgba(200,146,74,0.22)' }}>
          See all →
        </Link>
      </div>

      {/* Mini shields row — show the 6 streak shields */}
      <div className="flex gap-2 mb-4">
        {STREAK_SHIELDS.map(shield => {
          const earned = streak >= shield.threshold;
          return (
            <div key={shield.threshold} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full aspect-square rounded-xl flex items-center justify-center text-[16px]"
                style={{
                  background: earned
                    ? isDark ? 'rgba(200,146,74,0.22)' : 'rgba(200,146,74,0.14)'
                    : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  border: earned
                    ? '1px solid rgba(200,146,74,0.40)'
                    : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
                  filter: earned ? 'none' : 'grayscale(1) opacity(0.25)',
                }}
              >
                {shield.emoji}
              </div>
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
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px]" style={{ color: muted }}>
                Next: <span style={{ color: h1, fontWeight: 600 }}>{next.emoji} {next.name}</span>
                <span style={{ color: muted }}> · {next.desc}</span>
              </span>
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(200,146,74,0.85)' }}>
                {val}/{next.threshold}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,rgba(200,146,74,0.75),rgba(212,100,20,0.85))' }}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
            </div>
          </div>
        );
      })()}
      {!nextStreak && !nextSession && (
        <p className="text-center text-sm" style={{ color: 'rgba(200,146,74,0.70)', fontFamily: 'var(--font-serif)' }}>
          सर्वसिद्धि — All shields earned! 🙏
        </p>
      )}
    </div>
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
  const border = isDark ? 'rgba(200,146,74,0.14)' : 'rgba(180,120,40,0.14)';
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
    const text = `🕉️ ${monthName(report.curMonthStart)} Sādhana Report\n🔥 ${streak}-day streak\n🪷 ${report.curSessions} japa sessions · ${report.curRounds} rounds\n🌅 ${nityaRate2}% Nitya Karma\nPracticed with Sanatan Sangam 🙏`;
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
            A beautiful monthly summary of your entire practice — all pillars, trends, highlights — available with Sangam Pro.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Lock size={14} className="mx-auto" style={{ color: 'rgba(200,146,74,0.6)' }} />
            <p className="text-xs" style={{ color: 'rgba(200,146,74,0.7)' }}>Premium Feature</p>
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
                <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: 'rgba(200,146,74,0.65)' }}>Sadhana Report</p>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600, color: h1, lineHeight: 1.2 }}>
                  {monthName(report.curMonthStart)}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleShare}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: isDark ? 'rgba(200,146,74,0.12)' : 'rgba(200,146,74,0.10)', border: `1px solid ${border}` }}>
                  <Share2 size={15} style={{ color: 'rgba(200,146,74,0.75)' }} />
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
                  style={{ background: isDark ? 'rgba(200,146,74,0.12)' : 'rgba(200,146,74,0.10)', border: `1px solid ${border}` }}>
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
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(200,146,74,0.7)' }}>🪷 Japa Practice</p>
                <div className="flex items-center gap-2">
                  <Link href="/bhakti/mala/insights" onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5"
                    style={{ color: 'rgba(200,146,74,0.6)', background: 'rgba(200,146,74,0.08)', border: '1px solid rgba(200,146,74,0.14)' }}>
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
              {/* AI explanation */}
              <AnimatePresence>
                {(japaAi.loading || japaAi.text) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                    {japaAi.loading
                      ? <div className="flex items-center gap-2"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Sparkles size={12} style={{ color: 'rgba(200,146,74,0.6)' }} /></motion.div><span className="text-[11px]" style={{ color: muted }}>Interpreting your practice…</span></div>
                      : <p className="text-[12px] leading-relaxed italic" style={{ color: isDark ? 'rgba(245,215,160,0.80)' : '#3a1a06' }}>{japaAi.text}</p>
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
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(200,146,74,0.7)' }}>🌅 Nitya Karma</p>
                <div className="flex items-center gap-2">
                  <Link href="/nitya-karma/insights" onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5"
                    style={{ color: 'rgba(200,146,74,0.6)', background: 'rgba(200,146,74,0.08)', border: '1px solid rgba(200,146,74,0.14)' }}>
                    <ExternalLink size={9} /> Insights
                  </Link>
                  <span className="text-[10px]" style={{ color: muted }}>Tap for AI ✨</span>
                </div>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: h1 }}>{nityaRate}%</p>
                  <p className="text-[10px] mt-0.5" style={{ color: muted }}>Completion rate</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: h1 }}>{report.curNityaDays}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: muted }}>Days completed</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs" style={{ color: muted }}>of {report.curDaysElapsed} days elapsed</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
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
                      ? <div className="flex items-center gap-2"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Sparkles size={12} style={{ color: 'rgba(200,146,74,0.6)' }} /></motion.div><span className="text-[11px]" style={{ color: muted }}>Interpreting…</span></div>
                      : <p className="text-[12px] leading-relaxed italic" style={{ color: isDark ? 'rgba(245,215,160,0.80)' : '#3a1a06' }}>{nityaAi.text}</p>
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Highlights ── */}
            <div className="rounded-[1.2rem] p-4" style={{ background: card, border: `1px solid ${border}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'rgba(200,146,74,0.7)' }}>✨ Highlights</p>
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
              <p className="text-sm" style={{ fontFamily: 'var(--font-serif)', color: 'rgba(200,146,74,0.55)', fontStyle: 'italic' }}>
                योगः कर्मसु कौशलम् — Excellence in action is yoga.
              </p>
            </div>
          </div>

          {/* ── Print footer ── */}
          <div className="px-6 pb-6 flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-medium"
              style={{ background: 'linear-gradient(135deg,rgba(212,100,20,0.9),rgba(200,146,74,0.85))', color: '#1c1208' }}>
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
  isPro,
  streak,
  heatmap,
  japa30dSessions,
  japa30dRounds,
  japa30dBeads,
  japa30dMins,
  topMantra,
  dowCounts,
  totalJapaSessions,
  nitya30dDays,
  report,
}: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark    = resolvedTheme === 'dark';
  const [showReport, setShowReport]     = useState(false);
  const [calView, setCalView] = useState<'calendar' | 'sparkline'>('calendar');

  // ── Page + shared tokens ──────────────────────────────────────────────────
  const pageBg  = isDark
    ? 'linear-gradient(165deg,#0e0a05 0%,#17100a 50%,#1a1208 100%)'
    : 'linear-gradient(165deg,#fdf6ee 0%,#f5e8d5 50%,#f0dfc8 100%)';
  const h1      = isDark ? '#f5dfa0' : '#1a0a02';
  const muted   = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';
  const dimText = isDark ? 'rgba(245,210,130,0.30)' : 'rgba(100,55,10,0.35)';
  const amber   = 'rgba(200,146,74,0.70)';

  // ── Per-card sanctuary gradients (mirrors HOME_THEMES) ────────────────────
  // Calendar — panchang: dawn amber
  const cardCalBg  = isDark
    ? 'linear-gradient(150deg, rgba(52,42,28,0.97) 0%, rgba(38,32,22,0.96) 100%)'
    : 'linear-gradient(150deg, rgba(255,246,232,0.97) 0%, rgba(250,236,210,0.99) 100%)';
  const cardCalBdr = isDark ? 'rgba(200,146,74,0.22)' : 'rgba(200,146,74,0.22)';

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
  const cardPathBdr = isDark ? 'rgba(200,146,74,0.18)' : 'rgba(130,130,200,0.22)';

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
      <div className="min-h-screen pb-28" style={{ background: pageBg }}>
        {/* Safe area */}
        <div style={{ height: 'max(env(safe-area-inset-top,0px),16px)' }} />

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-4 pb-4">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(200,146,74,0.10)', border: '1px solid rgba(200,146,74,0.18)' }}>
            <ChevronLeft size={18} style={{ color: 'rgba(200,146,74,0.85)' }} />
          </button>
          <div className="flex-1">
            <p className="text-[10px] tracking-[0.18em] uppercase font-medium" style={{ color: muted }}>My Progress</p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 700, color: h1, lineHeight: 1.1 }}>
              {userName}&apos;s Sādhana
            </h1>
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* ── Activity Calendar — compact, calendar-first ── */}
          <motion.section
            initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] p-4"
            style={{ background: cardCalBg, border: `1px solid ${cardCalBdr}`, boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.38)' : '0 2px 20px rgba(0,0,0,0.07)' }}>

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
                <div className="rounded-lg px-2 py-1 text-center" style={{ background: isDark ? 'rgba(200,146,74,0.12)' : 'rgba(200,146,74,0.10)', border: `1px solid rgba(200,146,74,0.18)` }}>
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
                  style={{ background: calView === 'calendar' ? 'rgba(200,146,74,0.22)' : 'transparent' }}
                  aria-label="Month calendar"
                >
                  <Calendar size={12} style={{ color: amber }} />
                </button>
                <button
                  onClick={() => setCalView('sparkline')}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                  style={{ background: calView === 'sparkline' ? 'rgba(200,146,74,0.22)' : 'transparent' }}
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

          {/* ── Practice pillars — full-width cards ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
            className="space-y-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] px-1" style={{ color: muted }}>
              Practice Pillars · last 30 days
            </p>

            {/* Japa card — full width with rich stats */}
            <div className="rounded-[1.8rem] p-5" style={{ background: cardJapaBg, border: `1px solid ${cardJapaBdr}`, boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.35)' : '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🪷</span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: muted }}>Japa</p>
                    <p className="text-xs" style={{ color: dimText }}>
                      {hasOlderSessions ? 'Mantra repetition · older sessions exist' : 'Mantra repetition · 30 days'}
                    </p>
                  </div>
                </div>
                <Link href="/bhakti/mala/insights"
                  className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold"
                  style={{ background: 'rgba(200,146,74,0.12)', color: 'rgba(200,146,74,0.90)', border: '1px solid rgba(200,146,74,0.22)' }}>
                  Insights →
                </Link>
              </div>

              {japa30dSessions === 0 ? (
                /* ── No sessions in last 30 days ── */
                <div className="text-center py-4">
                  <p className="text-2xl mb-2">{hasOlderSessions ? '📿' : '🪷'}</p>
                  {hasOlderSessions ? (
                    <>
                      <p className="text-sm font-medium" style={{ color: h1 }}>No sessions in the last 30 days</p>
                      <p className="text-[11px] mt-1" style={{ color: muted }}>
                        You have {totalJapaSessions} session{totalJapaSessions !== 1 ? 's' : ''} in your history — view them in Insights.
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Link href="/bhakti/mala/insights"
                          className="inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-semibold"
                          style={{ background: 'rgba(200,146,74,0.14)', color: 'rgba(200,146,74,0.90)', border: '1px solid rgba(200,146,74,0.25)' }}>
                          View Insights →
                        </Link>
                        <Link href="/bhakti/mala"
                          className="inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-semibold"
                          style={{ background: 'rgba(200,146,74,0.07)', color: 'rgba(200,146,74,0.75)', border: '1px solid rgba(200,146,74,0.18)' }}>
                          Resume Japa
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium" style={{ color: h1 }}>No sessions yet</p>
                      <p className="text-[11px] mt-1" style={{ color: muted }}>
                        Start your first Japa session to see stats here.
                      </p>
                      <Link href="/bhakti/mala"
                        className="inline-flex items-center mt-3 rounded-full px-4 py-1.5 text-[11px] font-semibold"
                        style={{ background: 'rgba(200,146,74,0.14)', color: 'rgba(200,146,74,0.90)', border: '1px solid rgba(200,146,74,0.25)' }}>
                        Begin Japa →
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: String(japa30dSessions), sub: 'sessions' },
                      { val: fmt(japa30dBeads),       sub: 'beads'    },
                      { val: japa30dRounds > 0 ? String(japa30dRounds) : '—', sub: 'rounds' },
                      { val: japa30dMins > 0 ? `${japa30dMins}m` : '—',       sub: 'sat'   },
                    ].map(({ val, sub: s }) => (
                      <div key={s} className="text-center rounded-xl py-2" style={{ background: isDark ? 'rgba(200,146,74,0.07)' : 'rgba(200,146,74,0.06)' }}>
                        <p className="text-[16px] font-bold" style={{ color: h1 }}>{val}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: muted }}>{s}</p>
                      </div>
                    ))}
                  </div>
                  {/* Consistency bar — only shown when there are actual sessions */}
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px]" style={{ color: muted }}>Consistency</span>
                      <span className="text-[10px] font-semibold" style={{ color: 'rgba(200,146,74,0.85)' }}>{japaRate}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg,rgba(200,146,74,0.75),rgba(212,100,20,0.85))' }}
                        initial={{ width: 0 }} animate={{ width: `${japaRate}%` }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                  {topMantra && (
                    <p className="text-[11px] mt-3 pt-3" style={{ color: muted, borderTop: `1px solid ${cardJapaBdr}` }}>
                      Most chanted: <span style={{ color: h1, fontFamily: 'var(--font-serif)' }}>{topMantra}</span>
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Nitya Karma card */}
            <div className="rounded-[1.8rem] p-5" style={{ background: cardNityaBg, border: `1px solid ${cardNityaBdr}`, boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.35)' : '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌅</span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: muted }}>Nitya Karma</p>
                    <p className="text-xs" style={{ color: dimText }}>Daily practices</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/nitya-karma/insights"
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: 'rgba(140,180,100,0.10)', color: 'rgba(100,160,70,0.80)', border: '1px solid rgba(140,180,100,0.18)' }}>
                    Insights
                  </Link>
                  <Link href="/nitya-karma"
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: 'rgba(140,180,100,0.12)', color: 'rgba(100,160,70,0.90)', border: '1px solid rgba(140,180,100,0.22)' }}>
                    Open →
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { val: String(nitya30dDays), sub: 'days done' },
                  { val: `${nityaRate}%`,      sub: 'rate'      },
                  { val: `${30 - nitya30dDays}`, sub: 'missed'  },
                ].map(({ val, sub: s }) => (
                  <div key={s} className="text-center rounded-xl py-2" style={{ background: isDark ? 'rgba(140,180,100,0.07)' : 'rgba(140,180,100,0.06)' }}>
                    <p className="text-[16px] font-bold" style={{ color: h1 }}>{val}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: muted }}>{s}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px]" style={{ color: muted }}>Completion rate</span>
                <span className="text-[10px] font-semibold" style={{ color: 'rgba(100,160,70,0.85)' }}>{nityaRate}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,rgba(140,180,100,0.75),rgba(90,150,60,0.85))' }}
                  initial={{ width: 0 }} animate={{ width: `${nityaRate}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                />
              </div>
            </div>

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
          </motion.section>

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
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#9575cd' }}>
                      🧠 Quiz Mastery
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
            className="rounded-[1.8rem] p-5"
            style={{ background: cardRhythmBg, border: `1px solid ${cardRhythmBdr}`, boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.35)' : '0 2px 16px rgba(0,0,0,0.07)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-0.5" style={{ color: amber }}>
              Practice Rhythm
            </p>
            <p className="text-[10px] mb-4" style={{ color: muted }}>Which days you sit for japa (last 30 days)</p>
            <DowChart counts={dowCounts} isDark={isDark} />
          </motion.section>

          {/* ── Monthly Sadhana Report CTA ── */}
          <motion.section
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.40 }}
            className="rounded-[2rem] p-5 text-center"
            style={{ background: isDark ? 'linear-gradient(140deg,rgba(50,28,8,0.95),rgba(28,16,6,0.98))' : 'linear-gradient(140deg,rgba(255,238,210,0.98),rgba(245,222,185,0.99))', border: '1px solid rgba(200,146,74,0.22)' }}>
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
                  ? 'linear-gradient(135deg,rgba(212,100,20,0.92),rgba(200,146,74,0.88))'
                  : 'rgba(200,146,74,0.10)',
                color: isPro ? '#1c1208' : 'rgba(200,146,74,0.8)',
                border: isPro ? 'none' : '1px solid rgba(200,146,74,0.28)',
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
    </>
  );
}
