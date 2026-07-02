'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw, Settings2 } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import SacredIcon, { type SacredIconName } from '@/components/ui/SacredIcon';
import { getTraditionMeta } from '@/lib/tradition-config';

// ─── Timing ──────────────────────────────────────────────────────────────────
const PRESET_DURATIONS = [12, 24, 48];

const BREATH_PATTERNS = [
  { id: 'nadi',   label: 'Nāḍī Śodhana',  inhale: 4, hold: 2, exhale: 6, desc: 'Calming · Reduces anxiety' },
  { id: 'box',    label: 'Box Breath',      inhale: 4, hold: 4, exhale: 4, holdAfter: 4, desc: 'Focus · Equalizes mind' },
  { id: 'sleep',  label: '4-7-8',           inhale: 4, hold: 7, exhale: 8, desc: 'Sleep · Deep rest' },
  { id: 'shitali',label: 'Shītalī',         inhale: 6, hold: 0, exhale: 6, desc: 'Cooling · Reduces heat' },
] as const;
type PatternId = typeof BREATH_PATTERNS[number]['id'];
type Phase = 'inhale' | 'hold' | 'exhale' | 'holdAfter';

// ─── Phase colours ─────────────────────────────────────────────────────────
const PHASE_COLOURS: Record<Phase, { primary: string; glow: string; ring: string; label: string }> = {
  inhale:    { primary: '#C5A059', glow: 'rgba(197,160,89,',  ring: 'rgba(197,160,89,0.45)', label: 'Inhale' },
  hold:      { primary: '#A89880', glow: 'rgba(168,152,128,', ring: 'rgba(168,152,128,0.3)', label: 'Hold' },
  exhale:    { primary: '#D4B483', glow: 'rgba(212,180,131,', ring: 'rgba(212,180,131,0.4)', label: 'Exhale' },
  holdAfter: { primary: '#A89880', glow: 'rgba(168,152,128,', ring: 'rgba(168,152,128,0.3)', label: 'Hold' },
};

// ─── Environments ───────────────────────────────────────────────────────────
type EnvId = 'temple' | 'mountains' | 'forest' | 'river' | 'night';
const ENVIRONMENTS: Record<EnvId, { label: string; icon: SacredIconName; bg: string; glowColor: string; particleColor: string }> = {
  temple:    { label: 'Temple dawn',  icon: 'landmark', bg: 'linear-gradient(180deg, #0A0A0A 0%, #1A1208 100%)', glowColor: 'rgba(197,160,89,',  particleColor: 'rgba(255,245,220,'  },
  mountains: { label: 'Snow peaks',   icon: 'mountain', bg: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)', glowColor: 'rgba(148,163,184,', particleColor: 'rgba(241,245,249,' },
  forest:    { label: 'Forest still', icon: 'tree', bg: 'linear-gradient(180deg, #082F24 0%, #064E3B 100%)', glowColor: 'rgba(90,190,135,',  particleColor: 'rgba(209,250,229,' },
  river:     { label: 'Sacred river', icon: 'water', bg: 'linear-gradient(180deg, #0C4A6E 0%, #083344 100%)', glowColor: 'rgba(56,189,248,',  particleColor: 'rgba(224,242,254,'  },
  night:     { label: 'Night sky',    icon: 'moon', bg: 'linear-gradient(180deg, #111827 0%, #020617 100%)', glowColor: 'rgba(197,160,89,', particleColor: 'rgba(237,233,254,' },
};



// ─── Ambient options ─────────────────────────────────────────────────────────
const AMBIENT_OPTIONS = [
  { id: 'off',  label: 'Off',     icon: 'shield' as SacredIconName },
  { id: 'bowl', label: 'Bowl',    icon: 'music' as SacredIconName },
  { id: 'om',   label: 'Om nada', icon: 'chant' as SacredIconName },
  { id: 'tanpura', label: 'Tanpura', icon: 'radio' as SacredIconName },
  { id: 'inst', label: 'Strings', icon: 'music' as SacredIconName },
] as const;
type AmbientId = typeof AMBIENT_OPTIONS[number]['id'];
const STORAGE_ZEN_SOUND = 'shoonaya-zen-ambient';

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
  if (phase === 'hold' || phase === 'holdAfter') navigator.vibrate([8, 20, 8]);
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
function BreathCircle({ running, glowColor, phase, remaining, totalSecs, pattern, cycleCount }: {
  running: boolean; glowColor: string; phase: Phase; remaining: number; totalSecs: number; pattern: PatternId; cycleCount: number;
}) {
  const colours = PHASE_COLOURS[phase];
  const scale   = phase === 'inhale' ? 1.22 : phase === 'hold' || phase === 'holdAfter' ? 1.22 : 0.82;
  const currentPattern = BREATH_PATTERNS.find(p => p.id === pattern)!;
  let durSec = phase === 'inhale' ? currentPattern.inhale :
               phase === 'hold' ? currentPattern.hold :
               phase === 'exhale' ? currentPattern.exhale :
               ('holdAfter' in currentPattern && currentPattern.holdAfter) ? currentPattern.holdAfter : 1;
  const dur = phase === 'hold' || phase === 'holdAfter' ? 0.3 : durSec;
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
          {running ? colours.label : 'Ready'}
        </motion.p>
        <p className="font-mono text-2xl font-light mt-1"
          style={{ color: colours.primary, textShadow: `0 0 16px ${glowColor}0.6)` }}>
          {formatClock(remaining)}
        </p>
        {running && (
          <p className="text-[10px] mt-1" style={{ color: `${glowColor}0.5)` }}>
            Cycle {cycleCount} · {Math.round(remaining/60)}m left
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
          <SacredIcon name="flower" size={18} />
        </motion.div>
      ))}
    </div>
  );
}

function NightStars() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div key={`star-${i}`} className="absolute rounded-full bg-white"
          style={{ 
            width: 1 + (i % 3) * 0.45,
            height: 1 + (i % 3) * 0.45,
            left: `${(i * 17.3) % 100}%`,
            top: `${(i * 29.7) % 100}%`
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2 + (i % 5) * 0.55, repeat: Infinity, delay: (i % 9) * 0.35 }}
        />
      ))}
    </div>
  );
}

function RiverRipples() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div key={`ripple-${i}`} className="absolute rounded-full border border-blue-400/20"
          style={{ 
            width: 100, 
            height: 40, 
            left: `${8 + (i * 11) % 80}%`,
            top: `${12 + (i * 17) % 70}%`
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 2], opacity: [0, 0.3, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 0.8 }}
        />
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
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const { playHaptic } = useZenithSensory();
  const [tradition, setTradition] = useState('hindu');
  const traditionMeta = getTraditionMeta(tradition);

  // ── Premium Theme Tokens (Sattvic Ivory) ───────────────────────────
  const mainCardBg   = isDark ? '#121212' : '#FFFFFF';
  const mainCardBdr  = isDark ? 'rgba(197,160,89,0.1)' : 'rgba(197,160,89,0.2)';
  const sectionBg    = isDark ? '#1A1A1A' : '#FDFCF8';
  const sectionBdr   = isDark ? 'rgba(197,160,89,0.05)' : 'rgba(197,160,89,0.15)';
  const gold         = '#C5A059';
  const textPrimary  = isDark ? '#F5F5F5' : '#1A1A1A';
  const textSecond   = isDark ? 'rgba(245,245,245,0.5)' : 'rgba(26,26,26,0.5)';
  const textMuted    = isDark ? 'rgba(245,245,245,0.3)' : 'rgba(26,26,26,0.3)';
  const pillBgInact  = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const pillBdrInact = isDark ? 'rgba(197,160,89,0.05)' : 'rgba(197,160,89,0.1)';
  const pillBgAct    = isDark ? 'rgba(197,160,89,0.1)' : 'rgba(197,160,89,0.08)';
  const pillBdrAct   = isDark ? 'rgba(197,160,89,0.3)' : 'rgba(197,160,89,0.4)';
  const inputBg      = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const inputBdr     = isDark ? 'rgba(197,160,89,0.1)' : 'rgba(197,160,89,0.15)';
  const progressBg   = isDark ? 'rgba(197,160,89,0.1)' : 'rgba(197,160,89,0.05)';
  const chantPickerBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)';
  const chantPickerBdr = isDark ? 'rgba(197,160,89,0.1)' : 'rgba(197,160,89,0.15)';
  const glassBg      = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)';
  const textDim      = textSecond;
  const sattvaBg     = glassBg;
  const sattvaText   = textDim;
  const sattvaLabel  = gold;
  const sattvaHints  = textMuted;

  const [pattern,    setPattern]  = useState<PatternId>('nadi');
  const [cycleCount, setCycleCount] = useState(0);
  const [duration,   setDuration] = useState(24);
  const [customInput,setCustomInput] = useState('');
  const [showCustom, setShowCustom]  = useState(false);
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

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || !mounted) return;
      const { data } = await supabase.from('profiles').select('tradition').eq('id', user.id).maybeSingle();
      const nextTradition = data?.tradition ?? 'hindu';
      if (!mounted) return;
      setTradition(nextTradition);
      if (nextTradition === 'sikh') {
        setEnv('temple');
      } else if (nextTradition === 'buddhist') {
        setEnv('mountains');
      } else if (nextTradition === 'jain') {
        setEnv('temple');
      }
    });
    return () => { mounted = false; };
  }, []);

  // Reset on duration/pattern change
  useEffect(() => {
    setRemaining(duration * 60);
    setRunning(false);
    setPhase('inhale');
    setCycleCount(0);
  }, [duration, pattern]);

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
              const todayStr = new Date().toISOString().split('T')[0];
              localStorage.setItem(`shoonaya-pranayama-done-${todayStr}`, 'true');
              const row = {
                user_id: user.id,
                mode: 'breath',
                duration_secs: totalSecs,
                environment: focusEnv,
                mantra: null,
                tradition,
                ambient_id: ambientId,
                completion_type: 'completed',
                source_route: '/bhakti/zen',
              };
              createClient().from('sattvic_sessions').insert(row).then(async ({ error }) => {
                if (error) {
                  const { tradition: _tradition, ambient_id: _ambientId, completion_type: _completionType, source_route: _sourceRoute, ...legacyRow } = row;
                  const fallback = await createClient().from('sattvic_sessions').insert(legacyRow);
                  if (fallback.error) console.error('Failed to save sattvic session:', fallback.error);
                  else toast.success('Session saved');
                  return;
                }
                toast.success('Session saved');
              });
            }
          });
          
          return 0; 
        }
        return cur - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, totalSecs, focusEnv, tradition, ambientId]);

  // Breath phase cycle
  useEffect(() => {
    if (!running) return;
    const currentPattern = BREATH_PATTERNS.find(p => p.id === pattern)!;
    function cyclePhase(current: Phase) {
      hapticPhase(current);
      playHaptic(current.includes('hold') ? 'light' : 'medium'); // Zenith Haptic
      if (current === 'inhale') playBell(432, 0.8, 0.12);
      if (current === 'exhale') playBell(528, 1.2, 0.1);
      setPhase(current);
      
      let nextPhase: Phase = 'inhale';
      let durationSec: number = currentPattern.inhale;
      
      if (current === 'inhale') {
        if (currentPattern.hold > 0) { nextPhase = 'hold'; durationSec = currentPattern.hold; }
        else { nextPhase = 'exhale'; durationSec = currentPattern.exhale; }
      } else if (current === 'hold') {
        nextPhase = 'exhale'; durationSec = currentPattern.exhale;
      } else if (current === 'exhale') {
        setCycleCount(c => c + 1);
        if ('holdAfter' in currentPattern && currentPattern.holdAfter! > 0) {
          nextPhase = 'holdAfter'; durationSec = currentPattern.holdAfter!;
        } else {
          nextPhase = 'inhale'; durationSec = currentPattern.inhale;
        }
      } else if (current === 'holdAfter') {
        nextPhase = 'inhale'; durationSec = currentPattern.inhale;
      }
      phaseTimeout.current = setTimeout(() => cyclePhase(nextPhase), durationSec * 1000);
    }
    cyclePhase('inhale');
    return () => { if (phaseTimeout.current) clearTimeout(phaseTimeout.current); };
  }, [running, pattern, playHaptic]);

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

  const activePattern = BREATH_PATTERNS.find(m => m.id === pattern) ?? BREATH_PATTERNS[0];
  const activeEnv   = ENVIRONMENTS[focusEnv];
  const progress    = ((totalSecs - remaining) / totalSecs) * 100;

  function toggleRunning() { setRunning(r => !r); navigator.vibrate?.([10]); }
  function reset() { setRunning(false); setRemaining(totalSecs); setPhase('inhale'); setCycleCount(0); }
  function enterFocus() { setFocusMode(true); setRunning(true); setShowFocusSettings(false); }

  function applyCustomDuration() {
    const v = parseInt(customInput, 10);
    if (v > 0 && v <= 180) { setDuration(v); setShowCustom(false); setCustomInput(''); }
  }

  return (
    <div className="fade-in space-y-3 pb-4">
      {/* ── Page Header with Back Button Chevron ── */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <button 
          onClick={() => router.back()} 
          className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--surface-base)]/20 transition-all hover:bg-[var(--surface-base)]/40 active:scale-95"
          style={{ border: `1px solid rgba(197,160,89,0.2)` }}
        >
          <ChevronLeft size={18} style={{ color: '#C5A059' }} />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-center flex-1 pr-9" style={{ color: '#C5A059', fontFamily: 'var(--font-serif)' }}>
          {tradition === 'sikh' ? 'Simran Breath' : tradition === 'buddhist' ? 'Ānāpāna' : tradition === 'jain' ? 'Samayika Breath' : 'Prāṇāyāma'}
        </h1>
      </div>

      {/* ── Top card: mode + timer + controls ───────────────────────────── */}
      <section className="relative overflow-hidden rounded-[2rem]"
        style={{ background: mainCardBg, border: `1px solid ${mainCardBdr}` }}>

        {/* Background mandala */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
          <SacredMandala color="rgba(197, 160, 89,1)" size={320} />
        </div>

        <div className="relative px-5 pt-5 pb-6 space-y-4">

          {/* Pattern pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {BREATH_PATTERNS.map(item => (
              <motion.button key={item.id}
                onClick={() => setPattern(item.id as any)}
                className="flex-1 rounded-[1.2rem] px-3 py-2.5 text-center transition-all flex-shrink-0"
                whileTap={{ scale: 0.96 }}
                style={{
                  background: pattern === item.id ? pillBgAct : pillBgInact,
                  border: `1px solid ${pattern === item.id ? pillBdrAct : pillBdrInact}`,
                }}>
                <p className="text-[12px] font-medium"
                  style={{ color: pattern === item.id ? textPrimary : textSecond }}>
                  {item.label}
                </p>
                <p className="text-[9px] mt-1" style={{ color: textMuted }}>
                  {item.inhale}-{item.hold}-{item.exhale}{'holdAfter' in item && item.holdAfter ? `-${item.holdAfter}` : ''}
                </p>
              </motion.button>
            ))}
          </div>

          {/* Breath display */}
          <div className="flex justify-center py-2">
            <BreathCircle running={running} glowColor="rgba(180,140,60,"
              phase={phase} remaining={remaining} totalSecs={totalSecs} pattern={pattern} cycleCount={cycleCount} />
          </div>
          
          <div className="text-center pb-2">
            <p className="text-xs" style={{ color: textSecond }}>{activePattern.desc}</p>
          </div>

          {/* Duration + custom */}
          <div className="space-y-3">
            <div className="flex justify-center gap-2 flex-wrap">
              {PRESET_DURATIONS.map(v => (
                <button key={v} onClick={() => { setDuration(v); setShowCustom(false); }}
                  className="rounded-full px-4 py-1.5 text-xs font-medium transition-all"
                  style={duration === v && !showCustom
                    ? { background: 'linear-gradient(135deg,rgba(212,100,20,0.9),rgba(197, 160, 89,0.85))', color: '#1c1208' }
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
                style={{ background: 'linear-gradient(90deg,rgba(212,100,20,0.9),rgba(197, 160, 89,1))' }}
                animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3">
            <motion.button onClick={toggleRunning} whileTap={{ scale: 0.95 }}
              className="rounded-full px-7 py-3 text-sm font-medium transition-all"
              style={{
                background: running ? pillBgAct : 'linear-gradient(135deg,rgba(212,100,20,0.9),rgba(197, 160, 89,0.85))',
                color: running ? textPrimary : '#1c1208',
                border: '1px solid rgba(197, 160, 89,0.3)',
                boxShadow: running ? 'none' : '0 4px 24px rgba(212,120,20,0.3)',
              }}>
              {running ? 'Pause' : 'Begin'}
            </motion.button>
            <button onClick={enterFocus}
              className="rounded-full px-5 py-3 text-sm font-medium transition-all"
              style={{ background: 'rgba(197, 160, 89,0.08)', color: 'rgba(197, 160, 89,0.8)', border: '1px solid rgba(197, 160, 89,0.22)' }}>
              Focus
            </button>
            <button onClick={reset}
              className="rounded-full px-4 py-3 text-sm transition-all"
              style={{ color: textSecond, border: `1px solid ${pillBdrInact}` }} aria-label="Action">
              <RotateCcw size={15} />
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
                ? { background: pillBgAct, color: textPrimary, border: `1px solid ${pillBdrAct}`, boxShadow: '0 0 10px rgba(197, 160, 89,0.1)' }
                : { background: pillBgInact, color: textSecond, border: `1px solid ${pillBdrInact}` }}>
              <span className="inline-flex items-center gap-1.5"><SacredIcon name={env.icon} size={12} />{env.label}</span>
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
              <span className="inline-flex items-center justify-center gap-1.5"><SacredIcon name={opt.icon} size={12} />{opt.label}</span>
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
          {tradition === 'sikh' ? 'Naam simran' : tradition === 'buddhist' ? 'Dhamma practice' : tradition === 'jain' ? 'Samayika' : 'Sattva guna'}
        </p>
        <p className="text-[12.5px] leading-relaxed" style={{ color: sattvaText, fontFamily: 'var(--font-serif)' }}>
          {traditionMeta.bhaktiGreeting}. This space keeps the essential practice in front and moves advanced choices into focus settings, so the session feels quiet instead of busy.
        </p>
        <div className="flex gap-3 mt-3">
            {[
              { icon: 'flower' as SacredIconName, label: tradition === 'sikh' ? 'Sangat-ready' : 'Light preparation' },
              { icon: 'shield' as SacredIconName, label: 'Silence preferred' },
              { icon: 'sunset' as SacredIconName, label: tradition === 'sikh' ? 'Good for Rehras' : 'Best at sandhya' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[10.5px]" style={{ color: sattvaHints }}>
                <SacredIcon name={icon} size={12} />
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
              value: activePattern.label,
              label: 'Pattern',
              sub: running ? 'in session' : 'selected',
            },
            {
              value: <SacredIcon name={activeEnv.icon} size={24} className="mx-auto" />,
              label: 'Sanctuary',
              sub: activeEnv.label,
            },
          ].map(({ value, label, sub }) => (
            <div key={label} className="rounded-[1rem] px-3 py-3 text-center"
              style={{ background: isDark ? 'rgba(28,18,10,0.6)' : 'rgba(240,220,190,0.7)', border: `1px solid ${pillBdrInact}` }}>
              <p className="text-lg font-semibold leading-tight" style={{ color: textPrimary }}>{value}</p>
              <p className="text-[10px] mt-0.5 font-medium uppercase tracking-wide" style={{ color: 'rgba(197, 160, 89,0.75)' }}>{label}</p>
              <p className="text-[9px] mt-0.5" style={{ color: textMuted }}>{sub}</p>
            </div>
          ))}
        </div>
        {sessionMins === 0 && (
          <p className="text-center text-[11px] mt-3" style={{ color: textMuted }}>
            Press <span style={{ color: 'rgba(197, 160, 89,0.85)' }}>Begin</span> to start tracking your session.
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
            <div className="flex items-center gap-3 px-4 pb-3 flex-shrink-0 pt-safe-top">
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
                  <span className="inline-flex items-center gap-1.5"><SacredIcon name={activeEnv.icon} size={14} />{activeEnv.label}</span>
                </p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(245,220,150,0.42)' }}>
                  {activePattern.label}
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
                        <span className="inline-flex items-center gap-1.5"><SacredIcon name={env.icon} size={12} />{env.label}</span>
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
                        <span className="inline-flex items-center justify-center gap-1.5"><SacredIcon name={opt.icon} size={12} />{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Centre ── */}
            <div className="flex-1 flex flex-col items-center justify-center gap-5 min-h-0 px-4">
              <BreathCircle running={running} glowColor={activeEnv.glowColor}
                  phase={phase} remaining={remaining} totalSecs={totalSecs} pattern={pattern} cycleCount={cycleCount} />
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
