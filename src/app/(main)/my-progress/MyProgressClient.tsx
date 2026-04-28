'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Lock, TrendingUp, TrendingDown, Minus, Calendar, LayoutGrid, Sparkles, Share2, ExternalLink } from 'lucide-react';
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

// ── Interactive Activity Calendar ─────────────────────────────────────────────
function InteractiveCalendar({
  days, isDark, monthView,
}: {
  days: Props['heatmap']; isDark: boolean; monthView: boolean;
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

  if (!monthView) {
    // ── Compact 28-day strip ─────────────────────────────────────────────────
    const weeks: Props['heatmap'][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return (
      <div>
        <div className="flex gap-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5 flex-1">
              {week.map(day => {
                const both = day.japa && day.nitya;
                const bg = both
                  ? `${amber}0.85)`
                  : day.japa ? `${amber}0.45)` : day.nitya ? `${green}0.50)` : dimBg;
                const isToday = day.date === todayIso;
                const isSelected = day.date === selectedDay;
                return (
                  <motion.button
                    key={day.date}
                    onClick={() => setSelectedDay(isSelected ? null : day.date)}
                    className="rounded-[5px] aspect-square w-full cursor-pointer transition-transform"
                    style={{
                      background: isSelected ? `${amber}0.95)` : bg,
                      outline: isToday ? `2px solid ${amber}0.70)` : 'none',
                      outlineOffset: '1px',
                    }}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.88 }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2">
          {[
            { color: `${amber}0.85)`, label: 'Both' },
            { color: `${amber}0.45)`, label: 'Japa' },
            { color: `${green}0.50)`, label: 'Nitya' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: color }} />
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

function ShieldBadges({
  streak, totalSessions, isDark,
}: {
  streak: number; totalSessions: number; isDark: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'streak' | 'session'>('streak');
  const shields = activeTab === 'streak' ? STREAK_SHIELDS : SESSION_SHIELDS;
  const value   = activeTab === 'streak' ? streak : totalSessions;

  const h1      = isDark ? '#f5dfa0' : '#1a0a02';
  const muted   = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.90)';
  const cardBdr = isDark ? 'rgba(200,146,74,0.12)' : 'rgba(180,120,40,0.14)';

  const nextMilestone = shields.find(s => s.threshold > value);
  const progress = nextMilestone
    ? Math.min(100, Math.round((value / nextMilestone.threshold) * 100))
    : 100;

  return (
    <div className="rounded-[1.8rem] p-5" style={{ background: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? 'none' : '0 1px 10px rgba(0,0,0,0.05)' }}>
      {/* Header + tab switcher */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgba(200,146,74,0.70)' }}>
            🏅 Achievement Shields
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: muted }}>
            {value} {activeTab === 'streak' ? 'day streak' : 'total sessions'}
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
          {(['streak', 'session'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all"
              style={{
                background: activeTab === tab ? 'rgba(200,146,74,0.22)' : 'transparent',
                color: activeTab === tab ? 'rgba(200,146,74,0.95)' : muted,
              }}
            >
              {tab === 'streak' ? '🔥 Streak' : '📿 Sessions'}
            </button>
          ))}
        </div>
      </div>

      {/* Shields grid */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {shields.map(shield => {
          const earned = value >= shield.threshold;
          return (
            <div key={shield.threshold} className="flex flex-col items-center gap-1">
              <motion.div
                className="w-full aspect-square rounded-xl flex items-center justify-center relative"
                style={{
                  background: earned
                    ? isDark ? 'rgba(200,146,74,0.22)' : 'rgba(200,146,74,0.14)'
                    : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  border: earned
                    ? '1px solid rgba(200,146,74,0.45)'
                    : `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
                  filter: earned ? 'none' : 'grayscale(1) opacity(0.3)',
                }}
                animate={earned ? { scale: [1, 1.06, 1] } : {}}
                transition={{ duration: 0.4, delay: 0.05 }}
              >
                <span className="text-[18px] leading-none">{shield.emoji}</span>
                {earned && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(80,200,80,0.9)', border: `1px solid ${cardBg}` }}>
                    <span className="text-[7px] text-white font-bold leading-none">✓</span>
                  </div>
                )}
              </motion.div>
              <p className="text-[7px] text-center leading-tight px-0.5" style={{
                color: earned ? h1 : muted,
                fontWeight: earned ? 600 : 400,
              }}>
                {shield.name}
              </p>
            </div>
          );
        })}
      </div>

      {/* Progress to next */}
      {nextMilestone ? (
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px]" style={{ color: muted }}>
              Next: <span style={{ color: h1, fontWeight: 600 }}>{nextMilestone.name}</span>
              <span style={{ color: muted }}> · {nextMilestone.desc}</span>
            </span>
            <span className="text-[10px] font-semibold" style={{ color: 'rgba(200,146,74,0.85)' }}>
              {value}/{nextMilestone.threshold}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg,rgba(200,146,74,0.75),rgba(212,100,20,0.85))' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      ) : (
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
                  <Link href="/japa/insights" onClick={e => e.stopPropagation()}
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
  const [calMonthView, setCalMonthView] = useState(false); // false = 28d strip, true = full month

  // Theme tokens
  const pageBg  = isDark ? 'linear-gradient(180deg,#130e08 0%,#1a1208 100%)' : 'linear-gradient(180deg,#fdf6ee 0%,#f7ede0 100%)';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.90)';
  const cardBdr = isDark ? 'rgba(200,146,74,0.12)' : 'rgba(180,120,40,0.14)';
  const heroBg  = isDark ? 'linear-gradient(160deg,rgba(50,24,8,0.97),rgba(28,16,6,0.99))' : 'linear-gradient(160deg,rgba(255,243,222,0.99),rgba(250,231,201,0.99))';
  const h1      = isDark ? '#f5dfa0' : '#1a0a02';
  const muted   = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';
  const dimText = isDark ? 'rgba(245,210,130,0.30)' : 'rgba(100,55,10,0.35)';
  const amber   = 'rgba(200,146,74,0.70)';

  const nityaRate   = Math.round((nitya30dDays / 30) * 100);
  const japaRate    = Math.round((heatmap.filter(d => d.japa).length / 28) * 100);
  const activeDays  = heatmap.filter(d => d.japa || d.nitya).length;

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
            style={{ background: heroBg, border: `1px solid ${cardBdr}` }}>

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

              {/* View toggle */}
              <div className="flex items-center gap-1 p-0.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                <button
                  onClick={() => setCalMonthView(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: !calMonthView ? 'rgba(200,146,74,0.22)' : 'transparent',
                  }}
                  aria-label="Strip view"
                >
                  <LayoutGrid size={12} style={{ color: amber }} />
                </button>
                <button
                  onClick={() => setCalMonthView(true)}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: calMonthView ? 'rgba(200,146,74,0.22)' : 'transparent',
                  }}
                  aria-label="Month calendar"
                >
                  <Calendar size={12} style={{ color: amber }} />
                </button>
              </div>
            </div>

            {/* Interactive calendar */}
            <AnimatePresence mode="wait">
              <motion.div
                key={calMonthView ? 'month' : 'strip'}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <InteractiveCalendar days={heatmap} isDark={isDark} monthView={calMonthView} />
              </motion.div>
            </AnimatePresence>
          </motion.section>

          {/* ── Practice pillars — full-width cards ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
            className="space-y-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] px-1" style={{ color: muted }}>Practice Pillars · 30 days</p>

            {/* Japa card — full width with rich stats */}
            <div className="rounded-[1.8rem] p-5" style={{ background: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? 'none' : '0 1px 10px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🪷</span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: muted }}>Japa</p>
                    <p className="text-xs" style={{ color: dimText }}>Mantra repetition · 30 days</p>
                  </div>
                </div>
                <Link href="/japa/insights"
                  className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold"
                  style={{ background: 'rgba(200,146,74,0.12)', color: 'rgba(200,146,74,0.90)', border: '1px solid rgba(200,146,74,0.22)' }}>
                  Insights →
                </Link>
              </div>

              {japa30dSessions === 0 ? (
                /* ── No sessions yet ── */
                <div className="text-center py-4">
                  <p className="text-2xl mb-2">📿</p>
                  <p className="text-sm font-medium" style={{ color: h1 }}>No sessions yet</p>
                  <p className="text-[11px] mt-1" style={{ color: muted }}>
                    Start your first Japa session to see stats here.
                  </p>
                  <Link href="/japa"
                    className="inline-flex items-center mt-3 rounded-full px-4 py-1.5 text-[11px] font-semibold"
                    style={{ background: 'rgba(200,146,74,0.14)', color: 'rgba(200,146,74,0.90)', border: '1px solid rgba(200,146,74,0.25)' }}>
                    Begin Japa →
                  </Link>
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
                    <p className="text-[11px] mt-3 pt-3" style={{ color: muted, borderTop: `1px solid ${cardBdr}` }}>
                      Most chanted: <span style={{ color: h1, fontFamily: 'var(--font-serif)' }}>{topMantra}</span>
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Nitya Karma card */}
            <div className="rounded-[1.8rem] p-5" style={{ background: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? 'none' : '0 1px 10px rgba(0,0,0,0.05)' }}>
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
              {[
                { emoji: '📖', label: 'Pathshala', sub: 'Study paths',      href: '/pathshala/insights', accent: 'rgba(80,160,200,' },
                { emoji: '🪷', label: 'Bhakti',    sub: 'Devotion insights', href: '/bhakti/insights',   accent: 'rgba(196,120,154,' },
              ].map(p => (
                <Link key={p.label} href={p.href}
                  className="block rounded-[1.6rem] p-4"
                  style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
                  <div className="h-0.5 rounded-full mb-3" style={{ background: `${p.accent}0.55)` }} />
                  <span className="text-xl block mb-2">{p.emoji}</span>
                  <p className="text-sm font-semibold" style={{ color: h1 }}>{p.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: muted }}>{p.sub}</p>
                  <p className="text-[10px] mt-3 font-medium" style={{ color: `${p.accent}0.70)` }}>Open →</p>
                </Link>
              ))}
            </div>
          </motion.section>

          {/* ── Achievement Shields ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
            <ShieldBadges
              streak={streak}
              totalSessions={totalJapaSessions}
              isDark={isDark}
            />
          </motion.section>

          {/* ── Day-of-week chart ── */}
          <motion.section
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.30 }}
            className="rounded-[1.8rem] p-5"
            style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
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
