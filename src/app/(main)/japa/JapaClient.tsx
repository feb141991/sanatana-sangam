'use client';

// ─── Japa Mala — Multi-screen redesign ────────────────────────────────────────
//
//  Screen 1 — Choose Mala   (sandalwood / rudraksha / rose quartz / tulsi / crystal)
//  Screen 2 — Choose Mantra (6 options across traditions)
//  Screen 3 — Japa practice (SVG bead ring, counter in center)
//  Overlay  — Completion    (stats + streak)
//  Sheet    — Sacred Sounds (ambient audio)
//
//  Theme: follows global data-theme dark/light via useThemePreference()
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, VolumeX, Flame, RotateCcw } from 'lucide-react';
import { useEngine } from '@/contexts/EngineContext';
import { hapticLight, hapticSuccess } from '@/lib/platform';
import { createClient } from '@/lib/supabase';
import { usePremium } from '@/hooks/usePremium';
import { useThemePreference } from '@/components/providers/ThemeProvider';

// ── Constants ──────────────────────────────────────────────────────────────────
const TOTAL_BEADS = 108;
const SVG_W = 340;
const SVG_CX = SVG_W / 2;
const SVG_CY = SVG_W / 2;
const RING_R = 148;
const BEAD_R = 5.2;
const SUMERU_R = 8;
const STORAGE_MALA    = 'ss-japa-mala';
const STORAGE_MANTRA  = 'ss-japa-mantra';

// ── Mala definitions ───────────────────────────────────────────────────────────
const MALAS = [
  {
    id: 'sandalwood',
    name: 'Sandalwood',
    subtitle: 'Calming · All Traditions',
    emoji: '🟤',
    dark:  { thread: 'rgba(120,80,40,0.20)', bead: '#5A3218', counted: '#C8924A', sumeru: '#2E1508', glow: 'rgba(200,146,74,0.55)' },
    light: { thread: 'rgba(80,50,20,0.15)',  bead: '#C8A070', counted: '#7A4A1E', sumeru: '#5A3010', glow: 'rgba(122,74,30,0.45)' },
  },
  {
    id: 'rudraksha',
    name: 'Rudraksha',
    subtitle: 'Sacred · Shaiva',
    emoji: '🟤',
    dark:  { thread: 'rgba(80,40,20,0.20)', bead: '#3A1A08', counted: '#C8924A', sumeru: '#1A0802', glow: 'rgba(200,100,60,0.55)' },
    light: { thread: 'rgba(60,30,10,0.15)', bead: '#A07050', counted: '#5A2E10', sumeru: '#3A1A02', glow: 'rgba(90,46,16,0.45)' },
  },
  {
    id: 'rose_quartz',
    name: 'Rose Quartz',
    subtitle: 'Love & Healing · Universal',
    emoji: '🩷',
    dark:  { thread: 'rgba(160,80,100,0.20)', bead: '#5A2A3A', counted: '#D4826A', sumeru: '#3A1828', glow: 'rgba(210,120,140,0.55)' },
    light: { thread: 'rgba(160,80,100,0.15)', bead: '#E8B0C0', counted: '#C07090', sumeru: '#A04870', glow: 'rgba(192,112,144,0.45)' },
  },
  {
    id: 'tulsi',
    name: 'Tulsi',
    subtitle: 'Pure & Auspicious · Vaishnava',
    emoji: '🌿',
    dark:  { thread: 'rgba(40,100,40,0.20)', bead: '#1E3E1E', counted: '#C8924A', sumeru: '#0E2A0E', glow: 'rgba(60,160,60,0.40)' },
    light: { thread: 'rgba(30,80,30,0.15)',  bead: '#90C090', counted: '#3A7A3A', sumeru: '#1E5A1E', glow: 'rgba(58,122,58,0.40)' },
  },
  {
    id: 'crystal',
    name: 'Crystal',
    subtitle: 'Clarity & Purity · Universal',
    emoji: '🔮',
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
] as const;

type MantraId = typeof MANTRAS[number]['id'];

// ── Sound definitions ──────────────────────────────────────────────────────────
type SoundId = 'silence' | 'rain' | 'river' | 'bells' | 'forest';
const SOUNDS: { id: SoundId; label: string; emoji: string; url: string; bg: string }[] = [
  { id: 'silence', label: 'Silence',       emoji: '🤫', url: '', bg: 'linear-gradient(135deg, #1a1a2e, #0d0d1a)' },
  { id: 'rain',    label: 'Rain',          emoji: '🌧️', url: 'https://cdn.freesound.org/previews/346/346170_5121236-lq.mp3', bg: 'linear-gradient(135deg, #1a2a3a, #0a1a2a)' },
  { id: 'river',   label: 'River',         emoji: '🌊', url: 'https://cdn.freesound.org/previews/531/531947_11861866-lq.mp3', bg: 'linear-gradient(135deg, #0e2030, #1a3040)' },
  { id: 'bells',   label: 'Temple Bells',  emoji: '🔔', url: 'https://cdn.freesound.org/previews/411/411090_5121236-lq.mp3', bg: 'linear-gradient(135deg, #2a1a0e, #1a0e06)' },
  { id: 'forest',  label: 'Forest',        emoji: '🌿', url: 'https://cdn.freesound.org/previews/250/250978_4486188-lq.mp3', bg: 'linear-gradient(135deg, #0e2010, #182a18)' },
];

// ── SVG Mala ───────────────────────────────────────────────────────────────────
function beadPos(i: number) {
  const angle = ((i / TOTAL_BEADS) * Math.PI * 2) - Math.PI / 2;
  return { x: SVG_CX + RING_R * Math.cos(angle), y: SVG_CY + RING_R * Math.sin(angle) };
}

function MalaSVG({
  malaId, beadCount, isDark, pulsing, onTap,
}: {
  malaId: MalaId; beadCount: number; isDark: boolean;
  pulsing: boolean; onTap: () => void;
}) {
  const mala = MALAS.find(m => m.id === malaId) ?? MALAS[0];
  const c = isDark ? mala.dark : mala.light;
  const currentBeadIdx = beadCount % TOTAL_BEADS;
  const roundComplete  = beadCount > 0 && beadCount % TOTAL_BEADS === 0;

  const countDisplay = roundComplete ? TOTAL_BEADS : currentBeadIdx;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_W}`}
      style={{ width: '100%', maxWidth: 320, cursor: 'pointer', touchAction: 'manipulation' }}
      onClick={onTap}
    >
      <defs>
        {/* 3D bead gradients */}
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
        {/* Glow filter for current bead */}
        <filter id="bead-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Center glow */}
        <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={c.glow} stopOpacity="0.18" />
          <stop offset="100%" stopColor={c.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Thread / string */}
      <circle cx={SVG_CX} cy={SVG_CY} r={RING_R} fill="none"
        stroke={c.thread} strokeWidth="1.5" />

      {/* Center glow */}
      <circle cx={SVG_CX} cy={SVG_CY} r={RING_R - 20} fill="url(#center-glow)" />

      {/* 108 beads */}
      {Array.from({ length: TOTAL_BEADS }, (_, i) => {
        const isSumeru = i === 0;
        const isDone   = i > 0 && i <= currentBeadIdx && !roundComplete
                        || (roundComplete && i > 0);
        const isCurrent = !roundComplete && i === currentBeadIdx + 1 && beadCount > 0;
        const pos = beadPos(i);
        const r   = isSumeru ? SUMERU_R : BEAD_R;
        const fill = isSumeru
          ? `url(#sumeru-${malaId})`
          : isDone
          ? `url(#bead-done-${malaId})`
          : `url(#bead-un-${malaId})`;

        return (
          <circle
            key={i}
            cx={pos.x}
            cy={pos.y}
            r={r}
            fill={fill}
            filter={isCurrent ? 'url(#bead-glow)' : undefined}
            stroke={isCurrent ? c.glow : isDone ? (isDark ? 'rgba(240,180,60,0.35)' : 'rgba(100,60,20,0.3)') : 'none'}
            strokeWidth={isCurrent ? 1.5 : isDone ? 0.8 : 0}
          />
        );
      })}

      {/* Counter in center */}
      <text
        x={SVG_CX}
        y={SVG_CY - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={countDisplay >= 100 ? 46 : 54}
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={isDark ? 'rgba(245,225,185,0.97)' : '#2D1F0E'}
        letterSpacing="-2"
      >
        {countDisplay}
      </text>
      <text
        x={SVG_CX}
        y={SVG_CY + 32}
        textAnchor="middle"
        fontSize={14}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={isDark ? 'rgba(200,146,74,0.65)' : 'rgba(100,65,25,0.65)'}
        letterSpacing="1"
      >
        / 108
      </text>

      {/* "Tap" hint when not started */}
      {beadCount === 0 && (
        <text
          x={SVG_CX}
          y={SVG_CY + 54}
          textAnchor="middle"
          fontSize={11}
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={isDark ? 'rgba(200,146,74,0.40)' : 'rgba(100,65,25,0.40)'}
        >
          tap to begin
        </text>
      )}
    </svg>
  );
}

// ── Screen 1: Choose Mala ─────────────────────────────────────────────────────
function ChooseMalaScreen({
  isDark, selected, onSelect, onConfirm,
}: {
  isDark: boolean; selected: MalaId;
  onSelect: (id: MalaId) => void; onConfirm: () => void;
}) {
  const bg   = isDark ? '#08070A' : '#F5F0E8';
  const card = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const text = isDark ? 'rgba(245,225,185,0.95)' : '#2D1F0E';
  const sub  = isDark ? 'rgba(200,146,74,0.60)' : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C8924A' : '#7A4A1E';

  return (
    <motion.div
      className="flex flex-col min-h-screen"
      style={{ background: bg }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-2"
          style={{ color: amber }}>Choose Your</p>
        <h1 className="text-[2rem] font-bold leading-tight" style={{ color: text, fontFamily: 'var(--font-serif)' }}>
          Mala
        </h1>
        <p className="text-sm mt-1" style={{ color: sub }}>The sacred beads for your practice</p>
      </div>

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
                background: isSelected
                  ? isDark ? 'rgba(200,146,74,0.10)' : 'rgba(122,74,30,0.08)'
                  : card,
                borderColor: isSelected ? `${malaC.glow}` : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                boxShadow: isSelected ? `0 0 0 1.5px ${malaC.glow}` : 'none',
              }}
            >
              {/* Mini mala SVG preview */}
              <div style={{ width: 52, height: 52, flexShrink: 0 }}>
                <svg viewBox="0 0 52 52">
                  <circle cx={26} cy={26} r={22} fill="none"
                    stroke={malaC.thread} strokeWidth="1" />
                  {Array.from({ length: 24 }, (_, i) => {
                    const a = ((i / 24) * Math.PI * 2) - Math.PI / 2;
                    const x = 26 + 22 * Math.cos(a);
                    const y = 26 + 22 * Math.sin(a);
                    const done = i < 8;
                    return (
                      <circle key={i} cx={x} cy={y} r={i === 0 ? 3.5 : 2.2}
                        fill={i === 0 ? malaC.sumeru : done ? malaC.counted : malaC.bead}
                        opacity={i === 0 ? 1 : done ? 0.9 : 0.7} />
                    );
                  })}
                </svg>
              </div>

              <div className="flex-1">
                <p className="font-semibold text-[15px]" style={{ color: text }}>{m.name}</p>
                <p className="text-[12px] mt-0.5" style={{ color: sub }}>{m.subtitle}</p>
              </div>

              {isSelected && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: amber }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Confirm button */}
      <div className="px-5 pb-10 pt-2">
        <motion.button
          onClick={onConfirm}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-bold text-[15px]"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #C8924A, #8a5818)'
              : 'linear-gradient(135deg, #8B5E3C, #5a3010)',
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
  const bg   = isDark ? '#08070A' : '#F5F0E8';
  const card = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const text = isDark ? 'rgba(245,225,185,0.95)' : '#2D1F0E';
  const sub  = isDark ? 'rgba(200,146,74,0.60)' : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C8924A' : '#7A4A1E';

  return (
    <motion.div
      className="flex flex-col min-h-screen"
      style={{ background: bg }}
      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
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
                background: isSelected
                  ? isDark ? 'rgba(200,146,74,0.09)' : 'rgba(122,74,30,0.07)'
                  : card,
                borderColor: isSelected ? `${m.tradColor}55` : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                boxShadow: isSelected ? `0 0 0 1.5px ${m.tradColor}44` : 'none',
              }}
            >
              {/* Tradition badge + check */}
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${m.tradColor}20`, color: m.tradColor, border: `1px solid ${m.tradColor}30` }}>
                  {m.tradition}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: amber }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>
              {/* Devanagari */}
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
      <div className="px-5 pb-10 pt-2">
        <motion.button
          onClick={onConfirm}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-bold text-[15px]"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #C8924A, #8a5818)'
              : 'linear-gradient(135deg, #8B5E3C, #5a3010)',
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
      className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        className="w-full max-w-2xl mx-auto rounded-t-3xl px-5 pt-3 pb-10"
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

        <div className="grid grid-cols-5 gap-2">
          {SOUNDS.map(s => {
            const isActive = current === s.id;
            return (
              <button key={s.id} onClick={() => onSelect(s.id)}
                className="flex flex-col items-center gap-2 rounded-2xl py-4 border transition-all"
                style={{
                  background: isActive
                    ? isDark ? 'rgba(200,146,74,0.14)' : 'rgba(122,74,30,0.10)'
                    : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  borderColor: isActive
                    ? isDark ? 'rgba(200,146,74,0.40)' : 'rgba(122,74,30,0.35)'
                    : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                }}>
                <span className="text-[1.6rem] leading-none">{s.emoji}</span>
                <span className="text-[9px] font-semibold text-center" style={{ color: isActive ? (isDark ? '#C8924A' : '#7A4A1E') : sub }}>
                  {s.label}
                </span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: isDark ? '#C8924A' : '#7A4A1E' }} />
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
  isDark, rounds, durationSecs, mantraName, streak, onClose,
}: {
  isDark: boolean; rounds: number; durationSecs: number;
  mantraName: string; streak: number; onClose: () => void;
}) {
  const mins = Math.floor(durationSecs / 60);
  const secs = durationSecs % 60;
  const bg   = isDark ? 'rgba(8,6,12,0.97)' : 'rgba(245,240,232,0.97)';
  const text = isDark ? 'rgba(245,225,185,0.97)' : '#2D1F0E';
  const sub  = isDark ? 'rgba(200,146,74,0.60)' : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C8924A' : '#7A4A1E';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ background: 'rgba(0,0,0,0.65)' }}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="w-full max-w-2xl mx-auto rounded-t-3xl px-6 pt-6 pb-10 space-y-6"
        style={{ background: bg, backdropFilter: 'blur(28px)', border: `1px solid ${amber}28`, borderBottom: 'none' }}
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
            Japa Complete
          </h2>
          <p style={{ color: sub, fontSize: '0.9rem' }}>
            {rounds} mala{rounds > 1 ? 's' : ''} · {mantraName}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Rounds', value: `${rounds}` },
            { label: 'Beads',  value: `${rounds * TOTAL_BEADS}` },
            { label: 'Time',   value: `${mins}m ${secs}s` },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center border"
              style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: `${amber}1A` }}>
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

        {/* CTA */}
        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-bold text-[15px]"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #C8924A, #8a5818)'
              : 'linear-gradient(135deg, #8B5E3C, #5a3010)',
            color: isDark ? '#fde8c8' : '#fff8f0',
            boxShadow: '0 4px 24px rgba(200,146,74,0.28)',
          }}>
          🕉️  Hari Om
        </motion.button>
      </motion.div>
    </motion.div>
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
  const { isPro } = usePremium();

  // ── Default mantra by tradition ──────────────────────────────────────────
  const defaultMantraId: MantraId = tradition === 'sikh' ? 'om_namah_shivaya'
    : tradition === 'buddhist' ? 'om_mani'
    : 'gayatri';

  // ── Persisted selections ─────────────────────────────────────────────────
  const [screen, setScreen]       = useState<Screen>('chooseMala');
  const [malaId, setMalaId]       = useState<MalaId>('sandalwood');
  const [mantraId, setMantraId]   = useState<MantraId>(defaultMantraId);

  useEffect(() => {
    try {
      const savedMala   = localStorage.getItem(STORAGE_MALA)   as MalaId | null;
      const savedMantra = localStorage.getItem(STORAGE_MANTRA) as MantraId | null;
      if (savedMala   && MALAS.find(m => m.id === savedMala))     setMalaId(savedMala);
      if (savedMantra && MANTRAS.find(m => m.id === savedMantra)) setMantraId(savedMantra);
    } catch { /* ok */ }
  }, []);

  // ── Japa state ───────────────────────────────────────────────────────────
  const [beadCount,   setBeadCount]   = useState(0);   // within current round 0-108
  const [roundsDone,  setRoundsDone]  = useState(0);   // completed rounds
  const [totalBeads,  setTotalBeads]  = useState(0);   // total beads ever tapped
  const [paused,      setPaused]      = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showSounds,  setShowSounds]  = useState(false);
  const [soundId,     setSoundId]     = useState<SoundId>('silence');
  const [streak,      setStreak]      = useState(currentStreak);
  const [saved,       setSaved]       = useState(japaAlreadyDoneToday);
  const [pulsing,     setPulsing]     = useState(false);

  // Timer
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (screen !== 'japa' || paused || showComplete) return;
    if (!startedAt.current) startedAt.current = Date.now();
    timerRef.current = setInterval(() => setDuration(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen, paused, showComplete]);

  // ── Audio ────────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const url = SOUNDS.find(s => s.id === soundId)?.url ?? '';
    if (!url) {
      audioRef.current?.pause();
      audioRef.current = null;
      return;
    }
    if (!audioRef.current || audioRef.current.src !== url) {
      audioRef.current?.pause();
      const a = new Audio(url);
      a.loop = true;
      audioRef.current = a;
    }
    const playPromise = audioRef.current.play();
    if (playPromise) playPromise.catch(() => { /* autoplay blocked */ });
    return () => {
      audioRef.current?.pause();
    };
  }, [soundId]);

  // Cleanup on unmount
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  // ── Count bead ───────────────────────────────────────────────────────────
  const countBead = useCallback(() => {
    if (paused || showComplete) return;
    hapticLight();
    setPulsing(true);
    setTimeout(() => setPulsing(false), 120);

    setBeadCount(prev => {
      const next = prev + 1;
      if (next >= TOTAL_BEADS) {
        // Round complete
        hapticSuccess();
        setRoundsDone(r => r + 1);
        setTotalBeads(t => t + next);
        setTimeout(() => setShowComplete(true), 300);
        return 0;
      }
      setTotalBeads(t => t + 1);
      return next;
    });
  }, [paused, showComplete]);

  // ── Save session ─────────────────────────────────────────────────────────
  const saveSession = useCallback(async (completedRounds: number) => {
    if (saved || completedRounds === 0) return;
    try {
      const supabase = createClient();
      const today = new Date().toISOString().slice(0, 10);
      await supabase.from('mala_sessions').insert({
        user_id: userId, date: today,
        rounds: completedRounds,
        bead_count: completedRounds * TOTAL_BEADS,
        mantra_id: mantraId,
        duration_secs: duration,
      });
      // Update sadhana
      const { data: existing } = await supabase
        .from('daily_sadhana').select('streak_count').eq('user_id', userId).eq('date', today).single();
      const newStreak = (existing?.streak_count ?? 0) + 1;
      await supabase.from('daily_sadhana').upsert({
        user_id: userId, date: today, japa_done: true, streak_count: newStreak,
      }, { onConflict: 'user_id,date' });
      engine?.logSadhanaStep({ userId, step: 'japa', date: today });
      setStreak(newStreak);
      setSaved(true);
    } catch { /* silent */ }
  }, [saved, userId, mantraId, duration, engine]);

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
    saveSession(roundsDone);
    setShowComplete(false);
    setBeadCount(0);
  };

  const currentMantra = MANTRAS.find(m => m.id === mantraId) ?? MANTRAS[0];
  const currentMala   = MALAS.find(m => m.id === malaId)     ?? MALAS[0];

  // ── Theme tokens for japa screen ─────────────────────────────────────────
  const bg    = isDark ? '#06060A' : '#F5F0E8';
  const text  = isDark ? 'rgba(245,225,185,0.97)' : '#2D1F0E';
  const sub   = isDark ? 'rgba(200,146,74,0.60)'  : 'rgba(100,65,25,0.60)';
  const amber = isDark ? '#C8924A' : '#7A4A1E';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const malaColors = isDark ? currentMala.dark : currentMala.light;

  return (
    <AnimatePresence mode="wait">
      {screen === 'chooseMala' && (
        <ChooseMalaScreen key="chooseMala"
          isDark={isDark} selected={malaId}
          onSelect={setMalaId} onConfirm={handleConfirmMala}
        />
      )}

      {screen === 'chooseMantra' && (
        <ChooseMantraScreen key="chooseMantra"
          isDark={isDark} selected={mantraId}
          onSelect={setMantraId}
          onBack={() => setScreen('chooseMala')}
          onConfirm={handleConfirmMantra}
        />
      )}

      {screen === 'japa' && (
        <motion.div
          key="japa"
          className="flex flex-col min-h-screen relative"
          style={{ background: bg }}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── Top bar ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 pt-14 pb-2">
            <button
              onClick={() => setScreen('chooseMala')}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
              <ChevronLeft size={20} style={{ color: amber }} />
            </button>

            {/* Mantra name */}
            <div className="text-center">
              <p className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: sub }}>
                {currentMantra.tradition}
              </p>
              <p className="text-[13px] font-semibold" style={{ color: text }}>
                {currentMantra.name}
              </p>
            </div>

            {/* Sounds button */}
            <button
              onClick={() => setShowSounds(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
              {soundId === 'silence'
                ? <VolumeX size={17} style={{ color: amber }} />
                : <Volume2 size={17} style={{ color: amber }} />}
            </button>
          </div>

          {/* ── Mantra devanagari ────────────────────────────────────────── */}
          <div className="text-center px-6 pb-4">
            <p style={{
              fontFamily: 'var(--font-devanagari), "Noto Sans Devanagari", sans-serif',
              fontSize: '1.4rem',
              color: isDark ? 'rgba(245,210,150,0.75)' : 'rgba(80,45,10,0.65)',
              lineHeight: 1.6,
              letterSpacing: '0.03em',
            }}>
              {currentMantra.devanagari}
            </p>
          </div>

          {/* ── SVG Mala — center of screen ──────────────────────────────── */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4">
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
                onTap={countBead}
              />
            </motion.div>

            {/* Round indicator */}
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.max(1, roundsDone + 1) }, (_, i) => (
                <div key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: i === roundsDone ? 20 : 6,
                    height: 6,
                    background: i < roundsDone
                      ? amber
                      : i === roundsDone
                      ? `${amber}80`
                      : `${amber}25`,
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
          <div className="px-5 pb-10 space-y-3">
            {/* Streak + stats row */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5">
                <Flame size={15} style={{ color: streak > 0 ? amber : `${amber}40` }} />
                <span className="text-[12px] font-semibold" style={{ color: streak > 0 ? amber : `${amber}40` }}>
                  {streak > 0 ? `${streak} day streak` : 'Start your streak'}
                </span>
              </div>
              {totalBeads > 0 && (
                <p className="text-[11px]" style={{ color: sub }}>
                  {totalBeads} beads total
                </p>
              )}
            </div>

            {/* Action row */}
            <div className="flex gap-3">
              {/* Pause / Resume */}
              <button
                onClick={() => setPaused(p => !p)}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-[14px] border transition-all"
                style={{
                  background: cardBg,
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
                  color: text,
                }}>
                {paused ? '▶  Resume' : '⏸  Pause'}
              </button>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="w-14 py-3.5 rounded-2xl flex items-center justify-center border transition-all"
                style={{
                  background: cardBg,
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
                }}>
                <RotateCcw size={17} style={{ color: sub }} />
              </button>
            </div>

            {/* Manual complete */}
            {roundsDone > 0 && (
              <button
                onClick={() => { saveSession(roundsDone); setShowComplete(true); }}
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

          {/* ── Sound sheet ───────────────────────────────────────────────── */}
          <AnimatePresence>
            {showSounds && (
              <SoundsSheet
                isDark={isDark}
                current={soundId}
                onSelect={id => { setSoundId(id); }}
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
                durationSecs={duration}
                mantraName={currentMantra.name}
                streak={streak}
                onClose={handleCompleteClose}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
