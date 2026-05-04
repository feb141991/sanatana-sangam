'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Settings2 } from 'lucide-react';
import ChantAudioPlayer from '@/components/bhakti/ChantAudioPlayer';
import { BHAKTI_MANTRAS } from '@/lib/bhakti-practice';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';

// ─── Timing ──────────────────────────────────────────────────────────────────
const PRESET_DURATIONS = [12, 24, 48];
const BREATH_PHASES = {
  inhale: { duration: 4000, label: 'Inhale', next: 'hold'   },
  hold:   { duration: 2000, label: 'Hold',   next: 'exhale' },
  exhale: { duration: 6000, label: 'Exhale', next: 'inhale' },
} as const;
type Phase = keyof typeof BREATH_PHASES;

// ─── Phase colours ─────────────────────────────────────────────────────────
const PHASE_COLOURS: Record<Phase, { primary: string; glow: string; ring: string }> = {
  inhale: { primary: '#f5dfa0', glow: 'rgba(200,146,74,',  ring: 'rgba(200,146,74,0.55)'  },
  hold:   { primary: '#ffffff', glow: 'rgba(255,255,255,', ring: 'rgba(255,255,255,0.4)'  },
  exhale: { primary: '#b4c8ff', glow: 'rgba(130,160,255,', ring: 'rgba(120,150,255,0.45)' },
};

// ─── Environments ───────────────────────────────────────────────────────────
type EnvId = 'temple' | 'mountains' | 'forest' | 'river' | 'night';
const ENVIRONMENTS: Record<EnvId, { label: string; emoji: string; bg: string; glowColor: string; particleColor: string }> = {
  temple:    { label: 'Temple Dawn',  emoji: '🪔', bg: 'linear-gradient(180deg,#1a0d08 0%,#2e1710 40%,#3e2216 100%)', glowColor: 'rgba(212,120,20,',  particleColor: 'rgba(255,190,60,'  },
  mountains: { label: 'Snow Peaks',   emoji: '🏔️', bg: 'linear-gradient(180deg,#10141c 0%,#182030 40%,#1e2c3c 100%)', glowColor: 'rgba(140,180,255,', particleColor: 'rgba(220,235,255,' },
  forest:    { label: 'Forest Still', emoji: '🌿', bg: 'linear-gradient(180deg,#0c1610 0%,#142018 40%,#1c2c1e 100%)', glowColor: 'rgba(60,180,80,',   particleColor: 'rgba(100,220,120,' },
  river:     { label: 'Sacred River', emoji: '🌊', bg: 'linear-gradient(180deg,#0a1218 0%,#101c2a 40%,#162436 100%)', glowColor: 'rgba(40,140,200,',  particleColor: 'rgba(80,180,220,'  },
  night:     { label: 'Night Sky',    emoji: '✨', bg: 'linear-gradient(180deg,#04060e 0%,#0a0e1c 40%,#0e1226 100%)', glowColor: 'rgba(160,140,255,', particleColor: 'rgba(220,210,255,' },
};

// ─── Modes ──────────────────────────────────────────────────────────────────
const MODES = [
  { id: 'reading', emoji: '📖', title: 'Svādhyāya', description: 'Silent scripture in sattva.' },
  { id: 'breath',  emoji: '🫁', title: 'Prānāyāma', description: 'Nāḍī śodhana — 4-2-6 cycle.' },
  { id: 'chant',   emoji: '🕉️', title: 'Kīrtana',   description: 'One mantra, one pointed mind.' },
] as const;

// ─── Ambient options ─────────────────────────────────────────────────────────
const AMBIENT_OPTIONS = [
  { id: 'off',  label: 'Off',     emoji: '🔇' },
  { id: 'bowl', label: 'Bowl',    emoji: '🎵' },
  { id: 'om',   label: 'Om Nada', emoji: '🕉️' },
  { id: 'tanpura', label: 'Tanpura', emoji: '🪕' },
  { id: 'inst', label: 'Strings', emoji: '🎻' },
] as const;
type AmbientId = typeof AMBIENT_OPTIONS[number]['id'];
const STORAGE_ZEN_SOUND = 'ss-zen-ambient';

// ─── WebAudio ambient ────────────────────────────────────────────────────────
let ambientCtx: AudioContext | null = null;
let ambientNodes: { osc?: OscillatorNode; gain?: GainNode }[] = [];

function stopAmbient() {
  ambientNodes.forEach(n => { try { n.osc?.stop(); n.gain?.disconnect(); } catch {} });
  ambientNodes = [];
}

function playBowlAmbient(volume = 0.06) {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    if (!ambientCtx) ambientCtx = new Ctx();
    const ctx = ambientCtx!;
    stopAmbient();
    [[432, 1.0], [648, 0.4], [216, 0.3]].forEach(([freq, rel]) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * (rel as number), ctx.currentTime + 2.5);
      osc.start(ctx.currentTime);
      ambientNodes.push({ osc, gain });
    });
  } catch {}
}

function playOmAmbient(volume = 0.07) {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    if (!ambientCtx) ambientCtx = new Ctx();
    const ctx = ambientCtx!;
    stopAmbient();
    [136.1, 272.2, 408.3].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume / (i + 1), ctx.currentTime + 3);
      osc.start(ctx.currentTime);
      ambientNodes.push({ osc, gain });
    });
  } catch {}
}

function playTanpuraAmbient(volume = 0.08) {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    if (!ambientCtx) ambientCtx = new Ctx();
    const ctx = ambientCtx!;
    stopAmbient();
    // Tanpura: Root, Octave, and Fifth (Pa-Sa-Sa-Sa)
    [138.59, 138.59 * 1.5, 277.18, 138.59 * 0.75].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume / (i + 1), ctx.currentTime + 3);
      osc.start(ctx.currentTime);
      ambientNodes.push({ osc, gain });
    });
  } catch {}
}

function playInstrumentalAmbient(volume = 0.05) {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    if (!ambientCtx) ambientCtx = new Ctx();
    const ctx = ambientCtx!;
    stopAmbient();
    [146.83, 220.0, 293.66, 440.0].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume / (i + 1.5), ctx.currentTime + 4);
      osc.start(ctx.currentTime);
      ambientNodes.push({ osc, gain });
    });
  } catch {}
}

function fadeOutAmbient() {
  if (!ambientCtx) return;
  const ctx = ambientCtx;
  ambientNodes.forEach(n => {
    if (n.gain) {
      try { n.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5); } catch {}
      setTimeout(() => { try { n.osc?.stop(); } catch {} }, 1600);
    }
  });
  ambientNodes = [];
}

// ─── Bell ────────────────────────────────────────────────────────────────────
function playBell(freq: number, durationSecs: number, volume = 0.18) {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSecs);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + durationSecs);
  } catch {}
}

function hapticPhase(phase: Phase) {
  if (!navigator.vibrate) return;
  if (phase === 'inhale') navigator.vibrate([20, 30, 15]);
  if (phase === 'hold')   navigator.vibrate([8, 20, 8]);
  if (phase === 'exhale') navigator.vibrate([35]);
}
function hapticFinish() { navigator.vibrate?.([30, 50, 30, 50, 60]); }

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Sacred geometry mandala ────────────────────────────────────────────────
function SacredMandala({ color, size = 300 }: { color: string; size?: number }) {
  const r = size / 2;
  function petalPath(angle: number, pr: number, pw: number) {
    const rad = (angle * Math.PI) / 180;
    const cx2 = r + pr * Math.cos(rad), cy2 = r + pr * Math.sin(rad);
    const tx = r + (pr * 2) * Math.cos(rad), ty = r + (pr * 2) * Math.sin(rad);
    const bx1 = r + pw * Math.cos(rad - Math.PI / 2), by1 = r + pw * Math.sin(rad - Math.PI / 2);
    const bx2 = r + pw * Math.cos(rad + Math.PI / 2), by2 = r + pw * Math.sin(rad + Math.PI / 2);
    return `M ${r} ${r} C ${bx1} ${by1} ${cx2} ${cy2} ${tx} ${ty} C ${cx2} ${cy2} ${bx2} ${by2} ${r} ${r}`;
  }
  const innerPetals = Array.from({ length: 8 },  (_, i) => petalPath(i * 45,   r * 0.22, r * 0.09));
  const outerPetals = Array.from({ length: 16 }, (_, i) => petalPath(i * 22.5, r * 0.36, r * 0.07));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute', pointerEvents: 'none' }}>
      <motion.g style={{ transformOrigin: `${r}px ${r}px` }}
        animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}>
        {outerPetals.map((d, i) => <path key={`op-${i}`} d={d} fill={color} fillOpacity={0.09} />)}
      </motion.g>
      <motion.g style={{ transformOrigin: `${r}px ${r}px` }}
        animate={{ rotate: -360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}>
        {innerPetals.map((d, i) => <path key={`ip-${i}`} d={d} fill={color} fillOpacity={0.16} />)}
      </motion.g>
      <motion.g style={{ transformOrigin: `${r}px ${r}px` }}
        animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          return <line key={`l-${i}`}
            x1={r + r * 0.45 * Math.cos(a)} y1={r + r * 0.45 * Math.sin(a)}
            x2={r + r * 0.45 * Math.cos(a + Math.PI)} y2={r + r * 0.45 * Math.sin(a + Math.PI)}
            stroke={color} strokeOpacity={0.12} strokeWidth={0.5} />;
        })}
      </motion.g>
      <motion.g style={{ transformOrigin: `${r}px ${r}px` }}
        animate={{ rotate: [0, 360] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
        <polygon points={`${r},${r - r * 0.3} ${r + r * 0.26},${r + r * 0.15} ${r - r * 0.26},${r + r * 0.15}`}
          fill="none" stroke={color} strokeOpacity={0.16} strokeWidth={0.8} />
        <polygon points={`${r},${r + r * 0.3} ${r + r * 0.26},${r - r * 0.15} ${r - r * 0.26},${r - r * 0.15}`}
          fill="none" stroke={color} strokeOpacity={0.16} strokeWidth={0.8} />
      </motion.g>
      <motion.circle cx={r} cy={r} r={3} fill={color} fillOpacity={0.7}
        animate={{ scale: [0.8, 1.5, 0.8], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: `${r}px ${r}px` }} />
    </svg>
  );
}

// ─── Breath Circle ──────────────────────────────────────────────────────────
function BreathCircle({ running, glowColor, phase, remaining, totalSecs }: {
  running: boolean; glowColor: string; phase: Phase; remaining: number; totalSecs: number;
}) {
  const colours = PHASE_COLOURS[phase];
  const scale   = phase === 'inhale' ? 1.22 : phase === 'hold' ? 1.22 : 0.82;
  const dur     = phase === 'inhale' ? 4    : phase === 'hold'  ? 0.3  : 6;
  const ringSpring = { type: 'spring' as const, stiffness: 28, damping: 14 };

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      <div className="absolute inset-0 flex items-center justify-center opacity-80">
        <SacredMandala color={colours.primary} size={280} />
      </div>
      <motion.div className="absolute rounded-full border"
        style={{ width: 270, height: 270, borderColor: `${glowColor}0.08)` }}
        animate={{ rotate: 360, scale: running ? scale * 1.03 : 1 }}
        transition={{ rotate: { duration: 90, repeat: Infinity, ease: 'linear' }, scale: { duration: dur, ease: 'easeInOut', ...ringSpring } }}
      />
      <motion.div className="absolute rounded-full"
        style={{ width: 228, height: 228, border: `1.5px solid ${glowColor}0.15)`, boxShadow: running ? `0 0 40px ${glowColor}0.12), 0 0 80px ${glowColor}0.06)` : 'none' }}
        animate={{ scale: running ? scale * 1.02 : 1, opacity: running ? 1 : 0.5 }}
        transition={{ duration: dur, ease: 'easeInOut' }}
      />
      <motion.div className="absolute rounded-full"
        style={{ width: 188, height: 188, border: `1px solid ${colours.ring}`, boxShadow: running ? `0 0 30px ${glowColor}0.22), inset 0 0 30px ${glowColor}0.06)` : 'none' }}
        animate={{ scale: running ? scale * 1.01 : 1, opacity: running ? 1 : 0.45 }}
        transition={{ duration: dur, ease: 'easeInOut' }}
      />
      <motion.div className="absolute rounded-full"
        style={{ width: 152, height: 152, border: `1.5px dashed ${glowColor}0.3)` }}
        animate={{ rotate: phase === 'inhale' ? 90 : 0, scale: running ? scale : 1 }}
        transition={{ duration: dur, ease: 'easeInOut' }}
      />
      <motion.div className="absolute rounded-full"
        style={{
          width: 118, height: 118,
          background: `radial-gradient(circle at 38% 38%, ${glowColor}0.38) 0%, ${glowColor}0.18) 50%, ${glowColor}0.04) 100%)`,
          boxShadow: running ? `0 0 50px ${glowColor}0.45), 0 0 100px ${glowColor}0.22), inset 0 0 20px ${glowColor}0.1)` : `0 0 20px ${glowColor}0.12)`,
        }}
        animate={{ scale: running ? scale * 0.98 : 1, opacity: running ? 1 : 0.7 }}
        transition={{ duration: dur, ease: 'easeInOut' }}
      />
      <div className="relative z-10 text-center pointer-events-none">
        <motion.p key={phase} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold tracking-widest uppercase"
          style={{ color: colours.primary, textShadow: `0 0 12px ${glowColor}0.5)` }}>
          {running ? BREATH_PHASES[phase].label : 'Ready'}
        </motion.p>
        <p className="font-mono text-2xl font-light mt-1"
          style={{ color: colours.primary, textShadow: `0 0 16px ${glowColor}0.6)` }}>
          {formatClock(remaining)}
        </p>
        {running && (
          <p className="text-[10px] mt-1" style={{ color: `${glowColor}0.5)` }}>
            {Math.round(((totalSecs - remaining) / totalSecs) * 100)}%
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Particle systems ───────────────────────────────────────────────────────
function SnowParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div key={`snow-${i}`} className="absolute rounded-full"
          style={{ width: 1 + (i % 3), height: 1 + (i % 3), left: `${(i * 5.1) % 99}%`, background: `rgba(220,235,255,${0.5 + (i % 4) * 0.12})` }}
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
          style={{ width: 2 + (i % 2), height: 2 + (i % 2), left: `${(i * 6.3) % 95}%`, top: `${15 + (i * 4.9) % 70}%`, background: i % 3 === 0 ? 'rgba(180,255,120,0.9)' : 'rgba(100,220,80,0.9)', boxShadow: `0 0 ${4 + (i % 3) * 2}px rgba(80,220,60,0.7)` }}
          animate={{ x: [0, i % 2 === 0 ? 24 : -24, 12, -12, 0], y: [0, -16, 8, -10, 0], opacity: [0, 0.9, 0.3, 1, 0], scale: [0.4, 1, 0.5, 1.3, 0.4] }}
          transition={{ duration: 4 + (i % 4) * 1.2, repeat: Infinity, delay: i * 0.55, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
function LotusParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div key={`lotus-${i}`} className="absolute"
          style={{ 
            left: `${(i * 7.7) % 95}%`, 
            top: `-20px`,
            color: i % 2 === 0 ? 'rgba(255, 182, 193, 0.4)' : 'rgba(255, 215, 0, 0.3)' 
          }}
          initial={{ y: -20, rotate: 0, opacity: 0 }}
          animate={{ 
            y: '110vh', 
            rotate: [0, 45, -45, 90],
            x: [0, (i % 2 === 0 ? 20 : -20), 0],
            opacity: [0, 0.8, 0.8, 0] 
          }}
          transition={{ 
            duration: 10 + (i % 5) * 2, 
            repeat: Infinity, 
            delay: i * 0.8, 
            ease: 'linear' 
          }}
        >
          <span className="text-xl">🪷</span>
        </motion.div>
      ))}
    </div>
  );
}

function EnvParticles({ env }: { env: EnvId }) {
  if (env === 'mountains') return <SnowParticles />;
  if (env === 'forest')    return <FireflyParticles />;
  if (env === 'temple')    return <LotusParticles />; // Bhakti/Temple uses Lotus
  if (env === 'night')     return <NightStars />;
  if (env === 'river')     return <RiverRipples />;
  return null;
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function SattvicModePage() {
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const { playHaptic, setIsMuted } = useZenithSensory();

  // ── Theme tokens ───────────────────────────────────────────────────────
  const mainCardBg   = isDark ? 'linear-gradient(160deg,rgba(26,14,8,0.97) 0%,rgba(14,8,4,0.99) 100%)' : 'linear-gradient(160deg,rgba(255,245,230,0.98) 0%,rgba(250,235,210,0.99) 100%)';
  const mainCardBdr  = isDark ? 'rgba(200,146,74,0.16)' : 'rgba(160,100,30,0.18)';
  const sectionBg    = isDark ? 'rgba(12,8,4,0.9)' : 'rgba(255,245,230,0.95)';
  const sectionBdr   = isDark ? 'rgba(200,146,74,0.09)' : 'rgba(180,110,30,0.14)';
  const pillBgInact  = isDark ? 'rgba(28,18,10,0.6)' : 'rgba(235,215,185,0.7)';
  const pillBdrInact = isDark ? 'rgba(200,146,74,0.10)' : 'rgba(180,120,40,0.18)';
  const pillBgAct    = isDark ? 'rgba(200,146,74,0.16)' : 'rgba(200,146,74,0.14)';
  const pillBdrAct   = isDark ? 'rgba(200,146,74,0.38)' : 'rgba(200,146,74,0.40)';
  const textPrimary  = isDark ? '#f5dfa0' : '#2a1002';
  const textSecond   = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';
  const textMuted    = isDark ? 'rgba(245,210,130,0.35)' : 'rgba(120,70,15,0.40)';
  const inputBg      = isDark ? 'rgba(18,12,8,0.9)' : 'rgba(240,225,200,0.9)';
  const inputBdr     = isDark ? 'rgba(200,146,74,0.18)' : 'rgba(180,120,40,0.22)';
  const progressBg   = isDark ? 'rgba(200,146,74,0.1)' : 'rgba(200,146,74,0.12)';
  const chantPickerBg= isDark ? 'rgba(28,18,10,0.8)' : 'rgba(240,225,200,0.85)';
  const chantPickerBdr = isDark ? 'rgba(200,146,74,0.14)' : 'rgba(180,120,40,0.18)';
  const sattvaBg     = isDark ? 'rgba(12,8,4,0.9)' : 'rgba(255,245,230,0.95)';
  const sattvaText   = isDark ? 'rgba(220,195,145,0.60)' : 'rgba(70,35,5,0.65)';
  const sattvaLabel  = isDark ? 'rgba(200,146,74,0.5)' : 'rgba(160,90,20,0.55)';
  const sattvaHints  = isDark ? 'rgba(200,175,120,0.45)' : 'rgba(110,65,15,0.50)';

  const [mode,       setMode]     = useState<'reading' | 'breath' | 'chant'>('breath');
  const [duration,   setDuration] = useState(24);
  const [customInput,setCustomInput] = useState('');
  const [showCustom, setShowCustom]  = useState(false);
  const [chantMantra,setMantra]   = useState<string>(BHAKTI_MANTRAS[0].value);
  const [remaining,  setRemaining]= useState(24 * 60);
  const [running,    setRunning]  = useState(false);
  const [focusMode,  setFocusMode]= useState(false);
  const [focusEnv,   setEnv]      = useState<EnvId>('temple');
  const [phase,      setPhase]    = useState<Phase>('inhale');
  const [ambientId,  setAmbient]  = useState<AmbientId>(() => {
    if (typeof window === 'undefined') return 'off';
    return (localStorage.getItem(STORAGE_ZEN_SOUND) as AmbientId) || 'off';
  });
  const [showFocusSettings, setShowFocusSettings] = useState(false);
  // Tracks total minutes practised this session (increments each minute while running)
  const [sessionMins, setSessionMins] = useState(0);
  const sessionRef = useRef(0);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalSecs    = duration * 60;

  // Reset on duration/mode change
  useEffect(() => {
    setRemaining(duration * 60);
    setRunning(false);
    setPhase('inhale');
  }, [duration, mode]);

  // Countdown
  useEffect(() => {
    if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setRemaining(cur => {
        if (cur <= 1) { 
          clearInterval(intervalRef.current!); 
          setRunning(false); 
          hapticFinish(); 
          playBell(432, 3, 0.25);
          
          // Save session
          createClient().auth.getUser().then(({ data: { user } }) => {
            if (user) {
              createClient().from('sattvic_sessions').insert({
                user_id: user.id,
                mode: mode,
                duration_secs: totalSecs,
                environment: focusEnv,
                mantra: mode === 'chant' ? chantMantra : null,
              }).then(({ error }) => {
                if (error) console.error('Failed to save sattvic session:', error);
                else toast.success('Session saved 🙏', { icon: '✨' });
              });
            }
          });
          
          return 0; 
        }
        return cur - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, totalSecs, mode, focusEnv, chantMantra]);

  // Breath phase cycle
  useEffect(() => {
    if (!running || mode !== 'breath') return;
    function cyclePhase(current: Phase) {
      hapticPhase(current);
      playHaptic(current === 'hold' ? 'light' : 'medium'); // Zenith Haptic
      if (current === 'inhale') playBell(432, 0.8, 0.12);
      if (current === 'exhale') playBell(528, 1.2, 0.1);
      setPhase(current);
      const next = BREATH_PHASES[current].next as Phase;
      phaseTimeout.current = setTimeout(() => cyclePhase(next), BREATH_PHASES[current].duration);
    }
    cyclePhase('inhale');
    return () => { if (phaseTimeout.current) clearTimeout(phaseTimeout.current); };
  }, [running, mode, playHaptic]);

  // Ambient
  useEffect(() => {
    if (!running) { fadeOutAmbient(); return; }
    if (ambientId === 'bowl') playBowlAmbient(0.06);
    else if (ambientId === 'om') playOmAmbient(0.07);
    else if (ambientId === 'tanpura') playTanpuraAmbient(0.08);
    else if (ambientId === 'inst') playInstrumentalAmbient(0.06);
    else fadeOutAmbient();
    return () => { if (!running) fadeOutAmbient(); };
  }, [running, ambientId]);

  useEffect(() => () => fadeOutAmbient(), []);

  // Track minutes practiced this session
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      sessionRef.current += 1;
      setSessionMins(sessionRef.current);
    }, 60000);
    return () => clearInterval(id);
  }, [running]);

  const activeMode  = MODES.find(m => m.id === mode) ?? MODES[0];
  const activeChant = BHAKTI_MANTRAS.find(m => m.value === chantMantra) ?? BHAKTI_MANTRAS[0];
  const activeEnv   = ENVIRONMENTS[focusEnv];
  const progress    = ((totalSecs - remaining) / totalSecs) * 100;
  const chantTrackIds = activeChant.audioTrackId ? [activeChant.audioTrackId] : ['gayatri-mantra-as-it-is', 'guru-stotram'];

  function toggleRunning() { setRunning(r => !r); navigator.vibrate?.([10]); }
  function reset() { setRunning(false); setRemaining(totalSecs); setPhase('inhale'); }
  function enterFocus() { setFocusMode(true); setRunning(true); setShowFocusSettings(false); }

  function applyCustomDuration() {
    const v = parseInt(customInput, 10);
    if (v > 0 && v <= 180) { setDuration(v); setShowCustom(false); setCustomInput(''); }
  }

  return (
    <div className="fade-in space-y-3 pb-4">

      {/* ── Top card: mode + timer + controls ───────────────────────────── */}
      <section className="relative overflow-hidden rounded-[2rem]"
        style={{ background: mainCardBg, border: `1px solid ${mainCardBdr}` }}>

        {/* Background mandala */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
          <SacredMandala color="rgba(200,146,74,1)" size={320} />
        </div>

        <div className="relative px-5 pt-5 pb-6 space-y-4">

          {/* Mode pills */}
          <div className="flex gap-2">
            {MODES.map(item => (
              <motion.button key={item.id}
                onClick={() => setMode(item.id as any)}
                className="flex-1 rounded-[1.2rem] py-2.5 text-center transition-all"
                whileTap={{ scale: 0.96 }}
                style={{
                  background: mode === item.id ? pillBgAct : pillBgInact,
                  border: `1px solid ${mode === item.id ? pillBdrAct : pillBdrInact}`,
                }}>
                <div className="text-base leading-none">{item.emoji}</div>
                <p className="text-[11px] mt-1 font-medium"
                  style={{ color: mode === item.id ? textPrimary : textSecond }}>
                  {item.title}
                </p>
              </motion.button>
            ))}
          </div>

          {/* Timer display */}
          {mode === 'breath' ? (
            <div className="flex justify-center py-2">
              <BreathCircle running={running} glowColor="rgba(180,140,60,"
                phase={phase} remaining={remaining} totalSecs={totalSecs} />
            </div>
          ) : (
            <div className="text-center py-3">
              <motion.p className="font-mono font-light"
                style={{ color: textPrimary, fontSize: '3.2rem', textShadow: '0 0 28px rgba(200,146,74,0.25)' }}
                animate={{ opacity: running ? [0.85, 1, 0.85] : 1 }}
                transition={{ duration: 4, repeat: running ? Infinity : 0 }}>
                {formatClock(remaining)}
              </motion.p>
              <p className="text-xs mt-1" style={{ color: textSecond }}>{activeMode.description}</p>
            </div>
          )}

          {/* Chant picker */}
          <AnimatePresence>
            {mode === 'chant' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-[1.3rem] border px-3 py-3"
                style={{ background: chantPickerBg, borderColor: chantPickerBdr }}>
                <select value={chantMantra} onChange={e => setMantra(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none mb-2"
                  style={{ background: inputBg, border: `1px solid ${inputBdr}`, color: textPrimary }}>
                  {BHAKTI_MANTRAS.map(m => <option key={m.value} value={m.value}>{m.value}</option>)}
                </select>
                <ChantAudioPlayer title="Chant companion" trackIds={chantTrackIds}
                  initialTrackId={activeChant.audioTrackId ?? undefined} compact />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Duration + custom */}
          <div className="space-y-3">
            <div className="flex justify-center gap-2 flex-wrap">
              {PRESET_DURATIONS.map(v => (
                <button key={v} onClick={() => { setDuration(v); setShowCustom(false); }}
                  className="rounded-full px-4 py-1.5 text-xs font-medium transition-all"
                  style={duration === v && !showCustom
                    ? { background: 'linear-gradient(135deg,rgba(212,100,20,0.9),rgba(200,146,74,0.85))', color: '#1c1208' }
                    : { background: pillBgInact, color: textSecond, border: `1px solid ${pillBdrInact}` }}>
                  {v} min
                </button>
              ))}
              <button onClick={() => setShowCustom(v => !v)}
                className="rounded-full px-4 py-1.5 text-xs font-medium transition-all"
                style={showCustom
                  ? { background: pillBgAct, color: textPrimary, border: `1px solid ${pillBdrAct}` }
                  : { background: pillBgInact, color: textSecond, border: `1px solid ${pillBdrInact}` }}>
                Custom
              </button>
            </div>

            {/* Custom duration input */}
            <AnimatePresence>
              {showCustom && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  <div className="flex items-center gap-2 rounded-xl border px-3 py-2"
                    style={{ background: inputBg, borderColor: inputBdr }}>
                    <input
                      type="number" min="1" max="180"
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && applyCustomDuration()}
                      placeholder="e.g. 60"
                      className="flex-1 bg-transparent outline-none text-sm"
                      style={{ color: textPrimary }}
                    />
                    <span className="text-xs" style={{ color: textSecond }}>min</span>
                    <button onClick={applyCustomDuration}
                      className="rounded-lg px-3 py-1 text-xs font-semibold"
                      style={{ background: 'rgba(212,100,20,0.8)', color: '#f5dfa0' }}>
                      Set
                    </button>
                  </div>
                  <p className="text-[10px] mt-1 text-center" style={{ color: textMuted }}>1–180 minutes</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            <div className="h-0.5 overflow-hidden rounded-full" style={{ background: progressBg }}>
              <motion.div className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,rgba(212,100,20,0.9),rgba(200,146,74,1))' }}
                animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3">
            <motion.button onClick={toggleRunning} whileTap={{ scale: 0.95 }}
              className="rounded-full px-7 py-3 text-sm font-medium transition-all"
              style={{
                background: running ? pillBgAct : 'linear-gradient(135deg,rgba(212,100,20,0.9),rgba(200,146,74,0.85))',
                color: running ? textPrimary : '#1c1208',
                border: '1px solid rgba(200,146,74,0.3)',
                boxShadow: running ? 'none' : '0 4px 24px rgba(212,120,20,0.3)',
              }}>
              {running ? 'Pause' : 'Begin'}
            </motion.button>
            <button onClick={enterFocus}
              className="rounded-full px-5 py-3 text-sm font-medium transition-all"
              style={{ background: 'rgba(200,146,74,0.08)', color: 'rgba(200,146,74,0.8)', border: '1px solid rgba(200,146,74,0.22)' }}>
              ✨ Focus
            </button>
            <button onClick={reset}
              className="rounded-full px-4 py-3 text-sm transition-all"
              style={{ color: textSecond, border: `1px solid ${pillBdrInact}` }}>
              ↺
            </button>
          </div>
        </div>
      </section>

      {/* ── Environment + Ambient ─────────────────────────────────────────── */}
      <section className="rounded-[1.6rem] px-4 py-3"
        style={{ background: sectionBg, border: `1px solid ${sectionBdr}` }}>
        <p className="text-[10px] mb-2" style={{ color: textMuted }}>Sanctuary</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(Object.entries(ENVIRONMENTS) as [EnvId, typeof ENVIRONMENTS[EnvId]][]).map(([id, env]) => (
            <button key={id} onClick={() => setEnv(id)}
              className="rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-all flex-shrink-0"
              style={focusEnv === id
                ? { background: pillBgAct, color: textPrimary, border: `1px solid ${pillBdrAct}`, boxShadow: '0 0 10px rgba(200,146,74,0.1)' }
                : { background: pillBgInact, color: textSecond, border: `1px solid ${pillBdrInact}` }}>
              {env.emoji} {env.label}
            </button>
          ))}
        </div>

        <p className="text-[10px] mt-3 mb-2" style={{ color: textMuted }}>Ambient sound</p>
        <div className="flex gap-2">
          {AMBIENT_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => { setAmbient(opt.id); localStorage.setItem(STORAGE_ZEN_SOUND, opt.id); }}
              className="flex-1 rounded-full py-1.5 text-xs font-medium transition-all"
              style={ambientId === opt.id
                ? { background: pillBgAct, color: textPrimary, border: `1px solid ${pillBdrAct}` }
                : { background: pillBgInact, color: textSecond, border: `1px solid ${pillBdrInact}` }}>
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
        {ambientId !== 'off' && !running && (
          <p className="text-[10px] mt-2 text-center" style={{ color: textMuted }}>
            Ambient plays when session begins
          </p>
        )}
      </section>

      {/* ── Sattva context ─────────────────────────────────────────────────── */}
      <section className="rounded-[1.6rem] px-4 py-3.5"
        style={{ background: sattvaBg, border: `1px solid ${sectionBdr}` }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: sattvaLabel }}>
          Sattva Guna
        </p>
        <p className="text-[12.5px] leading-relaxed" style={{ color: sattvaText, fontFamily: 'var(--font-serif)' }}>
          Sattvic practice cultivates clarity, lightness, and equanimity — the guṇa of wisdom and peace. This space is your invitation to step out of rajas and tamas, and into presence.
        </p>
        <div className="flex gap-3 mt-3">
          {[
            { icon: '🌿', label: 'Light food before' },
            { icon: '🤫', label: 'Silence preferred' },
            { icon: '🌅', label: 'Best at sandhyā' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[10.5px]" style={{ color: sattvaHints }}>
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Session Insights ─────────────────────────────────────────────── */}
      <section className="rounded-[1.6rem] px-4 py-4"
        style={{ background: sectionBg, border: `1px solid ${sectionBdr}` }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: sattvaLabel }}>
          Today&apos;s Practice
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              value: sessionMins > 0 ? `${sessionMins}m` : '—',
              label: 'Sat',
              sub: sessionMins > 0 ? 'this session' : 'not started',
            },
            {
              value: running ? activeMode.title : mode === 'breath' ? 'Prānāyāma' : mode === 'chant' ? 'Kīrtana' : 'Svādhyāya',
              label: 'Mode',
              sub: running ? 'in session' : 'selected',
            },
            {
              value: activeEnv.emoji,
              label: 'Sanctuary',
              sub: activeEnv.label,
            },
          ].map(({ value, label, sub }) => (
            <div key={label} className="rounded-[1rem] px-3 py-3 text-center"
              style={{ background: isDark ? 'rgba(28,18,10,0.6)' : 'rgba(240,220,190,0.7)', border: `1px solid ${pillBdrInact}` }}>
              <p className="text-lg font-semibold leading-tight" style={{ color: textPrimary }}>{value}</p>
              <p className="text-[10px] mt-0.5 font-medium uppercase tracking-wide" style={{ color: 'rgba(200,146,74,0.75)' }}>{label}</p>
              <p className="text-[9px] mt-0.5" style={{ color: textMuted }}>{sub}</p>
            </div>
          ))}
        </div>
        {sessionMins === 0 && (
          <p className="text-center text-[11px] mt-3" style={{ color: textMuted }}>
            Press <span style={{ color: 'rgba(200,146,74,0.85)' }}>Begin</span> to start tracking your session.
          </p>
        )}
      </section>

      {/* ── Full Focus Overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="fixed inset-0 z-[80] overflow-hidden flex flex-col"
            style={{ background: activeEnv.bg }}>

            {/* Deep glow */}
            <motion.div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ width: 500, height: 500, background: `radial-gradient(circle, ${activeEnv.glowColor}0.11) 0%, transparent 68%)` }}
              animate={{ scale: [1, 1.16, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <EnvParticles env={focusEnv} />

            {/* ── Top bar ── */}
            <div
              className="relative flex items-center gap-3 px-4 pb-3 flex-shrink-0"
              style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 18px)' }}
            >
              {/* Back button — TOP LEFT */}
              <button
                onClick={() => { setFocusMode(false); setRunning(false); }}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium flex-shrink-0"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  color: `${activeEnv.glowColor}0.9)`,
                  border: `1px solid ${activeEnv.glowColor}0.25)`,
                  backdropFilter: 'blur(8px)',
                }}>
                <ChevronLeft size={16} />
                Back
              </button>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate"
                  style={{ color: `${activeEnv.glowColor}0.85)`, textShadow: `0 0 8px ${activeEnv.glowColor}0.4)` }}>
                  {activeEnv.emoji} {activeEnv.label}
                </p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(245,220,150,0.42)' }}>
                  {activeMode.title}{mode === 'chant' ? ` · ${chantMantra}` : ''}
                  {ambientId !== 'off' ? ` · ${AMBIENT_OPTIONS.find(a => a.id === ambientId)?.label}` : ''}
                </p>
              </div>

              {/* Settings toggle */}
              <button
                onClick={() => setShowFocusSettings(v => !v)}
                className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
                style={{
                  background: showFocusSettings ? `${activeEnv.glowColor}0.2)` : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${activeEnv.glowColor}0.22)`,
                  color: `${activeEnv.glowColor}0.8)`,
                  backdropFilter: 'blur(8px)',
                }}>
                <Settings2 size={16} />
              </button>
            </div>

            {/* ── Settings drawer (ambient + sanctuary) ── */}
            <AnimatePresence>
              {showFocusSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex-shrink-0 overflow-hidden px-4 pb-3"
                  style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
                  {/* Sanctuary */}
                  <p className="text-[10px] mt-2 mb-1.5" style={{ color: `${activeEnv.glowColor}0.6)` }}>Sanctuary</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {(Object.entries(ENVIRONMENTS) as [EnvId, typeof ENVIRONMENTS[EnvId]][]).map(([id, env]) => (
                      <button key={id} onClick={() => setEnv(id)}
                        className="rounded-full px-2.5 py-1 text-[11px] whitespace-nowrap flex-shrink-0 transition-all"
                        style={focusEnv === id
                          ? { background: `${activeEnv.glowColor}0.2)`, color: '#f5dfa0', border: `1px solid ${activeEnv.glowColor}0.35)` }
                          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(245,220,150,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {env.emoji} {env.label}
                      </button>
                    ))}
                  </div>
                  {/* Ambient */}
                  <p className="text-[10px] mt-2.5 mb-1.5" style={{ color: `${activeEnv.glowColor}0.6)` }}>Ambient sound</p>
                  <div className="flex gap-2 pb-2">
                    {AMBIENT_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => setAmbient(opt.id)}
                        className="flex-1 rounded-full py-1.5 text-[11px] font-medium transition-all"
                        style={ambientId === opt.id
                          ? { background: `${activeEnv.glowColor}0.22)`, color: '#f5dfa0', border: `1px solid ${activeEnv.glowColor}0.4)` }
                          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(245,220,150,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {opt.emoji} {opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Centre ── */}
            <div className="flex-1 flex flex-col items-center justify-center gap-5 min-h-0 px-4">
              {mode === 'breath' ? (
                <BreathCircle running={running} glowColor={activeEnv.glowColor}
                  phase={phase} remaining={remaining} totalSecs={totalSecs} />
              ) : (
                <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-65">
                    <SacredMandala color={activeEnv.glowColor.includes('212,120') ? '#f5dfa0' : '#b4c8ff'} size={280} />
                  </div>
                  <motion.div className="absolute rounded-full"
                    style={{ width: 262, height: 262, border: `1px solid ${activeEnv.glowColor}0.14)` }}
                    animate={{ scale: running ? [1, 1.04, 1] : 1 }}
                    transition={{ duration: 4.5, repeat: running ? Infinity : 0 }}
                  />
                  <motion.div className="absolute rounded-full"
                    style={{ width: 218, height: 218, border: `1.5px solid ${activeEnv.glowColor}0.3)`, boxShadow: running ? `0 0 40px ${activeEnv.glowColor}0.2), inset 0 0 30px ${activeEnv.glowColor}0.08)` : 'none' }}
                    animate={{ scale: running ? [1, 1.03, 1] : 1 }}
                    transition={{ duration: 4.5, repeat: running ? Infinity : 0 }}
                  />
                  <motion.div className="absolute rounded-full"
                    style={{ width: 158, height: 158, background: `radial-gradient(circle at 38% 38%, ${activeEnv.glowColor}0.3) 0%, ${activeEnv.glowColor}0.1) 60%, transparent 100%)`, boxShadow: running ? `0 0 50px ${activeEnv.glowColor}0.3)` : 'none' }}
                    animate={{ scale: running ? [1, 1.06, 1] : 1 }}
                    transition={{ duration: 4.5, repeat: running ? Infinity : 0 }}
                  />
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

              {/* Progress line */}
              <div className="h-0.5 w-44 overflow-hidden rounded-full" style={{ background: `${activeEnv.glowColor}0.1)` }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg,${activeEnv.glowColor}0.7),${activeEnv.glowColor}1))` }}
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} />
              </div>

              {mode === 'chant' && (
                <div className="w-full max-w-xs">
                  <ChantAudioPlayer title="Focus chant" trackIds={chantTrackIds}
                    initialTrackId={activeChant.audioTrackId ?? undefined} compact />
                </div>
              )}
            </div>

            {/* ── Bottom controls ── */}
            <div
              className="flex-shrink-0 flex flex-wrap justify-center gap-3 px-4"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
            >
              <button onClick={toggleRunning}
                className="rounded-full px-8 py-3.5 text-sm font-medium transition-all"
                style={{
                  background: running ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${activeEnv.glowColor}0.85),${activeEnv.glowColor}0.6))`,
                  color: running ? 'rgba(245,210,130,0.75)' : '#1c1208',
                  border: `1px solid ${activeEnv.glowColor}0.3)`,
                  boxShadow: running ? 'none' : `0 4px 24px ${activeEnv.glowColor}0.3)`,
                }}>
                {running ? 'Pause' : 'Begin'}
              </button>
              <button onClick={reset}
                className="rounded-full px-6 py-3.5 text-sm transition"
                style={{ color: 'rgba(245,210,130,0.42)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
