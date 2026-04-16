'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChantAudioPlayer from '@/components/bhakti/ChantAudioPlayer';
import { BHAKTI_MANTRAS } from '@/lib/bhakti-practice';

// ─── Timing ──────────────────────────────────────────────────────────────────
const DURATIONS = [12, 24, 48];
const BREATH_PHASES = {
  inhale:  { duration: 4000, label: 'Inhale',  next: 'hold'    },
  hold:    { duration: 2000, label: 'Hold',     next: 'exhale'  },
  exhale:  { duration: 6000, label: 'Exhale',   next: 'inhale'  },
} as const;
type Phase = keyof typeof BREATH_PHASES;

// ─── Phase colours ────────────────────────────────────────────────────────────
const PHASE_COLOURS: Record<Phase, { primary: string; glow: string; ring: string }> = {
  inhale:  { primary: '#f5dfa0', glow: 'rgba(212,166,70,',   ring: 'rgba(212,166,70,0.55)'  },
  hold:    { primary: '#ffffff', glow: 'rgba(255,255,255,',  ring: 'rgba(255,255,255,0.4)'  },
  exhale:  { primary: '#b4c8ff', glow: 'rgba(130,160,255,',  ring: 'rgba(120,150,255,0.45)' },
};

// ─── Environments ─────────────────────────────────────────────────────────────
type EnvId = 'temple' | 'mountains' | 'forest' | 'river' | 'night';
const ENVIRONMENTS: Record<EnvId, { label: string; emoji: string; bg: string; glowColor: string; particleColor: string }> = {
  temple:    { label: 'Temple Dawn',  emoji: '🪔', bg: 'linear-gradient(180deg,#1a0d08 0%,#2e1710 40%,#3e2216 100%)', glowColor: 'rgba(212,120,20,',  particleColor: 'rgba(255,190,60,' },
  mountains: { label: 'Snow Peaks',   emoji: '🏔️', bg: 'linear-gradient(180deg,#10141c 0%,#182030 40%,#1e2c3c 100%)', glowColor: 'rgba(140,180,255,', particleColor: 'rgba(220,235,255,' },
  forest:    { label: 'Forest Still', emoji: '🌿', bg: 'linear-gradient(180deg,#0c1610 0%,#142018 40%,#1c2c1e 100%)', glowColor: 'rgba(60,180,80,',   particleColor: 'rgba(100,220,120,' },
  river:     { label: 'Sacred River', emoji: '🌊', bg: 'linear-gradient(180deg,#0a1218 0%,#101c2a 40%,#162436 100%)', glowColor: 'rgba(40,140,200,',  particleColor: 'rgba(80,180,220,' },
  night:     { label: 'Night Sky',    emoji: '✨', bg: 'linear-gradient(180deg,#04060e 0%,#0a0e1c 40%,#0e1226 100%)', glowColor: 'rgba(160,140,255,', particleColor: 'rgba(220,210,255,' },
};

// ─── Modes ────────────────────────────────────────────────────────────────────
const MODES = [
  { id: 'reading', title: 'Reading',  description: 'Calm scripture reading with minimal noise.',    breathLabel: null    },
  { id: 'breath',  title: 'Breath',   description: 'Guided 4-2-6 pranayama breathing cycle.',       breathLabel: 'Breathe with the mandala' },
  { id: 'chant',   title: 'Chant',    description: 'Single mantra, one rhythm, unbroken mind.',     breathLabel: null    },
] as const;

// ─── WebAudio bell ────────────────────────────────────────────────────────────
function playBell(freq: number, durationSecs: number, volume = 0.18) {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSecs);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationSecs);
  } catch { /* silently fail if AudioContext blocked */ }
}

// ─── Haptic patterns ──────────────────────────────────────────────────────────
function hapticPhase(phase: Phase) {
  if (!navigator.vibrate) return;
  if (phase === 'inhale')  navigator.vibrate([20, 30, 15]);
  if (phase === 'hold')    navigator.vibrate([8, 20, 8]);
  if (phase === 'exhale')  navigator.vibrate([35]);
}

function hapticFinish() {
  navigator.vibrate?.([30, 50, 30, 50, 60]);
}

// ─── Sacred geometry SVG mandala ─────────────────────────────────────────────
function SacredMandala({ color, size = 300 }: { color: string; size?: number }) {
  const r = size / 2;
  // Build 8-petal lotus path
  function petalPath(angle: number, pr: number, pw: number) {
    const rad = (angle * Math.PI) / 180;
    const cx2 = r + pr * Math.cos(rad);
    const cy2 = r + pr * Math.sin(rad);
    const tx = r + (pr * 2) * Math.cos(rad);
    const ty = r + (pr * 2) * Math.sin(rad);
    const bx1 = r + pw * Math.cos(rad - Math.PI / 2);
    const by1 = r + pw * Math.sin(rad - Math.PI / 2);
    const bx2 = r + pw * Math.cos(rad + Math.PI / 2);
    const by2 = r + pw * Math.sin(rad + Math.PI / 2);
    return `M ${r} ${r} C ${bx1} ${by1} ${cx2} ${cy2} ${tx} ${ty} C ${cx2} ${cy2} ${bx2} ${by2} ${r} ${r}`;
  }
  const innerPetals = Array.from({ length: 8 }, (_, i) => petalPath(i * 45, r * 0.22, r * 0.09));
  const outerPetals = Array.from({ length: 16 }, (_, i) => petalPath(i * 22.5, r * 0.36, r * 0.07));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', pointerEvents: 'none' }}>
      {/* Outer lotus — 16 petals, slowly rotating */}
      <motion.g
        style={{ transformOrigin: `${r}px ${r}px` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      >
        {outerPetals.map((d, i) => (
          <path key={`op-${i}`} d={d} fill={color} fillOpacity={0.07} />
        ))}
      </motion.g>

      {/* Inner lotus — 8 petals, counter-rotating */}
      <motion.g
        style={{ transformOrigin: `${r}px ${r}px` }}
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      >
        {innerPetals.map((d, i) => (
          <path key={`ip-${i}`} d={d} fill={color} fillOpacity={0.13} />
        ))}
      </motion.g>

      {/* 8-pointed star (Ashtakona) */}
      <motion.g
        style={{ transformOrigin: `${r}px ${r}px` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          const x1 = r + r * 0.45 * Math.cos(a);
          const y1 = r + r * 0.45 * Math.sin(a);
          const x2 = r + r * 0.45 * Math.cos(a + Math.PI);
          const y2 = r + r * 0.45 * Math.sin(a + Math.PI);
          return <line key={`l-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeOpacity={0.1} strokeWidth={0.5} />;
        })}
      </motion.g>

      {/* Inner triangle pair */}
      <motion.g
        style={{ transformOrigin: `${r}px ${r}px` }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        <polygon
          points={`${r},${r - r * 0.3} ${r + r * 0.26},${r + r * 0.15} ${r - r * 0.26},${r + r * 0.15}`}
          fill="none" stroke={color} strokeOpacity={0.14} strokeWidth={0.8}
        />
        <polygon
          points={`${r},${r + r * 0.3} ${r + r * 0.26},${r - r * 0.15} ${r - r * 0.26},${r - r * 0.15}`}
          fill="none" stroke={color} strokeOpacity={0.14} strokeWidth={0.8}
        />
      </motion.g>

      {/* Bindu — central dot */}
      <motion.circle cx={r} cy={r} r={2.5} fill={color} fillOpacity={0.6}
        animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: `${r}px ${r}px` }}
      />
    </svg>
  );
}

// ─── AAA Breath Circle ────────────────────────────────────────────────────────
function BreathCircle({
  running,
  glowColor,
  phase,
  remaining,
  totalSecs,
}: {
  running: boolean;
  glowColor: string;
  phase: Phase;
  remaining: number;
  totalSecs: number;
}) {
  const colours = PHASE_COLOURS[phase];
  const scale = phase === 'inhale' ? 1.22 : phase === 'hold' ? 1.22 : 0.82;
  const dur   = phase === 'inhale' ? 4   : phase === 'hold'  ? 0.3  : 6;

  const ringSpring = { type: 'spring' as const, stiffness: 28, damping: 14 };

  return (
    <div className="relative flex items-center justify-center" style={{ width: 300, height: 300 }}>

      {/* Sacred geometry mandala behind everything */}
      <div className="absolute inset-0 flex items-center justify-center opacity-80">
        <SacredMandala color={colours.primary} size={300} />
      </div>

      {/* Ring 5 — outermost, always rotating, very faint */}
      <motion.div
        className="absolute rounded-full border"
        style={{ width: 290, height: 290, borderColor: `${glowColor}0.08)` }}
        animate={{ rotate: 360, scale: running ? scale * 1.03 : 1 }}
        transition={{ rotate: { duration: 90, repeat: Infinity, ease: 'linear' }, scale: { duration: dur, ease: 'easeInOut', ...ringSpring } }}
      />

      {/* Ring 4 — slow glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 248, height: 248,
          border: `1.5px solid ${glowColor}0.14)`,
          boxShadow: running ? `0 0 40px ${glowColor}0.12), 0 0 80px ${glowColor}0.06)` : 'none',
        }}
        animate={{ scale: running ? scale * 1.02 : 1, opacity: running ? 1 : 0.5 }}
        transition={{ duration: dur, ease: 'easeInOut' }}
      />

      {/* Ring 3 — medium glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 210, height: 210,
          border: `1px solid ${colours.ring}`,
          boxShadow: running ? `0 0 30px ${glowColor}0.2), inset 0 0 30px ${glowColor}0.06)` : 'none',
        }}
        animate={{ scale: running ? scale * 1.01 : 1, opacity: running ? 1 : 0.45 }}
        transition={{ duration: dur, ease: 'easeInOut' }}
      />

      {/* Ring 2 — dashed orbit */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 172, height: 172,
          border: `1.5px dashed ${glowColor}0.3)`,
        }}
        animate={{
          rotate: phase === 'inhale' ? 90 : phase === 'hold' ? 90 : 0,
          scale: running ? scale : 1,
        }}
        transition={{ duration: dur, ease: 'easeInOut' }}
      />

      {/* Ring 1 — core glowing fill (the breath bubble) */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 136, height: 136,
          background: `radial-gradient(circle at 38% 38%, ${glowColor}0.35) 0%, ${glowColor}0.18) 50%, ${glowColor}0.04) 100%)`,
          boxShadow: running
            ? `0 0 50px ${glowColor}0.4), 0 0 100px ${glowColor}0.2), inset 0 0 20px ${glowColor}0.1)`
            : `0 0 20px ${glowColor}0.12)`,
        }}
        animate={{ scale: running ? scale * 0.98 : 1, opacity: running ? 1 : 0.7 }}
        transition={{ duration: dur, ease: 'easeInOut' }}
      />

      {/* Centre label */}
      <div className="relative z-10 text-center pointer-events-none">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-sm font-semibold tracking-widest uppercase"
          style={{ color: colours.primary, textShadow: `0 0 12px ${glowColor}0.5)` }}
        >
          {running ? BREATH_PHASES[phase].label : 'Ready'}
        </motion.p>
        <p className="font-mono text-2xl font-light mt-1"
          style={{ color: colours.primary, textShadow: `0 0 16px ${glowColor}0.6)` }}>
          {formatClock(remaining)}
        </p>
        {running && (
          <p className="text-[10px] mt-1" style={{ color: `${glowColor}0.5)` }}>
            {Math.round(((totalSecs - remaining) / totalSecs) * 100)}% complete
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Particle systems ─────────────────────────────────────────────────────────
function SnowParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div key={`snow-${i}`} className="absolute rounded-full"
          style={{
            width: 1 + (i % 3),
            height: 1 + (i % 3),
            left: `${(i * 5.1) % 99}%`,
            background: `rgba(220,235,255,${0.5 + (i % 4) * 0.12})`,
            boxShadow: i % 4 === 0 ? '0 0 4px rgba(200,220,255,0.6)' : 'none',
          }}
          initial={{ y: '-5vh', opacity: 0 }}
          animate={{ y: '108vh', x: [0, i % 2 === 0 ? 18 : -18, 0], opacity: [0, 0.8, 0.8, 0] }}
          transition={{ duration: 8 + (i % 5) * 1.2, repeat: Infinity, delay: i * 0.48, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

function FireflyParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div key={`fly-${i}`} className="absolute rounded-full"
          style={{
            width: 2 + (i % 2),
            height: 2 + (i % 2),
            left: `${(i * 6.3) % 95}%`,
            top: `${15 + (i * 4.9) % 70}%`,
            background: i % 3 === 0 ? 'rgba(180,255,120,0.9)' : 'rgba(100,220,80,0.9)',
            boxShadow: `0 0 ${4 + (i % 3) * 2}px rgba(80,220,60,0.7)`,
          }}
          animate={{
            x: [0, i % 2 === 0 ? 24 : -24, 12, -12, 0],
            y: [0, -16, 8, -10, 0],
            opacity: [0, 0.9, 0.3, 1, 0],
            scale: [0.4, 1, 0.5, 1.3, 0.4],
          }}
          transition={{ duration: 4 + (i % 4) * 1.2, repeat: Infinity, delay: i * 0.55, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function TempleParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div key={`lamp-${i}`} className="absolute rounded-full"
          style={{
            width: 1.5 + (i % 3) * 0.5,
            height: 1.5 + (i % 3) * 0.5,
            left: `${10 + (i * 5.3) % 80}%`,
            bottom: `${5 + (i % 4) * 3}%`,
            background: i % 3 === 0 ? 'rgba(255,200,60,0.9)' : 'rgba(255,150,30,0.8)',
            boxShadow: `0 0 ${3 + (i % 3) * 2}px rgba(255,170,40,0.6)`,
          }}
          animate={{
            y: [0, -(50 + i * 12)],
            x: [0, (i % 2 === 0 ? 1 : -1) * (4 + i % 5)],
            opacity: [0, 0.8, 0.5, 0],
            scale: [0.4, 1.2, 0.6, 0],
          }}
          transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, delay: i * 0.65, ease: 'easeOut' }}
        />
      ))}
      {/* Lamp glow at bottom center */}
      <motion.div className="absolute left-1/2 bottom-[10%] -translate-x-1/2 rounded-full"
        style={{ width: 80, height: 80, background: 'radial-gradient(circle, rgba(255,160,30,0.14) 0%, transparent 70%)' }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function NightStars() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div key={`star-${i}`} className="absolute rounded-full"
          style={{
            width: i % 8 === 0 ? 2 : 1,
            height: i % 8 === 0 ? 2 : 1,
            left: `${(i * 2.1) % 100}%`,
            top: `${(i * 2.7) % 75}%`,
            background: 'white',
            boxShadow: i % 8 === 0 ? '0 0 4px rgba(200,200,255,0.8)' : 'none',
          }}
          animate={{ opacity: [0.15, i % 3 === 0 ? 0.9 : 0.5, 0.15], scale: [0.8, i % 5 === 0 ? 1.8 : 1.2, 0.8] }}
          transition={{ duration: 1.5 + (i % 5) * 0.7, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
      <motion.div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(150,130,255,0.05) 40%, transparent 70%)' }}
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
    </div>
  );
}

function RiverRipples() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div key={`ripple-${i}`} className="absolute left-1/2 rounded-full"
          style={{
            width: 40 + i * 60,
            height: 40 + i * 60,
            bottom: -20 - i * 18,
            marginLeft: -(20 + i * 30),
            border: `1px solid rgba(80,160,220,${0.25 - i * 0.03})`,
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.12, 0.35, 0.12] }}
          transition={{ duration: 4 + i * 1.5, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}
        />
      ))}
      {/* Water shimmer */}
      <motion.div className="absolute bottom-0 left-0 right-0 h-24"
        style={{ background: 'linear-gradient(0deg, rgba(20,80,140,0.18) 0%, transparent 100%)' }}
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      />
    </div>
  );
}

function EnvParticles({ env }: { env: EnvId }) {
  if (env === 'mountains') return <SnowParticles />;
  if (env === 'forest')    return <FireflyParticles />;
  if (env === 'temple')    return <TempleParticles />;
  if (env === 'night')     return <NightStars />;
  if (env === 'river')     return <RiverRipples />;
  return null;
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ZenModePage() {
  const [mode,             setMode]     = useState<'reading' | 'breath' | 'chant'>('reading');
  const [duration,         setDuration] = useState(24);
  const [chantMantra,      setMantra]   = useState<string>(BHAKTI_MANTRAS[0].value);
  const [remaining,        setRemaining]= useState(24 * 60);
  const [running,          setRunning]  = useState(false);
  const [focusMode,        setFocusMode]= useState(false);
  const [focusEnvironment, setEnv]      = useState<EnvId>('temple');
  const [phase,            setPhase]    = useState<Phase>('inhale');

  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalSecs     = duration * 60;

  // Reset timer when duration/mode changes
  useEffect(() => {
    setRemaining(duration * 60);
    setRunning(false);
    setPhase('inhale');
  }, [duration, mode]);

  // Countdown timer
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining(cur => {
        if (cur <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          hapticFinish();
          playBell(432, 3, 0.25);
          return 0;
        }
        return cur - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  // Breathing phase cycle
  useEffect(() => {
    if (!running || mode !== 'breath') return;

    function cyclePhase(current: Phase) {
      hapticPhase(current);
      if (current === 'inhale') playBell(432, 0.8, 0.12);
      if (current === 'exhale') playBell(528, 1.2, 0.1);
      setPhase(current);
      const next = BREATH_PHASES[current].next as Phase;
      phaseTimeout.current = setTimeout(() => cyclePhase(next), BREATH_PHASES[current].duration);
    }
    cyclePhase('inhale');
    return () => { if (phaseTimeout.current) clearTimeout(phaseTimeout.current); };
  }, [running, mode]);

  const activeMode  = MODES.find(m => m.id === mode) ?? MODES[0];
  const activeChant = BHAKTI_MANTRAS.find(m => m.value === chantMantra) ?? BHAKTI_MANTRAS[0];
  const activeEnv   = ENVIRONMENTS[focusEnvironment];
  const progress    = ((totalSecs - remaining) / totalSecs) * 100;
  const chantTrackIds = activeChant.audioTrackId ? [activeChant.audioTrackId] : ['gayatri-mantra-as-it-is', 'guru-stotram'];

  function toggleRunning() {
    setRunning(r => !r);
    navigator.vibrate?.([10]);
  }

  function reset() {
    setRunning(false);
    setRemaining(totalSecs);
    setPhase('inhale');
  }

  function enterFocus() {
    setFocusMode(true);
    setRunning(true);
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in space-y-5">

      {/* ── Mode cards ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[2rem] px-5 py-6"
        style={{ background: 'linear-gradient(160deg,rgba(26,14,8,0.96) 0%,rgba(18,10,6,0.98) 100%)', border: '1px solid rgba(212,166,70,0.16)' }}>
        <div className="space-y-4">
          <div className="inline-flex rounded-full px-3 py-1 text-xs"
            style={{ background: 'rgba(212,166,70,0.1)', color: 'rgba(212,166,70,0.7)', border: '1px solid rgba(212,166,70,0.18)' }}>
            Zen mode
          </div>
          <div>
            <h1 className="type-screen-title" style={{ color: '#f5dfa0' }}>A quieter surface</h1>
            <p className="type-body mt-2" style={{ color: 'rgba(245,210,130,0.5)' }}>
              Less chrome. More stillness. One clear devotional focus.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {MODES.map(item => (
              <button key={item.id} onClick={() => setMode(item.id as any)}
                className="rounded-[1.5rem] px-4 py-4 text-left transition-all"
                style={{
                  background: mode === item.id ? 'rgba(212,166,70,0.13)' : 'rgba(28,18,10,0.7)',
                  border: `1px solid ${mode === item.id ? 'rgba(212,166,70,0.32)' : 'rgba(212,166,70,0.1)'}`,
                  boxShadow: mode === item.id ? '0 0 20px rgba(212,166,70,0.08)' : 'none',
                }}>
                <p className="type-card-heading" style={{ color: mode === item.id ? '#f5dfa0' : 'rgba(245,220,150,0.55)' }}>
                  {item.title}
                </p>
                <p className="type-body mt-1" style={{ color: 'rgba(245,210,130,0.4)' }}>{item.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timer + practice ─────────────────────────────────────────────── */}
      <section className="rounded-[2rem] px-5 py-6 text-center"
        style={{ background: 'rgba(16,10,6,0.94)', border: '1px solid rgba(212,166,70,0.1)' }}>

        <p className="type-card-label mb-4" style={{ color: 'rgba(245,210,130,0.55)' }}>{activeMode.title}</p>

        {mode === 'breath' ? (
          <div className="flex justify-center my-2">
            <BreathCircle running={running} glowColor="rgba(180,140,60," phase={phase} remaining={remaining} totalSecs={totalSecs} />
          </div>
        ) : (
          <div className="my-6">
            <p className="font-mono" style={{ color: '#f5dfa0', fontSize: '3.5rem', fontWeight: 300, textShadow: '0 0 24px rgba(212,166,70,0.35)' }}>
              {formatClock(remaining)}
            </p>
            <p className="mt-2 text-sm" style={{ color: 'rgba(245,210,130,0.4)' }}>{activeMode.description}</p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mx-auto mt-4 h-1 w-56 overflow-hidden rounded-full" style={{ background: 'rgba(212,166,70,0.1)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,rgba(212,100,20,0.9),rgba(212,166,70,1))' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>

        {/* Duration pills */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {DURATIONS.map(v => (
            <button key={v} onClick={() => setDuration(v)}
              className="rounded-full px-4 py-2 type-chip transition-all"
              style={duration === v
                ? { background: 'linear-gradient(135deg,rgba(212,100,20,0.9),rgba(212,166,70,0.85))', color: '#1c1208' }
                : { background: 'rgba(28,18,10,0.7)', color: 'rgba(245,210,130,0.5)', border: '1px solid rgba(212,166,70,0.14)' }}>
              {v} min
            </button>
          ))}
        </div>

        {/* Chant mode picker */}
        {mode === 'chant' && (
          <div className="mt-5 rounded-[1.5rem] px-4 py-4 text-left"
            style={{ background: 'rgba(28,18,10,0.8)', border: '1px solid rgba(212,166,70,0.14)' }}>
            <p className="type-card-heading mb-3" style={{ color: '#f5dfa0' }}>Chant focus</p>
            <select value={chantMantra} onChange={e => setMantra(e.target.value)}
              className="type-body w-full rounded-xl px-4 py-3 outline-none"
              style={{ background: 'rgba(18,12,8,0.9)', border: '1px solid rgba(212,166,70,0.14)', color: 'rgba(245,220,150,0.8)' }}>
              {BHAKTI_MANTRAS.map(m => <option key={m.value} value={m.value}>{m.value}</option>)}
            </select>
            <div className="mt-3">
              <ChantAudioPlayer title="Chant companion" trackIds={chantTrackIds} initialTrackId={activeChant.audioTrackId ?? undefined} compact />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={toggleRunning}
            className="rounded-full px-7 py-3 type-chip font-medium transition-all"
            style={{
              background: running ? 'rgba(212,166,70,0.15)' : 'linear-gradient(135deg,rgba(212,100,20,0.9),rgba(212,166,70,0.85))',
              color: running ? 'rgba(245,210,130,0.8)' : '#1c1208',
              border: '1px solid rgba(212,166,70,0.3)',
              boxShadow: running ? 'none' : '0 4px 24px rgba(212,120,20,0.3)',
            }}>
            {running ? 'Pause' : 'Begin'}
          </button>
          <button onClick={enterFocus}
            className="rounded-full px-6 py-3 type-chip font-medium transition-all"
            style={{ background: 'rgba(212,166,70,0.08)', color: 'rgba(212,166,70,0.8)', border: '1px solid rgba(212,166,70,0.22)' }}>
            Full Focus ✨
          </button>
          <button onClick={reset}
            className="rounded-full px-5 py-3 type-chip transition-all"
            style={{ color: 'rgba(245,210,130,0.45)', border: '1px solid rgba(212,166,70,0.1)' }}>
            Reset
          </button>
        </div>
      </section>

      {/* ── Environment selector ─────────────────────────────────────────── */}
      <section className="rounded-[1.8rem] p-5" style={{ background: 'rgba(12,8,4,0.88)', border: '1px solid rgba(212,166,70,0.08)' }}>
        <p className="text-xs mb-3" style={{ color: 'rgba(245,210,130,0.4)' }}>Choose your sanctuary</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(ENVIRONMENTS) as [EnvId, typeof ENVIRONMENTS[EnvId]][]).map(([id, env]) => (
            <button key={id} onClick={() => setEnv(id)}
              className="rounded-full px-3 py-1.5 text-xs transition-all"
              style={focusEnvironment === id
                ? { background: 'rgba(212,166,70,0.18)', color: '#f5dfa0', border: '1px solid rgba(212,166,70,0.3)', boxShadow: '0 0 12px rgba(212,166,70,0.12)' }
                : { background: 'rgba(28,18,10,0.6)', color: 'rgba(245,210,130,0.45)', border: '1px solid rgba(212,166,70,0.1)' }}>
              {env.emoji} {env.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Full Focus Overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[80] overflow-hidden"
            style={{ background: activeEnv.bg }}
          >
            {/* Ambient deep glow */}
            <motion.div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 500, height: 500,
                background: `radial-gradient(circle, ${activeEnv.glowColor}0.10) 0%, transparent 68%)`,
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            <EnvParticles env={focusEnvironment} />

            <div className="mx-auto grid h-full w-full max-w-lg grid-rows-[auto_1fr_auto] px-4 py-6 text-center">

              {/* Top bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: `${activeEnv.glowColor}0.8)`, textShadow: `0 0 8px ${activeEnv.glowColor}0.4)` }}>
                    {activeEnv.emoji} {activeEnv.label}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: 'rgba(245,220,150,0.45)' }}>
                    {activeMode.title}{mode === 'chant' ? ` · ${chantMantra}` : ''}
                  </p>
                </div>
                <button onClick={() => { setFocusMode(false); setRunning(false); }}
                  className="rounded-full px-4 py-2 text-xs transition"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(245,210,130,0.55)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  Close
                </button>
              </div>

              {/* Centre — breathing circle or timer orb */}
              <div className="flex flex-col items-center justify-center gap-6 min-h-0">
                {mode === 'breath' ? (
                  <BreathCircle
                    running={running}
                    glowColor={activeEnv.glowColor}
                    phase={phase}
                    remaining={remaining}
                    totalSecs={totalSecs}
                  />
                ) : (
                  <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
                    {/* Background mandala */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-60">
                      <SacredMandala color={activeEnv.glowColor.replace('rgba(', '').replace(',', '').split(',')[0] === '212' ? '#f5dfa0' : '#b4c8ff'} size={280} />
                    </div>
                    {/* Outer pulsing ring */}
                    <motion.div className="absolute rounded-full"
                      style={{ width: 262, height: 262, border: `1px solid ${activeEnv.glowColor}0.15)` }}
                      animate={{ scale: running ? [1, 1.04, 1] : 1 }}
                      transition={{ duration: 4.5, repeat: running ? Infinity : 0, ease: 'easeInOut' }}
                    />
                    {/* Glow ring */}
                    <motion.div className="absolute rounded-full"
                      style={{
                        width: 220, height: 220,
                        border: `1.5px solid ${activeEnv.glowColor}0.3)`,
                        boxShadow: running ? `0 0 40px ${activeEnv.glowColor}0.2), inset 0 0 30px ${activeEnv.glowColor}0.08)` : 'none',
                      }}
                      animate={{ scale: running ? [1, 1.03, 1] : 1 }}
                      transition={{ duration: 4.5, repeat: running ? Infinity : 0, ease: 'easeInOut' }}
                    />
                    {/* Inner orb */}
                    <motion.div className="absolute rounded-full"
                      style={{
                        width: 160, height: 160,
                        background: `radial-gradient(circle at 38% 38%, ${activeEnv.glowColor}0.3) 0%, ${activeEnv.glowColor}0.1) 60%, transparent 100%)`,
                        boxShadow: running ? `0 0 50px ${activeEnv.glowColor}0.3)` : 'none',
                      }}
                      animate={{ scale: running ? [1, 1.06, 1] : 1 }}
                      transition={{ duration: 4.5, repeat: running ? Infinity : 0, ease: 'easeInOut' }}
                    />
                    {/* Timer text */}
                    <div className="relative z-10 text-center">
                      <p className="font-mono text-4xl font-light"
                        style={{ color: '#f5dfa0', textShadow: `0 0 20px ${activeEnv.glowColor}0.6)` }}>
                        {formatClock(remaining)}
                      </p>
                      <p className="text-[11px] mt-1.5" style={{ color: `${activeEnv.glowColor}0.5)` }}>
                        {mode === 'chant' ? chantMantra : activeMode.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="h-0.5 w-48 overflow-hidden rounded-full" style={{ background: `${activeEnv.glowColor}0.1)` }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg,${activeEnv.glowColor}0.7),${activeEnv.glowColor}1))` }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>

                {mode === 'chant' && (
                  <div className="w-full max-w-sm">
                    <ChantAudioPlayer title="Focus chant" trackIds={chantTrackIds} initialTrackId={activeChant.audioTrackId ?? undefined} compact />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={toggleRunning}
                  className="rounded-full px-8 py-3.5 text-sm font-medium transition-all"
                  style={{
                    background: running
                      ? 'rgba(255,255,255,0.07)'
                      : `linear-gradient(135deg,${activeEnv.glowColor}0.85),${activeEnv.glowColor}0.6))`,
                    color: running ? 'rgba(245,210,130,0.75)' : '#1c1208',
                    border: `1px solid ${activeEnv.glowColor}0.3)`,
                    boxShadow: running ? 'none' : `0 4px 24px ${activeEnv.glowColor}0.3)`,
                  }}>
                  {running ? 'Pause' : 'Begin'}
                </button>
                <button onClick={reset}
                  className="rounded-full px-6 py-3.5 text-sm transition"
                  style={{ color: 'rgba(245,210,130,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
