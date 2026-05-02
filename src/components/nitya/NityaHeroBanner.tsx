'use client';

// ─── Nitya Karma Hero Banner — Time-Aware ─────────────────────────────────────
//
// Renders a living, animated sky that reflects the actual time of day:
//   Night (0–4 h)     → deep indigo starfield, moon glow
//   Brahma Muhurta (4–6 h) → violet pre-dawn, stars fading, cosmic dust
//   Sunrise (6–8 h)   → warm amber/saffron, rising sun arc, rays
//   Morning (8–12 h)  → golden sky, high sun
//   Afternoon (12–16h)→ bright amber zenith
//   Evening (16–19 h) → crimson/coral sunset, setting sun
//   Dusk (19–21 h)    → indigo dusk, first stars appearing
//   Late night (21–24h)→ full starfield returns
//
// Transitions are smooth (framer-motion + CSS transitions).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Flame } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = 'night' | 'brahma' | 'sunrise' | 'morning' | 'afternoon' | 'evening' | 'dusk';

interface PhaseConfig {
  grad: [string, string, string];
  accentColor: string;
  textColor: string;
  label: string;
  emoji: string;
  stars: boolean;
  moon: boolean;
  sun: boolean;
  sunProgress: number; // 0=below horizon, 0.5=zenith, 1=below horizon other side
  hasDust: boolean;    // cosmic dust particles for brahma muhurta
}

const PHASES: Record<Phase, PhaseConfig> = {
  night: {
    grad:        ['#080614', '#110d28', '#0b0820'],
    accentColor: '#a394e0',
    textColor:   '#e8e0ff',
    label:       'Night Sadhana',
    emoji:       '🌙',
    stars:       true,
    moon:        true,
    sun:         false,
    sunProgress: 0,
    hasDust:     false,
  },
  brahma: {
    grad:        ['#190830', '#3a1058', '#200828'],
    accentColor: '#d4a8f0',
    textColor:   '#f5eeff',
    label:       'Brahma Muhurta',
    emoji:       '✨',
    stars:       true,
    moon:        true,
    sun:         false,
    sunProgress: 0,
    hasDust:     true,
  },
  sunrise: {
    grad:        ['#3b1005', '#c85010', '#f09820'],
    accentColor: '#fcd068',
    textColor:   '#fff8e8',
    label:       'Sacred Sunrise',
    emoji:       '🌅',
    stars:       false,
    moon:        false,
    sun:         true,
    sunProgress: 0.12,
    hasDust:     false,
  },
  morning: {
    grad:        ['#7a2e08', '#d46810', '#f0b020'],
    accentColor: '#fce070',
    textColor:   '#fff8e0',
    label:       'Morning Sadhana',
    emoji:       '🌞',
    stars:       false,
    moon:        false,
    sun:         true,
    sunProgress: 0.35,
    hasDust:     false,
  },
  afternoon: {
    grad:        ['#7a3800', '#c87408', '#e8a418'],
    accentColor: '#fdd060',
    textColor:   '#fff5d0',
    label:       'Afternoon Practice',
    emoji:       '☀️',
    stars:       false,
    moon:        false,
    sun:         true,
    sunProgress: 0.5,
    hasDust:     false,
  },
  evening: {
    grad:        ['#5c0f0f', '#a42010', '#c84018'],
    accentColor: '#fca060',
    textColor:   '#ffe8d8',
    label:       'Evening Sandhya',
    emoji:       '🌇',
    stars:       false,
    moon:        false,
    sun:         true,
    sunProgress: 0.85,
    hasDust:     false,
  },
  dusk: {
    grad:        ['#130620', '#28103a', '#0f0818'],
    accentColor: '#c0a0e8',
    textColor:   '#f0e8ff',
    label:       'Dusk Contemplation',
    emoji:       '🌆',
    stars:       true,
    moon:        false,
    sun:         false,
    sunProgress: 0,
    hasDust:     false,
  },
};

// ── Utility ───────────────────────────────────────────────────────────────────
function getPhase(hour: number): Phase {
  if (hour >= 4  && hour < 6)  return 'brahma';
  if (hour >= 6  && hour < 8)  return 'sunrise';
  if (hour >= 8  && hour < 12) return 'morning';
  if (hour >= 12 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 19) return 'evening';
  if (hour >= 19 && hour < 21) return 'dusk';
  return 'night';
}

// Deterministic star positions (seeded pseudo-random, stable across renders)
function genStars(count: number) {
  const stars: { x: number; y: number; r: number; delay: number; dur: number }[] = [];
  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
  for (let i = 0; i < count; i++) {
    stars.push({
      x:     rand() * 100,
      y:     rand() * 70,
      r:     rand() * 1.4 + 0.4,
      delay: rand() * 3,
      dur:   rand() * 2 + 1.5,
    });
  }
  return stars;
}

const STARS = genStars(52);

// Sun arc: maps sunProgress (0–1) to a parabolic x,y path across the banner
function sunPosition(progress: number) {
  // x: 5% to 95% across width
  const x = 5 + progress * 90;
  // y: parabola — high in middle, low at edges (inverted — lower y = higher in banner)
  const y = 75 - Math.sin(progress * Math.PI) * 60; // 75% down at horizon, 15% at zenith
  return { x, y };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StarField({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 2.5 }}
    >
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left:    `${s.x}%`,
            top:     `${s.y}%`,
            width:   s.r * 2,
            height:  s.r * 2,
            opacity: 0.7,
            animation: `nityaStarTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </motion.div>
  );
}

function Moon({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ top: '12%', right: '14%' }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.7 }}
      transition={{ duration: 2 }}
    >
      {/* Crescent using overlapping circles */}
      <div className="relative" style={{ width: 28, height: 28 }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 40%, #fef8e0, #e8d898)',
            boxShadow: '0 0 18px 6px rgba(240,220,120,0.25)',
          }}
        />
        {/* Shadow circle to create crescent */}
        <div
          className="absolute rounded-full"
          style={{
            width: 26, height: 26,
            top: -2, right: -6,
            background: '#190830', // matches night grad
          }}
        />
      </div>
    </motion.div>
  );
}

function Sun({ progress, visible }: { progress: number; visible: boolean }) {
  const { x, y } = sunPosition(progress);
  const isLow = y > 60; // near horizon — larger, redder
  const sunColor = isLow
    ? 'radial-gradient(circle at 40% 40%, #ffe0a0, #f06018)'
    : 'radial-gradient(circle at 35% 35%, #fff5c0, #f0c030)';
  const glowColor = isLow ? 'rgba(240,96,24,0.35)' : 'rgba(240,192,48,0.28)';
  const size = isLow ? 32 : 26;

  return (
    <motion.div
      className="absolute pointer-events-none"
      animate={{
        left:    `${x}%`,
        top:     `${y}%`,
        opacity: visible ? 1 : 0,
        scale:   visible ? 1 : 0.5,
      }}
      transition={{ duration: 1.8, ease: 'easeInOut' }}
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      {/* Glow halo */}
      <motion.div
        className="absolute rounded-full"
        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: size * 2.8,
          height: size * 2.8,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${glowColor}, transparent 70%)`,
        }}
      />
      {/* Sun disc */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: sunColor,
          boxShadow: `0 0 ${size}px ${glowColor}`,
          position: 'relative',
        }}
      />
    </motion.div>
  );
}

function CosmicDust({ visible }: { visible: boolean }) {
  // Subtle floating particles for Brahma Muhurta
  const particles = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    x:     (i * 37 + 11) % 100,
    y:     (i * 53 + 7)  % 100,
    size:  ((i * 17) % 3) + 1,
    dur:   3 + (i % 4),
    delay: (i * 0.4) % 3,
  })), []);

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 2 }}
    >
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left:       `${p.x}%`,
            top:        `${p.y}%`,
            width:      p.size,
            height:     p.size,
            background: 'rgba(212,168,248,0.6)',
          }}
          animate={{
            y:       [-6, 6, -6],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: p.dur,
            delay:    p.delay,
            repeat:   Infinity,
            ease:     'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface NityaHeroBannerProps {
  greeting:      string;
  userName:      string;
  completedCount: number;
  totalSteps:    number;
  progressPct:   number;
  streak?:       { current_streak: number; longest_streak: number } | null;
  isPro:         boolean;
  panchang?:     any;
  vataDays?:     string | null;
}

export default function NityaHeroBanner({
  greeting,
  userName,
  completedCount,
  totalSteps,
  progressPct,
  streak,
  isPro,
  panchang,
  vataDays,
}: NityaHeroBannerProps) {
  const [hour,   setHour]   = useState(new Date().getHours());
  const [minute, setMinute] = useState(new Date().getMinutes());

  // Update every minute
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setHour(now.getHours());
      setMinute(now.getMinutes());
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const phase  = getPhase(hour);
  const config = PHASES[phase];
  const [g0, g1, g2] = config.grad;

  // Fine-grained sun progress within morning hours
  const detailedSunProgress = (() => {
    if (phase === 'sunrise')   return 0.08 + (minute / 60) * 0.12;
    if (phase === 'morning')   return 0.20 + ((hour - 8)  / 4) * 0.30;
    if (phase === 'afternoon') return 0.50 + ((hour - 12) / 4) * 0.18;
    if (phase === 'evening')   return 0.68 + ((hour - 16) / 3) * 0.24;
    return config.sunProgress;
  })();

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes nityaStarTwinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.85); }
          50%       { opacity: 0.9;  transform: scale(1.15); }
        }
      `}</style>

      <div
        className="relative -mx-3 min-h-[355px] overflow-hidden sm:-mx-4"
        style={{ isolation: 'isolate' }}
      >
        {/* ── Animated sky background ── */}
        <motion.div
          className="absolute inset-0"
          animate={{ background: `linear-gradient(160deg, ${g0} 0%, ${g1} 50%, ${g2} 100%)` }}
          transition={{ duration: 3, ease: 'easeInOut' }}
        />

        {/* ── Atmospheric layers ── */}
        <StarField visible={config.stars} />
        <Moon      visible={config.moon}  />
        <Sun       progress={detailedSunProgress} visible={config.sun} />
        <CosmicDust visible={config.hasDust} />

        {/* ── Frameless fade: no hard card edge, just atmosphere dissolving into page ── */}
        <div
          className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, var(--surface-base), transparent)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-44 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(12,10,7,0.36) 38%, var(--surface-base) 100%)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 74%, rgba(0,0,0,0.08), transparent 62%)',
          }}
        />

        {/* ── Horizon glow (sunrise/sunset) ── */}
        <AnimatePresence>
          {(phase === 'sunrise' || phase === 'evening') && (
            <motion.div
              key="horizon"
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{ height: '45%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
            >
              <div
                className="w-full h-full"
                style={{
                  background: phase === 'sunrise'
                    ? 'linear-gradient(to top, rgba(240,120,20,0.55), transparent)'
                    : 'linear-gradient(to top, rgba(180,30,10,0.55), transparent)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content overlay ── */}
        <div className="relative z-10 flex min-h-[355px] flex-col justify-end px-5 pb-7 pt-14">
          {/* Phase label */}
          <div
            className="mb-3 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: config.accentColor }} />
            <h2 className="text-[14px] font-bold uppercase tracking-widest" style={{ color: config.accentColor, opacity: 0.95 }}>
              {config.label}
            </h2>
          </div>

          <p style={{ color: config.textColor, opacity: 0.90 }} className="text-[13px] font-medium leading-relaxed max-w-[240px]">
            The atmosphere of {config.label.toLowerCase()} is perfect for deep contemplation and steady practice.
          </p>

          {/* Streak — only if active */}
          {isPro && streak && streak.current_streak > 0 && (
            <div className="flex items-center gap-1 mt-3">
              <Flame size={12} style={{ color: config.accentColor }} />
              <span className="text-[11px] font-semibold" style={{ color: config.accentColor }}>
                {streak.current_streak}-day streak
              </span>
            </div>
          )}

          {/* Simple progress bar — no ring, no floating number */}
          <div
            className="mt-5 space-y-1.5 rounded-[1.35rem] px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(16px) saturate(130%)',
              WebkitBackdropFilter: 'blur(16px) saturate(130%)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: config.textColor, opacity: 0.65 }}>
                {completedCount} of {totalSteps} steps
              </span>
              {completedCount === totalSteps && totalSteps > 0 && (
                <span className="text-[10px] font-bold" style={{ color: config.accentColor }}>✓ Complete</span>
              )}
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: config.accentColor }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>

        {/* ── Panchang bar ── */}
        {panchang && (
          <div className="absolute left-5 right-5 top-5 z-10 flex flex-wrap gap-2">
            {panchang.tithi && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px]"
                style={{
                  color: `${config.textColor}d8`,
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <CalendarDays size={12} />
                {panchang.tithi}{panchang.paksha ? ` · ${panchang.paksha}` : ''}
              </span>
            )}
            {panchang.vaara && (
              <span
                className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px]"
                style={{
                  color: `${config.textColor}d8`,
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {panchang.vaara}
              </span>
            )}
            {vataDays && (
              <span
                className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
                style={{
                  color: config.accentColor,
                  background: 'rgba(255,255,255,0.10)',
                  border: `1px solid ${config.accentColor}33`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                {vataDays}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
