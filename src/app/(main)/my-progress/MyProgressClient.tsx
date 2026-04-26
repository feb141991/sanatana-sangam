'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Download, Lock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

// ── Heatmap ───────────────────────────────────────────────────────────────────
function Heatmap({ days, isDark }: { days: Props['heatmap']; isDark: boolean }) {
  const weeks: Props['heatmap'][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5 flex-1">
            {week.map(day => {
              const both  = day.japa && day.nitya;
              const one   = day.japa || day.nitya;
              const bg = both
                ? 'rgba(200,146,74,0.85)'
                : day.japa
                  ? 'rgba(200,146,74,0.45)'
                  : day.nitya
                    ? 'rgba(140,180,100,0.50)'
                    : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
              return (
                <motion.div
                  key={day.date}
                  className="rounded-[4px] aspect-square w-full"
                  style={{ background: bg }}
                  whileHover={{ scale: 1.25 }}
                  title={`${day.date}${day.japa ? ' · Japa ✓' : ''}${day.nitya ? ' · Nitya ✓' : ''}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-1">
        {[
          { color: 'rgba(200,146,74,0.85)', label: 'Both' },
          { color: 'rgba(200,146,74,0.45)', label: 'Japa' },
          { color: 'rgba(140,180,100,0.50)', label: 'Nitya' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: isDark ? 'rgba(245,210,130,0.38)' : 'rgba(100,60,10,0.45)' }}>{label}</span>
          </div>
        ))}
      </div>
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

// ── Premium Report Modal ──────────────────────────────────────────────────────
function ReportModal({ report, isPro, onClose, isDark }: {
  report: ReportData; isPro: boolean; onClose: () => void; isDark: boolean;
}) {
  const printRef = useRef<HTMLDivElement>(null);

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

  function handlePrint() {
    window.print();
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
              <div className="text-3xl">🕉️</div>
            </div>
            {/* Summary pills */}
            <div className="mt-4 flex gap-2 flex-wrap">
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
            <div className="rounded-[1.2rem] p-4" style={{ background: card, border: `1px solid ${border}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'rgba(200,146,74,0.7)' }}>📿 Japa Practice</p>
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
            </div>

            {/* ── Nitya Karma ── */}
            <div className="rounded-[1.2rem] p-4" style={{ background: card, border: `1px solid ${border}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'rgba(200,146,74,0.7)' }}>🌅 Nitya Karma</p>
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
              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,rgba(140,180,100,0.8),rgba(100,160,70,0.9))' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${nityaRate}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

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
  nitya30dDays,
  report,
}: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const [showReport, setShowReport] = useState(false);

  // Theme tokens
  const pageBg  = isDark ? 'linear-gradient(180deg,#130e08 0%,#1a1208 100%)' : 'linear-gradient(180deg,#fdf6ee 0%,#f7ede0 100%)';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.90)';
  const cardBdr = isDark ? 'rgba(200,146,74,0.12)' : 'rgba(180,120,40,0.14)';
  const h1      = isDark ? '#f5dfa0' : '#1a0a02';
  const muted   = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';
  const dimText = isDark ? 'rgba(245,210,130,0.30)' : 'rgba(100,55,10,0.35)';
  const amber   = 'rgba(200,146,74,0.65)';

  const nityaRate = Math.round((nitya30dDays / 30) * 100);

  const pillars = [
    {
      emoji: '📿', label: 'Japa',
      stats: [
        { val: String(japa30dSessions), sub: 'sessions' },
        { val: fmt(japa30dBeads),       sub: 'beads'    },
        { val: `${japa30dMins}m`,       sub: 'sat'      },
      ],
      href: '/japa',
      insightsHref: '/japa/insights',
      accent: 'rgba(200,146,74,',
    },
    {
      emoji: '🌅', label: 'Nitya',
      stats: [
        { val: `${nitya30dDays}`, sub: 'days' },
        { val: `${nityaRate}%`,   sub: 'rate' },
        { val: japa30dRounds > 0 ? `${streak}🔥` : '—', sub: 'streak' },
      ],
      href: '/nitya-karma',
      insightsHref: null,
      accent: 'rgba(140,180,100,',
    },
    {
      emoji: '🕉️', label: 'Sattvic',
      stats: [
        { val: '—', sub: 'min sat' },
        { val: '—', sub: 'sessions' },
        { val: '—', sub: 'env'     },
      ],
      href: '/bhakti/zen',
      insightsHref: null,
      accent: 'rgba(130,100,220,',
    },
    {
      emoji: '📖', label: 'Pathshala',
      stats: [
        { val: '—', sub: 'lessons' },
        { val: '—', sub: 'verses'  },
        { val: '—', sub: 'paths'   },
      ],
      href: '/pathshala',
      insightsHref: null,
      accent: 'rgba(80,160,200,',
    },
  ];

  return (
    <>
      <div className="min-h-screen pb-28" style={{ background: pageBg }}>
        {/* Safe area */}
        <div style={{ height: 'max(env(safe-area-inset-top,0px),16px)' }} />

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 pb-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(200,146,74,0.10)', border: '1px solid rgba(200,146,74,0.20)' }}>
            <ChevronLeft size={18} style={{ color: 'rgba(200,146,74,0.80)' }} />
          </button>
          <div>
            <p className="text-[11px] tracking-widest uppercase" style={{ color: muted }}>My Progress</p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: h1, lineHeight: 1.1 }}>
              {userName}&apos;s Sādhana
            </h1>
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* ── Streak + heatmap hero ── */}
          <motion.section
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] p-5"
            style={{ background: isDark ? 'linear-gradient(160deg,rgba(50,24,8,0.95),rgba(28,16,6,0.98))' : 'linear-gradient(160deg,rgba(255,242,220,0.98),rgba(250,230,200,0.99))', border: `1px solid ${cardBdr}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: muted }}>Current streak</p>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 700, color: h1, lineHeight: 1 }}>
                  {streak}<span className="text-xl">🔥</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: dimText }}>days of continuous practice</p>
              </div>
              <Link href="/japa/insights"
                className="rounded-full px-4 py-1.5 text-xs font-medium"
                style={{ background: 'rgba(200,146,74,0.12)', color: 'rgba(200,146,74,0.85)', border: '1px solid rgba(200,146,74,0.22)' }}>
                Japa insights →
              </Link>
            </div>
            <Heatmap days={heatmap} isDark={isDark} />
            <p className="text-[10px] text-right mt-2" style={{ color: dimText }}>Last 28 days</p>
          </motion.section>

          {/* ── Pillar cards grid ── */}
          <div className="grid grid-cols-2 gap-3">
            {pillars.map((p, i) => (
              <motion.div key={p.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}>
                <Link href={p.href}
                  className="block rounded-[1.6rem] p-4 h-full"
                  style={{ background: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? 'none' : '0 1px 8px rgba(0,0,0,0.05)' }}>
                  {/* Accent top strip */}
                  <div className="h-0.5 rounded-full mb-3" style={{ background: `${p.accent}0.6)` }} />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{p.emoji}</span>
                    {p.insightsHref && (
                      <Link href={p.insightsHref} onClick={e => e.stopPropagation()}
                        className="text-[10px] rounded-full px-2 py-0.5"
                        style={{ color: `${p.accent}0.8)`, background: `${p.accent}0.10)`, border: `1px solid ${p.accent}0.20)` }}>
                        Insights
                      </Link>
                    )}
                  </div>
                  <p className="text-sm font-semibold mb-2" style={{ color: h1 }}>{p.label}</p>
                  <div className="space-y-1">
                    {p.stats.map(({ val, sub }) => (
                      <div key={sub} className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold" style={{ color: h1 }}>{val}</span>
                        <span className="text-[10px]" style={{ color: muted }}>{sub}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] mt-2" style={{ color: dimText }}>Last 30 days</p>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* ── Day-of-week chart ── */}
          <motion.section
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="rounded-[1.6rem] p-4"
            style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: amber }}>Practice Days</p>
            <p className="text-[10px] mb-3" style={{ color: muted }}>Which days you sit for japa</p>
            <DowChart counts={dowCounts} isDark={isDark} />
          </motion.section>

          {/* ── Top mantra ── */}
          {topMantra && (
            <motion.section
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
              className="rounded-[1.6rem] px-5 py-4 text-center"
              style={{ background: isDark ? 'rgba(40,22,8,0.7)' : 'rgba(255,242,220,0.90)', border: `1px solid ${cardBdr}` }}>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: muted }}>Most Chanted</p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: h1 }}>{topMantra}</p>
            </motion.section>
          )}

          {/* ── Premium report CTA ── */}
          <motion.section
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}
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
          />
        )}
      </AnimatePresence>
    </>
  );
}
