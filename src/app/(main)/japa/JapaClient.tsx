'use client';

// ─── Japa Mala — Multi-screen redesign v2 ─────────────────────────────────────
//
//  Screen 1 — Choose Mala   (sandalwood / rudraksha / rose quartz / tulsi / crystal)
//  Screen 2 — Choose Mantra (6 options across traditions)
//  Screen 3 — Japa practice (SVG bead ring, counter in center, tap anywhere)
//  Overlay  — Completion    (confetti + stats + streak)
//  Sheet    — Sacred Sounds (ambient audio)
//
//  Theme: follows global data-theme dark/light via useThemePreference()
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, VolumeX, Flame, RotateCcw, BarChart2, Settings2 } from 'lucide-react';
import { useEngine } from '@/contexts/EngineContext';
import { hapticLight, hapticSuccess } from '@/lib/platform';
import { createClient } from '@/lib/supabase';
import { localSpiritualDate } from '@/lib/sacred-time';
import { usePremium } from '@/hooks/usePremium';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import Link from 'next/link';

// ── Constants ──────────────────────────────────────────────────────────────────
const TOTAL_BEADS = 108;
const SVG_W = 340;
const SVG_CX = SVG_W / 2;
const SVG_CY = SVG_W / 2;
const RING_R = 148;
const BEAD_R = 5.2;
const SUMERU_R = 8;
const STORAGE_MALA   = 'ss-japa-mala';
const STORAGE_MANTRA = 'ss-japa-mantra';

// ── Mala definitions ───────────────────────────────────────────────────────────
const MALAS = [
  {
    id: 'sandalwood',
    name: 'Sandalwood',
    subtitle: 'Calming · All Traditions',
    dark:  { thread: 'rgba(120,80,40,0.20)', bead: '#5A3218', counted: '#C8924A', sumeru: '#2E1508', glow: 'rgba(200,146,74,0.55)' },
    light: { thread: 'rgba(80,50,20,0.15)',  bead: '#C8A070', counted: '#7A4A1E', sumeru: '#5A3010', glow: 'rgba(122,74,30,0.45)' },
  },
  {
    id: 'rudraksha',
    name: 'Rudraksha',
    subtitle: 'Sacred · Shaiva',
    dark:  { thread: 'rgba(80,40,20,0.20)', bead: '#3A1A08', counted: '#C8924A', sumeru: '#1A0802', glow: 'rgba(200,100,60,0.55)' },
    light: { thread: 'rgba(60,30,10,0.15)', bead: '#A07050', counted: '#5A2E10', sumeru: '#3A1A02', glow: 'rgba(90,46,16,0.45)' },
  },
  {
    id: 'rose_quartz',
    name: 'Rose Quartz',
    subtitle: 'Love & Healing · Universal',
    dark:  { thread: 'rgba(160,80,100,0.20)', bead: '#5A2A3A', counted: '#D4826A', sumeru: '#3A1828', glow: 'rgba(210,120,140,0.55)' },
    light: { thread: 'rgba(160,80,100,0.15)', bead: '#E8B0C0', counted: '#C07090', sumeru: '#A04870', glow: 'rgba(192,112,144,0.45)' },
  },
  {
    id: 'tulsi',
    name: 'Tulsi',
    subtitle: 'Pure & Auspicious · Vaishnava',
    dark:  { thread: 'rgba(40,100,40,0.20)', bead: '#1E3E1E', counted: '#C8924A', sumeru: '#0E2A0E', glow: 'rgba(60,160,60,0.40)' },
    light: { thread: 'rgba(30,80,30,0.15)',  bead: '#90C090', counted: '#3A7A3A', sumeru: '#1E5A1E', glow: 'rgba(58,122,58,0.40)' },
  },
  {
    id: 'crystal',
    name: 'Crystal',
    subtitle: 'Clarity & Purity · Universal',
    dark:  { thread: 'rgba(180,200,220,0.12)', bead: 'rgba(200,215,235,0.12)', counted: '#C8924A', sumeru: 'rgba(200,220,240,0.22)', glow: 'rgba(180,200,240,0.50)' },
    light: { thread: 'rgba(100,120,160,0.15)',  bead: 'rgba(160,180,210,0.35)', counted: '#6878A8', sumeru: 'rgba(140,160,200,0.55)', glow: 'rgba(104,120,168,0.40)' },
  },
] as const;

type MalaId = typeof MALAS[number]['id'];

// ── Mantra definitions ─────────────────────────────────────────────────────────
const MANTRAS = [
  {
    id: 'om_namah_shivaya',
    name: 'Om Namah Shivaya',
    devanagari: 'ॐ नमः शिवाय',
    tradition: 'Shaiva',
    description: 'Salutation to Shiva — the five elements',
    full: 'ॐ नमः शिवाय\nॐ नमः शिवाय\nॐ नमः शिवाय',
    tradColor: '#A06888',
  },
  {
    id: 'om_namo_narayanaya',
    name: 'Om Namo Narayanaya',
    devanagari: 'ॐ नमो नारायणाय',
    tradition: 'Vaishnava',
    description: 'Salutation to Lord Narayana',
    full: 'ॐ नमो नारायणाय\nॐ नमो नारायणाय\nॐ नमो नारायणाय',
    tradColor: '#6888C8',
  },
  {
    id: 'gayatri',
    name: 'Gayatri Mantra',
    devanagari: 'ॐ भूर्भुवः स्वः',
    tradition: 'Vedic',
    description: 'Universal mantra of light and wisdom',
    full: 'ॐ भूर्भुवः स्वः\nतत्सवितुर्वरेण्यं\nभर्गो देवस्य धीमहि\nधियो यो नः प्रचोदयात् ।।',
    tradColor: '#C8A040',
  },
  {
    id: 'hare_krishna',
    name: 'Hare Krishna Mahamantra',
    devanagari: 'हरे कृष्ण हरे कृष्ण',
    tradition: 'Vaishnava',
    description: 'The great mantra of Krishna and Rama',
    full: 'हरे कृष्ण हरे कृष्ण\nकृष्ण कृष्ण हरे हरे\nहरे राम हरे राम\nराम राम हरे हरे',
    tradColor: '#5888C8',
  },
  {
    id: 'mahamrityunjaya',
    name: 'Mahamrityunjaya',
    devanagari: 'ॐ त्र्यम्बकं यजामहे',
    tradition: 'Vedic',
    description: 'The great death-conquering mantra of Shiva',
    full: 'ॐ त्र्यम्बकं यजामहे\nसुगन्धिं पुष्टिवर्धनम्\nउर्वारुकमिव बन्धनान्\nमृत्योर्मुक्षीय मामृतात् ।।',
    tradColor: '#A86838',
  },
  {
    id: 'om_mani',
    name: 'Om Mani Padme Hum',
    devanagari: 'ॐ मणि पद्मे हूँ',
    tradition: 'Buddhist',
    description: 'Jewel in the lotus — mantra of compassion',
    full: 'ॐ मणि पद्मे हूँ\nॐ मणि पद्मे हूँ\nॐ मणि पद्मे हूँ',
    tradColor: '#6A9888',
  },
  {
    id: 'waheguru',
    name: 'Waheguru Simran',
    devanagari: 'ਵਾਹਿਗੁਰੂ',
    tradition: 'Sikh',
    description: 'The wondrous Guru — sacred simran of the Sikhs',
    full: 'ਵਾਹਿਗੁਰੂ\nਵਾਹਿਗੁਰੂ\nਵਾਹਿਗੁਰੂ',
    tradColor: '#4A8870',
  },
] as const;

type MantraId = typeof MANTRAS[number]['id'];

// ── Sound definitions ──────────────────────────────────────────────────────────
type SoundId = 'silence' | 'om' | 'bowl' | 'rain' | 'river' | 'bells' | 'forest';
const SOUNDS: { id: SoundId; label: string; emoji: string }[] = [
  { id: 'silence', label: 'Silence',      emoji: '🤫' },
  { id: 'om',      label: 'Om Chant',     emoji: '🕉' },
  { id: 'bowl',    label: 'Singing Bowl', emoji: '🪘' },
  { id: 'rain',    label: 'Rain',         emoji: '🌧️' },
  { id: 'river',   label: 'River',        emoji: '🌊' },
  { id: 'bells',   label: 'Temple Bells', emoji: '🔔' },
  { id: 'forest',  label: 'Forest',       emoji: '🌿' },
];

// ── Web Audio ambient engine (no external URLs — works offline + no CORS) ──────
let _japaCtx: AudioContext | null = null;
let _japaStopFns: (() => void)[] = [];

function _getCtx(): AudioContext | null {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!_japaCtx || _japaCtx.state === 'closed') _japaCtx = new Ctx() as AudioContext;
    const ctx = _japaCtx;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch { return null; }
}

function _noiseBuffer(ctx: AudioContext, secs = 4): AudioBuffer {
  const len = Math.ceil(ctx.sampleRate * secs);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function stopJapaAmbient() {
  _japaStopFns.forEach(fn => { try { fn(); } catch {} });
  _japaStopFns = [];
}

function _startRain(ctx: AudioContext) {
  const src = ctx.createBufferSource(); src.buffer = _noiseBuffer(ctx, 4); src.loop = true;
  const lp  = ctx.createBiquadFilter(); lp.type = 'lowpass';  lp.frequency.value = 650; lp.Q.value = 0.4;
  const hp  = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 90;
  const g   = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 1.8);
  src.connect(lp); lp.connect(hp); hp.connect(g); g.connect(ctx.destination);
  src.start();
  return () => {
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    setTimeout(() => { try { src.stop(); } catch {} }, 700);
  };
}

function _startRiver(ctx: AudioContext) {
  const src  = ctx.createBufferSource(); src.buffer = _noiseBuffer(ctx, 5); src.loop = true;
  const bp   = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 320; bp.Q.value = 0.7;
  const lp   = ctx.createBiquadFilter(); lp.type = 'lowpass';  lp.frequency.value = 1400;
  const g    = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.26, ctx.currentTime + 2.2);
  const lfo  = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.15;
  const lfoG = ctx.createGain(); lfoG.gain.value = 0.07;
  lfo.connect(lfoG); lfoG.connect(g.gain);
  src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(ctx.destination);
  src.start(); lfo.start();
  return () => {
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    setTimeout(() => { try { src.stop(); lfo.stop(); } catch {} }, 700);
  };
}

function _startBells(ctx: AudioContext) {
  let active = true;
  function ring() {
    if (!active) return;
    const t0 = ctx.currentTime;
    [432, 648, 864, 1080].forEach((freq, i) => {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      const g   = ctx.createGain();
      g.gain.setValueAtTime(0.14 / (i + 1), t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2 - i * 0.25);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + 3.5);
    });
    // Ring every 5-9 seconds (was 9-17s — much more responsive now)
    const delay = 5000 + Math.random() * 4000;
    setTimeout(() => { if (active) ring(); }, delay);
  }
  ring();
  return () => { active = false; };
}

function _startOm(ctx: AudioContext) {
  // Synthesises a repeating Om chant using formant filter sweep: A→U→M
  let active = true;
  function chant() {
    if (!active) return;
    const t0  = ctx.currentTime;
    const dur = 5.5; // duration of one Om

    // Sawtooth source — rich in harmonics like a human voice
    const src = ctx.createOscillator();
    src.type = 'sawtooth';
    src.frequency.value = 130; // ~C3 — deep, resonant male fundamental

    // Formant bandpass filter sweeps through A→U→M vowel shapes
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.Q.value = 4.0;
    filt.frequency.setValueAtTime(800, t0 + 0.05);          // 'A' vowel open
    filt.frequency.linearRampToValueAtTime(380, t0 + 2.2);  // 'U' vowel closing
    filt.frequency.linearRampToValueAtTime(180, t0 + 3.8);  // 'M' nasal/hum

    // Gentle reverb via convolver-like delay feedback
    const delay  = ctx.createDelay(0.25);
    delay.delayTime.value = 0.18;
    const fbGain = ctx.createGain(); fbGain.gain.value = 0.25;

    const masterG = ctx.createGain();
    masterG.gain.setValueAtTime(0, t0);
    masterG.gain.linearRampToValueAtTime(0.22, t0 + 0.5);
    masterG.gain.setValueAtTime(0.22, t0 + dur - 1.4);
    masterG.gain.linearRampToValueAtTime(0, t0 + dur);

    src.connect(filt);
    filt.connect(masterG);
    filt.connect(delay); delay.connect(fbGain); fbGain.connect(delay);
    delay.connect(masterG);
    masterG.connect(ctx.destination);

    src.start(t0); src.stop(t0 + dur);
    // 2 seconds of silence between Oms
    setTimeout(() => { if (active) chant(); }, (dur + 2.0) * 1000);
  }
  chant();
  return () => { active = false; };
}

function _startBowl(ctx: AudioContext) {
  // Tibetan singing bowl — 3 sinusoidal partials, struck every 10-15s
  let active = true;
  function strike() {
    if (!active) return;
    const t0 = ctx.currentTime;
    [[432, 0.22], [540, 0.10], [864, 0.05]].forEach(([freq, amp]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(amp, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 8.0);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + 8.5);
    });
    const delay = 10000 + Math.random() * 5000;
    setTimeout(() => { if (active) strike(); }, delay);
  }
  strike();
  return () => { active = false; };
}

function _startForest(ctx: AudioContext) {
  // Wind layer
  const s1 = ctx.createBufferSource(); s1.buffer = _noiseBuffer(ctx, 6); s1.loop = true;
  const hp1 = ctx.createBiquadFilter(); hp1.type = 'highpass'; hp1.frequency.value = 1800;
  const lp1 = ctx.createBiquadFilter(); lp1.type = 'lowpass';  lp1.frequency.value = 4500;
  const g1  = ctx.createGain(); g1.gain.setValueAtTime(0, ctx.currentTime);
  g1.gain.linearRampToValueAtTime(0.11, ctx.currentTime + 2);
  s1.connect(hp1); hp1.connect(lp1); lp1.connect(g1); g1.connect(ctx.destination);
  // Low rustle layer
  const s2 = ctx.createBufferSource(); s2.buffer = _noiseBuffer(ctx, 4); s2.loop = true;
  const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 280;
  const g2  = ctx.createGain(); g2.gain.setValueAtTime(0, ctx.currentTime);
  g2.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 2);
  s2.connect(lp2); lp2.connect(g2); g2.connect(ctx.destination);
  s1.start(); s2.start();
  return () => {
    [g1, g2].forEach(g => g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6));
    setTimeout(() => { try { s1.stop(); s2.stop(); } catch {} }, 700);
  };
}

function startJapaAmbient(id: SoundId) {
  const ctx = _getCtx();
  if (!ctx) return;
  stopJapaAmbient();
  if (id === 'silence') return;
  const fn = id === 'rain'   ? _startRain(ctx)
           : id === 'river'  ? _startRiver(ctx)
           : id === 'bells'  ? _startBells(ctx)
           : id === 'forest' ? _startForest(ctx)
           : id === 'om'     ? _startOm(ctx)
           : id === 'bowl'   ? _startBowl(ctx)
           : null;
  if (fn) _japaStopFns.push(fn);
}

// ── Target rounds ──────────────────────────────────────────────────────────────
const TARGET_OPTIONS = [1, 3, 5, 11] as const;

// ── Confetti burst on completion ───────────────────────────────────────────────
function ConfettiShower() {
  const particles = useMemo(() =>
    Array.from({ length: 64 }, (_, i) => ({
      id: i,
      left: `${3 + ((i * 1.516) % 94)}%`,
      delay: (i * 0.028) % 1.1,
      duration: 1.3 + (i % 6) * 0.18,
      color: ['#FFD700','#FF6B6B','#C8924A','#9988CC','#66BBAA','#FF9060','#88D4A8','#FF88BB'][i % 8],
      size: 5 + (i % 4),
      shape: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0%',
      rotate: Math.random() * 720 - 360,
    })), []
  );

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 62, overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: -14,
            width: p.size,
            height: p.size,
            borderRadius: p.shape,
            background: p.color,
          }}
          animate={{ y: '110vh', rotate: p.rotate, opacity: [1, 1, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      ))}
    </div>
  );
}

// ── SVG Mala ───────────────────────────────────────────────────────────────────
function beadPos(i: number) {
  const angle = ((i / TOTAL_BEADS) * Math.PI * 2) - Math.PI / 2;
  return { x: SVG_CX + RING_R * Math.cos(angle), y: SVG_CY + RING_R * Math.sin(angle) };
}

function MalaSVG({
  malaId, beadCount, isDark, pulsing,
}: {
  malaId: MalaId; beadCount: number; isDark: boolean; pulsing: boolean;
}) {
  const mala = MALAS.find(m => m.id === malaId) ?? MALAS[0];
  const c = isDark ? mala.dark : mala.light;
  const currentBeadIdx = beadCount % TOTAL_BEADS;
  const roundComplete  = beadCount > 0 && beadCount % TOTAL_BEADS === 0;
  const countDisplay   = roundComplete ? TOTAL_BEADS : currentBeadIdx;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_W}`}
      style={{ width: '100%', maxWidth: 320, touchAction: 'manipulation', userSelect: 'none' }}
    >
      <defs>
        <radialGradient id={`bead-un-${malaId}`} cx="38%" cy="32%" r="60%">
          <stop offset="0%"   stopColor={c.bead} stopOpacity="1" />
          <stop offset="100%" stopColor={c.bead} stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id={`bead-done-${malaId}`} cx="38%" cy="32%" r="60%">
          <stop offset="0%"   stopColor={isDark ? '#F4C860' : c.counted} stopOpacity="1" />
          <stop offset="100%" stopColor={c.counted} stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id={`sumeru-${malaId}`} cx="38%" cy="32%" r="60%">
          <stop offset="0%"   stopColor={isDark ? '#3E2010' : c.sumeru} stopOpacity="1" />
          <stop offset="100%" stopColor={c.sumeru} stopOpacity="0.8" />
        </radialGradient>
        <filter id="bead-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={c.glow} stopOpacity="0.18" />
          <stop offset="100%" stopColor={c.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Thread */}
      <circle cx={SVG_CX} cy={SVG_CY} r={RING_R} fill="none" stroke={c.thread} strokeWidth="1.5" />
      {/* Center glow */}
      <circle cx={SVG_CX} cy={SVG_CY} r={RING_R - 20} fill="url(#center-glow)" />

      {/* 108 beads */}
      {Array.from({ length: TOTAL_BEADS }, (_, i) => {
        const isSumeru  = i === 0;
        const isDone    = (!roundComplete && i > 0 && i <= currentBeadIdx) || (roundComplete && i > 0);
        const isCurrent = !roundComplete && i === currentBeadIdx + 1 && beadCount > 0;
        const pos = beadPos(i);
        const r   = isSumeru ? SUMERU_R : BEAD_R;
        const fill = isSumeru
          ? `url(#sumeru-${malaId})`
          : isDone ? `url(#bead-done-${malaId})`
          : `url(#bead-un-${malaId})`;

        return (
          <circle
            key={i}
            cx={pos.x}
            cy={pos.y}
            r={r}
            fill={fill}
            filter={isCurrent ? 'url(#bead-glow)' : undefined}
            stroke={
              isCurrent ? c.glow
              : isDone   ? (isDark ? 'rgba(240,180,60,0.35)' : 'rgba(100,60,20,0.3)')
              : 'none'
            }
            strokeWidth={isCurrent ? 1.5 : isDone ? 0.8 : 0}
          />
        );
      })}

      {/* Counter */}
      <text
        x={SVG_CX} y={SVG_CY - 8}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={countDisplay >= 100 ? 46 : 54}
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={isDark ? 'rgba(245,225,185,0.97)' : '#2D1F0E'}
        letterSpacing="-2"
      >
        {countDisplay}
      </text>
      <text
        x={SVG_CX} y={SVG_CY + 32}
        textAnchor="middle" fontSize={14}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={isDark ? 'rgba(200,146,74,0.65)' : 'rgba(100,65,25,0.65)'}
        letterSpacing="1"
      >
        / 108
      </text>

      {beadCount === 0 && (
        <text
          x={SVG_CX} y={SVG_CY + 54}
          textAnchor="middle" fontSize={11}
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={isDark ? 'rgba(200,146,74,0.40)' : 'rgba(100,65,25,0.40)'}
        >
          tap anywhere to begin
        </text>
      )}
    </svg>
  );
}

// ── Screen 1: Choose Mala ─────────────────────────────────────────────────────
function ChooseMalaScreen({
  isDark, selected, onSelect, onConfirm, onBack,
}: {
  isDark: boolean; selected: MalaId;
  onSelect: (id: MalaId) => void; onConfirm: () => void; onBack: () => void;
}) {
  const bg    = isDark ? '#08070A' : '#F5F0E8';
  const card  = isDark ? 'var(--card-bg)' : 'rgba(0,0,0,0.04)';
  const text  = isDark ? 'rgba(245,225,185,0.95)' : '#2D1F0E';
  const sub   = isDark ? 'rgba(200,146,74,0.60)' : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C8924A' : '#7A4A1E';

  return (
    <motion.div
      className="flex flex-col"
      style={{ background: bg, minHeight: '100dvh', marginLeft: '-0.75rem', marginRight: '-0.75rem', marginTop: '-0.5rem' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-2">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}
        >
          <ChevronLeft size={20} style={{ color: amber }} />
        </button>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: amber }}>Choose Your</p>
          <h1 className="text-[2rem] font-bold leading-tight" style={{ color: text, fontFamily: 'var(--font-serif)' }}>
            Mala
          </h1>
        </div>
      </div>
      <p className="px-6 pb-4 text-sm" style={{ color: sub }}>The sacred beads for your practice</p>

      {/* Mala list */}
      <div className="flex-1 px-5 space-y-3 overflow-y-auto pb-6">
        {MALAS.map(m => {
          const malaC = isDark ? m.dark : m.light;
          const isSelected = selected === m.id;
          return (
            <motion.button
              key={m.id}
              onClick={() => onSelect(m.id as MalaId)}
              whileTap={{ scale: 0.975 }}
              className="w-full text-left rounded-2xl p-4 flex items-center gap-4 border transition-all"
              style={{
                background: isSelected ? (isDark ? 'rgba(200,146,74,0.10)' : 'rgba(122,74,30,0.08)') : card,
                borderColor: isSelected ? malaC.glow : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'),
                boxShadow: isSelected ? `0 0 0 1.5px ${malaC.glow}` : 'none',
              }}
            >
              {/* Mini preview */}
              <div style={{ width: 52, height: 52, flexShrink: 0 }}>
                <svg viewBox="0 0 52 52">
                  <circle cx={26} cy={26} r={22} fill="none" stroke={malaC.thread} strokeWidth="1" />
                  {Array.from({ length: 24 }, (_, i) => {
                    const a = ((i / 24) * Math.PI * 2) - Math.PI / 2;
                    const x = 26 + 22 * Math.cos(a);
                    const y = 26 + 22 * Math.sin(a);
                    return (
                      <circle key={i} cx={x} cy={y} r={i === 0 ? 3.5 : 2.2}
                        fill={i === 0 ? malaC.sumeru : i < 8 ? malaC.counted : malaC.bead}
                        opacity={i === 0 ? 1 : i < 8 ? 0.9 : 0.7} />
                    );
                  })}
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[15px]" style={{ color: text }}>{m.name}</p>
                <p className="text-[12px] mt-0.5" style={{ color: sub }}>{m.subtitle}</p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: amber }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="px-5 pb-16 pt-2">
        <motion.button
          onClick={onConfirm}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-bold text-[15px]"
          style={{
            background: isDark ? 'linear-gradient(135deg, #C8924A, #8a5818)' : 'linear-gradient(135deg, #8B5E3C, #5a3010)',
            color: isDark ? '#fde8c8' : '#fff8f0',
            boxShadow: '0 4px 24px rgba(200,146,74,0.25)',
          }}
        >
          Continue →
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Screen 2: Choose Mantra ───────────────────────────────────────────────────
function ChooseMantraScreen({
  isDark, selected, onSelect, onBack, onConfirm,
}: {
  isDark: boolean; selected: MantraId;
  onSelect: (id: MantraId) => void; onBack: () => void; onConfirm: () => void;
}) {
  const bg    = isDark ? '#08070A' : '#F5F0E8';
  const card  = isDark ? 'var(--card-bg)' : 'rgba(0,0,0,0.04)';
  const text  = isDark ? 'rgba(245,225,185,0.95)' : '#2D1F0E';
  const sub   = isDark ? 'rgba(200,146,74,0.60)' : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C8924A' : '#7A4A1E';

  return (
    <motion.div
      className="flex flex-col"
      style={{ background: bg, minHeight: '100dvh', marginLeft: '-0.75rem', marginRight: '-0.75rem', marginTop: '-0.5rem' }}
      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}
        >
          <ChevronLeft size={20} style={{ color: amber }} />
        </button>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: amber }}>Choose Your</p>
          <h1 className="text-[1.8rem] font-bold leading-tight" style={{ color: text, fontFamily: 'var(--font-serif)' }}>Mantra</h1>
        </div>
      </div>

      {/* Mantra list */}
      <div className="flex-1 px-5 space-y-3 overflow-y-auto pb-6">
        {MANTRAS.map(m => {
          const isSelected = selected === m.id;
          return (
            <motion.button
              key={m.id}
              onClick={() => onSelect(m.id as MantraId)}
              whileTap={{ scale: 0.975 }}
              className="w-full text-left rounded-2xl p-4 border transition-all"
              style={{
                background: isSelected ? (isDark ? 'rgba(200,146,74,0.09)' : 'rgba(122,74,30,0.07)') : card,
                borderColor: isSelected ? `${m.tradColor}55` : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'),
                boxShadow: isSelected ? `0 0 0 1.5px ${m.tradColor}44` : 'none',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${m.tradColor}20`, color: m.tradColor, border: `1px solid ${m.tradColor}30` }}>
                  {m.tradition}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: amber }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-[1.35rem] font-medium mb-0.5 leading-snug"
                style={{ fontFamily: 'var(--font-devanagari), "Noto Sans Devanagari", sans-serif', color: text }}>
                {m.devanagari}
              </p>
              <p className="text-[13px] font-semibold mb-1" style={{ color: text, opacity: 0.85 }}>{m.name}</p>
              <p className="text-[11.5px]" style={{ color: sub }}>{m.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="px-5 pb-16 pt-2">
        <motion.button
          onClick={onConfirm}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-bold text-[15px]"
          style={{
            background: isDark ? 'linear-gradient(135deg, #C8924A, #8a5818)' : 'linear-gradient(135deg, #8B5E3C, #5a3010)',
            color: isDark ? '#fde8c8' : '#fff8f0',
            boxShadow: '0 4px 24px rgba(200,146,74,0.25)',
          }}
        >
          Begin Practice →
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Sounds Sheet ──────────────────────────────────────────────────────────────
function SoundsSheet({
  isDark, current, onSelect, onClose,
}: {
  isDark: boolean; current: SoundId;
  onSelect: (id: SoundId) => void; onClose: () => void;
}) {
  const bg   = isDark ? 'rgba(12,10,16,0.97)' : 'rgba(245,240,232,0.97)';
  const text = isDark ? 'rgba(245,225,185,0.95)' : '#2D1F0E';
  const sub  = isDark ? 'rgba(200,146,74,0.60)' : 'rgba(100,65,25,0.60)';

  return (
    <motion.div
      className="fixed inset-0 flex items-end"
      style={{ zIndex: 60, background: 'rgba(0,0,0,0.55)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        className="w-full max-w-2xl mx-auto rounded-t-3xl px-5 pt-3 pb-16"
        style={{ background: bg, backdropFilter: 'blur(24px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5"
          style={{ background: isDark ? 'rgba(200,146,74,0.25)' : 'rgba(100,65,25,0.20)' }} />
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: sub }}>Ambience</p>
            <h2 className="text-[1.3rem] font-bold" style={{ color: text, fontFamily: 'var(--font-serif)' }}>Sacred Sounds</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke={isDark ? 'rgba(245,225,185,0.7)' : '#2D1F0E'} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SOUNDS.map(s => {
            const isActive = current === s.id;
            return (
              <button key={s.id} onClick={() => onSelect(s.id)}
                className="flex flex-col items-center gap-2 rounded-2xl py-4 border transition-all"
                style={{
                  background: isActive
                    ? (isDark ? 'rgba(200,146,74,0.14)' : 'rgba(122,74,30,0.10)')
                    : (isDark ? 'var(--card-bg)' : 'rgba(0,0,0,0.04)'),
                  borderColor: isActive
                    ? (isDark ? 'rgba(200,146,74,0.40)' : 'rgba(122,74,30,0.35)')
                    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                }}>
                <span className="text-[1.6rem] leading-none">{s.emoji}</span>
                <span className="text-[9px] font-semibold text-center"
                  style={{ color: isActive ? (isDark ? '#C8924A' : '#7A4A1E') : sub }}>
                  {s.label}
                </span>
                {isActive && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: isDark ? '#C8924A' : '#7A4A1E' }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Completion Overlay ────────────────────────────────────────────────────────
function CompletionOverlay({
  isDark, rounds, partialBeads, targetRounds, durationSecs, mantraName, streak, onClose, onViewInsights,
}: {
  isDark: boolean; rounds: number; partialBeads: number; targetRounds: number; durationSecs: number;
  mantraName: string; streak: number; onClose: () => void; onViewInsights: () => void;
}) {
  const mins  = Math.floor(durationSecs / 60);
  const secs  = durationSecs % 60;
  const bg    = isDark ? 'rgba(8,6,12,0.97)' : 'rgba(245,240,232,0.97)';
  const text  = isDark ? 'rgba(245,225,185,0.97)' : '#2D1F0E';
  const sub   = isDark ? 'rgba(200,146,74,0.60)' : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C8924A' : '#7A4A1E';
  const isGoalMet = rounds >= targetRounds;
  const totalBeadsShown = rounds * TOTAL_BEADS + partialBeads;

  return (
    <>
      {/* Confetti */}
      <ConfettiShower />

      <motion.div
        className="fixed inset-0 flex items-end"
        style={{ zIndex: 61, background: 'rgba(0,0,0,0.65)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="w-full max-w-2xl mx-auto rounded-t-3xl px-6 pt-6 space-y-5"
          style={{
            background: bg,
            backdropFilter: 'blur(28px)',
            border: `1px solid ${amber}28`,
            borderBottom: 'none',
            paddingBottom: 'max(7rem, calc(env(safe-area-inset-bottom, 0px) + 5rem))',
          }}
        >
          <div className="w-10 h-1 rounded-full mx-auto" style={{ background: `${amber}30` }} />

          {/* Celebration */}
          <div className="text-center space-y-2">
            <motion.div className="text-5xl"
              animate={{ scale: [0.5, 1.2, 1] }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              🙏
            </motion.div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700, color: text, letterSpacing: '-0.01em' }}>
              {isGoalMet ? 'Sadhana Complete' : 'Japa Complete'}
            </h2>
            <p style={{ color: sub, fontSize: '0.9rem' }}>
              {rounds} mala{rounds > 1 ? 's' : ''} · {mantraName}
            </p>
            {isGoalMet && targetRounds > 1 && (
              <p className="text-xs font-semibold px-3 py-1 rounded-full inline-block"
                style={{ background: `${amber}18`, color: amber }}>
                🎯 Goal of {targetRounds} malas achieved!
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Rounds', value: rounds > 0 ? `${rounds}` : '—' },
              { label: 'Beads',  value: `${totalBeadsShown}` },
              { label: 'Time',   value: `${mins}m ${secs}s` },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center border"
                style={{ background: isDark ? 'var(--card-bg)' : 'rgba(0,0,0,0.04)', borderColor: `${amber}1A` }}>
                <p className="font-bold text-xl" style={{ color: amber }}>{s.value}</p>
                <p className="text-[11px] mt-1" style={{ color: sub }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center justify-center gap-2 rounded-2xl p-3 border"
              style={{ background: `${amber}10`, borderColor: `${amber}28` }}>
              <Flame size={18} style={{ color: amber }} />
              <span className="font-semibold text-sm" style={{ color: amber }}>{streak} day streak</span>
            </div>
          )}

          {/* CTAs */}
          <div className="space-y-2.5">
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-bold text-[15px]"
              style={{
                background: isDark ? 'linear-gradient(135deg, #C8924A, #8a5818)' : 'linear-gradient(135deg, #8B5E3C, #5a3010)',
                color: isDark ? '#fde8c8' : '#fff8f0',
                boxShadow: '0 4px 24px rgba(200,146,74,0.28)',
              }}>
              🕉️  Hari Om
            </motion.button>

            <button
              onClick={onViewInsights}
              className="w-full py-3 rounded-2xl text-sm font-semibold border"
              style={{
                background: 'transparent',
                borderColor: `${amber}30`,
                color: amber,
              }}>
              View Insights →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

// ── Main JapaClient ────────────────────────────────────────────────────────────
type Screen = 'chooseMala' | 'chooseMantra' | 'japa';

interface Props {
  userId: string;
  userName: string;
  tradition: string;
  currentStreak: number;
  japaAlreadyDoneToday: boolean;
  history: { date: string; done: boolean }[];
}

export default function JapaClient({
  userId, userName, tradition, currentStreak, japaAlreadyDoneToday, history,
}: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const engine = useEngine();
  const isPro  = usePremium();

  const defaultMantraId: MantraId = tradition === 'sikh'     ? 'waheguru'
    : tradition === 'buddhist' ? 'om_mani'
    : 'gayatri';

  // ── Screen + selection state ─────────────────────────────────────────────
  const [screen,    setScreen]    = useState<Screen>('chooseMala');
  const [malaId,    setMalaId]    = useState<MalaId>('sandalwood');
  const [mantraId,  setMantraId]  = useState<MantraId>(defaultMantraId);
  const [targetRounds, setTargetRounds] = useState(1);
  // Ref so countBead callback always reads the latest targetRounds without stale closure
  const targetRoundsRef = useRef(1);
  useEffect(() => { targetRoundsRef.current = targetRounds; }, [targetRounds]);

  useEffect(() => {
    try {
      const savedMala   = localStorage.getItem(STORAGE_MALA)   as MalaId | null;
      const savedMantra = localStorage.getItem(STORAGE_MANTRA) as MantraId | null;
      if (savedMala   && MALAS.find(m => m.id === savedMala))     setMalaId(savedMala);
      if (savedMantra && MANTRAS.find(m => m.id === savedMantra)) setMantraId(savedMantra);
    } catch { /* ok */ }
  }, []);

  // ── Japa state ───────────────────────────────────────────────────────────
  const [beadCount,    setBeadCount]    = useState(0);
  const [roundsDone,   setRoundsDone]   = useState(0);
  const [totalBeads,   setTotalBeads]   = useState(0);
  const [paused,       setPaused]       = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showSounds,   setShowSounds]   = useState(false);
  const [soundId,      setSoundId]      = useState<SoundId>('silence');
  const [streak,       setStreak]       = useState(currentStreak);
  const [saved,        setSaved]        = useState(japaAlreadyDoneToday);
  const [pulsing,      setPulsing]      = useState(false);

  // Timer
  const [duration, setDuration] = useState(0);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt  = useRef<number | null>(null);

  useEffect(() => {
    if (screen !== 'japa' || paused || showComplete) return;
    if (!startedAt.current) startedAt.current = Date.now();
    timerRef.current = setInterval(() => setDuration(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen, paused, showComplete]);

  // ── Audio — Web Audio API (no CORS, no external URLs) ───────────────────
  // Cleanup on unmount
  useEffect(() => () => { stopJapaAmbient(); }, []);

  // Pause/resume: Web Audio context suspend/resume
  useEffect(() => {
    if (!_japaCtx) return;
    if (paused) {
      _japaCtx.suspend().catch(() => {});
    } else {
      _japaCtx.resume().catch(() => {});
    }
  }, [paused]);

  // Stop audio when leaving japa screen
  useEffect(() => {
    if (screen !== 'japa') {
      stopJapaAmbient();
      setSoundId('silence');
    }
  }, [screen]);

  // Full-screen: enter when japa begins, exit when leaving
  useEffect(() => {
    if (screen === 'japa') {
      try {
        const el = document.documentElement;
        if (el.requestFullscreen && !document.fullscreenElement) {
          el.requestFullscreen().catch(() => {});
        }
      } catch { /* ok — not all browsers support fullscreen */ }
    } else {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } catch { /* ok */ }
    }
  }, [screen]);

  // ── Handle sound selection (called from SoundsSheet — user gesture) ──────
  function handleSoundSelect(id: SoundId) {
    setSoundId(id);
    startJapaAmbient(id);
    setShowSounds(false);
  }

  // ── Count bead ───────────────────────────────────────────────────────────
  const countBead = useCallback(() => {
    if (paused || showComplete) return;
    hapticLight();
    setPulsing(true);
    setTimeout(() => setPulsing(false), 120);

    setBeadCount(prev => {
      const next = prev + 1;
      if (next >= TOTAL_BEADS) {
        hapticSuccess();
        setRoundsDone(r => {
          const newRounds = r + 1;
          setTotalBeads(t => t + next);
          // Only auto-complete when the user has hit their target rounds
          if (newRounds >= targetRoundsRef.current) {
            stopJapaAmbient();   // silence the ambient sound when sadhana is done
            setTimeout(() => setShowComplete(true), 300);
          }
          return newRounds;
        });
        return 0;
      }
      setTotalBeads(t => t + 1);
      return next;
    });
  }, [paused, showComplete]);

  // ── Milestone thresholds ─────────────────────────────────────────────────
  const STREAK_MILESTONES  = [7, 21, 40, 54, 108, 365];
  const SESSION_MILESTONES = [7, 21, 40, 108, 365, 1000];

  // ── Save session ─────────────────────────────────────────────────────────
  const saveSession = useCallback(async (completedRounds: number, partialBeads = 0) => {
    if (saved || (completedRounds === 0 && partialBeads === 0)) return;
    try {
      const supabase = createClient();
      const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
      const today = localSpiritualDate(tz, 4);

      // Insert japa session and get new all-time count in parallel
      const [insertResult, { count: newTotalSessions }] = await Promise.all([
        supabase.from('mala_sessions').insert({
          user_id: userId, date: today,
          rounds: completedRounds,
          bead_count: completedRounds * TOTAL_BEADS + partialBeads,
          mantra_id: mantraId,
          duration_secs: duration,
        }),
        supabase.from('mala_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);
      if (insertResult.error) {
        console.error('[Japa] mala_sessions insert failed:', insertResult.error);
        throw insertResult.error;
      }

      // Streak: look at yesterday's record to build a consecutive-day count
      const yesterdayObj = new Date(today + 'T12:00:00Z');
      yesterdayObj.setUTCDate(yesterdayObj.getUTCDate() - 1);
      const yesterday = yesterdayObj.toISOString().slice(0, 10);
      const [{ data: todayRow }, { data: yesterdayRow }] = await Promise.all([
        supabase.from('daily_sadhana').select('streak_count, japa_done').eq('user_id', userId).eq('date', today).maybeSingle(),
        supabase.from('daily_sadhana').select('streak_count, japa_done').eq('user_id', userId).eq('date', yesterday).maybeSingle(),
      ]);
      // If today already has a streak count (edge case), keep it; otherwise derive from yesterday
      const newStreak = todayRow?.streak_count
        ? todayRow.streak_count
        : (yesterdayRow?.japa_done ? (yesterdayRow.streak_count ?? 0) + 1 : 1);
      await supabase.from('daily_sadhana').upsert({
        user_id: userId, date: today, japa_done: true, streak_count: newStreak,
      }, { onConflict: 'user_id,date' });
      setStreak(newStreak);
      setSaved(true);

      // ── Fire milestone notifications (fire-and-forget) ──────────────────
      const milestonePayloads: { type: 'streak' | 'session'; threshold: number }[] = [];

      if (STREAK_MILESTONES.includes(newStreak)) {
        milestonePayloads.push({ type: 'streak', threshold: newStreak });
      }
      const total = newTotalSessions ?? 0;
      if (SESSION_MILESTONES.includes(total)) {
        milestonePayloads.push({ type: 'session', threshold: total });
      }

      for (const payload of milestonePayloads) {
        fetch('/api/notifications/milestone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => { /* best-effort */ });
      }
    } catch (err) {
      console.error('[Japa] saveSession error:', err);
    }
  }, [saved, userId, mantraId, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleConfirmMala = () => {
    try { localStorage.setItem(STORAGE_MALA, malaId); } catch { /* ok */ }
    setScreen('chooseMantra');
  };

  const handleConfirmMantra = () => {
    try { localStorage.setItem(STORAGE_MANTRA, mantraId); } catch { /* ok */ }
    setScreen('japa');
  };

  const handleReset = () => {
    setBeadCount(0);
    setRoundsDone(0);
    setTotalBeads(0);
    setDuration(0);
    startedAt.current = null;
    setPaused(false);
    setShowComplete(false);
  };

  const handleCompleteClose = () => {
    saveSession(roundsDone, beadCount);
    setShowComplete(false);
    setBeadCount(0);
    // Do NOT reset roundsDone so user can continue
  };

  const handleViewInsights = async () => {
    await saveSession(roundsDone, beadCount);
    router.push('/japa/insights');
  };

  const currentMantra = MANTRAS.find(m => m.id === mantraId)  ?? MANTRAS[0];
  const currentMala   = MALAS.find(m => m.id === malaId)      ?? MALAS[0];

  // Theme tokens for japa screen
  const bg      = isDark ? '#06060A' : '#F5F0E8';
  const text     = isDark ? 'rgba(245,225,185,0.97)' : '#2D1F0E';
  const sub      = isDark ? 'rgba(200,146,74,0.60)'  : 'rgba(100,65,25,0.60)';
  const amber    = isDark ? '#C8924A' : '#7A4A1E';
  const cardBg   = isDark ? 'var(--card-bg)' : 'rgba(0,0,0,0.04)';

  // Progress toward target
  // For multi-round targets: full rounds completed / target; for single mala: bead count / 108
  const progressPct = targetRounds > 1
    ? Math.min(100, (roundsDone / targetRounds) * 100)
    : Math.min(100, (beadCount / 108) * 100);

  return (
    <AnimatePresence mode="wait">

      {screen === 'chooseMala' && (
        <ChooseMalaScreen
          key="chooseMala"
          isDark={isDark}
          selected={malaId}
          onSelect={setMalaId}
          onConfirm={handleConfirmMala}
          onBack={() => router.back()}
        />
      )}

      {screen === 'chooseMantra' && (
        <ChooseMantraScreen
          key="chooseMantra"
          isDark={isDark}
          selected={mantraId}
          onSelect={setMantraId}
          onBack={() => setScreen('chooseMala')}
          onConfirm={handleConfirmMantra}
        />
      )}

      {screen === 'japa' && (
        <motion.div
          key="japa"
          className="flex flex-col"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: bg,
            overflowY: 'auto',
          }}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          // Tap anywhere on the japa screen (except controls) counts a bead
          onClick={(e) => {
            // Only count if the tap is on the background (not on buttons/controls)
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('a') || target.tagName === 'BUTTON') return;
            countBead();
          }}
        >
          {/* ── Top bar ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 pt-14 pb-2">
            <button
              onClick={() => {
                try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch {}
                setScreen('chooseMala');
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
              <ChevronLeft size={20} style={{ color: amber }} />
            </button>

            {/* Mantra name + tradition */}
            <div className="text-center flex-1 px-3">
              <p className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: sub }}>
                {currentMantra.tradition}
              </p>
              <p className="text-[13px] font-semibold leading-tight" style={{ color: text }}>
                {currentMantra.name}
              </p>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Change mala/mantra */}
              <button
                onClick={() => {
                  try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch {}
                  setScreen('chooseMala');
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                <Settings2 size={15} style={{ color: amber }} />
              </button>
              {/* Sounds */}
              <button
                onClick={() => setShowSounds(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                {soundId === 'silence'
                  ? <VolumeX size={15} style={{ color: amber }} />
                  : <Volume2 size={15} style={{ color: amber }} />}
              </button>
            </div>
          </div>

          {/* ── Mantra devanagari ─────────────────────────────────────────── */}
          <div className="text-center px-6 pb-2">
            <p style={{
              fontFamily: 'var(--font-devanagari), "Noto Sans Devanagari", sans-serif',
              fontSize: '1.3rem',
              color: isDark ? 'rgba(245,210,150,0.75)' : 'rgba(80,45,10,0.65)',
              lineHeight: 1.6,
              letterSpacing: '0.03em',
            }}>
              {currentMantra.devanagari}
            </p>
          </div>

          {/* ── Target rounds selector ────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-2 px-4 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider mr-1" style={{ color: sub }}>Target</p>
            {TARGET_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setTargetRounds(n)}
                className="px-3 py-1 rounded-full text-[11px] font-semibold border transition-all"
                style={{
                  background: targetRounds === n ? `${amber}22` : 'transparent',
                  borderColor: targetRounds === n ? `${amber}70` : `${amber}28`,
                  color: targetRounds === n ? amber : sub,
                }}
              >
                {n} mala
              </button>
            ))}
          </div>

          {/* ── Progress bar toward target ────────────────────────────────── */}
          <div className="px-8 pb-2">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: `${amber}18` }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: amber }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] text-center mt-1" style={{ color: sub }}>
              {targetRounds > 1
                ? `${roundsDone}/${targetRounds} malas`
                : `${beadCount}/108 beads`}
            </p>
          </div>

          {/* ── SVG Mala ─────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-3">
            <motion.div
              className="w-full flex items-center justify-center"
              animate={pulsing ? { scale: [1, 0.985, 1] } : {}}
              transition={{ duration: 0.12 }}
              style={{ maxWidth: 340 }}
            >
              <MalaSVG
                malaId={malaId}
                beadCount={beadCount + roundsDone * TOTAL_BEADS}
                isDark={isDark}
                pulsing={pulsing}
              />
            </motion.div>

            {/* Round indicator dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.max(targetRounds, roundsDone + 1) }, (_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: i === roundsDone ? 20 : 6,
                    height: 6,
                    background: i < roundsDone
                      ? amber
                      : i === roundsDone
                      ? `${amber}80`
                      : `${amber}22`,
                  }}
                />
              ))}
              {roundsDone > 0 && (
                <p className="text-[11px] font-semibold ml-1" style={{ color: sub }}>
                  Round {roundsDone + 1}
                </p>
              )}
            </div>
          </div>

          {/* ── Bottom controls ───────────────────────────────────────────── */}
          <div className="px-5 space-y-3" style={{ paddingBottom: 'max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 4.5rem))' }}>
            {/* Streak + insights row */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Flame size={15} style={{ color: streak > 0 ? amber : `${amber}40` }} />
                <span className="text-[12px] font-semibold" style={{ color: streak > 0 ? amber : `${amber}40` }}>
                  {streak > 0 ? `${streak} day streak` : 'Start your streak'}
                </span>
              </div>
              <Link
                href="/japa/insights"
                className="flex items-center gap-1"
                onClick={e => e.stopPropagation()}
              >
                <BarChart2 size={13} style={{ color: sub }} />
                <span className="text-[11px]" style={{ color: sub }}>Insights</span>
              </Link>
            </div>

            {/* Pause / Reset row */}
            <div className="flex gap-3">
              <button
                onClick={() => setPaused(p => !p)}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-[14px] border transition-all"
                style={{ background: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)', color: text }}>
                {paused ? '▶  Resume' : '⏸  Pause'}
              </button>
              <button
                onClick={handleReset}
                className="w-14 py-3.5 rounded-2xl flex items-center justify-center border transition-all"
                style={{ background: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }}>
                <RotateCcw size={17} style={{ color: sub }} />
              </button>
            </div>

            {/* Finish session — always shown once any beads counted */}
            {(roundsDone > 0 || beadCount > 0) && (
              <button
                onClick={() => { saveSession(roundsDone, beadCount); setShowComplete(true); }}
                className="w-full py-3 rounded-2xl font-semibold text-[13px]"
                style={{
                  background: isDark ? 'rgba(200,146,74,0.12)' : 'rgba(122,74,30,0.08)',
                  color: amber,
                  border: `1px solid ${amber}28`,
                }}>
                End & Save Session
              </button>
            )}
          </div>

          {/* ── Sounds sheet ──────────────────────────────────────────────── */}
          <AnimatePresence>
            {showSounds && (
              <SoundsSheet
                isDark={isDark}
                current={soundId}
                onSelect={handleSoundSelect}
                onClose={() => setShowSounds(false)}
              />
            )}
          </AnimatePresence>

          {/* ── Completion overlay ────────────────────────────────────────── */}
          <AnimatePresence>
            {showComplete && (
              <CompletionOverlay
                isDark={isDark}
                rounds={roundsDone}
                partialBeads={beadCount}
                targetRounds={targetRounds}
                durationSecs={duration}
                mantraName={currentMantra.name}
                streak={streak}
                onClose={handleCompleteClose}
                onViewInsights={handleViewInsights}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
