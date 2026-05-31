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

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, Volume2, VolumeX, Flame, RotateCcw, BarChart2, Settings2, X, Moon, Sun, Sparkles, Play, Pause } from 'lucide-react';
import { hapticSuccess } from '@/lib/platform';
import { createClient } from '@/lib/supabase';
import { localSpiritualDate } from '@/lib/sacred-time';
import { buildMalaSessionInsert } from '@/lib/mala-sessions';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { triggerSadhanaShare } from '@/lib/share/trigger-share';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PageIntro from '@/components/ui/PageIntro';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';

const TRADITION_SYMBOLS: Record<string, string> = { hindu: '🕉️', sikh: 'ੴ', buddhist: '☸️', jain: '🤲' };
import {
  getJapaMantrasForTradition,
  getJapaPracticeType,
  getTraditionMeta,
  JAPA_MALAS as MALAS,
  type JapaMalaId,
  type JapaMantraId,
} from '@/lib/tradition-config';
import { MANTRAS as DATA_MANTRAS } from '@/data/mantras';

interface JapaMantraEntry {
  id: string;
  name: string;
  devanagari: string;
  tradition: string;
  description: string;
  full: string;
  tradColor: string;
  transliteration: string;
}

const MANTRAS: JapaMantraEntry[] = DATA_MANTRAS.map(m => ({
  id: m.id,
  name: m.nameEn,
  devanagari: m.nameLocal,
  tradition: m.tradition,
  description: m.textMeaning,
  full: m.textSanskrit || m.nameLocal,
  tradColor: '#C5A059',
  transliteration: m.textTransliteration,
}));
import { getMalaSkin } from '@/lib/mala-skins';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import MantraPlayer from '@/components/ui/MantraPlayer';

// ── Constants ──────────────────────────────────────────────────────────────────
const TOTAL_BEADS = 108;
const SVG_W = 400;          // ↑ larger canvas so beads fill more screen
const SVG_CX = SVG_W / 2;
const SVG_CY = SVG_W / 2;
const RING_R = 170;         // ↑ wider ring
const BEAD_R = 13;        // ↑ significantly bigger beads        // ↑ significantly bigger beads (was 7.0)
const SUMERU_R = 20;        // ↑ bigger sumeru bead        // ↑ bigger sumeru bead (was 11)
const STORAGE_MALA   = 'shoonaya-japa-mala';
const STORAGE_MANTRA = 'shoonaya-japa-mantra';
const STORAGE_CUSTOM_MANTRA = 'shoonaya-japa-custom-mantra';
const STORAGE_BG     = 'shoonaya-japa-bg';
const STORAGE_SOUND  = 'shoonaya-japa-sound';
const STORAGE_LIFETIME = 'shoonaya-japa-lifetime';
const CUSTOM_MANTRA_ID = '__custom__';

type JapaLifetimeData = {
  totalBeads: number;
  totalRounds: number;
  lastPracticed: string | null;
};

const EMPTY_LIFETIME_DATA: JapaLifetimeData = {
  totalBeads: 0,
  totalRounds: 0,
  lastPracticed: null,
};

function getMilestoneLabel(bead: number, appLanguage: string) {
  const normalized = appLanguage === 'hi' || appLanguage === 'pa' ? appLanguage : 'en';
  const labels = {
    hi: { 27: '¼ माला', 54: '½ माला', 81: '¾ माला' },
    pa: { 27: '¼ ਮਾਲਾ', 54: '½ ਮਾਲਾ', 81: '¾ ਮਾਲਾ' },
    en: { 27: '¼ Mala', 54: '½ Mala', 81: '¾ Mala' },
  } as const;
  return labels[normalized][bead as 27 | 54 | 81] ?? `${bead}`;
}

function getTraditionSacredSymbol(tradition: string) {
  if (tradition === 'sikh') return 'ੴ';
  if (tradition === 'buddhist') return '☸';
  if (tradition === 'jain') return '☮';
  return 'ॐ';
}

function getSpiritualTimeWindow(date: Date) {
  const hour = date.getHours();
  if (hour >= 3 && hour < 6) return 'brahma_muhurta';
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'midday';
  if (hour >= 16 && hour < 20) return 'sandhya';
  return 'night';
}

type MalaId = JapaMalaId;
type MantraId = string;
type SelectedMantraId = MantraId | typeof CUSTOM_MANTRA_ID;
type CustomMantra = {
  label: string;
  text: string;
  description: string;
};
type PresetMantra = (typeof MANTRAS)[number];
type CustomMantraCard = ReturnType<typeof buildCustomMantraCard>;
type MantraOption = PresetMantra | CustomMantraCard;

// ── Sound definitions ──────────────────────────────────────────────────────────
type SoundId = 'silence' | 'om' | 'bowl' | 'rain' | 'river' | 'bells' | 'forest' | 'dilruba' | 'dhamma' | 'stavan';
const SOUNDS: { id: SoundId; label: string; icon: any }[] = [
  { id: 'silence', label: 'Silence',      icon: <VolumeX size={18} /> },
  { id: 'om',      label: 'Om Chant',     icon: <Volume2 size={18} /> },
  { id: 'bowl',    label: 'Singing Bowl', icon: <Volume2 size={18} /> },
  { id: 'rain',    label: 'Rain',         icon: <Volume2 size={18} /> },
  { id: 'river',   label: 'River',        icon: <Volume2 size={18} /> },
  { id: 'bells',   label: 'Temple Bells', icon: <Volume2 size={18} /> },
  { id: 'forest',  label: 'Forest',       icon: <Volume2 size={18} /> },
  { id: 'dilruba', label: 'Dilruba',      icon: <Volume2 size={18} /> },
  { id: 'dhamma',  label: 'Dhamma Chant', icon: <Volume2 size={18} /> },
  { id: 'stavan',  label: 'Jain Chime',   icon: <Volume2 size={18} /> },
];

// ── Background scenes ──────────────────────────────────────────────────────────
const BG_SCENES = [
  {
    id: 'midnight',
    name: 'Midnight',
    icon: <Moon size={18} />,
    dark:  { bg: '#06060A', overlay: 'none' },
    light: { bg: '#F5F0E8', overlay: 'none' },
  },
  {
    id: 'himalayan_dawn',
    name: 'Himalayan',
    icon: <Sun size={18} />,
    dark:  { bg: '#0A0614', overlay: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(200,120,50,0.40) 0%, rgba(100,50,140,0.20) 55%, transparent 100%)' },
    light: { bg: '#FFF0E0', overlay: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,180,80,0.55) 0%, rgba(220,140,80,0.25) 55%, transparent 100%)' },
  },
  {
    id: 'temple',
    name: 'Temple',
    icon: <Flame size={18} />,
    dark:  { bg: '#0E0804', overlay: 'radial-gradient(ellipse 70% 80% at 30% 80%, rgba(200,130,40,0.38) 0%, rgba(140,80,20,0.12) 60%, transparent 100%)' },
    light: { bg: '#FDF4E0', overlay: 'radial-gradient(ellipse 70% 80% at 30% 80%, rgba(220,160,60,0.45) 0%, rgba(200,140,60,0.15) 60%, transparent 100%)' },
  },
  {
    id: 'river_ghat',
    name: 'River Ghat',
    icon: <RotateCcw size={18} />,
    dark:  { bg: '#040A12', overlay: 'radial-gradient(ellipse 90% 50% at 50% 90%, rgba(30,100,140,0.38) 0%, rgba(15,60,100,0.15) 60%, transparent 100%)' },
    light: { bg: '#E8F4F8', overlay: 'radial-gradient(ellipse 90% 50% at 50% 90%, rgba(70,140,180,0.45) 0%, rgba(50,110,160,0.18) 60%, transparent 100%)' },
  },
  {
    id: 'forest_ashram',
    name: 'Forest',
    icon: <BarChart2 size={18} />,
    dark:  { bg: '#040C06', overlay: 'radial-gradient(ellipse 80% 70% at 50% 65%, rgba(30,90,40,0.35) 0%, rgba(15,60,25,0.12) 60%, transparent 100%)' },
    light: { bg: '#EAF5EA', overlay: 'radial-gradient(ellipse 80% 70% at 50% 65%, rgba(60,140,70,0.45) 0%, rgba(40,110,55,0.18) 60%, transparent 100%)' },
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    icon: <Sparkles size={18} />,
    dark:  { bg: '#04040E', overlay: 'radial-gradient(ellipse 70% 80% at 50% 20%, rgba(80,60,160,0.42) 0%, rgba(40,30,120,0.18) 55%, transparent 100%)' },
    light: { bg: '#EEE8F8', overlay: 'radial-gradient(ellipse 70% 80% at 50% 20%, rgba(120,100,200,0.45) 0%, rgba(80,60,160,0.18) 55%, transparent 100%)' },
  },
] as const;

type BgSceneId = typeof BG_SCENES[number]['id'];

function LotusParticles({ accentColor }: { accentColor: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 24 }).map((_, i) => {
        const opacity = 0.25 + (i % 6) * 0.06;
        return (
          <motion.div
            key={`lotus-${i}`}
            className="absolute"
            style={{
              left: `${(i * 7.7) % 95}%`,
              top: '-20px',
            }}
            initial={{ y: -20, rotate: 0, opacity: 0 }}
            animate={{
              y: '110vh',
              rotate: [0, 45, -45, 90],
              x: [0, (i % 2 === 0 ? 20 : -20), 0],
              opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{
              duration: 10 + (i % 5) * 2,
              repeat: Infinity,
              delay: i * 0.8,
              ease: 'linear',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: accentColor,
                opacity,
                position: 'absolute',
                top: 0,
                left: 0,
                filter: 'blur(1px)',
              }}
            />
          </motion.div>
        );
      })}
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

function playBeadTapSound() {
  const ctx = _getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(680, t0);
  osc.frequency.exponentialRampToValueAtTime(430, t0 + 0.045);
  filter.type = 'lowpass';
  filter.frequency.value = 1800;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.055, t0 + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.105);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.12);
}

function playIntervalBell() {
  const ctx = _getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  [528, 792, 1056].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08 / (i + 1), t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 1.9);
  });
}

// ── Target rounds ──────────────────────────────────────────────────────────────
const TARGET_OPTIONS = [1, 3, 5, 11] as const;

function buildCustomMantraCard(custom: CustomMantra) {
  return {
    id: CUSTOM_MANTRA_ID,
    name: custom.label || 'Custom mantra',
    devanagari: custom.text,
    tradition: 'Personal',
    description: custom.description || 'Your own private mantra focus',
    full: custom.text,
    tradColor: '#C5A059',
  } as const;
}

// ── SVG Mala ───────────────────────────────────────────────────────────────────
function beadPos(i: number) {
  const angle = ((i / TOTAL_BEADS) * Math.PI * 2) - Math.PI / 2;
  return { x: SVG_CX + RING_R * Math.cos(angle), y: SVG_CY + RING_R * Math.sin(angle) };
}

function SacredGeometry({
  rounds,
  tradition,
  accentColor,
}: {
  rounds: number;
  tradition: string;
  accentColor: string;
}) {
  if (rounds <= 0) return null;

  const opacity = rounds >= 5 ? 0.25 : rounds >= 3 ? 0.2 : 0.15;
  const baseStroke = accentColor;
  const triangle = `M ${SVG_CX} ${SVG_CY - 54} L ${SVG_CX - 48} ${SVG_CY + 30} L ${SVG_CX + 48} ${SVG_CY + 30} Z`;
  const inverseTriangle = `M ${SVG_CX} ${SVG_CY + 54} L ${SVG_CX - 48} ${SVG_CY - 30} L ${SVG_CX + 48} ${SVG_CY - 30} Z`;
  const upperLeft = `M ${SVG_CX - 24} ${SVG_CY - 58} L ${SVG_CX - 62} ${SVG_CY + 6} L ${SVG_CX + 12} ${SVG_CY + 6} Z`;
  const upperRight = `M ${SVG_CX + 24} ${SVG_CY - 58} L ${SVG_CX - 12} ${SVG_CY + 6} L ${SVG_CX + 62} ${SVG_CY + 6} Z`;
  const lowerLeft = `M ${SVG_CX - 24} ${SVG_CY + 58} L ${SVG_CX - 62} ${SVG_CY - 6} L ${SVG_CX + 12} ${SVG_CY - 6} Z`;
  const lowerRight = `M ${SVG_CX + 24} ${SVG_CY + 58} L ${SVG_CX - 12} ${SVG_CY - 6} L ${SVG_CX + 62} ${SVG_CY - 6} Z`;
  const ringOpacity = tradition === 'buddhist' ? opacity + 0.04 : opacity;

  const sharedProps = {
    fill: 'none',
    stroke: baseStroke,
    strokeWidth: 1.4,
    strokeOpacity: opacity,
    style: { transition: 'opacity 1.5s ease-out' },
  } as const;

  return (
    <g aria-hidden="true">
      {rounds >= 1 && <path d={triangle} {...sharedProps} />}
      {rounds >= 2 && (
        <circle
          cx={SVG_CX}
          cy={SVG_CY}
          r={64}
          fill="none"
          stroke={baseStroke}
          strokeWidth={1.2}
          strokeOpacity={ringOpacity}
          style={{ transition: 'opacity 1.5s ease-out' }}
        />
      )}
      {rounds >= 3 && <path d={inverseTriangle} {...sharedProps} />}
      {rounds >= 5 && (
        <>
          <path d={upperLeft} {...sharedProps} />
          <path d={upperRight} {...sharedProps} />
          <path d={lowerLeft} {...sharedProps} />
          <path d={lowerRight} {...sharedProps} />
        </>
      )}
    </g>
  );
}

const MalaSVG = memo(function MalaSVG({
  malaId, beadCount, isDark, pulsing, flashBeadIdx, flashKey, milestoneActive, appLanguage, tradition, isPracticing, accentColor, completedRounds, activeSymbolId,
}: {
  malaId: MalaId; beadCount: number; isDark: boolean; pulsing: boolean;
  flashBeadIdx: number; flashKey: number;
  milestoneActive: number | null;
  appLanguage: string;
  tradition: string;
  isPracticing: boolean;
  accentColor: string;
  completedRounds: number;
  activeSymbolId?: string | null;
}) {
  const { playHaptic } = useZenithSensory();
  const mala = MALAS.find(m => m.id === malaId) ?? MALAS[0];
  const c = isDark ? mala.dark : mala.light;
  const malaSkin = getMalaSkin(activeSymbolId);
  const currentBeadIdx = beadCount % TOTAL_BEADS;
  const roundComplete  = beadCount > 0 && beadCount % TOTAL_BEADS === 0;
  const countDisplay   = roundComplete ? TOTAL_BEADS : currentBeadIdx;
  const milestoneLabel = milestoneActive ? getMilestoneLabel(milestoneActive, appLanguage) : null;
  const sacredSymbol = getTraditionSacredSymbol(tradition);

  // Current bead (next to be tapped)
  const nextBeadIdx = !roundComplete && beadCount > 0 ? currentBeadIdx + 1 : -1;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_W}`}
      style={{ width: '100%', maxWidth: '100%', touchAction: 'manipulation', userSelect: 'none' }}
    >
      <defs>
        <style>
          {`
            @keyframes milestone-burst {
              0% { r: 40px; opacity: 0.9; stroke-width: 3px; }
              100% { r: 90px; opacity: 0; stroke-width: 0.5px; }
            }
            @keyframes breath-halo {
              0%, 100% { r: 168px; opacity: 0.12; }
              50% { r: 176px; opacity: 0.28; }
            }
            @keyframes milestone-text-fade {
              0% { opacity: 0; transform: translateY(6px); }
              18% { opacity: 1; transform: translateY(0); }
              82% { opacity: 1; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-4px); }
            }
            @keyframes current-pulse {
              0% { opacity: 0.8; r: ${BEAD_R + 3}px; }
              100% { opacity: 0; r: ${BEAD_R + 8}px; }
            }
          `}
        </style>
        {/* ── Uncounted bead — 3-stop 3D gradient ── */}
        <radialGradient id={`bead-un-${malaId}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor={malaSkin.beadColor} stopOpacity="1" />
          <stop offset="55%"  stopColor={malaSkin.beadColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor="#888888" stopOpacity="0.15" />
        </radialGradient>
        {/* ── Counted bead — warm gold glow ── */}
        <radialGradient id={`bead-done-${malaId}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor={malaSkin.glowColor} stopOpacity="1" />
          <stop offset="50%"  stopColor={malaSkin.beadColor} stopOpacity="0.95" />
          <stop offset="100%" stopColor={malaSkin.beadColor} stopOpacity="0.75" />
        </radialGradient>
        {/* ── Sumeru bead ── */}
        <radialGradient id={`sumeru-${malaId}`} cx="35%" cy="28%" r="65%">
          <stop offset="0%"   stopColor={malaSkin.glowColor} stopOpacity="1" />
          <stop offset="100%" stopColor={malaSkin.beadColor} stopOpacity="0.88" />
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
        <filter id="bead-done-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={malaSkin.glowColor} floodOpacity="0.70" />
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
          <stop offset="0%"   stopColor={malaSkin.glowColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={malaSkin.glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Thread */}
      {isPracticing && (
        <circle
          cx={SVG_CX}
          cy={SVG_CY}
          r={RING_R}
          fill="none"
          stroke={malaSkin.glowColor}
          style={{ opacity: 0.35, animation: 'breath-halo 4s ease-in-out infinite' }}
        />
      )}
      <circle
        cx={SVG_CX}
        cy={SVG_CY}
        r={RING_R}
        fill="none"
        stroke={malaSkin.glowColor}
        strokeWidth="2.2"
        style={{ opacity: isPracticing ? 0.35 : 0.18, transition: 'fill 0.5s ease, stroke 0.5s ease, opacity 0.5s ease' }}
      />
      {/* Center ambient glow */}
      <circle cx={SVG_CX} cy={SVG_CY} r={RING_R - 22} fill={`url(#center-glow-${malaId})`} />
      <SacredGeometry rounds={completedRounds} tradition={tradition} accentColor={accentColor} />

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
            {/* Current bead pulse ring */}
            {isCurrent && (
              <circle
                cx={pos.x} cy={pos.y}
                fill="none" stroke={malaSkin.glowColor} strokeWidth="1.5"
                style={{ animation: 'current-pulse 1.2s infinite' }}
              />
            )}
            {/* Shadow */}
            <circle cx={pos.x + 1.2} cy={pos.y + 1.8} r={r * 0.92} fill="black" opacity="0.38" />
            {/* Main bead */}
            <circle
              cx={pos.x} cy={pos.y} r={r}
              fill={fill}
              filter={isCurrent ? 'url(#bead-glow)' : isDone ? 'url(#bead-done-glow)' : 'url(#bead-shadow)'}
              stroke={
                isCurrent ? malaSkin.glowColor : malaSkin.beadBorder
              }
              strokeWidth={isCurrent ? 1.8 : isDone ? 0.9 : 0.5}
              style={{ transition: 'fill 0.5s ease, stroke 0.5s ease' }}
            />
            {/* Crystal inner glow */}
            {malaId === 'crystal' && (
              <circle cx={pos.x} cy={pos.y} r={r * 0.75} fill="url(#crystal-inner)" />
            )}
            {/* Specular highlight */}
            <circle
              cx={pos.x - r * 0.22} cy={pos.y - r * 0.26}
              r={r * (isSumeru ? 0.40 : 0.38)}
              fill={isSumeru ? 'rgba(255,255,255,0.55)' : `url(#spec-${malaId})`}
            />
            {isSumeru && (
              <>
                <circle
                  cx={pos.x - 4}
                  cy={pos.y - 4}
                  r={3.5}
                  fill="white"
                  opacity={0.55}
                />
                <text
                  x={pos.x}
                  y={pos.y + 3.5}
                  textAnchor="middle"
                  fontSize={11}
                  fontFamily="var(--font-devanagari), var(--font-serif), system-ui"
                  fill={isDark ? 'rgba(255,245,232,0.9)' : 'rgba(45,31,14,0.82)'}
                >
                  {sacredSymbol}
                </text>
              </>
            )}
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
              fill={malaSkin.glowColor}
              animate={{ r: [BEAD_R * 1.15, BEAD_R * 1.35, BEAD_R * 1.15], opacity: [0.35, 0.10, 0.35] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Outer guide ring */}
            <motion.circle
              cx={pos.x} cy={pos.y}
              fill="none"
              stroke={malaSkin.glowColor}
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
              fill={malaSkin.glowColor}
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
              stroke={malaSkin.glowColor}
              strokeWidth={2.5}
              initial={{ r: BEAD_R * 1.2, opacity: 0.80 }}
              animate={{ r: BEAD_R * 4.5, opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            />
          </>
        );
      })()}

      {/* Counter */}
      {milestoneActive ? (
        <>
          <circle
            cx={SVG_CX}
            cy={SVG_CY}
            r={40}
            fill="none"
            stroke={accentColor}
            style={{ animation: 'milestone-burst 2.2s ease-out forwards' }}
          />
          <text
            x={SVG_CX}
            y={SVG_CY + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={30}
            fontWeight="700"
            fontFamily="var(--font-devanagari), var(--font-serif), system-ui"
            fill={isDark ? 'rgba(245,225,185,0.98)' : '#2D1F0E'}
            style={{ animation: 'milestone-text-fade 2.2s ease-out forwards' }}
          >
            {milestoneLabel}
          </text>
        </>
      ) : (
        <>
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
            fill={isDark ? 'rgba(197, 160, 89,0.65)' : 'rgba(100,65,25,0.65)'}
            letterSpacing="1"
          >
            / 108
          </text>
        </>
      )}

      {beadCount === 0 && (
        <text
          x={SVG_CX} y={SVG_CY + 54}
          textAnchor="middle" fontSize={11}
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={isDark ? 'rgba(197, 160, 89,0.40)' : 'rgba(100,65,25,0.40)'}
        >
          tap anywhere to begin
        </text>
      )}
    </svg>
  );
});

function MantraStream({
  mantra,
  isDark,
}: {
  mantra: string;
  isDark: boolean;
}) {
  const words = mantra
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 10);
  const streamWords = words.length > 0 ? words : [mantra];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 7 }).map((_, index) => {
        const isLeading = index < 2;
        const opacityPeak = isLeading ? 0.72 - index * 0.08 : 0.35 - ((index - 2) % 3) * 0.05;
        const opacityMid = isLeading ? 0.38 : Math.max(0.2, opacityPeak - 0.07);
        const fontSize = isLeading ? `${16 - index}px` : `${14 + (index % 2)}px`;

        return (
          <motion.div
            key={`mantra-stream-${index}`}
            className="absolute left-1/2 whitespace-nowrap"
            style={{
              bottom: '-8%',
              x: '-50%',
              fontFamily: 'var(--font-devanagari), var(--font-serif)',
              fontSize,
              letterSpacing: '0.05em',
              color: isDark
                ? `rgba(245,210,150,${opacityMid})`
                : `rgba(122,74,30,${opacityMid})`,
              filter: 'blur(0.4px)',
            }}
            animate={{
              y: ['0%', '-118%'],
              opacity: [0, opacityPeak, opacityMid, 0],
              scale: [0.98, 1.01, 1.04],
            }}
            transition={{
              duration: 8.4 + index * 0.7,
              repeat: Infinity,
              ease: 'linear',
              delay: index * 1.1,
            }}
          >
            {streamWords[index % streamWords.length]}
          </motion.div>
        );
      })}
    </div>
  );
}

function TapBloom({
  particles,
  isDark,
}: {
  particles: { id: number }[];
  isDark: boolean;
}) {
  const color = isDark ? 'rgba(245,210,150,0.75)' : 'rgba(122,74,30,0.55)';
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle, index) => (
          <motion.div
            key={particle.id}
            className="absolute left-1/2 top-1/2"
            initial={{ opacity: 0.9, scale: 0.4, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              scale: 1.8,
              x: (index % 2 === 0 ? 1 : -1) * (28 + (index % 3) * 10),
              y: -(20 + (index % 4) * 12),
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="rounded-full blur-[1px]"
              style={{
                width: 10 + (index % 3) * 4,
                height: 10 + (index % 3) * 4,
                background: color,
                boxShadow: `0 0 28px ${color}`,
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Screen 0: Ritual launcher ─────────────────────────────────────────────────
function PracticeLauncherScreen({
  isDark, traditionLabel, currentMala, currentMantra, targetRounds, streak, lifetimeData, accentColor, onTargetChange, onStart, onCustomize, onBack, japaAlreadyDoneToday,
}: {
  isDark: boolean;
  traditionLabel: string;
  currentMala: typeof MALAS[number];
  currentMantra: MantraOption;
  targetRounds: number;
  streak: number;
  lifetimeData: JapaLifetimeData;
  accentColor: string;
  onTargetChange: (rounds: number) => void;
  onStart: () => void;
  onCustomize: () => void;
  onBack: () => void;
  japaAlreadyDoneToday?: boolean;
}) {
  const bg = isDark ? '#06060A' : '#F7F0E6';
  const card = isDark ? 'rgba(28,25,20,0.84)' : 'rgba(255,253,249,0.88)';
  const text = isDark ? 'rgba(245,232,210,0.96)' : '#2D1F0E';
  const sub = isDark ? 'rgba(205,178,130,0.68)' : 'rgba(96,66,34,0.66)';
  const amber = accentColor;
  const borderColor = isDark ? 'rgba(197, 160, 89,0.18)' : 'rgba(0,0,0,0.08)';

  return (
    <motion.div
      key="launcher"
      className="min-h-[100dvh] -mx-3 -mt-2 px-5 pb-28 pt-12 overflow-hidden"
      style={{ background: bg }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="relative mx-auto flex min-h-[calc(100dvh-5rem)] max-w-xl flex-col">
        {japaAlreadyDoneToday && (
          <div className="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="text-[#160F08] px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 shadow-[0_4px_24px_rgba(197,160,89,0.4)]" 
                 style={{ 
                   background: 'linear-gradient(90deg, #C5A059 0%, #E8D09A 50%, #C5A059 100%)',
                   backgroundSize: '200% auto',
                   animation: 'shimmer 2.5s linear infinite' 
                 }}>
              Japa complete for today 🙏
            </div>
            <style>{`
              @keyframes shimmer {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
              }
            `}</style>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 top-10 h-64 w-64 rounded-full" style={{ background: `${amber}10` }} />
          <div className="absolute -left-20 bottom-10 h-52 w-52 rounded-full border" style={{ borderColor: `${amber}18` }} />
        </div>

        <div className="relative flex items-center justify-between">
          <button onClick={onBack} className="h-11 w-11 rounded-full border flex items-center justify-center" style={{ borderColor: `${amber}22`, background: card }} aria-label="Go back">
            <ChevronLeft size={18} style={{ color: amber }} />
          </button>
          <Link href="/bhakti/mala/insights" className="rounded-full border px-3 py-2 text-[12px] font-medium" style={{ borderColor: `${amber}22`, color: sub, background: card }}>
            Insights
          </Link>
        </div>

        <div className="relative flex flex-1 flex-col justify-center gap-5 py-6">
          {/* ── Screen heading ── */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.26em] uppercase mb-1" style={{ color: `${amber}80` }}>
              Japa Mala · {traditionLabel}
            </p>
            <h1 className="text-[2.2rem] leading-none" style={{ color: text, fontFamily: 'var(--font-serif)', fontWeight: 300 }}>
              Choose your practice
            </h1>
          </div>

          {/* ── Mantra hero card ── */}
          <div className="relative rounded-[1.75rem] border overflow-hidden" style={{ background: card, borderColor: `${amber}1c`, backdropFilter: 'blur(18px)' }}>
            {/* ambient glow */}
            <div className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 rounded-full blur-2xl" style={{ background: `${amber}18` }} />
            <div className="p-5">
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-3" style={{ color: `${amber}70` }}>Selected mantra</p>
              {/* Large Devanagari hero */}
              <p className="text-[2.4rem] leading-[1.15] mb-2" style={{ color: amber, fontFamily: 'var(--font-devanagari), var(--font-serif)', fontWeight: 300 }}>{currentMantra.devanagari}</p>
              <p className="text-[15px] font-medium leading-snug mb-1" style={{ color: text, fontFamily: 'var(--font-serif)' }}>{currentMantra.name}</p>
              <p className="text-[12px] leading-5" style={{ color: sub }}>{currentMantra.description}</p>
              {/* Thin divider */}
              <div className="mt-4 mb-3 h-px" style={{ background: `${amber}14` }} />
              {/* Meta row */}
              <div className="flex gap-2">
                {[
                  { label: 'Mala', value: currentMala.name },
                  { label: 'Target', value: `${targetRounds} × 108` },
                  { label: 'Streak', value: streak > 0 ? `${streak} days` : 'Start' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex-1 rounded-xl border px-2.5 py-2" style={{ borderColor: `${amber}15`, background: `${amber}07` }}>
                    <p className="text-[9.5px] uppercase tracking-[0.14em] mb-0.5" style={{ color: sub }}>{label}</p>
                    <p className="text-[12px] font-semibold truncate" style={{ color: text }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Target rounds ── */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: sub }}>Target rounds</p>
            <div className="flex gap-2">
              {TARGET_OPTIONS.map(rounds => (
                <button
                  key={rounds}
                  onClick={() => onTargetChange(rounds)}
                  className="flex-1 h-10 rounded-full border text-[13px] font-semibold transition-all active:scale-95"
                  style={{
                    background: targetRounds === rounds ? amber : card,
                    borderColor: targetRounds === rounds ? amber : `${amber}20`,
                    color: targetRounds === rounds ? (isDark ? '#160F08' : '#fffaf2') : sub,
                  }}
                >
                  {rounds}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative space-y-2.5 pb-3">
          {/* Lifetime stats */}
          {lifetimeData.totalBeads > 0 && (
            <div className="flex items-center justify-center gap-6 pb-1">
              <div className="text-center">
                <div className="text-[17px] font-bold" style={{ color: amber, fontFamily: 'var(--font-serif)' }}>{lifetimeData.totalBeads.toLocaleString()}</div>
                <div className="text-[10px] uppercase tracking-[0.14em]" style={{ color: sub }}>Beads</div>
              </div>
              <div className="h-6 w-px" style={{ background: `${amber}22` }} />
              <div className="text-center">
                <div className="text-[17px] font-bold" style={{ color: amber, fontFamily: 'var(--font-serif)' }}>{lifetimeData.totalRounds}</div>
                <div className="text-[10px] uppercase tracking-[0.14em]" style={{ color: sub }}>Rounds</div>
              </div>
            </div>
          )}
          <button
            onClick={onStart}
            className="w-full rounded-full py-4 text-[15px] font-semibold transition-transform active:scale-[0.98]"
            style={{ background: amber, color: isDark ? '#160F08' : '#fffaf2', boxShadow: `0 8px 24px ${amber}38`, letterSpacing: '0.02em' }}
          >
            Begin Japa
          </button>
          <button onClick={onCustomize} className="w-full rounded-full border py-3.5 text-[13px] font-medium" style={{ borderColor: `${amber}22`, color: sub, background: 'transparent' }}>
            Change mala, mantra or background
          </button>
        </div>
      </div>
    </motion.div>
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
  const sub   = isDark ? 'rgba(197, 160, 89,0.60)' : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C5A059' : '#7A4A1E';

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
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border"
          style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: `${amber}22` }}
         aria-label="Go back">
          <ChevronLeft size={18} style={{ color: amber }} />
        </button>
        <div>
          <p className="text-[10px] font-bold tracking-[0.24em] uppercase" style={{ color: `${amber}70` }}>Japa Mala</p>
          <h1 className="text-[1.9rem] leading-tight" style={{ color: text, fontFamily: 'var(--font-serif)', fontWeight: 300 }}>
            Choose your mala
          </h1>
        </div>
      </div>
      <p className="px-6 pb-4 text-[12px]" style={{ color: sub }}>The sacred beads carry the energy of your tradition</p>

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
                background: isSelected ? (isDark ? 'rgba(197, 160, 89,0.10)' : 'rgba(122,74,30,0.08)') : card,
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
                  <span className="text-2xl relative z-10">{scene.icon}</span>
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
          className="w-full py-4 rounded-full font-semibold text-[15px]"
          style={{
            background: amber,
            color: isDark ? '#160F08' : '#fffaf2',
            boxShadow: `0 8px 24px ${amber}38`,
            letterSpacing: '0.02em',
          }}
        >
          Choose mantra →
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Screen 2: Choose Mantra ───────────────────────────────────────────────────
function ChooseMantraScreen({
  isDark, selected, mantras, onSelect, onBack, onConfirm, customMantra, onOpenCustom, targetRounds, onTargetChange
}: {
  isDark: boolean; selected: SelectedMantraId;
  mantras: readonly MantraOption[];
  onSelect: (id: SelectedMantraId) => void; onBack: () => void; onConfirm: () => void;
  customMantra: CustomMantra | null; onOpenCustom: () => void;
  targetRounds: number; onTargetChange: (n: number) => void;
}) {
  const bg    = isDark ? '#08070A' : '#F5F0E8';
  const card  = isDark ? 'var(--card-bg)' : 'rgba(0,0,0,0.04)';
  const text  = isDark ? 'rgba(245,225,185,0.95)' : '#2D1F0E';
  const sub   = isDark ? 'rgba(197, 160, 89,0.60)' : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C5A059' : '#7A4A1E';

  const isPersonalSelected = selected === CUSTOM_MANTRA_ID;
  // Derive confirm button label
  const confirmLabel = isPersonalSelected && !customMantra
    ? 'Add Your Mantra →'
    : 'Begin Practice →';

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
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border"
          style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: `${amber}22` }}
         aria-label="Go back">
          <ChevronLeft size={18} style={{ color: amber }} />
        </button>
        <div>
          <p className="text-[10px] font-bold tracking-[0.24em] uppercase" style={{ color: `${amber}70` }}>Japa Mala</p>
          <h1 className="text-[1.9rem] leading-tight" style={{ color: text, fontFamily: 'var(--font-serif)', fontWeight: 300 }}>Choose your mantra</h1>
        </div>
      </div>

      {/* ── Personal mantra card ─────────────────────────────────────────── */}
      <div className="px-5 pb-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={() => {
            if (customMantra) {
              // Has a saved mantra → tap selects it
              onSelect(CUSTOM_MANTRA_ID);
            } else {
              // No mantra yet → open the add sheet
              onOpenCustom();
            }
          }}
          className="w-full rounded-2xl border p-4 text-left transition-all"
          style={{
            background: isPersonalSelected
              ? (isDark ? 'rgba(197,160,89,0.12)' : 'rgba(122,74,30,0.09)')
              : (isDark ? 'rgba(197,160,89,0.07)' : 'rgba(122,74,30,0.05)'),
            borderColor: isPersonalSelected ? `${amber}55` : `${amber}28`,
            boxShadow: isPersonalSelected ? `0 0 0 1.5px ${amber}38` : 'none',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: amber }}>
                {customMantra ? 'Personal mantra' : 'Add personal mantra'}
              </p>
              <p className="mt-1 text-sm font-semibold truncate" style={{ color: text }}>
                {customMantra?.label || 'Use your own mantra in mala practice'}
              </p>
              <p className="mt-0.5 text-[11px] leading-5 truncate" style={{ color: sub }}>
                {customMantra?.text || 'Tap to add a name and mantra text'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isPersonalSelected && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: amber }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
              {customMantra && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenCustom(); }}
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                  style={{ background: `${amber}18`, color: amber }}
                >
                  Edit
                </button>
              )}
              {!customMantra && (
                <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: `${amber}18`, color: amber }}>
                  Personal
                </span>
              )}
            </div>
          </div>
        </motion.button>
      </div>

      {/* Mantra list — preset mantras only (no custom card duplication) */}
      <div className="flex-1 px-5 space-y-3 overflow-y-auto pb-6">
        {mantras.map(m => {
          // When personal is selected, deselect all preset mantras visually
          const isSelected = !isPersonalSelected && selected === m.id;
          return (
            <motion.button
              key={m.id}
              onClick={() => onSelect(m.id as MantraId)}
              whileTap={{ scale: 0.975 }}
              className="w-full text-left rounded-2xl p-4 border transition-all"
              style={{
                background: isSelected ? (isDark ? 'rgba(197, 160, 89,0.09)' : 'rgba(122,74,30,0.07)') : card,
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
        <div className="text-center pt-2 pb-1">
          <Link href="/mantras" className="text-[11px] font-semibold transition-opacity hover:opacity-100 inline-block" style={{ color: amber, opacity: 0.7 }}>
            Browse all mantras →
          </Link>
        </div>
      </div>

      {/* Target Rounds Picker */}
      <div className="px-5 pb-4 pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-3 pl-1" style={{ color: sub }}>
          Target rounds
        </p>
        <div className="flex items-center justify-between gap-2">
          {[1, 3, 5, 11, 21].map(n => (
            <button
              key={n}
              onClick={() => onTargetChange(n)}
              className="flex-1 py-2 rounded-xl text-[13px] font-bold transition-all border"
              style={{
                background: targetRounds === n ? (isDark ? 'rgba(197, 160, 89, 0.15)' : 'rgba(197, 160, 89, 0.12)') : card,
                borderColor: targetRounds === n ? `${amber}60` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                color: targetRounds === n ? amber : text,
                boxShadow: targetRounds === n ? `0 0 0 1.5px ${amber}30` : 'none',
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[10px] mt-2 text-center" style={{ color: sub }}>
          {targetRounds} mala{targetRounds > 1 ? 's' : ''} = {targetRounds * 108} beads
        </p>
      </div>

      {/* Confirm */}
      <div className="px-5 pb-16 pt-2">
        <motion.button
          onClick={isPersonalSelected && !customMantra ? onOpenCustom : onConfirm}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-bold text-[15px]"
          style={{
            background: isDark ? 'linear-gradient(135deg, #C5A059, #8a5818)' : 'linear-gradient(135deg, #8B5E3C, #5a3010)',
            color: isDark ? '#fde8c8' : '#fff8f0',
            boxShadow: '0 4px 24px rgba(197, 160, 89,0.25)',
          }}
        >
          {confirmLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}

function CustomMantraSheet({
  isDark,
  initialValue,
  saving = false,
  onSave,
  onClose,
}: {
  isDark: boolean;
  initialValue: CustomMantra | null;
  saving?: boolean;
  onSave: (value: CustomMantra) => void | Promise<void>;
  onClose: () => void;
}) {
  const bg = isDark ? 'rgba(10,8,14,0.98)' : 'rgba(248,244,236,0.98)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const border = isDark ? 'rgba(197, 160, 89,0.14)' : 'rgba(0,0,0,0.07)';
  const text = isDark ? 'rgba(245,225,185,0.95)' : '#2D1F0E';
  const sub = isDark ? 'rgba(197, 160, 89,0.60)' : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C5A059' : '#7A4A1E';
  const [label, setLabel] = useState(initialValue?.label ?? '');
  const [mantraText, setMantraText] = useState(initialValue?.text ?? '');
  const [description, setDescription] = useState(initialValue?.description ?? '');
  const valid = mantraText.trim().length >= 2;

  return (
    <motion.div
      className="fixed inset-0 flex items-end"
      style={{ zIndex: 130, background: 'rgba(0,0,0,0.62)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl mx-auto rounded-t-3xl px-5 pt-3 pb-8"
        style={{ background: bg, backdropFilter: 'blur(28px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: `${amber}30` }} />
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${amber}80` }}>Personal mantra</p>
            <h2 className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-serif)', color: text }}>Add your own chant</h2>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: sub }}>
              This stays private to your device for now and can be used with the same immersive mala flow.
            </p>
          </div>
          <button onClick={onClose} className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: cardBg }}>
            <X size={15} style={{ color: sub }} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border p-3" style={{ background: cardBg, borderColor: border }}>
            <p className="text-[11px] font-semibold mb-2" style={{ color: sub }}>Label</p>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Example: Guru mantra" className="w-full bg-transparent outline-none text-sm" style={{ color: text }} />
          </div>
          <div className="rounded-2xl border p-3" style={{ background: cardBg, borderColor: border }}>
            <p className="text-[11px] font-semibold mb-2" style={{ color: sub }}>Mantra text</p>
            <textarea
              value={mantraText}
              onChange={(e) => setMantraText(e.target.value)}
              placeholder="Paste the mantra exactly as you want it shown during practice"
              rows={4}
              className="w-full resize-none bg-transparent outline-none text-sm leading-6"
              style={{ color: text, fontFamily: 'var(--font-devanagari), var(--font-serif)' }}
            />
          </div>
          <div className="rounded-2xl border p-3" style={{ background: cardBg, borderColor: border }}>
            <p className="text-[11px] font-semibold mb-2" style={{ color: sub }}>Description</p>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional meaning or reminder" className="w-full bg-transparent outline-none text-sm" style={{ color: text }} />
          </div>
        </div>

        <button
          type="button"
          disabled={!valid || saving}
          onClick={() => onSave({
            label: label.trim() || 'Custom mantra',
            text: mantraText.trim(),
            description: description.trim() || 'Personal mantra focus',
          })}
          className="mt-5 w-full rounded-2xl py-4 text-[15px] font-bold disabled:opacity-50"
          style={{ background: amber, color: isDark ? '#160F08' : '#fffaf2' }}
        >
          {saving ? 'Saving...' : 'Save mantra'}
        </button>
      </motion.div>
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
  const sub  = isDark ? 'rgba(197, 160, 89,0.60)' : 'rgba(100,65,25,0.60)';

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
          style={{ background: isDark ? 'rgba(197, 160, 89,0.25)' : 'rgba(100,65,25,0.20)' }} />
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: sub }}>Ambience</p>
            <h2 className="text-[1.3rem] font-bold" style={{ color: text, fontFamily: 'var(--font-serif)' }}>Sacred Sounds</h2>
          </div>
          <button onClick={onClose} className="w-11 h-11 rounded-full flex items-center justify-center"
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
                    ? (isDark ? 'rgba(197, 160, 89,0.14)' : 'rgba(122,74,30,0.10)')
                    : (isDark ? 'var(--card-bg)' : 'rgba(0,0,0,0.04)'),
                  borderColor: isActive
                    ? (isDark ? 'rgba(197, 160, 89,0.40)' : 'rgba(122,74,30,0.35)')
                    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                }}>
                <span className="text-[1.6rem] leading-none">{s.icon}</span>
                <span className="text-[9px] font-semibold text-center"
                  style={{ color: isActive ? (isDark ? '#C5A059' : '#7A4A1E') : sub }}>
                  {s.label}
                </span>
                {isActive && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: isDark ? '#C5A059' : '#7A4A1E' }}
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

// ── Completion Ceremony ───────────────────────────────────────────────────────
const CEREMONY_SUBTITLES: Record<string, string> = {
  hindu: 'माला पूर्ण हुई',
  sikh: 'Simran Complete',
  buddhist: 'Meditation Complete',
  jain: 'Japa Complete',
};
const CEREMONY_SYMBOLS: Record<string, string> = {
  hindu: 'ॐ', sikh: 'ੴ', buddhist: '☸', jain: '☮',
};

function JapaCompletionCeremony({
  tradition,
  rounds,
  totalBeads,
  mantraName,
  totalTimeSeconds,
  isDark,
  accentColor,
  insight,
  insightLoading,
  onContinue,
  onDone,
  onShare,
}: {
  tradition: string;
  rounds: number;
  totalBeads: number;
  mantraName: string;
  totalTimeSeconds: number;
  isDark: boolean;
  accentColor: string;
  insight: string | null;
  insightLoading: boolean;
  onContinue: () => void;
  onDone: () => void;
  onShare: () => void;
}) {
  const [showConfetti, setShowConfetti] = useState(true);
  const mins = Math.floor(totalTimeSeconds / 60);
  const secs = totalTimeSeconds % 60;

  // Stays within the app's established palette — no jarring gradient overrides
  const bg      = isDark ? 'rgba(6,4,10,0.97)'         : 'rgba(248,244,234,0.97)';
  const cardBg  = isDark ? 'rgba(255,255,255,0.05)'     : 'rgba(0,0,0,0.04)';
  const border  = isDark ? 'rgba(197,160,89,0.18)'      : 'rgba(197,160,89,0.22)';
  const text    = isDark ? 'rgba(245,232,210,0.97)'     : '#2D1F0E';
  const sub     = isDark ? 'rgba(205,178,130,0.65)'     : 'rgba(96,66,34,0.60)';

  const centerSymbol = CEREMONY_SYMBOLS[tradition] ?? 'ॐ';
  const subtitle     = CEREMONY_SUBTITLES[tradition]  ?? 'Practice Complete';

  return (
    <motion.div
      className="fixed inset-0 z-[2200] flex flex-col items-center justify-center px-6 py-10 overflow-y-auto"
      style={{ background: bg, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />
      {/* Golden ripple burst */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`golden-ripple-${i}`}
            className="absolute rounded-full border border-[color:var(--accent-color)]"
            style={{ '--accent-color': accentColor } as any}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ delay: i * 0.15, duration: 1.2, ease: "easeOut" }}
          />
        ))}
      </div>
      <style>{`
        @keyframes ceremony-ring-expand {
          0% { transform: scale(0.82); opacity: 0.65; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes dharma-wheel-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Ambient accent glow behind symbol */}
      <div
        className="pointer-events-none absolute rounded-full blur-[80px]"
        style={{
          width: 260, height: 260,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -72%)',
          background: `${accentColor}22`,
        }}
      />

      <div className="relative flex flex-col items-center justify-center text-center w-full max-w-md">
        {/* Lotus petals for Hindu */}
        {tradition === 'hindu' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const x = Math.cos(angle) * 88;
              const y = Math.sin(angle) * 88;
              return (
                <motion.svg
                  key={`lotus-petal-${i}`}
                  width="24" height="38" viewBox="0 0 28 44"
                  className="absolute"
                  style={{ transform: `translate(${x}px, ${y}px) rotate(${(angle * 180) / Math.PI + 90}deg)` }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.45, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.07, duration: 0.5 }}
                >
                  <path d="M14 2 C24 10 24 28 14 42 C4 28 4 10 14 2 Z"
                    fill={`${accentColor}30`} stroke={`${accentColor}55`} strokeWidth="1" />
                </motion.svg>
              );
            })}
          </div>
        )}

        {/* Expanding rings for Buddhist */}
        {tradition === 'buddhist' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0, 1, 2].map((ring) => (
              <div
                key={`ring-${ring}`}
                className="absolute rounded-full border"
                style={{
                  width: 110 + ring * 44, height: 110 + ring * 44,
                  borderColor: `${accentColor}44`,
                  animation: `ceremony-ring-expand ${2.8 + ring * 0.4}s ease-out ${ring * 0.22}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        {/* Central symbol */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: 'var(--font-devanagari), var(--font-serif), system-ui',
            fontSize: '5.5rem',
            lineHeight: 1,
            color: accentColor,
            position: 'relative',
            zIndex: 1,
            filter: `drop-shadow(0 0 24px ${accentColor}55)`,
            animation: tradition === 'buddhist' ? 'dharma-wheel-rotate 10s linear infinite' : undefined,
          }}
        >
          {centerSymbol}
        </motion.div>

        <motion.div
          className="mt-4 relative z-10"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {tradition === 'sikh' && (
            <p className="text-[1.2rem] font-semibold mb-1"
              style={{ color: accentColor, fontFamily: 'var(--font-devanagari), var(--font-serif)' }}>
              ਵਾਹਿਗੁਰੂ
            </p>
          )}
          <p className="text-[1.75rem] font-semibold" style={{ color: text, fontFamily: 'var(--font-serif)' }}>
            {subtitle}
          </p>
        </motion.div>
      </div>

      {/* Stats card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="mt-8 w-full max-w-md rounded-[1.75rem] border px-5 py-5"
        style={{ background: cardBg, borderColor: border, backdropFilter: 'blur(20px)' }}
      >
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {[
            { label: 'Rounds', value: `${rounds}` },
            { label: 'Total beads', value: `${totalBeads.toLocaleString('en-IN')}` },
            { label: 'Duration', value: `${mins}m ${secs < 10 ? '0' : ''}${secs}s` },
            { label: 'Mantra', value: mantraName },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl px-3.5 py-3" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
              <p className="text-[9px] uppercase tracking-[0.16em]" style={{ color: sub }}>{stat.label}</p>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug truncate" style={{ color: text }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Dharma Mitra insight */}
        <div
          className="rounded-2xl px-4 py-3 mt-1"
          style={{ background: `${accentColor}0d`, border: `1px solid ${accentColor}22` }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: accentColor }}>
            Dharma Mitra
          </p>
          {insightLoading ? (
            <div className="flex items-center gap-2">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: accentColor }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <p className="text-[12px]" style={{ color: sub }}>Receiving insight…</p>
            </div>
          ) : insight ? (
            <p className="text-[12px] leading-relaxed" style={{ color: text, opacity: 0.88 }}>{insight}</p>
          ) : (
            <p className="text-[12px] leading-relaxed" style={{ color: sub }}>
              {rounds >= 3
                ? `${rounds} malas — a sacred triad. The vibration of ${totalBeads.toLocaleString('en-IN')} names now lives in your breath.`
                : `Each of your ${totalBeads.toLocaleString('en-IN')} beads was a step deeper. The mantra you carried is now woven into this moment.`}
            </p>
          )}
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="mt-6 w-full max-w-md space-y-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.4 }}
      >
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl font-bold text-[15px] transition-transform active:scale-[0.98]"
          style={{ background: accentColor, color: isDark ? '#160F08' : '#fffaf2' }}
        >
          🔄 Another mala
        </button>
        <button
          onClick={onDone}
          className="w-full py-3.5 rounded-2xl font-semibold text-[14px] border transition-transform active:scale-[0.98]"
          style={{ background: cardBg, borderColor: border, color: text }}
        >
          🏠 Done for today
        </button>
        <button
          onClick={onShare}
          className="w-full py-2.5 rounded-full text-[13px] font-semibold"
          style={{ color: accentColor, opacity: 0.85 }}
        >
          🔗 Share this practice
        </button>
      </motion.div>
    </motion.div>
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
  const sub    = isDark ? 'rgba(197, 160, 89,0.60)' : 'rgba(100,65,25,0.60)';
  const amber  = isDark ? '#C5A059' : '#7A4A1E';
  const border = isDark ? 'rgba(197, 160, 89,0.14)' : 'rgba(0,0,0,0.07)';

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
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
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
                background: isDark ? 'linear-gradient(135deg, #C5A059, #8a5818)' : 'linear-gradient(135deg, #8B5E3C, #5a3010)',
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

function PracticeSettingsSheet({
  isDark, targetRounds, onTargetChange, soundId, onSoundSelect, isSilent, onSilentToggle,
  onChangeMala, onClose
}: {
  isDark: boolean;
  targetRounds: number; onTargetChange: (n: number) => void;
  soundId: SoundId; onSoundSelect: (id: SoundId) => void;
  isSilent: boolean; onSilentToggle: (v: boolean) => void;
  onChangeMala: () => void; onClose: () => void;
}) {
  const bg   = isDark ? 'rgba(10,8,14,0.97)' : 'rgba(248,244,236,0.97)';
  const text = isDark ? 'rgba(245,225,185,0.95)' : '#2D1F0E';
  const sub  = isDark ? 'rgba(197, 160, 89,0.60)' : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C5A059' : '#7A4A1E';
  const border = isDark ? 'rgba(197, 160, 89,0.14)' : 'rgba(0,0,0,0.07)';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

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
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: `${amber}30` }} />

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${amber}80` }}>Practice</p>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: text }}>Settings</h2>
          </div>
          <button onClick={onClose} className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke={text} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            </svg>
          </button>
        </div>

        {/* Silent Mode */}
        <div className="px-5 mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-3 px-1" style={{ color: sub }}>
            Sacred Sounds
          </p>
          <div className="flex items-center justify-between p-4 rounded-2xl border"
            style={{ background: cardBg, borderColor: border }}>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: text }}>Silent mode</p>
              <p className="text-[11px] mt-0.5" style={{ color: sub }}>Mute bells and taps. Use haptics only.</p>
            </div>
            <button
              onClick={() => onSilentToggle(!isSilent)}
              className="w-12 h-7 rounded-full p-1 transition-colors relative"
              style={{ background: isSilent ? amber : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }}
            >
              <motion.div
                layout
                className="w-5 h-5 rounded-full bg-white shadow-sm"
                animate={{ x: isSilent ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>

        {/* Target rounds */}
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: sub }}>Rounds target</p>
          <div className="grid grid-cols-5 gap-2">
            {[1, 3, 5, 11, 21].map(n => (
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
                  <span className="text-xl leading-none">{s.icon}</span>
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
          <Settings2 size={15} /> Change Mala &amp; Mantra
        </button>
      </motion.div>
    </motion.div>
  );
}


// ── Main JapaClient ────────────────────────────────────────────────────────────
type Screen = 'launcher' | 'chooseMala' | 'chooseMantra' | 'practice';

interface Props {
  userId: string;
  userName: string;
  tradition: string;
  currentStreak: number;
  japaAlreadyDoneToday: boolean;
  history: { date: string; done: boolean }[];
  activeSymbolId?: string | null;
  initialMantraId?: string;
}

export default function JapaClient({
  userId, tradition, currentStreak, japaAlreadyDoneToday, activeSymbolId = null, initialMantraId,
}: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const { lang: appLanguage } = useLanguage();
  const isDark = resolvedTheme === 'dark';
  const { playHaptic } = useZenithSensory();
  const prefersReducedMotion = useReducedMotion();

  const meta = getTraditionMeta(tradition);
  const malaSkin = getMalaSkin(activeSymbolId);
  const defaultMantraId: MantraId = meta.japaDefaultMantra as MantraId;

  // ── Screen + selection state ─────────────────────────────────────────────
  const [screen,    setScreen]    = useState<Screen>('launcher');
  const [malaId,    setMalaId]    = useState<MalaId>((meta.japaRecommendedMalas[0] ?? 'sandalwood') as MalaId);
  const [mantraId,  setMantraId]  = useState<SelectedMantraId>(defaultMantraId);
  const [customMantra, setCustomMantra] = useState<CustomMantra | null>(null);
  const [showCustomMantraSheet, setShowCustomMantraSheet] = useState(false);
  const [savingCustomMantra, setSavingCustomMantra] = useState(false);
  const [bgSceneId, setBgSceneId] = useState<BgSceneId>('midnight');
  const [targetRounds, setTargetRounds] = useState(1);
  const [hasStoredMantra, setHasStoredMantra] = useState(false);
  const targetRoundsRef = useRef(1);
  useEffect(() => { targetRoundsRef.current = targetRounds; }, [targetRounds]);

  const [isSilent, setIsSilent] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shoonaya-japa-silent');
      if (stored === 'true') setIsSilent(true);
    }
  }, []);

  const handleSilentToggle = useCallback((val: boolean) => {
    setIsSilent(val);
    localStorage.setItem('shoonaya-japa-silent', val ? 'true' : 'false');
  }, []);

  const tapTimesRef = useRef<number[]>([]);

  // ── Auto-hide controls state (immersive mode) ────────────────────────────
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControlsBriefly = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 2200);
  }, []);

  useEffect(() => {
    if (screen === 'practice') {
      showControlsBriefly();
    } else {
      setControlsVisible(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    }
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [screen, showControlsBriefly]); 

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const immersive = screen === 'practice';
    if (immersive) {
      root.dataset.practiceImmersive = 'true';
      document.body.style.overflow = 'hidden';
    } else {
      delete root.dataset.practiceImmersive;
      document.body.style.overflow = '';
    }
    return () => {
      delete root.dataset.practiceImmersive;
      document.body.style.overflow = '';
    };
  }, [screen]);

  // ── Per-bead flash animation state ──────────────────────────────────────
  const [flashBeadIdx, setFlashBeadIdx] = useState(-1);
  const [flashKey,     setFlashKey]     = useState(0);
  const flashTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beadCountRef   = useRef(0);
  const [milestoneActive, setMilestoneActive] = useState<number | null>(null);
  const milestoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [floatParticles, setFloatParticles] = useState<{id: number}[]>([]);
  const floatIdRef = useRef(0);

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    try {
      const savedMala   = localStorage.getItem(STORAGE_MALA)   as MalaId | null;
      const savedMantra = localStorage.getItem(STORAGE_MANTRA) as SelectedMantraId | null;
      const savedCustomMantra = localStorage.getItem(STORAGE_CUSTOM_MANTRA);
      setHasStoredMantra(!!savedMala);
      const savedBg     = localStorage.getItem(STORAGE_BG)     as BgSceneId | null;
      if (savedMala   && MALAS.find(m => m.id === savedMala))         setMalaId(savedMala);
      if (savedCustomMantra) {
        try {
          const parsed = JSON.parse(savedCustomMantra) as CustomMantra;
          if (parsed?.text) setCustomMantra(parsed);
        } catch { /* ok */ }
      }
      if (initialMantraId) {
        setMantraId(initialMantraId as SelectedMantraId);
      } else if (savedMantra === CUSTOM_MANTRA_ID) {
        setMantraId(CUSTOM_MANTRA_ID);
      } else if (savedMantra && MANTRAS.find(m => m.id === savedMantra)) {
        setMantraId(savedMantra);
      }
      if (savedBg     && BG_SCENES.find(s => s.id === savedBg))       setBgSceneId(savedBg);
      const savedLifetime = localStorage.getItem(STORAGE_LIFETIME);
      if (savedLifetime) {
        try {
          const parsed = JSON.parse(savedLifetime) as JapaLifetimeData;
          setLifetimeData({
            totalBeads: parsed.totalBeads ?? 0,
            totalRounds: parsed.totalRounds ?? 0,
            lastPracticed: parsed.lastPracticed ?? null,
          });
        } catch { /* ok */ }
      }
    } catch { /* ok */ }
  // initialMantraId is a URL param set once on mount — intentionally excluded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSyncedCustomMantra() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('user_custom_japa_mantras')
          .select('label, mantra_text, description')
          .eq('user_id', userId)
          .maybeSingle();
        if (cancelled || error || !data?.mantra_text) return;
        const synced: CustomMantra = {
          label: data.label || 'Custom mantra',
          text: data.mantra_text,
          description: data.description || 'Personal mantra focus',
        };
        setCustomMantra(synced);
        try {
          localStorage.setItem(STORAGE_CUSTOM_MANTRA, JSON.stringify(synced));
        } catch { /* ok */ }
      } catch {
        // Keep local fallback.
      }
    }

    loadSyncedCustomMantra();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const [beadCount,    setBeadCount]    = useState(0);
  const [roundsDone,   setRoundsDone]   = useState(0);
  const [totalBeads,   setTotalBeads]   = useState(0);
  const [lifetimeData, setLifetimeData] = useState<JapaLifetimeData>(EMPTY_LIFETIME_DATA);
  const [paused,       setPaused]       = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showStopSheet, setShowStopSheet] = useState(false);
  // ── Dharma Mitra completion insight ──────────────────────────────────────
  const [completionInsight,        setCompletionInsight]        = useState<string | null>(null);
  const [completionInsightLoading, setCompletionInsightLoading] = useState(false);
  const [soundId,      setSoundId]      = useState<SoundId>(() => {
    if (typeof window === 'undefined') return 'silence';
    return (localStorage.getItem(STORAGE_SOUND) as SoundId) || 'silence';
  });
  const [streak,       setStreak]       = useState(currentStreak);
  const [saved,        setSaved]        = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [pulsing,      setPulsing]      = useState(false);

  useEffect(() => { beadCountRef.current = beadCount; }, [beadCount]);

  // ── Fetch Dharma Mitra insight when session completes ────────────────────
  useEffect(() => {
    if (!showComplete) return;
    setCompletionInsight(null);
    setCompletionInsightLoading(true);

    const timeOfDay = getSpiritualTimeWindow(new Date());
    const mins = Math.floor(duration / 60);

    fetch('/api/japa/completion-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tradition,
        mantraName: currentMantra.name,
        rounds: roundsDone,
        totalBeads: roundsDone * TOTAL_BEADS,
        durationMinutes: mins,
        timeOfDay,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then((data: { insight?: string } | null) => {
        if (data?.insight) setCompletionInsight(data.insight);
      })
      .catch(() => { /* keep fallback text */ })
      .finally(() => setCompletionInsightLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showComplete]);

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
  useEffect(() => () => {
    if (milestoneTimerRef.current) clearTimeout(milestoneTimerRef.current);
  }, []);

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
    if (!isSilent) startJapaAmbient(id);
  }

  const triggerMilestonePulse = useCallback((bead: number) => {
    setMilestoneActive(bead);
    if (milestoneTimerRef.current) clearTimeout(milestoneTimerRef.current);
    milestoneTimerRef.current = setTimeout(() => setMilestoneActive(null), 2200);
    if (!isSilent) playIntervalBell();
  }, [isSilent]);

  const updateLifetimeData = useCallback((completedRounds: number) => {
    if (completedRounds <= 0) return;
    setLifetimeData((prev) => {
      const next = {
        totalBeads: prev.totalBeads + completedRounds * TOTAL_BEADS,
        totalRounds: prev.totalRounds + completedRounds,
        lastPracticed: new Date().toISOString(),
      };
      try {
        localStorage.setItem(STORAGE_LIFETIME, JSON.stringify(next));
      } catch { /* ok */ }
      return next;
    });
  }, []);

  const saveCustomMantraSync = useCallback(async (value: CustomMantra) => {
    setSavingCustomMantra(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('user_custom_japa_mantras').upsert({
        user_id: userId,
        label: value.label.trim() || 'Custom mantra',
        mantra_text: value.text.trim(),
        description: value.description.trim() || 'Personal mantra focus',
      });
      if (error) throw error;
      return true;
    } catch {
      return false;
    } finally {
      setSavingCustomMantra(false);
    }
  }, [userId]);

  const countBead = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 11) tapTimesRef.current.shift();

    if (paused || showComplete) return;
    if (!isSilent) playBeadTapSound();
    if (appLanguage !== 'hi') playHaptic('light');

    setPulsing(true);
    setTimeout(() => setPulsing(false), 120);

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
      const milestones = [27, 54, 81];
      if (milestones.includes(next)) {
        triggerMilestonePulse(next);
      }
      if (next >= TOTAL_BEADS) {
        hapticSuccess();
        if (!isSilent) playIntervalBell();
        setRoundsDone(r => {
          const newRounds = r + 1;
          setTotalBeads(t => t + next);
          updateLifetimeData(1);
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
  }, [paused, showComplete, playHaptic, triggerMilestonePulse, updateLifetimeData, isSilent, malaId, appLanguage]);

  const saveSession = useCallback(async (completedRounds: number, partialBeads = 0) => {
    if (saved || savingSession || (completedRounds === 0 && partialBeads === 0)) return false;
    setSavingSession(true);
    try {
      const supabase = createClient();
      const sessionMantraText = mantraId === CUSTOM_MANTRA_ID
        ? (customMantra?.text?.trim() || 'ॐ')
        : (MANTRAS.find((m) => m.id === mantraId)?.full || MANTRAS[0].full);
      const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
      const today = localSpiritualDate(tz, 4);

      const totalBeads = completedRounds * TOTAL_BEADS + partialBeads;
      const completedAt = new Date().toISOString();
      const malaSessionRow = buildMalaSessionInsert({
        userId,
        mantra: sessionMantraText,
        count: totalBeads,
        targetCount: TOTAL_BEADS,
        durationSeconds: duration,
        completedAt,
        date: today,
        malaId,
        backgroundScene: bgSceneId,
        tradition,
        practiceType: getJapaPracticeType(tradition),
        intention: 'daily_practice',
        completionType: completedRounds >= targetRoundsRef.current ? 'target_completed' : 'ended_manually',
        targetRounds: targetRoundsRef.current,
        completedRounds,
        completedBeads: totalBeads,
        ambientId: soundId,
        spiritualTimeWindow: getSpiritualTimeWindow(new Date()),
        spiritualDate: today,
        timezone: tz,
        hapticsEnabled: true,
        sourceRoute: '/bhakti/mala',
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
          tradition: _tradition,
          practice_type: _practiceType,
          intention: _intention,
          completion_type: _completionType,
          target_rounds: _targetRounds,
          completed_rounds: _completedRounds,
          completed_beads: _completedBeads,
          ambient_id: _ambientId,
          mood_before: _moodBefore,
          mood_after: _moodAfter,
          spiritual_time_window: _spiritualTimeWindow,
          spiritual_date: _spiritualDate,
          timezone: _timezone,
          haptics_enabled: _hapticsEnabled,
          source_route: _sourceRoute,
          panchang_context: _panchangContext,
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
      const [{ data: todayRow }, { data: yesterdayRow }, { data: profileRow }, { data: latestPriorRow }] = await Promise.all([
        supabase.from('daily_sadhana').select('streak_count, japa_done').eq('user_id', userId).eq('date', today).maybeSingle(),
        supabase.from('daily_sadhana').select('streak_count, japa_done').eq('user_id', userId).eq('date', yesterday).maybeSingle(),
        supabase.from('profiles').select('streak_freeze_count, last_freeze_used').eq('id', userId).maybeSingle(),
        supabase.from('daily_sadhana').select('date, streak_count').eq('user_id', userId).lt('date', today).not('streak_count', 'is', null).order('date', { ascending: false }).limit(1).maybeSingle(),
      ]);
      const freezeBridgesYesterday = profileRow?.last_freeze_used === today && !yesterdayRow?.japa_done;
      const carriedStreak = yesterdayRow?.japa_done
        ? (yesterdayRow.streak_count ?? 0)
        : (freezeBridgesYesterday ? (yesterdayRow?.streak_count ?? latestPriorRow?.streak_count ?? 0) : 0);
      const newStreak = todayRow?.streak_count
        ? todayRow.streak_count
        : (carriedStreak > 0 ? carriedStreak + 1 : 1);
      await supabase.from('daily_sadhana').upsert({
        user_id: userId, date: today, japa_done: true, streak_count: newStreak,
      }, { onConflict: 'user_id,date' });

      if (!todayRow?.streak_count && newStreak > 0 && newStreak % 7 === 0 && (profileRow?.streak_freeze_count ?? 0) < 3) {
        const { data: freezeCount, error: freezeError } = await supabase.rpc('increment_streak_freeze', {
          p_user_id: userId,
          p_amount: 1,
        });
        if (!freezeError && typeof freezeCount === 'number') {
          toast.success(`🧊 Streak Freeze earned! (${freezeCount}/3)`);
        }
      }

      try {
        localStorage.setItem('shoonaya-japa-session-today', JSON.stringify({
          date: today, beads: totalBeads, rounds: completedRounds,
        }));
      } catch { /* ok */ }

      if (completedRounds > 0) {
        const sevaGain  = completedRounds * 10;
        const karmaGain = completedRounds * 5;

        try {
          const { error: sevaRpcErr } = await supabase.rpc('increment_period_seva', {
            p_user_id: userId, p_points: sevaGain,
          });
          if (sevaRpcErr) {
            const { data: prof } = await supabase.from('profiles').select('seva_score, weekly_seva, monthly_seva').eq('id', userId).single();
            if (prof) {
              await supabase.from('profiles')
                .update({ 
                  seva_score: (prof.seva_score ?? 0) + sevaGain,
                  weekly_seva: (prof.weekly_seva ?? 0) + sevaGain,
                  monthly_seva: (prof.monthly_seva ?? 0) + sevaGain
                })
                .eq('id', userId);
            }
          }
          fetch('/api/seva-tier/check', { method: 'POST' }).catch(() => {});
        } catch { /* non-fatal */ }

        try {
          const { error: karmaRpcErr } = await supabase.rpc('increment_karma', {
            p_user_id: userId, p_amount: karmaGain,
          });
          if (karmaRpcErr) {
            const { data: prof } = await supabase.from('profiles').select('karma_points').eq('id', userId).single();
            if (prof) {
              await supabase.from('profiles')
                .update({ karma_points: ((prof as { karma_points?: number }).karma_points ?? 0) + karmaGain })
                .eq('id', userId);
            }
          }
        } catch { /* non-fatal */ }
      }

      setStreak(newStreak);
      setSaved(true);
      return true;
    } catch (err) {
      return false;
    } finally {
      setSavingSession(false);
    }
  }, [saved, savingSession, userId, mantraId, customMantra, malaId, bgSceneId, duration, tradition, soundId]);

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

  const handleStartPractice = () => {
    try {
      localStorage.setItem(STORAGE_MALA, malaId);
      localStorage.setItem(STORAGE_MANTRA, mantraId);
      localStorage.setItem(STORAGE_BG, bgSceneId);
    } catch { /* ok */ }
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
    setCompletionInsight(null);
    resetPracticeForNextRound();
  };

  const handleDoneForToday = async () => {
    await saveSession(roundsDone, beadCount);
    setCompletionInsight(null);
    leavePracticeSetup();
  };

  const handleShareFromComplete = () => {
    triggerSadhanaShare({
      tradition,
      type: 'japa',
      symbol: TRADITION_SYMBOLS[tradition] ?? '🙏',
      lines: [
        { text: `${roundsDone} round${roundsDone > 1 ? 's' : ''} complete`, size: 64, weight: '700', color: '#F5E8D0' },
        { text: currentMantra.name ?? 'Japa Mala', size: 44, weight: '400', color: 'rgba(255,255,255,0.6)' },
        { text: `${(roundsDone * TOTAL_BEADS).toLocaleString('en-IN')} beads`, size: 36, weight: '300', color: 'rgba(255,255,255,0.4)' },
      ],
      activeSymbolId,
    });
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
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setScreen('launcher');
  }, []);

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

  const customMantraCard = customMantra ? buildCustomMantraCard(customMantra) : null;
  const currentMantra = mantraId === CUSTOM_MANTRA_ID
    ? customMantraCard ?? buildCustomMantraCard({ label: 'Custom mantra', text: 'ॐ', description: 'Personal mantra focus' })
    : MANTRAS.find(m => m.id === mantraId) ?? MANTRAS[0];
  const currentMala   = MALAS.find(m => m.id === malaId)      ?? MALAS[0];
  const currentBgScene = BG_SCENES.find(s => s.id === bgSceneId) ?? BG_SCENES[0];
  const traditionMantras = useMemo(
    () => {
      if (tradition === 'all' || tradition === 'other') return MANTRAS;
      return MANTRAS.filter(m => m.tradition === tradition || m.tradition === 'all');
    },
    [tradition]
  );
  const selectableMantras = useMemo(() => traditionMantras, [traditionMantras]);
  const bgC = isDark ? currentBgScene.dark : currentBgScene.light;

  const bg      = bgC.bg;
  const text     = isDark ? 'rgba(245,225,185,0.97)' : '#2D1F0E';
  const sub      = isDark ? 'rgba(197, 160, 89,0.60)'  : 'rgba(100,65,25,0.60)';
  const amber    = isDark ? '#C5A059' : '#7A4A1E';
  const cardBg   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  const progressPct = targetRounds > 1
    ? Math.min(100, (roundsDone / targetRounds) * 100)
    : Math.min(100, (beadCount / 108) * 100);

  return (
    <>
      <PageIntro
        pageKey="japa"
        steps={[
          { emoji: '📿', title: 'Japa Mala', body: 'Tap the central bead to begin. Each tap counts one repetition of your mantra.' },
          { emoji: '🔄', title: 'Complete a Round', body: 'One full round = 108 beads. Complete rounds to earn Seva points.' },
          { emoji: '🔥', title: 'Build your streak', body: 'Complete Japa daily to keep your streak alive and unlock sacred relics.' },
        ]}
      />
      <AnimatePresence mode="wait">
        {screen === 'launcher' && (
        <PracticeLauncherScreen
          key="launcher"
          isDark={isDark}
          traditionLabel={meta.shortLabel}
          currentMala={currentMala}
          currentMantra={currentMantra}
          targetRounds={targetRounds}
          streak={streak}
          lifetimeData={lifetimeData}
          accentColor={meta.accentColour}
          onTargetChange={setTargetRounds}
          onStart={handleStartPractice}
          onCustomize={() => setScreen('chooseMala')}
          onBack={() => router.back()}
          japaAlreadyDoneToday={japaAlreadyDoneToday}
        />
      )}

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
          mantras={selectableMantras}
          onSelect={setMantraId}
          onBack={() => setScreen('chooseMala')}
          onConfirm={handleConfirmMantra}
          customMantra={customMantra}
          onOpenCustom={() => setShowCustomMantraSheet(true)}
          targetRounds={targetRounds}
          onTargetChange={n => { setTargetRounds(n); targetRoundsRef.current = n; }}
        />
      )}

      {screen === 'practice' && (
        <motion.div
          key="practice"
          className="flex flex-col"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483000,
            background: bg,
            overflow: 'hidden',
            width: '100vw',
            height: '100dvh',
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

          {!controlsVisible && (
            <motion.button
              type="button"
              aria-label="Show practice controls"
              onClick={(e) => {
                e.stopPropagation();
                showControlsBriefly();
              }}
              className="fixed right-4 top-14 h-11 w-11 rounded-full border flex items-center justify-center"
              style={{
                zIndex: 30,
                background: isDark ? 'rgba(8,6,4,0.28)' : 'rgba(255,253,248,0.36)',
                borderColor: `${amber}22`,
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
              }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 0.72, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              whileTap={{ scale: 0.94 }}
            >
              <Settings2 size={15} style={{ color: amber }} />
            </motion.button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); setShowStopSheet(true); }}
            className="w-11 h-11 rounded-full flex items-center justify-center border"
            aria-label="Stop session"
            style={{
              position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 52px)', left: '20px',
              zIndex: 20,
              background: isDark ? 'rgba(8,6,4,0.50)' : 'rgba(255,253,248,0.65)',
              borderColor: `${amber}30`,
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
            }}>
            <X size={17} style={{ color: amber }} />
          </button>

          <motion.div
            animate={{ opacity: controlsVisible ? 1 : 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ pointerEvents: controlsVisible ? 'auto' : 'none', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
          >
          <div className="flex items-center justify-between px-5 pt-14 pb-2">
            <div className="w-11 h-11" />
            <button
              onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                setScreen('chooseMantra');
              }}
              className="text-center flex-1 px-3 py-1.5 mx-2 rounded-full border transition-colors"
              style={{
                borderColor: `${amber}30`,
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <p className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: sub }}>
                {initialMantraId && !hasStoredMantra ? 'Select Mantra' : currentMantra.tradition}
              </p>
              <p className="text-[13px] font-semibold leading-tight flex items-center justify-center gap-1.5" style={{ color: text }}>
                <span style={{ fontFamily: 'var(--font-devanagari), "Noto Sans Devanagari", sans-serif' }}>
                  {initialMantraId && !hasStoredMantra ? '' : currentMantra.devanagari}
                </span>
                <span>{initialMantraId && !hasStoredMantra ? 'Choose...' : currentMantra.name}</span>
              </p>
            </button>
            <div className="flex items-center gap-2">
              {isSilent && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center border"
                  style={{ background: isDark ? 'rgba(8,6,4,0.36)' : 'rgba(255,253,248,0.42)', borderColor: `${amber}28`, backdropFilter: 'blur(18px)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path><path d="M18 8a6 6 0 0 0-9.33-5"></path><line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </div>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="w-11 h-11 rounded-full flex items-center justify-center border"
                aria-label="Practice settings"
                style={{ background: isDark ? 'rgba(8,6,4,0.36)' : 'rgba(255,253,248,0.42)', borderColor: `${amber}28`, backdropFilter: 'blur(18px)' }}>
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
              <p className="text-[10px]" style={{ color: sub }}>
                Target {targetRounds}×
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 mt-3 opacity-80 max-w-xs mx-auto">
              <p style={{ fontSize: '11px', fontStyle: 'italic', color: sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'center' }}>
                {'transliteration' in currentMantra ? currentMantra.transliteration : ''}
              </p>
              {'transliteration' in currentMantra && currentMantra.transliteration && (
                <MantraPlayer
                  text={currentMantra.transliteration}
                  label={`Listen to ${currentMantra.name} pronunciation`}
                  size={12}
                  accentColor={meta.accentColour}
                />
              )}
            </div>
          </div>
          </motion.div>

          <div className="flex-1 flex flex-col items-center justify-center relative">
            <LotusParticles accentColor={meta.accentColour} />
            <MantraStream mantra={currentMantra.full} isDark={isDark} />
            <TapBloom particles={floatParticles} isDark={isDark} />
            <div className="relative z-10 w-full max-w-sm px-6">
              <motion.div
                className="w-full flex items-center justify-center"
                animate={!prefersReducedMotion && pulsing ? { scale: [1, 0.980, 1.005, 1] } : {}}
                transition={{ duration: 0.15 }}
                style={{ width: 'min(88vw, 78dvh, 540px)', maxWidth: 540, aspectRatio: '1 / 1' }}
              >
                <MalaSVG
                  malaId={malaId}
                  beadCount={beadCount + roundsDone * TOTAL_BEADS}
                  isDark={isDark}
                  pulsing={pulsing}
                  flashBeadIdx={flashBeadIdx}
                  flashKey={flashKey}
                  milestoneActive={milestoneActive}
                  appLanguage={appLanguage}
                  tradition={tradition}
                  isPracticing={screen === 'practice'}
                  accentColor={meta.accentColour}
                  completedRounds={roundsDone}
                  activeSymbolId={activeSymbolId}
                />
              </motion.div>
            </div>
          </div>

          <motion.div
            animate={{ opacity: controlsVisible ? 1 : 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ pointerEvents: controlsVisible ? 'auto' : 'none', position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 }}
          >
          <div className="px-5 space-y-3" style={{ paddingBottom: 'max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 4.5rem))' }}>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Flame size={15} style={{ color: streak > 0 ? amber : `${amber}40` }} />
                <span className="text-[12px] font-semibold" style={{ color: streak > 0 ? amber : `${amber}40` }}>
                  {streak > 0 ? `${streak} day streak` : 'Start your streak'}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[11px]" style={{ color: sub }}>
                  {beadCount >= 20 && tapTimesRef.current.length === 11 ? (
                    `~${Math.round(60000 / ((tapTimesRef.current[tapTimesRef.current.length - 1] - tapTimesRef.current[0]) / 10))} beads/min`
                  ) : 'Tap beads to count'}
                </span>
                <span className="block text-[10px]" style={{ color: sub }}>{malaSkin.label} Mala</span>
              </div>
            </div>

            {/* Floating controls */}
            <div className="mx-auto flex w-fit gap-2 rounded-full border p-1.5"
              style={{ background: isDark ? 'rgba(8,6,4,0.38)' : 'rgba(255,253,248,0.48)', borderColor: `${amber}24`, backdropFilter: 'blur(18px)' }}>
              <button
                onClick={() => setPaused(p => !p)}
                className="h-11 min-w-11 rounded-full px-4 font-semibold text-[13px] transition-all active:scale-95"
                aria-label={paused ? 'Resume practice' : 'Pause practice'}
                style={{ background: paused ? `${amber}22` : 'transparent', color: text }}>
                <span className="inline-flex items-center justify-center gap-2">{paused ? <Play size={15} /> : <Pause size={15} />}{paused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={roundsDone > 0 || beadCount > 0 ? handleManualEnd : () => setShowStopSheet(true)}
                disabled={savingSession}
                className="h-11 rounded-full px-4 font-semibold text-[13px] transition-all active:scale-95 disabled:opacity-60"
                aria-label="End and save session"
                style={{
                  background: isDark ? 'rgba(197, 160, 89,0.14)' : 'rgba(122,74,30,0.10)',
                  color: amber,
                }}>
                {savingSession ? 'Saving...' : 'End'}
              </button>
            </div>
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
                isSilent={isSilent}
                onSilentToggle={handleSilentToggle}
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
              <JapaCompletionCeremony
                tradition={tradition}
                rounds={roundsDone}
                totalBeads={roundsDone * TOTAL_BEADS}
                mantraName={currentMantra.name}
                totalTimeSeconds={duration}
                isDark={isDark}
                accentColor={meta.accentColour}
                insight={completionInsight}
                insightLoading={completionInsightLoading}
                onContinue={handleContinueAfterComplete}
                onDone={handleDoneForToday}
                onShare={handleShareFromComplete}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showCustomMantraSheet && (
              <CustomMantraSheet
                isDark={isDark}
                initialValue={customMantra}
                saving={savingCustomMantra}
                onClose={() => setShowCustomMantraSheet(false)}
                onSave={async (value) => {
                  setCustomMantra(value);
                  setMantraId(CUSTOM_MANTRA_ID);
                  try {
                    localStorage.setItem(STORAGE_CUSTOM_MANTRA, JSON.stringify(value));
                    localStorage.setItem(STORAGE_MANTRA, CUSTOM_MANTRA_ID);
                  } catch { /* ok */ }
                  await saveCustomMantraSync(value);
                  setShowCustomMantraSheet(false);
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}

    </AnimatePresence>
    </>
  );
}
