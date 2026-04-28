'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';

// ── Shield definitions (same as MyProgressClient) ────────────────────────────
const STREAK_SHIELDS = [
  { threshold: 7,   name: 'Saptāha',     emoji: '🔥', desc: '7-day streak',    detail: 'Seven days of unbroken sādhana — a full week of niyama.' },
  { threshold: 21,  name: 'Niyama',      emoji: '🕯️', desc: '21-day streak',   detail: 'Twenty-one days — the ancient threshold where habit becomes nature.' },
  { threshold: 40,  name: 'Chālisā',    emoji: '🌟', desc: '40-day streak',   detail: 'Forty days of tapas. The number sacred across all traditions.' },
  { threshold: 54,  name: 'Ardha Mālā', emoji: '📿', desc: '54-day streak',   detail: 'Half a mālā. Your practice is deep and rooted.' },
  { threshold: 108, name: 'Pūrṇa Mālā', emoji: '🙏', desc: '108-day streak',  detail: '108 days — pūrṇa, complete. A full mālā of devotion.' },
  { threshold: 365, name: 'Varsha',      emoji: '☀️', desc: '365-day streak',  detail: 'One complete solar year of unbroken sādhana. Extraordinary.' },
];

const SESSION_SHIELDS = [
  { threshold: 7,    name: 'Prārambha', emoji: '🌱', desc: '7 sessions',    detail: 'The first sprout of sādhana has taken root.' },
  { threshold: 21,   name: 'Abhyāsa',  emoji: '⚡', desc: '21 sessions',   detail: 'Regular repetition — abhyāsa is building momentum.' },
  { threshold: 40,   name: 'Tapas',    emoji: '🔆', desc: '40 sessions',   detail: 'Forty sessions of inner heat — tapas refines the soul.' },
  { threshold: 108,  name: 'Mālā',     emoji: '📿', desc: '108 sessions',  detail: 'A complete mālā of sessions. The mantra is in your blood.' },
  { threshold: 365,  name: 'Varshika', emoji: '🌕', desc: '365 sessions',  detail: 'Three hundred and sixty-five sittings. A sādhaka of the highest order.' },
  { threshold: 1000, name: 'Sahasra',  emoji: '💎', desc: '1000 sessions', detail: 'Sahasra — one thousand. The divine number. You are transformed.' },
];

interface Props {
  streak:            number;
  totalJapaSessions: number;
  userName:          string;
}

export default function ShieldsClient({ streak, totalJapaSessions, userName }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const [activeTab, setActiveTab] = useState<'streak' | 'session'>('streak');
  const [expanded, setExpanded] = useState<number | null>(null);

  const shields = activeTab === 'streak' ? STREAK_SHIELDS : SESSION_SHIELDS;
  const value   = activeTab === 'streak' ? streak : totalJapaSessions;

  const earnedCount = shields.filter(s => value >= s.threshold).length;
  const nextShield  = shields.find(s => value < s.threshold);
  const progress    = nextShield
    ? Math.min(100, Math.round((value / nextShield.threshold) * 100))
    : 100;

  // Theme
  const pageBg  = isDark ? 'linear-gradient(180deg,#130e08 0%,#1a1208 100%)' : 'linear-gradient(180deg,#fdf6ee 0%,#f7ede0 100%)';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.90)';
  const cardBdr = isDark ? 'rgba(200,146,74,0.12)' : 'rgba(180,120,40,0.14)';
  const h1      = isDark ? '#f5dfa0' : '#1a0a02';
  const muted   = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';
  const amber   = 'rgba(200,146,74,';

  return (
    <div className="min-h-screen pb-28" style={{ background: pageBg }}>
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
            Achievement Shields
          </h1>
        </div>
        <span className="text-3xl">🏅</span>
      </div>

      <div className="px-4 space-y-4">

        {/* ── Hero: earned count ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] p-5"
          style={{ background: isDark ? 'linear-gradient(160deg,rgba(50,24,8,0.97),rgba(28,16,6,0.99))' : 'linear-gradient(160deg,rgba(255,243,222,0.99),rgba(250,231,201,0.99))', border: `1px solid ${cardBdr}` }}>
          <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: `${amber}0.60)` }}>
            {userName}&apos;s Collection
          </p>
          <div className="flex items-end gap-2 mt-1">
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 700, color: h1, lineHeight: 1 }}>
              {activeTab === 'streak'
                ? STREAK_SHIELDS.filter(s => streak >= s.threshold).length + SESSION_SHIELDS.filter(s => totalJapaSessions >= s.threshold).length
                : earnedCount
              }
            </span>
            <span className="pb-1 text-sm" style={{ color: muted }}>
              / {STREAK_SHIELDS.length + SESSION_SHIELDS.length} total shields
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: muted }}>
            {streak > 0
              ? `🔥 ${streak}-day streak · 📿 ${totalJapaSessions} total sessions`
              : `📿 ${totalJapaSessions} total sessions`
            }
          </p>
        </motion.div>

        {/* ── Tab switcher ── */}
        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          {([
            { key: 'streak',  label: '🔥 Streak Shields',  val: `${streak} days` },
            { key: 'session', label: '📿 Session Shields', val: `${totalJapaSessions} sessions` },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 rounded-xl py-2.5 text-center transition-all"
              style={{
                background: activeTab === tab.key ? isDark ? 'rgba(200,146,74,0.18)' : 'rgba(200,146,74,0.14)' : 'transparent',
                border: activeTab === tab.key ? '1px solid rgba(200,146,74,0.30)' : '1px solid transparent',
              }}>
              <p className="text-[12px] font-semibold" style={{ color: activeTab === tab.key ? h1 : muted }}>
                {tab.label}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: `${amber}0.55)` }}>{tab.val}</p>
            </button>
          ))}
        </div>

        {/* ── Progress to next ── */}
        {nextShield && (
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-[1.5rem] p-4"
            style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px]" style={{ color: muted }}>Next milestone</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: h1 }}>
                  {nextShield.emoji} {nextShield.name} <span style={{ color: muted, fontWeight: 400 }}>· {nextShield.desc}</span>
                </p>
              </div>
              <span className="text-[13px] font-bold" style={{ color: `${amber}0.85)` }}>
                {value} / {nextShield.threshold}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,rgba(200,146,74,0.75),rgba(212,100,20,0.88))' }}
                initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }} />
            </div>
            <p className="text-[10px] mt-2" style={{ color: muted }}>
              {nextShield.threshold - value} more {activeTab === 'streak' ? 'days' : 'sessions'} to unlock
            </p>
          </motion.div>
        )}

        {/* ── Shields grid ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
          className="rounded-[1.8rem] p-5"
          style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-4" style={{ color: `${amber}0.65)` }}>
            {earnedCount}/{shields.length} Earned
          </p>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {shields.map((shield, idx) => {
                const earned   = value >= shield.threshold;
                const isOpen   = expanded === idx;

                // Progress to THIS shield (not just next)
                const prev     = shields[idx - 1]?.threshold ?? 0;
                const shieldPct = earned ? 100 : Math.min(100, Math.round(((value - prev) / (shield.threshold - prev)) * 100));

                return (
                  <motion.div key={shield.threshold}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}>
                    <button
                      className="w-full text-left"
                      onClick={() => setExpanded(isOpen ? null : idx)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Badge */}
                        <motion.div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 relative"
                          animate={earned ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 0.35, delay: idx * 0.06 }}
                          style={{
                            background: earned
                              ? isDark ? 'rgba(200,146,74,0.20)' : 'rgba(200,146,74,0.14)'
                              : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                            border: earned
                              ? '1.5px solid rgba(200,146,74,0.45)'
                              : `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                            filter: earned ? 'none' : 'grayscale(1) opacity(0.28)',
                            boxShadow: earned ? '0 0 14px rgba(200,146,74,0.18)' : 'none',
                          }}
                        >
                          {shield.emoji}
                          {earned && (
                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: 'rgba(80,200,80,0.92)', border: `1.5px solid ${cardBg}` }}>
                              <span className="text-[8px] text-white font-bold">✓</span>
                            </div>
                          )}
                        </motion.div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="text-sm font-semibold" style={{ color: earned ? h1 : muted }}>
                              {shield.name}
                            </p>
                            <p className="text-[10px]" style={{ color: muted }}>{shield.desc}</p>
                          </div>
                          {/* Mini progress bar for each shield */}
                          {!earned && (
                            <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
                              <motion.div className="h-full rounded-full"
                                style={{ background: `${amber}0.55)` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(shieldPct, 0)}%` }}
                                transition={{ duration: 0.7, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }} />
                            </div>
                          )}
                          {earned && (
                            <p className="text-[10px] mt-0.5" style={{ color: `${amber}0.65)` }}>Unlocked ✦</p>
                          )}
                        </div>

                        <span className="text-[10px] flex-shrink-0" style={{ color: muted }}>
                          {earned ? shield.threshold : `${value}/${shield.threshold}`}
                        </span>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-2 ml-[68px] text-xs leading-relaxed italic"
                            style={{ color: isDark ? 'rgba(245,215,160,0.65)' : 'rgba(100,55,10,0.65)', fontFamily: 'var(--font-serif)' }}>
                            {shield.detail}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Separator */}
                    {idx < shields.length - 1 && (
                      <div className="mt-3 h-px" style={{ background: isDark ? 'rgba(200,146,74,0.06)' : 'rgba(0,0,0,0.05)' }} />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Sanskrit closing ── */}
        <div className="text-center py-3">
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9rem', color: `${amber}0.45)`, fontStyle: 'italic' }}>
            अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते
          </p>
          <p className="text-[10px] mt-1" style={{ color: muted }}>
            By practice and detachment, it is attained. — Gita 6.35
          </p>
        </div>

      </div>
    </div>
  );
}
