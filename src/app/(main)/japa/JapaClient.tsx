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
import { ChevronLeft, Volume2, VolumeX, Flame, RotateCcw, BarChart2, Settings2, X } from 'lucide-react';
import { useEngine } from '@/contexts/EngineContext';
import { hapticLight, hapticSuccess } from '@/lib/platform';
import { createClient } from '@/lib/supabase';
import { localSpiritualDate } from '@/lib/sacred-time';
import { buildMalaSessionInsert } from '@/lib/mala-sessions';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';
import Link from 'next/link';
import { getTraditionMeta } from '@/lib/tradition-config';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';

// ── Constants ──────────────────────────────────────────────────────────────────
const TOTAL_BEADS = 108;
const SVG_W = 400;          // ↑ larger canvas so beads fill more screen
const SVG_CX = SVG_W / 2;
const SVG_CY = SVG_W / 2;
const RING_R = 170;         // ↑ wider ring
const BEAD_R = 10.5;        // ↑ significantly bigger beads (was 7.0)
const SUMERU_R = 16;        // ↑ bigger sumeru bead (was 11)
const STORAGE_MALA   = 'ss-japa-mala';
const STORAGE_MANTRA = 'ss-japa-mantra';
const STORAGE_BG     = 'ss-japa-bg';
const STORAGE_SOUND  = 'ss-japa-sound';

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
type SoundId = 'silence' | 'om' | 'bowl' | 'rain' | 'river' | 'bells' | 'forest' | 'dilruba' | 'dhamma' | 'stavan';
const SOUNDS: { id: SoundId; label: string; emoji: string }[] = [
  { id: 'silence', label: 'Silence',      emoji: '🤫' },
  { id: 'om',      label: 'Om Chant',     emoji: '🕉' },
  { id: 'bowl',    label: 'Singing Bowl', emoji: '🪘' },
  { id: 'rain',    label: 'Rain',         emoji: '🌧️' },
  { id: 'river',   label: 'River',        emoji: '🌊' },
  { id: 'bells',   label: 'Temple Bells', emoji: '🔔' },
  { id: 'forest',  label: 'Forest',       emoji: '🌿' },
  { id: 'dilruba', label: 'Dilruba',      emoji: '🎻' },
  { id: 'dhamma',  label: 'Dhamma Chant', emoji: '☸️' },
  { id: 'stavan',  label: 'Jain Chime',   emoji: '✨' },
];

// ── Background scenes ──────────────────────────────────────────────────────────
const BG_SCENES = [
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    dark:  { bg: '#06060A', overlay: 'none' },
    light: { bg: '#F5F0E8', overlay: 'none' },
  },
  {
    id: 'himalayan_dawn',
    name: 'Himalayan',
    emoji: '🏔️',
    dark:  { bg: '#0A0614', overlay: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(200,120,50,0.40) 0%, rgba(100,50,140,0.20) 55%, transparent 100%)' },
    light: { bg: '#FFF0E0', overlay: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,180,80,0.55) 0%, rgba(220,140,80,0.25) 55%, transparent 100%)' },
  },
  {
    id: 'temple',
    name: 'Temple',
    emoji: '🛕',
    dark:  { bg: '#0E0804', overlay: 'radial-gradient(ellipse 70% 80% at 30% 80%, rgba(200,130,40,0.38) 0%, rgba(140,80,20,0.12) 60%, transparent 100%)' },
    light: { bg: '#FDF4E0', overlay: 'radial-gradient(ellipse 70% 80% at 30% 80%, rgba(220,160,60,0.45) 0%, rgba(200,140,60,0.15) 60%, transparent 100%)' },
  },
  {
    id: 'river_ghat',
    name: 'River Ghat',
    emoji: '🌊',
    dark:  { bg: '#040A12', overlay: 'radial-gradient(ellipse 90% 50% at 50% 90%, rgba(30,100,140,0.38) 0%, rgba(15,60,100,0.15) 60%, transparent 100%)' },
    light: { bg: '#E8F4F8', overlay: 'radial-gradient(ellipse 90% 50% at 50% 90%, rgba(70,140,180,0.45) 0%, rgba(50,110,160,0.18) 60%, transparent 100%)' },
  },
  {
    id: 'forest_ashram',
    name: 'Forest',
    emoji: '🌿',
    dark:  { bg: '#040C06', overlay: 'radial-gradient(ellipse 80% 70% at 50% 65%, rgba(30,90,40,0.35) 0%, rgba(15,60,25,0.12) 60%, transparent 100%)' },
    light: { bg: '#EAF5EA', overlay: 'radial-gradient(ellipse 80% 70% at 50% 65%, rgba(60,140,70,0.45) 0%, rgba(40,110,55,0.18) 60%, transparent 100%)' },
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    emoji: '✨',
    dark:  { bg: '#04040E', overlay: 'radial-gradient(ellipse 70% 80% at 50% 20%, rgba(80,60,160,0.42) 0%, rgba(40,30,120,0.18) 55%, transparent 100%)' },
    light: { bg: '#EEE8F8', overlay: 'radial-gradient(ellipse 70% 80% at 50% 20%, rgba(120,100,200,0.45) 0%, rgba(80,60,160,0.18) 55%, transparent 100%)' },
  },
] as const;

type BgSceneId = typeof BG_SCENES[number]['id'];

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

function _startDilruba(ctx: AudioContext) {
  // Sikh classical string drone (Dilruba/Taus style)
  const osc1 = ctx.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.value = 146.83; // D3
  const osc2 = ctx.createOscillator(); osc2.type = 'sawtooth'; osc2.frequency.value = 147.50; // Detuned D3 for richness
  const osc3 = ctx.createOscillator(); osc3.type = 'sine'; osc3.frequency.value = 73.42;    // D2 sub

  // LFO for slow bowing effect
  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.2;
  const lfoG = ctx.createGain(); lfoG.gain.value = 15;
  lfo.connect(lfoG);
  lfoG.connect(osc1.frequency); lfoG.connect(osc2.frequency);

  const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 800; filt.Q.value = 1.2;
  
  const g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 3);

  osc1.connect(filt); osc2.connect(filt); osc3.connect(filt);
  filt.connect(g); g.connect(ctx.destination);

  osc1.start(); osc2.start(); osc3.start(); lfo.start();
  return () => {
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => { try { osc1.stop(); osc2.stop(); osc3.stop(); lfo.stop(); } catch {} }, 1600);
  };
}

function _startDhamma(ctx: AudioContext) {
  // Buddhist deep throat chanting (monk style drone)
  const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 65.41; // C2 deep fundamental
  
  // Strong vocal formants
  const filt1 = ctx.createBiquadFilter(); filt1.type = 'bandpass'; filt1.frequency.value = 400; filt1.Q.value = 4;
  const filt2 = ctx.createBiquadFilter(); filt2.type = 'bandpass'; filt2.frequency.value = 1200; filt2.Q.value = 4;
  
  // Slow breath rhythm LFO
  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.1;
  const lfoG = ctx.createGain(); lfoG.gain.value = 0.05;
  lfo.connect(lfoG);

  const g1 = ctx.createGain(); g1.gain.value = 0.6;
  const g2 = ctx.createGain(); g2.gain.value = 0.4;
  
  osc.connect(filt1); osc.connect(filt2);
  filt1.connect(g1); filt2.connect(g2);
  
  const master = ctx.createGain(); master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 4);
  lfoG.connect(master.gain);
  
  g1.connect(master); g2.connect(master); master.connect(ctx.destination);
  
  osc.start(); lfo.start();
  return () => {
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    setTimeout(() => { try { osc.stop(); lfo.stop(); } catch {} }, 2100);
  };
}

function _startStavan(ctx: AudioContext) {
  // Jain Stavan style bell-chime sequence with soft organ drone
  let active = true;
  
  // Soft drone
  const drone = ctx.createOscillator(); drone.type = 'sine'; drone.frequency.value = 220; // A3
  const droneG = ctx.createGain(); droneG.gain.setValueAtTime(0, ctx.currentTime);
  droneG.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 3);
  drone.connect(droneG); droneG.connect(ctx.destination);
  drone.start();

  function chime() {
    if (!active) return;
    const t0 = ctx.currentTime;
    [554.37, 659.25, 830.61].forEach((freq, i) => { // C#5, E5, G#5
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0 + i * 0.15);
      g.gain.linearRampToValueAtTime(0.08, t0 + i * 0.15 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.15 + 3.0);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t0 + i * 0.15); osc.stop(t0 + i * 0.15 + 3.2);
    });
    const delay = 12000 + Math.random() * 6000;
    setTimeout(() => { if (active) chime(); }, delay);
  }
  chime();
  
  return () => {
    active = false;
    droneG.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => { try { drone.stop(); } catch {} }, 1600);
  };
}

function startJapaAmbient(id: SoundId) {
  const ctx = _getCtx();
  if (!ctx) return;
  stopJapaAmbient();
  if (id === 'silence') return;
  const fn = id === 'rain'    ? _startRain(ctx)
           : id === 'river'   ? _startRiver(ctx)
           : id === 'bells'   ? _startBells(ctx)
           : id === 'forest'  ? _startForest(ctx)
           : id === 'om'      ? _startOm(ctx)
           : id === 'bowl'    ? _startBowl(ctx)
           : id === 'dilruba' ? _startDilruba(ctx)
           : id === 'dhamma'  ? _startDhamma(ctx)
           : id === 'stavan'  ? _startStavan(ctx)
           : null;
  if (fn) _japaStopFns.push(fn);
}

// ── Target rounds ──────────────────────────────────────────────────────────────
const TARGET_OPTIONS = [1, 3, 5, 11] as const;

// ── Confetti burst on completion ───────────────────────────────────────────────
function ConfettiShower() {
  return <ConfettiOverlay show />;
}

// ── SVG Mala ───────────────────────────────────────────────────────────────────
function beadPos(i: number) {
  const angle = ((i / TOTAL_BEADS) * Math.PI * 2) - Math.PI / 2;
  return { x: SVG_CX + RING_R * Math.cos(angle), y: SVG_CY + RING_R * Math.sin(angle) };
}

function MalaSVG({
  malaId, beadCount, isDark, pulsing, flashBeadIdx, flashKey,
}: {
  malaId: MalaId; beadCount: number; isDark: boolean; pulsing: boolean;
  flashBeadIdx: number; flashKey: number;
}) {
  const { playHaptic } = useZenithSensory();
  const mala = MALAS.find(m => m.id === malaId) ?? MALAS[0];
  const c = isDark ? mala.dark : mala.light;
  const currentBeadIdx = beadCount % TOTAL_BEADS;
  const roundComplete  = beadCount > 0 && beadCount % TOTAL_BEADS === 0;
  const countDisplay   = roundComplete ? TOTAL_BEADS : currentBeadIdx;

  // Current bead (next to be tapped)
  const nextBeadIdx = !roundComplete && beadCount > 0 ? currentBeadIdx + 1 : -1;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_W}`}
      style={{ width: '100%', maxWidth: '100%', touchAction: 'manipulation', userSelect: 'none' }}
    >
      <defs>
        {/* ── Uncounted bead — 3-stop 3D gradient ── */}
        <radialGradient id={`bead-un-${malaId}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor={c.bead} stopOpacity="1" />
          <stop offset="55%"  stopColor={c.bead} stopOpacity="0.82" />
          <stop offset="100%" stopColor={c.bead} stopOpacity="0.45" />
        </radialGradient>
        {/* ── Counted bead — warm gold glow ── */}
        <radialGradient id={`bead-done-${malaId}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor={isDark ? '#F6D070' : c.counted} stopOpacity="1" />
          <stop offset="50%"  stopColor={isDark ? '#D4A040' : c.counted} stopOpacity="0.95" />
          <stop offset="100%" stopColor={c.counted} stopOpacity="0.75" />
        </radialGradient>
        {/* ── Sumeru bead ── */}
        <radialGradient id={`sumeru-${malaId}`} cx="35%" cy="28%" r="65%">
          <stop offset="0%"   stopColor={isDark ? '#4E2A12' : c.sumeru} stopOpacity="1" />
          <stop offset="100%" stopColor={c.sumeru} stopOpacity="0.8" />
        </radialGradient>
        {/* ── Specular highlight (applied on top of each bead) ── */}
        <radialGradient id={`spec-${malaId}`} cx="32%" cy="28%" r="48%">
          <stop offset="0%"   stopColor="white" stopOpacity={malaId === 'crystal' ? 0.70 : 0.48} />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* ── Drop shadow filter ── */}
        <filter id="bead-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="1.2" dy="1.8" stdDeviation="1.4" floodColor="#000" floodOpacity="0.45" />
        </filter>
        {/* ── Glow filter for current bead ── */}
        <filter id="bead-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* ── Strong glow for flash ripple ── */}
        <filter id="flash-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* ── Crystal inner glow ── */}
        {malaId === 'crystal' && (
          <radialGradient id="crystal-inner" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(180,210,255,0.30)" stopOpacity="1" />
            <stop offset="100%" stopColor="rgba(180,210,255,0)" stopOpacity="0" />
          </radialGradient>
        )}
        {/* ── Center ambient glow ── */}
        <radialGradient id={`center-glow-${malaId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={c.glow} stopOpacity="0.22" />
          <stop offset="100%" stopColor={c.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Thread */}
      <circle cx={SVG_CX} cy={SVG_CY} r={RING_R} fill="none" stroke={c.thread} strokeWidth="1.8" />
      {/* Center ambient glow */}
      <circle cx={SVG_CX} cy={SVG_CY} r={RING_R - 22} fill={`url(#center-glow-${malaId})`} />

      {/* ── 108 beads — shadow layer first, then bead, then specular ── */}
      {Array.from({ length: TOTAL_BEADS }, (_, i) => {
        const isSumeru  = i === 0;
        const isDone    = (!roundComplete && i > 0 && i <= currentBeadIdx) || (roundComplete && i > 0);
        const isCurrent = i === nextBeadIdx;
        const isFlash   = i === flashBeadIdx;
        const pos = beadPos(i);
        const r   = isSumeru ? SUMERU_R : BEAD_R;
        const fill = isSumeru
          ? `url(#sumeru-${malaId})`
          : isDone ? `url(#bead-done-${malaId})`
          : `url(#bead-un-${malaId})`;

        return (
          <g key={i}>
            {/* Shadow */}
            <circle cx={pos.x + 1.2} cy={pos.y + 1.8} r={r * 0.92} fill="black" opacity="0.38" />
            {/* Main bead */}
            <circle
              cx={pos.x} cy={pos.y} r={r}
              fill={fill}
              filter={isCurrent ? 'url(#bead-glow)' : 'url(#bead-shadow)'}
              stroke={
                isCurrent ? c.glow
                : isDone   ? (isDark ? 'rgba(240,180,60,0.40)' : 'rgba(100,60,20,0.35)')
                : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)')
              }
              strokeWidth={isCurrent ? 1.8 : isDone ? 0.9 : 0.5}
            />
            {/* Crystal inner glow */}
            {malaId === 'crystal' && (
              <circle cx={pos.x} cy={pos.y} r={r * 0.75} fill="url(#crystal-inner)" />
            )}
            {/* Specular highlight */}
            <circle
              cx={pos.x - r * 0.22} cy={pos.y - r * 0.26}
              r={r * (isSumeru ? 0.40 : 0.38)}
              fill={`url(#spec-${malaId})`}
            />
            {/* Rudraksha grain lines */}
            {malaId === 'rudraksha' && !isSumeru && (
              <>
                <line
                  x1={pos.x - r * 0.55} y1={pos.y}
                  x2={pos.x + r * 0.55} y2={pos.y}
                  stroke={isDark ? 'rgba(0,0,0,0.35)' : 'rgba(60,30,10,0.30)'}
                  strokeWidth="0.7" strokeLinecap="round"
                />
                <line
                  x1={pos.x} y1={pos.y - r * 0.55}
                  x2={pos.x} y2={pos.y + r * 0.55}
                  stroke={isDark ? 'rgba(0,0,0,0.25)' : 'rgba(60,30,10,0.22)'}
                  strokeWidth="0.5" strokeLinecap="round"
                />
              </>
            )}
          </g>
        );
      })}

      {/* ── Pulsing ring around current bead (next to tap) ── */}
      {nextBeadIdx >= 0 && (() => {
        const pos = beadPos(nextBeadIdx);
        return (
          <>
            {/* Inner glow ring */}
            <motion.circle
              cx={pos.x} cy={pos.y}
              fill={c.glow}
              animate={{ r: [BEAD_R * 1.15, BEAD_R * 1.35, BEAD_R * 1.15], opacity: [0.35, 0.10, 0.35] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Outer guide ring */}
            <motion.circle
              cx={pos.x} cy={pos.y}
              fill="none"
              stroke={c.glow}
              strokeWidth={2}
              animate={{ r: [BEAD_R * 1.55, BEAD_R * 2.1, BEAD_R * 1.55], opacity: [0.70, 0.12, 0.70] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </>
        );
      })()}

      {/* ── Flash ripple when a bead is counted — two-ring burst ── */}
      {flashBeadIdx >= 0 && flashBeadIdx < TOTAL_BEADS && (() => {
        const pos = beadPos(flashBeadIdx);
        return (
          <>
            {/* Inner burst */}
            <motion.circle
              key={`flash-inner-${flashKey}`}
              cx={pos.x} cy={pos.y}
              fill={c.glow}
              filter="url(#flash-glow)"
              initial={{ r: BEAD_R * 1.0, opacity: 0.95 }}
              animate={{ r: BEAD_R * 2.8, opacity: 0 }}
              transition={{ duration: 0.40, ease: 'easeOut' }}
            />
            {/* Outer shockwave ring */}
            <motion.circle
              key={`flash-outer-${flashKey}`}
              cx={pos.x} cy={pos.y}
              fill="none"
              stroke={c.glow}
              strokeWidth={2.5}
              initial={{ r: BEAD_R * 1.2, opacity: 0.80 }}
              animate={{ r: BEAD_R * 4.5, opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            />
          </>
        );
      })()}

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
  isDark, selected, onSelect, onConfirm, onBack, bgSceneId, onBgSceneSelect,
}: {
  isDark: boolean; selected: MalaId;
  onSelect: (id: MalaId) => void; onConfirm: () => void; onBack: () => void;
  bgSceneId: BgSceneId; onBgSceneSelect: (id: BgSceneId) => void;
}) {
  const bg    = isDark ? '#08070A' : '#F5F0E8';
  const card  = isDark ? 'var(--card-bg)' : 'rgba(0,0,0,0.04)';
  const text  = isDark ? 'rgba(245,225,185,0.95)' : '#2D1F0E';
  const sub   = isDark ? 'rgba(200,146,74,0.60)' : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C8924A' : '#7A4A1E';

  return (
    <motion.div
      className="flex flex-col fixed inset-0 z-[100] overflow-y-auto"
      style={{ background: bg }}
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

      {/* ── Background Scene Picker ── */}
      <div className="px-5 pb-4">
        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase mb-3" style={{ color: sub }}>
          Practice Background
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {BG_SCENES.map(scene => {
            const sc = isDark ? scene.dark : scene.light;
            const isSelected = bgSceneId === scene.id;
            return (
              <button
                key={scene.id}
                onClick={() => onBgSceneSelect(scene.id as BgSceneId)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
                style={{ minWidth: 60 }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                  style={{
                    background: sc.bg,
                    border: `2px solid ${isSelected ? amber : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)')}`,
                    boxShadow: isSelected ? `0 0 0 2px ${amber}55` : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Overlay gradient preview */}
                  {sc.overlay !== 'none' && (
                    <div style={{ position: 'absolute', inset: 0, background: sc.overlay, borderRadius: 'inherit' }} />
                  )}
                  <span className="text-2xl relative z-10">{scene.emoji}</span>
                </div>
                <p className="text-[9px] font-semibold text-center leading-tight"
                  style={{ color: isSelected ? amber : sub, maxWidth: 56 }}>
                  {scene.name}
                </p>
              </button>
            );
          })}
        </div>
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
      className="flex flex-col fixed inset-0 z-[100] overflow-y-auto"
      style={{ background: bg }}
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
  isDark, rounds, partialBeads, targetRounds, durationSecs, mantraName, streak, onContinue, onChangeMala, onViewInsights,
}: {
  isDark: boolean; rounds: number; partialBeads: number; targetRounds: number; durationSecs: number;
  mantraName: string; streak: number; onContinue: () => void; onChangeMala: () => void; onViewInsights: () => void;
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
              onClick={onContinue}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-bold text-[15px]"
              style={{
                background: isDark ? 'linear-gradient(135deg, #C8924A, #8a5818)' : 'linear-gradient(135deg, #8B5E3C, #5a3010)',
                color: isDark ? '#fde8c8' : '#fff8f0',
                boxShadow: '0 4px 24px rgba(200,146,74,0.28)',
              }}>
              Continue another mala
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
            <button
              onClick={onChangeMala}
              className="w-full py-3 rounded-2xl text-sm font-semibold border"
              style={{
                background: 'transparent',
                borderColor: `${amber}22`,
                color: sub,
              }}>
              Change mala &amp; mantra
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

function StopPracticeSheet({
  isDark, hasProgress, saving, onSaveAndStop, onDiscard, onContinue,
}: {
  isDark: boolean;
  hasProgress: boolean;
  saving: boolean;
  onSaveAndStop: () => void;
  onDiscard: () => void;
  onContinue: () => void;
}) {
  const bg     = isDark ? 'rgba(10,8,14,0.97)' : 'rgba(248,244,236,0.97)';
  const text   = isDark ? 'rgba(245,225,185,0.95)' : '#2D1F0E';
  const sub    = isDark ? 'rgba(200,146,74,0.60)' : 'rgba(100,65,25,0.60)';
  const amber  = isDark ? '#C8924A' : '#7A4A1E';
  const border = isDark ? 'rgba(200,146,74,0.14)' : 'rgba(0,0,0,0.07)';

  return (
    <motion.div
      className="fixed inset-0 flex items-end"
      style={{ zIndex: 125, background: 'rgba(0,0,0,0.62)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onContinue}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl mx-auto rounded-t-3xl px-5 pt-3 space-y-4"
        style={{
          background: bg,
          backdropFilter: 'blur(28px)',
          border: `1px solid ${border}`,
          borderBottom: 'none',
          paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom,0px) + 2rem))',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: `${amber}30` }} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${amber}80` }}>Focused mala</p>
            <h2 className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-serif)', color: text }}>
              Stop this session?
            </h2>
            <p className="text-sm leading-relaxed mt-2" style={{ color: sub }}>
              {hasProgress
                ? 'Save your current beads before leaving, or discard this unfinished session.'
                : 'No beads have been counted yet. You can leave setup or continue practice.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}
            aria-label="Continue practice"
          >
            <X size={15} style={{ color: sub }} />
          </button>
        </div>

        <div className="grid gap-2">
          {hasProgress && (
            <button
              type="button"
              onClick={onSaveAndStop}
              disabled={saving}
              className="w-full py-4 rounded-2xl font-bold text-[15px] disabled:opacity-60"
              style={{
                background: isDark ? 'linear-gradient(135deg, #C8924A, #8a5818)' : 'linear-gradient(135deg, #8B5E3C, #5a3010)',
                color: isDark ? '#fde8c8' : '#fff8f0',
              }}
            >
              {saving ? 'Saving...' : 'End & save'}
            </button>
          )}
          <button
            type="button"
            onClick={onContinue}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm border"
            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: border, color: text }}
          >
            Continue practice
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="w-full py-3 rounded-2xl font-semibold text-sm"
            style={{ color: sub }}
          >
            {hasProgress ? 'Discard and leave' : 'Leave setup'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── In-practice Settings Sheet ────────────────────────────────────────────────
// Opened via the gear icon — lets user change target rounds and sounds WITHOUT
// exiting fullscreen / going back to chooseMala.
function PracticeSettingsSheet({
  isDark, targetRounds, onTargetChange,
  soundId, onSoundSelect,
  onChangeMala, onClose,
}: {
  isDark: boolean;
  targetRounds: number; onTargetChange: (n: number) => void;
  soundId: SoundId; onSoundSelect: (id: SoundId) => void;
  onChangeMala: () => void; onClose: () => void;
}) {
  const bg   = isDark ? 'rgba(10,8,14,0.97)' : 'rgba(248,244,236,0.97)';
  const text = isDark ? 'rgba(245,225,185,0.95)' : '#2D1F0E';
  const sub  = isDark ? 'rgba(200,146,74,0.60)' : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C8924A' : '#7A4A1E';
  const border = isDark ? 'rgba(200,146,74,0.14)' : 'rgba(0,0,0,0.07)';
  const cardBg = isDark ? 'var(--card-bg)' : 'rgba(0,0,0,0.04)';

  const [localSound, setLocalSound] = useState<SoundId>(soundId);

  return (
    <motion.div
      className="fixed inset-0 flex items-end"
      style={{ zIndex: 120, background: 'rgba(0,0,0,0.60)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        className="w-full max-w-2xl mx-auto rounded-t-3xl px-5 pt-3"
        style={{ background: bg, backdropFilter: 'blur(28px)', paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom,0px) + 2rem))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: `${amber}30` }} />

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${amber}80` }}>Practice</p>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: text }}>Settings</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke={text} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            </svg>
          </button>
        </div>

        {/* Target rounds */}
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: sub }}>Rounds target</p>
          <div className="grid grid-cols-4 gap-2">
            {TARGET_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => onTargetChange(n)}
                className="py-3 rounded-2xl text-sm font-semibold border transition-all"
                style={{
                  background: targetRounds === n ? `${amber}20` : cardBg,
                  borderColor: targetRounds === n ? `${amber}60` : border,
                  color: targetRounds === n ? amber : text,
                  boxShadow: targetRounds === n ? `0 0 0 1.5px ${amber}35` : 'none',
                }}
              >
                {n}×
              </button>
            ))}
          </div>
          <p className="text-[10px] mt-2 text-center" style={{ color: sub }}>
            {targetRounds} mala{targetRounds > 1 ? 's' : ''} = {targetRounds * 108} mantras
          </p>
        </div>

        {/* Ambient sound */}
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: sub }}>Ambient sound</p>
          <div className="grid grid-cols-4 gap-2">
            {SOUNDS.map(s => {
              const isActive = localSound === s.id;
              return (
                <button key={s.id}
                  onClick={() => { setLocalSound(s.id); onSoundSelect(s.id); }}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all"
                  style={{
                    background: isActive ? `${amber}14` : cardBg,
                    borderColor: isActive ? `${amber}45` : border,
                  }}>
                  <span className="text-xl leading-none">{s.emoji}</span>
                  <span className="text-[9px] font-semibold" style={{ color: isActive ? amber : sub }}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Change mala / mantra */}
        <button
          onClick={onChangeMala}
          className="w-full py-3.5 rounded-2xl font-semibold text-sm border flex items-center justify-center gap-2"
          style={{ background: cardBg, borderColor: border, color: text }}>
          <span>🪬</span> Change Mala &amp; Mantra
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main JapaClient ────────────────────────────────────────────────────────────
type Screen = 'chooseMala' | 'chooseMantra' | 'practice';

interface Props {
  userId: string;
  userName: string;
  tradition: string;
  currentStreak: number;
  japaAlreadyDoneToday: boolean;
  history: { date: string; done: boolean }[];
}

export default function JapaClient({
  userId, tradition, currentStreak,
}: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const { playHaptic } = useZenithSensory();

  const meta = getTraditionMeta(tradition);
  const defaultMantraId: MantraId = meta.japaDefaultMantra as MantraId;

  // ── Screen + selection state ─────────────────────────────────────────────
  const [screen,    setScreen]    = useState<Screen>('chooseMala');
  const [malaId,    setMalaId]    = useState<MalaId>('sandalwood');
  const [mantraId,  setMantraId]  = useState<MantraId>(defaultMantraId);
  const [bgSceneId, setBgSceneId] = useState<BgSceneId>('midnight');
  const [targetRounds, setTargetRounds] = useState(1);
  const targetRoundsRef = useRef(1);
  useEffect(() => { targetRoundsRef.current = targetRounds; }, [targetRounds]);

  // ── Auto-hide controls state (immersive mode) ────────────────────────────
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControlsBriefly = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 4000);
  }, []);

  useEffect(() => {
    if (screen === 'practice') {
      showControlsBriefly();
    } else {
      setControlsVisible(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    }
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [screen]); 

  // ── Per-bead flash animation state ──────────────────────────────────────
  const [flashBeadIdx, setFlashBeadIdx] = useState(-1);
  const [flashKey,     setFlashKey]     = useState(0);
  const flashTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beadCountRef   = useRef(0);

  const [floatParticles, setFloatParticles] = useState<{id: number}[]>([]);
  const floatIdRef = useRef(0);

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    try {
      const savedMala   = localStorage.getItem(STORAGE_MALA)   as MalaId | null;
      const savedMantra = localStorage.getItem(STORAGE_MANTRA) as MantraId | null;
      const savedBg     = localStorage.getItem(STORAGE_BG)     as BgSceneId | null;
      if (savedMala   && MALAS.find(m => m.id === savedMala))         setMalaId(savedMala);
      if (savedMantra && MANTRAS.find(m => m.id === savedMantra))     setMantraId(savedMantra);
      if (savedBg     && BG_SCENES.find(s => s.id === savedBg))       setBgSceneId(savedBg);
    } catch { /* ok */ }
  }, []);

  const [beadCount,    setBeadCount]    = useState(0);
  const [roundsDone,   setRoundsDone]   = useState(0);
  const [totalBeads,   setTotalBeads]   = useState(0);
  const [paused,       setPaused]       = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showStopSheet, setShowStopSheet] = useState(false);
  const [soundId,      setSoundId]      = useState<SoundId>(() => {
    if (typeof window === 'undefined') return 'silence';
    return (localStorage.getItem(STORAGE_SOUND) as SoundId) || 'silence';
  });
  const [streak,       setStreak]       = useState(currentStreak);
  const [saved,        setSaved]        = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [pulsing,      setPulsing]      = useState(false);

  useEffect(() => { beadCountRef.current = beadCount; }, [beadCount]);

  const [duration, setDuration] = useState(0);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt  = useRef<number | null>(null);

  useEffect(() => {
    if (screen !== 'practice' || paused || showComplete) return;
    if (!startedAt.current) startedAt.current = Date.now();
    timerRef.current = setInterval(() => setDuration(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen, paused, showComplete]);

  useEffect(() => () => { stopJapaAmbient(); }, []);

  const enterBrowserFullscreen = useCallback(() => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen && !document.fullscreenElement) {
        el.requestFullscreen().catch(() => {});
      }
    } catch { /* ok */ }
  }, []);

  function handleSoundSelect(id: SoundId) {
    setSoundId(id);
    localStorage.setItem(STORAGE_SOUND, id);
    startJapaAmbient(id);
  }

  const countBead = useCallback(() => {
    if (paused || showComplete) return;
    playHaptic('light');
    setPulsing(true);
    setTimeout(() => setPulsing(false), 120);

    showControlsBriefly();

    const pid = ++floatIdRef.current;
    setFloatParticles(prev => [...prev.slice(-5), { id: pid }]);
    setTimeout(() => setFloatParticles(prev => prev.filter(p => p.id !== pid)), 800);

    const countingIdx = beadCountRef.current % TOTAL_BEADS;
    setFlashBeadIdx(countingIdx);
    setFlashKey(k => k + 1);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashBeadIdx(-1), 650);

    setBeadCount(prev => {
      const next = prev + 1;
      if (next >= TOTAL_BEADS) {
        hapticSuccess();
        setRoundsDone(r => {
          const newRounds = r + 1;
          setTotalBeads(t => t + next);
          if (newRounds >= targetRoundsRef.current) {
            stopJapaAmbient();
            setTimeout(() => setShowComplete(true), 300);
          }
          return newRounds;
        });
        return 0;
      }
      setTotalBeads(t => t + 1);
      return next;
    });
  }, [paused, showComplete, showControlsBriefly, playHaptic]);

  const saveSession = useCallback(async (completedRounds: number, partialBeads = 0) => {
    if (saved || savingSession || (completedRounds === 0 && partialBeads === 0)) return false;
    setSavingSession(true);
    try {
      const supabase = createClient();
      const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
      const today = localSpiritualDate(tz, 4);

      const totalBeads = completedRounds * TOTAL_BEADS + partialBeads;
      const completedAt = new Date().toISOString();
      const malaSessionRow = buildMalaSessionInsert({
        userId,
        mantra: mantraId ?? 'om_namah_shivaya',
        count: totalBeads,
        targetCount: TOTAL_BEADS,
        durationSeconds: duration,
        completedAt,
        date: today,
        malaId,
        backgroundScene: bgSceneId,
      });

      const primaryInsert = await supabase.from('mala_sessions').insert(malaSessionRow);

      if (primaryInsert.error) {
        const {
          date: _date,
          rounds: _rounds,
          bead_count: _beadCount,
          mantra_id: _mantraId,
          duration_secs: _durationSecs,
          mala_id: _malaId,
          background_scene: _backgroundScene,
          ...canonicalRow
        } = malaSessionRow;
        const fallback = await supabase.from('mala_sessions').insert(canonicalRow);
        if (fallback.error) throw fallback.error;
      }

      const { count: newTotalSessions } = await supabase
        .from('mala_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const yesterdayObj = new Date(today + 'T12:00:00Z');
      yesterdayObj.setUTCDate(yesterdayObj.getUTCDate() - 1);
      const yesterday = yesterdayObj.toISOString().slice(0, 10);
      const [{ data: todayRow }, { data: yesterdayRow }] = await Promise.all([
        supabase.from('daily_sadhana').select('streak_count, japa_done').eq('user_id', userId).eq('date', today).maybeSingle(),
        supabase.from('daily_sadhana').select('streak_count, japa_done').eq('user_id', userId).eq('date', yesterday).maybeSingle(),
      ]);
      const newStreak = todayRow?.streak_count
        ? todayRow.streak_count
        : (yesterdayRow?.japa_done ? (yesterdayRow.streak_count ?? 0) + 1 : 1);
      await supabase.from('daily_sadhana').upsert({
        user_id: userId, date: today, japa_done: true, streak_count: newStreak,
      }, { onConflict: 'user_id,date' });
      setStreak(newStreak);
      setSaved(true);
      return true;
    } catch (err) {
      return false;
    } finally {
      setSavingSession(false);
    }
  }, [saved, savingSession, userId, mantraId, malaId, bgSceneId, duration]);

  const handleBgSceneSelect = (id: BgSceneId) => {
    setBgSceneId(id);
    try { localStorage.setItem(STORAGE_BG, id); } catch { /* ok */ }
  };

  const handleConfirmMala = () => {
    try { localStorage.setItem(STORAGE_MALA, malaId); } catch { /* ok */ }
    setScreen('chooseMantra');
  };

  const handleConfirmMantra = () => {
    try { localStorage.setItem(STORAGE_MANTRA, mantraId); } catch { /* ok */ }
    enterBrowserFullscreen();
    setScreen('practice');
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

  const resetPracticeForNextRound = () => {
    setShowComplete(false);
    setBeadCount(0);
    setRoundsDone(0);
    setTotalBeads(0);
    setDuration(0);
    startedAt.current = null;
    setPaused(false);
    setSaved(false);
  };

  const handleViewInsights = async () => {
    await saveSession(roundsDone, beadCount);
    router.push('/bhakti/mala/insights');
  };

  const handleContinueAfterComplete = async () => {
    await saveSession(roundsDone, beadCount);
    resetPracticeForNextRound();
  };

  const handleChangeAfterComplete = async () => {
    await saveSession(roundsDone, beadCount);
    leavePracticeSetup();
  };

  const leavePracticeSetup = useCallback(() => {
    stopJapaAmbient();
    setShowStopSheet(false);
    setShowSettings(false);
    setShowComplete(false);
    setPaused(false);
    router.back();
  }, [router]);

  const handleSaveAndStop = async () => {
    await saveSession(roundsDone, beadCount);
    leavePracticeSetup();
  };

  const handleDiscardAndStop = () => {
    setBeadCount(0);
    setRoundsDone(0);
    setTotalBeads(0);
    setDuration(0);
    startedAt.current = null;
    setSaved(false);
    leavePracticeSetup();
  };

  const handleManualEnd = async () => {
    if (roundsDone === 0 && beadCount === 0) {
      setShowStopSheet(true);
      return;
    }
    await saveSession(roundsDone, beadCount);
    setShowComplete(true);
  };

  const currentMantra = MANTRAS.find(m => m.id === mantraId)  ?? MANTRAS[0];
  const currentMala   = MALAS.find(m => m.id === malaId)      ?? MALAS[0];
  const currentBgScene = BG_SCENES.find(s => s.id === bgSceneId) ?? BG_SCENES[0];
  const bgC = isDark ? currentBgScene.dark : currentBgScene.light;

  const bg      = bgC.bg;
  const text     = isDark ? 'rgba(245,225,185,0.97)' : '#2D1F0E';
  const sub      = isDark ? 'rgba(200,146,74,0.60)'  : 'rgba(100,65,25,0.60)';
  const amber    = isDark ? '#C8924A' : '#7A4A1E';
  const cardBg   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

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
          bgSceneId={bgSceneId}
          onBgSceneSelect={handleBgSceneSelect}
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

      {screen === 'practice' && (
        <motion.div
          key="practice"
          className="flex flex-col"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: bg,
            overflow: 'hidden',
          }}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('a') || target.tagName === 'BUTTON') return;
            countBead();
          }}
        >
          {bgC.overlay !== 'none' && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
              background: bgC.overlay,
            }} />
          )}

          <motion.div
            animate={{ opacity: controlsVisible ? 1 : 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ pointerEvents: controlsVisible ? 'auto' : 'none', position: 'relative', zIndex: 10 }}
          >
          <div className="flex items-center justify-between px-5 pt-14 pb-2">
            <button
              onClick={() => setShowStopSheet(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
              <X size={17} style={{ color: amber }} />
            </button>
            <div className="text-center flex-1 px-3">
              <p className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: sub }}>
                {currentMantra.tradition}
              </p>
              <p className="text-[13px] font-semibold leading-tight" style={{ color: text }}>
                {currentMantra.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                {soundId === 'silence'
                  ? <VolumeX size={15} style={{ color: amber }} />
                  : <Volume2 size={15} style={{ color: amber }} />}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                <Settings2 size={15} style={{ color: amber }} />
              </button>
            </div>
          </div>
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
          <div className="px-8 pb-2">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${amber}18` }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: amber }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 px-0.5">
              <p className="text-[10px]" style={{ color: sub }}>
                {targetRounds > 1
                  ? `${roundsDone}/${targetRounds} malas`
                  : `${beadCount}/108 beads`}
              </p>
              <button
                onClick={() => setShowSettings(true)}
                className="text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full border"
                style={{ color: amber, borderColor: `${amber}35`, background: `${amber}10` }}>
                Target: {targetRounds}× <span className="opacity-60">›</span>
              </button>
            </div>
          </div>
          </motion.div>

          <div className="flex-1 flex flex-col items-center justify-center relative">
            <LotusParticles />
            <div className="relative z-10 w-full max-w-sm px-6">
              <motion.div
                className="w-full flex items-center justify-center"
                animate={pulsing ? { scale: [1, 0.980, 1.005, 1] } : {}}
                transition={{ duration: 0.15 }}
                style={{ maxWidth: 420, maxHeight: 'calc(100vh - 26rem)', aspectRatio: '1 / 1' }}
              >
                <MalaSVG
                  malaId={malaId}
                  beadCount={beadCount + roundsDone * TOTAL_BEADS}
                  isDark={isDark}
                  pulsing={pulsing}
                  flashBeadIdx={flashBeadIdx}
                  flashKey={flashKey}
                />
              </motion.div>
            </div>
          </div>

          <motion.div
            animate={{ opacity: controlsVisible ? 1 : 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ pointerEvents: controlsVisible ? 'auto' : 'none', position: 'relative', zIndex: 10 }}
          >
          <div className="px-5 space-y-3" style={{ paddingBottom: 'max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 4.5rem))' }}>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Flame size={15} style={{ color: streak > 0 ? amber : `${amber}40` }} />
                <span className="text-[12px] font-semibold" style={{ color: streak > 0 ? amber : `${amber}40` }}>
                  {streak > 0 ? `${streak} day streak` : 'Start your streak'}
                </span>
              </div>
              <Link
                href="/bhakti/mala/insights"
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
                onClick={handleManualEnd}
                disabled={savingSession}
                className="w-full py-3 rounded-2xl font-semibold text-[13px]"
                style={{
                  background: isDark ? 'rgba(200,146,74,0.12)' : 'rgba(122,74,30,0.08)',
                  color: amber,
                  border: `1px solid ${amber}28`,
                }}>
                {savingSession ? 'Saving...' : 'End & Save Session'}
              </button>
            )}
          </div>
          </motion.div>{/* end bottom controls auto-hide wrapper */}

          {/* ── Practice settings sheet (target rounds + sound — stays in fullscreen) ── */}
          <AnimatePresence>
            {showSettings && (
              <PracticeSettingsSheet
                isDark={isDark}
                targetRounds={targetRounds}
                onTargetChange={n => { setTargetRounds(n); targetRoundsRef.current = n; }}
                soundId={soundId}
                onSoundSelect={handleSoundSelect}
                onChangeMala={() => setShowStopSheet(true)}
                onClose={() => setShowSettings(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showStopSheet && (
              <StopPracticeSheet
                isDark={isDark}
                hasProgress={roundsDone > 0 || beadCount > 0}
                saving={savingSession}
                onSaveAndStop={handleSaveAndStop}
                onDiscard={handleDiscardAndStop}
                onContinue={() => setShowStopSheet(false)}
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
                onContinue={handleContinueAfterComplete}
                onChangeMala={handleChangeAfterComplete}
                onViewInsights={handleViewInsights}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
