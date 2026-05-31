'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, Share2, X } from 'lucide-react';
import { useSacredCalendar, type SacredCalendarData } from '@/hooks/useSacredCalendar';
import { calculatePanchang } from '@/lib/panchang';
import { localSpiritualDate } from '@/lib/sacred-time';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import { createClient } from '@/lib/supabase';

// Import our premium Jyotish engines
import { getDailyHoroscope, RASHI_LIST } from '@/lib/jyotish/rashiphal-data';
import { generateKundali, renderKundaliSVG, type KundaliInput, type KundaliResult } from '@/lib/jyotish/kundali-engine';
import { getTodayTransits, detectSadeSati } from '@/lib/jyotish/astro-engine';
import type { AntardashaEntry } from '@/lib/jyotish/astro-engine';

interface Props {
  lat:       number;
  lon:       number;
  city:      string;
  tradition?: string;
  /** IANA timezone string for the user's location (e.g. "Europe/London", "America/New_York").
   *  When supplied, all time strings are displayed in the user's local timezone. */
  timezone?: string;
}

// ─── Tradition metadata ───────────────────────────────────────────────────────
const TRADITION_META: Record<string, { badge: string; note: string; accent: string; accentLight: string }> = {
  hindu:    { badge: '🕉️ Vedic',     note: 'Vikram Samvat',         accent: '#B8541B', accentLight: 'rgba(184,84,27,0.15)' },
  sikh:     { badge: '☬ Nanakshahi', note: 'Nanakshahi Calendar',   accent: '#1a4d7b', accentLight: 'rgba(26,77,123,0.15)' },
  buddhist: { badge: '☸️ Buddhist',   note: 'Buddhist Lunar',        accent: '#5c6b1a', accentLight: 'rgba(92,107,26,0.15)' },
  jain:     { badge: '🤲 Jain',       note: 'Vira Samvat',           accent: '#7b5a1a', accentLight: 'rgba(123,90,26,0.15)' },
};

const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─── Time-of-day phase from sunrise/sunset strings ────────────────────────────
type SkyPhase = 'night' | 'predawn' | 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'evening';

function parseSunTime(timeStr: string): number {
  const [time, period] = timeStr.split(' ');
  const [h, m]         = time.split(':').map(Number);
  let hours = h;
  if (period === 'PM' && h !== 12) hours += 12;
  if (period === 'AM' && h === 12) hours = 0;
  return hours * 60 + m;
}

function getSkyPhase(nowMin: number, sunriseMin: number, sunsetMin: number): SkyPhase {
  if (nowMin < sunriseMin - 60)          return 'night';
  if (nowMin < sunriseMin - 15)          return 'predawn';
  if (nowMin < sunriseMin + 45)          return 'dawn';
  if (nowMin < (sunriseMin + sunsetMin) / 2) return 'morning';
  if (nowMin < sunsetMin - 45)           return 'afternoon';
  if (nowMin < sunsetMin + 45)           return 'dusk';
  if (nowMin < sunsetMin + 120)          return 'evening';
  return 'night';
}

const SKY_GRADIENTS: Record<SkyPhase, string> = {
  night:     'linear-gradient(180deg, #050508 0%, #0a0a1a 40%, #080812 100%)',
  predawn:   'linear-gradient(180deg, #080812 0%, #0f0a20 50%, #1a0830 100%)',
  dawn:      'linear-gradient(180deg, #1a0a28 0%, #5c1f3a 35%, #c45c2a 70%, #e8a060 100%)',
  morning:   'linear-gradient(180deg, #1e4a8a 0%, #3a7ab8 35%, #d4885a 70%, #f0b870 100%)',
  afternoon: 'linear-gradient(180deg, #1a3a6e 0%, #2d5a9e 40%, #4a7ac0 100%)',
  dusk:      'linear-gradient(180deg, #1a1030 0%, #5c1a1a 30%, #c44820 60%, #e87040 100%)',
  evening:   'linear-gradient(180deg, #080512 0%, #1a0828 40%, #2a0a1a 100%)',
};

const SKY_ORB: Record<SkyPhase, { color: string; size: string; opacity: number }> = {
  night:     { color: 'rgba(200,220,255,0.35)', size: '5rem',  opacity: 0.9 },
  predawn:   { color: 'rgba(180,160,220,0.25)', size: '4rem',  opacity: 0.6 },
  dawn:      { color: 'rgba(255,180,80,0.45)',  size: '6rem',  opacity: 0.8 },
  morning:   { color: 'rgba(255,220,100,0.5)',  size: '8rem',  opacity: 0.9 },
  afternoon: { color: 'rgba(255,240,150,0.4)',  size: '10rem', opacity: 0.7 },
  dusk:      { color: 'rgba(255,120,50,0.5)',   size: '9rem',  opacity: 0.85 },
  evening:   { color: 'rgba(220,100,60,0.3)',   size: '6rem',  opacity: 0.5 },
};

const PHASE_LABELS: Record<SkyPhase, string> = {
  night: 'Night', predawn: 'Pre-dawn', dawn: 'Dawn',
  morning: 'Morning', afternoon: 'Afternoon', dusk: 'Dusk', evening: 'Evening',
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

// ─── Glass card ───────────────────────────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border backdrop-blur-md ${className}`}
      style={{ background: 'rgba(10,8,25,0.55)', borderColor: 'rgba(255,255,255,0.10)' }}>
      {children}
    </div>
  );
}

// ─── One-liner info for each panchang element ─────────────────────────────────
const INFO_TEXT: Record<string, string> = {
  Tithi:             'Lunar day (1–30). Each tithi has a presiding deity and governs which activities are auspicious.',
  Nakshatra:         "Moon's mansion in 1 of 27 star-clusters. Your moon nakshatra shapes emotion, instinct, and timing.",
  Yoga:              'Sun + Moon combined longitude across 27 yogas. Indicates the overall quality and nature of the day.',
  Karana:            'Half of a tithi — the moon moves 6° per karana. There are 11 karanas, 7 movable and 4 fixed. Governs the finer timing within each tithi for rituals and acts.',
  Vara:              'Vedic day of the week. Each day has a ruling planet and presiding deity who blesses related acts.',
  Sunrise:           'Calculated for your location. Brahma Muhurta starts 96 minutes before sunrise — the ideal waking time.',
  Sunset:            'Sandhya kaal — ideal for evening prayers, japa, and quiet reflection as day meets night.',
  'Brahma Muhurta':  'The sacred pre-dawn window — 96 to 48 minutes before sunrise. The mind is clearest, subtle energies are elevated, and the shastras call this the best time for meditation, japa, and pranayama.',
  'Rahu Kaal':       'A 90-min daily window ruled by Rahu (shadow planet). Avoid starting new ventures or auspicious acts.',
  'Abhijit Muhurat': 'The most auspicious ~48-min window around solar noon. Ideal for important new beginnings.',
};

// ─── Inline tooltip ────────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [show]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setShow((s) => !s); }}
        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition hover:opacity-80"
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.55)',
        }}
        aria-label="More info"
      >
        i
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-7 right-0 z-50 w-56 rounded-xl px-3 py-2.5 text-left"
            style={{
              background: 'rgba(8,6,22,0.97)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <p className="text-[11px] leading-relaxed text-white/75">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Panchang row ─────────────────────────────────────────────────────────────
function Row({ emoji, label, value, upto, accent, warn = false, infoKey, isLocal = false }: {
  emoji: string; label: string; value: string; upto?: string; accent: string; warn?: boolean; infoKey?: string; isLocal?: boolean;
}) {
  const infoText = infoKey ? INFO_TEXT[infoKey] : undefined;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: warn ? 'rgba(200,80,20,0.18)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${warn ? 'rgba(200,80,20,0.3)' : 'rgba(255,255,255,0.08)'}`,
      }}>
      <span className="text-lg w-6 text-center flex-shrink-0 leading-none">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className={`font-semibold text-sm mt-0.5 ${warn ? 'text-orange-300' : 'text-white/90'}`}>
            {value}
            {isLocal && <span className="text-[10px] text-white/50 ml-2 font-normal">(your time)</span>}
          </p>
          {upto && (
            <p className="text-[10px] text-white/40 mt-0.5">upto {upto}</p>
          )}
        </div>
      </div>
      {infoText && (
        <div className="relative flex-shrink-0">
          <InfoTooltip text={infoText} />
        </div>
      )}
    </div>
  );
}

// ─── Stars background ─────────────────────────────────────────────────────────
function Stars({ count = 28 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width:  `${1 + (i % 3) * 0.5}px`,
            height: `${1 + (i % 3) * 0.5}px`,
            left:   `${(i * 37 + 7) % 97}%`,
            top:    `${(i * 23 + 5) % 55}%`,
          }}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Nakshatra attributes lookup ──────────────────────────────────────────────
const NAKSHATRA_ATTRS: Record<string, { gana: string; animal: string; element: string; symbol: string; syllable: string }> = {
  'Ashwini':           { gana: 'Deva',     animal: 'Horse',    element: 'Earth', symbol: '🐴', syllable: 'Chu, Che, Cho, La' },
  'Bharani':           { gana: 'Manushya', animal: 'Elephant', element: 'Earth', symbol: '🐘', syllable: 'Li, Lu, Le, Lo' },
  'Krittika':          { gana: 'Rakshasa', animal: 'Sheep',    element: 'Earth', symbol: '🔥', syllable: 'A, I, U, E' },
  'Rohini':            { gana: 'Manushya', animal: 'Serpent',  element: 'Earth', symbol: '🌺', syllable: 'O, Va, Vi, Vu' },
  'Mrigashira':        { gana: 'Deva',     animal: 'Serpent',  element: 'Earth', symbol: '🦌', syllable: 'Ve, Vo, Ka, Ki' },
  'Ardra':             { gana: 'Manushya', animal: 'Dog',      element: 'Water', symbol: '💧', syllable: 'Ku, Gha, Ing, Ja' },
  'Punarvasu':         { gana: 'Deva',     animal: 'Cat',      element: 'Water', symbol: '⭐', syllable: 'Ke, Ko, Ha, Hi' },
  'Pushya':            { gana: 'Deva',     animal: 'Sheep',    element: 'Water', symbol: '🌼', syllable: 'Hu, He, Ho, Da' },
  'Ashlesha':          { gana: 'Rakshasa', animal: 'Cat',      element: 'Water', symbol: '🐍', syllable: 'Di, Du, De, Do' },
  'Magha':             { gana: 'Rakshasa', animal: 'Rat',      element: 'Fire',  symbol: '👑', syllable: 'Ma, Mi, Mu, Me' },
  'Purva Phalguni':    { gana: 'Manushya', animal: 'Rat',      element: 'Fire',  symbol: '🛏️', syllable: 'Mo, Ta, Ti, Tu' },
  'Uttara Phalguni':   { gana: 'Manushya', animal: 'Cow',      element: 'Fire',  symbol: '🌟', syllable: 'Te, To, Pa, Pi' },
  'Hasta':             { gana: 'Deva',     animal: 'Buffalo',  element: 'Fire',  symbol: '✋', syllable: 'Pu, Sha, Na, Tha' },
  'Chitra':            { gana: 'Rakshasa', animal: 'Tiger',    element: 'Fire',  symbol: '💎', syllable: 'Pe, Po, Ra, Ri' },
  'Swati':             { gana: 'Deva',     animal: 'Buffalo',  element: 'Air',   symbol: '🌬️', syllable: 'Ru, Re, Ro, Ta' },
  'Vishakha':          { gana: 'Rakshasa', animal: 'Tiger',    element: 'Fire',  symbol: '⚡', syllable: 'Ti, Tu, Te, To' },
  'Anuradha':          { gana: 'Deva',     animal: 'Deer',     element: 'Fire',  symbol: '🌸', syllable: 'Na, Ni, Nu, Ne' },
  'Jyeshtha':          { gana: 'Rakshasa', animal: 'Deer',     element: 'Water', symbol: '🌂', syllable: 'No, Ya, Yi, Yu' },
  'Mula':              { gana: 'Rakshasa', animal: 'Dog',      element: 'Water', symbol: '🌀', syllable: 'Ye, Yo, Bha, Bhi' },
  'Purva Ashadha':     { gana: 'Manushya', animal: 'Monkey',   element: 'Water', symbol: '🌊', syllable: 'Bhu, Dha, Pha, Da' },
  'Uttara Ashadha':    { gana: 'Manushya', animal: 'Mongoose', element: 'Fire',  symbol: '🏆', syllable: 'Be, Bo, Ja, Ji' },
  'Shravana':          { gana: 'Deva',     animal: 'Monkey',   element: 'Air',   symbol: '👂', syllable: 'Ju, Je, Jo, Sha' },
  'Dhanishtha':        { gana: 'Rakshasa', animal: 'Lion',     element: 'Air',   symbol: '🥁', syllable: 'Ga, Gi, Gu, Ge' },
  'Shatabhisha':       { gana: 'Rakshasa', animal: 'Horse',    element: 'Air',   symbol: '🌌', syllable: 'Go, Sa, Si, Su' },
  'Purva Bhadrapada':  { gana: 'Manushya', animal: 'Lion',     element: 'Air',   symbol: '⚔️', syllable: 'Se, So, Da, Di' },
  'Uttara Bhadrapada': { gana: 'Manushya', animal: 'Cow',      element: 'Air',   symbol: '🐟', syllable: 'Du, Tha, Jha, Da' },
  'Revati':            { gana: 'Deva',     animal: 'Elephant', element: 'Air',   symbol: '🐠', syllable: 'De, Do, Cha, Chi' },
};

const GANA_COLOR: Record<string, string> = {
  Deva:     'text-sky-300 bg-sky-400/10 border-sky-400/20',
  Manushya: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
  Rakshasa: 'text-red-300 bg-red-400/10 border-red-400/20',
};

const ELEMENT_COLOR: Record<string, string> = {
  Earth: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  Water: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20',
  Fire:  'text-orange-300 bg-orange-400/10 border-orange-400/20',
  Air:   'text-purple-300 bg-purple-400/10 border-purple-400/20',
};

// ─── Vimshottari Dasha Wisdom ──────────────────────────────────────────────────
const DASHA_WISDOM: Record<string, {
  hi: string;        // Hindi name
  en: string;        // English planet name
  years: number;
  emoji: string;
  color: string;     // Tailwind text color
  bg: string;        // Tailwind bg/border
  domains: string;   // What this dasha rules
  mantra: string;
  pros: string;
  cons: string;
  remedies: string;
}> = {
  Surya: {
    hi: 'सूर्य महादशा', en: 'Sun', years: 6, emoji: '☀️',
    color: 'text-amber-300', bg: 'bg-amber-400/10 border-amber-400/30',
    domains: 'Authority, government, father, health, vitality, career recognition',
    mantra: 'Om Hraam Hreem Hraum Sah Suryaya Namah',
    pros: 'Rise in career and social status, recognition from superiors, strong health and vitality, leadership opportunities, clarity of purpose.',
    cons: 'Ego conflicts, strained relationships with father figures, excessive pride, health issues related to heart and eyes.',
    remedies: 'Offer water to the rising sun daily, worship at a Shiva temple on Sundays, wear ruby (if well-placed).',
  },
  Chandra: {
    hi: 'चन्द्र महादशा', en: 'Moon', years: 10, emoji: '🌙',
    color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/30',
    domains: 'Mind, emotions, mother, home, intuition, water, travel, public',
    mantra: 'Om Shraam Shreem Shraum Sah Chandraaya Namah',
    pros: 'Emotional fulfilment, strong intuition, public popularity, peaceful home life, good for spiritual pursuits and creative arts.',
    cons: 'Emotional instability, mood swings, over-sensitivity, disturbed sleep, issues with mother or women in life.',
    remedies: 'Fast on Mondays, worship Devi (Durga, Lakshmi), keep silver with you, chant Chandra mantra 108 times at night.',
  },
  Mangal: {
    hi: 'मंगल महादशा', en: 'Mars', years: 7, emoji: '🔴',
    color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30',
    domains: 'Courage, energy, siblings, land, property, discipline, surgery, sports',
    mantra: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',
    pros: 'Surge of physical energy, courage to take bold action, success in sports and physical endeavours, property gains, sibling support.',
    cons: 'Aggression, accidents, conflicts, surgery risks, impulsiveness, fire/blood-related health issues.',
    remedies: 'Worship Hanuman on Tuesdays, donate red lentils, avoid anger and haste, wear red coral (if well-placed).',
  },
  Rahu: {
    hi: 'राहु महादशा', en: 'Rahu (North Node)', years: 18, emoji: '🌀',
    color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/30',
    domains: 'Ambition, illusion, foreign lands, technology, unconventional paths, sudden events',
    mantra: 'Om Bhram Bhreem Bhraum Sah Rahave Namah',
    pros: 'Rapid material gains, success in technology and mass media, foreign travel and connections, breakthroughs via unconventional methods, sudden rise.',
    cons: 'Confusion, obsession, deception from others, hidden enemies, health issues hard to diagnose, karmic debts surfacing.',
    remedies: 'Worship Durga or Kali, feed dogs, donate blue/black items on Saturdays, meditate to strengthen inner clarity.',
  },
  Guru: {
    hi: 'गुरु महादशा', en: 'Jupiter', years: 16, emoji: '🪐',
    color: 'text-yellow-300', bg: 'bg-yellow-400/10 border-yellow-400/30',
    domains: 'Wisdom, dharma, children, higher education, spirituality, wealth, guru',
    mantra: 'Om Graam Greem Graum Sah Gurave Namah',
    pros: 'Spiritual awakening, academic success, wealth and prosperity, children\'s blessings, finding a genuine guru or mentor, deep dharmic clarity.',
    cons: 'Overconfidence, excess weight gain, liver problems, complacency, over-generosity leading to financial strain.',
    remedies: 'Worship Vishnu on Thursdays, offer turmeric and yellow flowers, donate to Brahmins, wear yellow sapphire (if suited).',
  },
  Shani: {
    hi: 'शनि महादशा', en: 'Saturn', years: 19, emoji: '⏳',
    color: 'text-blue-300', bg: 'bg-blue-400/10 border-blue-400/30',
    domains: 'Karma, discipline, delays, service, longevity, old age, justice, labour',
    mantra: 'Om Praam Preem Praum Sah Shanaischaraya Namah',
    pros: 'Karmic purification, lasting rewards for honest effort, discipline and endurance, career stability through merit, spiritual depth through solitude.',
    cons: 'Slowdowns, delays, hardship and struggle, joint/bone issues, separation from loved ones, heavy responsibilities.',
    remedies: 'Worship Shani on Saturdays, light sesame oil lamp, serve the elderly and disabled, wear blue sapphire only after expert consultation.',
  },
  Budha: {
    hi: 'बुध महादशा', en: 'Mercury', years: 17, emoji: '☿',
    color: 'text-emerald-300', bg: 'bg-emerald-400/10 border-emerald-400/30',
    domains: 'Intellect, communication, business, writing, trade, education, youthfulness',
    mantra: 'Om Braam Breem Braum Sah Budhaya Namah',
    pros: 'Sharp intellect, business success, excellent communication, educational achievements, networking, writing and speaking opportunities.',
    cons: 'Over-thinking, nervous system stress, indecisiveness, skin or speech disorders, trust issues in partnerships.',
    remedies: 'Worship Vishnu on Wednesdays, donate green clothes or moong dal, read sacred texts, wear emerald (if well-placed).',
  },
  Ketu: {
    hi: 'केतु महादशा', en: 'Ketu (South Node)', years: 6, emoji: '☄️',
    color: 'text-teal-300', bg: 'bg-teal-400/10 border-teal-400/30',
    domains: 'Spirituality, liberation, past life karma, mysticism, healing, sudden events',
    mantra: 'Om Sraam Sreem Sraum Sah Ketave Namah',
    pros: 'Deep spiritual insights, psychic abilities, liberation from attachments, healing gifts, ancestral blessings, unexpected moksha-related experiences.',
    cons: 'Confusion about identity and direction, mysterious illnesses, isolation, sudden losses, difficulty in the material world.',
    remedies: 'Worship Ganesha, donate multi-coloured blankets, perform ancestral rites (Pitru Tarpan), avoid ego-driven ambitions.',
  },
  Shukra: {
    hi: 'शुक्र महादशा', en: 'Venus', years: 20, emoji: '💎',
    color: 'text-pink-300', bg: 'bg-pink-400/10 border-pink-400/30',
    domains: 'Love, marriage, beauty, arts, luxury, pleasure, relationships, women',
    mantra: 'Om Draam Dreem Draum Sah Shukraya Namah',
    pros: 'Romantic fulfilment, marriage and partnership bliss, artistic creativity, wealth and luxury, social charm, enjoyment of life\'s pleasures.',
    cons: 'Overindulgence, laziness, relationship complications, kidney or reproductive issues, materialistic attachment.',
    remedies: 'Worship Lakshmi on Fridays, donate white clothes or sweets, practice brahmacharya in thought, wear diamond or white sapphire (if suited).',
  },
};

// Helper: compute antardasha list for any mahadasha (client-side pure function)
function getAntardashaDates(dashaEntry: { planet: string; startDate: string; endDate: string }): AntardashaEntry[] {
  const DASHA_ORDER_LOCAL = ['Ketu','Shukra','Surya','Chandra','Mangal','Rahu','Guru','Shani','Budha'];
  const DASHA_YEARS_LOCAL: Record<string, number> = {
    Ketu:6, Shukra:20, Surya:6, Chandra:10, Mangal:7, Rahu:18, Guru:16, Shani:19, Budha:17,
  };
  const startMs = new Date(dashaEntry.startDate).getTime();
  const endMs   = new Date(dashaEntry.endDate).getTime();
  const durMs   = endMs - startMs;
  const order   = DASHA_ORDER_LOCAL.indexOf(dashaEntry.planet);
  let cursor    = startMs;
  return DASHA_ORDER_LOCAL.map((_, i) => {
    const sub  = DASHA_ORDER_LOCAL[(order + i) % 9];
    const dur  = (DASHA_YEARS_LOCAL[sub] / 120) * durMs;
    const end  = Math.min(cursor + dur, endMs);
    const entry: AntardashaEntry = {
      planet:    sub,
      startDate: new Date(cursor).toISOString().split('T')[0],
      endDate:   new Date(end).toISOString().split('T')[0],
    };
    cursor = end;
    return entry;
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PanchangClient({ lat, lon, city, tradition = 'hindu', timezone }: Props) {
  const { t, lang, setLang } = useLanguage();
  const { playHaptic } = useZenithSensory();
  const tradMeta = TRADITION_META[tradition] ?? TRADITION_META.hindu;
  const today    = useMemo(() => new Date(), []);
  const [selected,   setSelected]  = useState<Date>(today);
  const [viewYear,   setViewYear]  = useState(today.getFullYear());
  const [viewMonth,  setViewMonth] = useState(today.getMonth());

  // Unified Page Tabs
  const [activeTab, setActiveTab] = useState<'panchang' | 'rashiphal' | 'kundali'>('panchang');

  // Rashiphal Tab State
  const [selectedRashi, setSelectedRashi] = useState<string>('aries');

  // Kundali Tab State
  const [kundaliInput, setKundaliInput] = useState<KundaliInput>({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: city || '',
    lat: lat || 28.6139,
    lng: lon || 77.2090,
    timezone: timezone || 'Asia/Kolkata',
  });
  const [kundaliResult,  setKundaliResult]  = useState<KundaliResult | null>(null);
  const [kundaliLoading, setKundaliLoading] = useState(false);
  const [kundaliError,   setKundaliError]   = useState<string | null>(null);
  const [chartSaved,     setChartSaved]     = useState(false);
  const [saveError,      setSaveError]      = useState<string | null>(null);

  // Auth + saved profiles
  const [isLoggedIn,    setIsLoggedIn]    = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);

  // Recent searches (localStorage)
  const [recentSearches, setRecentSearches] = useState<KundaliInput[]>([]);

  // Text size preference: 'sm' | 'md' | 'lg'
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Interactive Dasha — which mahadasha pill is expanded (index 0-8, or null)
  const [selectedDashaIdx, setSelectedDashaIdx] = useState<number | null>(null);

  // Location autocomplete
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ display: string; lat: number; lng: number; timezone: string }>>([]);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const locTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Diaspora features
  const [displayTz, setDisplayTz] = useState<'local' | 'ist'>('local');
  const [upcomingObservances, setUpcomingObservances] = useState<any[]>([]);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('shoonaya_dismissed_ekadashi')) setDismissedBanner(true);
    } catch {}

    const tzQuery = timezone || 'Asia/Kolkata';
    fetch(`/api/calendar/upcoming?days=14&tz=${encodeURIComponent(tzQuery)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.observances) setUpcomingObservances(data.observances);
      })
      .catch(() => {});
  }, [timezone]);

  // Memoize today's transit positions — expensive computation, run once per mount
  const todayTransits = useMemo(() => {
    try { return getTodayTransits(); } catch { return null; }
  }, []);

  // Dynamic Localization: Automatically translate Kundali output when language changes
  useEffect(() => {
    setKundaliResult((current) => {
      if (!current) return current;
      try {
        return generateKundali(current.input, lang);
      } catch {
        return current;
      }
    });
  }, [lang]);

  const p: SacredCalendarData = useSacredCalendar(selected, lat, lon, tradition, displayTz === 'ist' ? 'Asia/Kolkata' : timezone);

  // ── Web Audio Graha Beeja Resonance Synthesizer ─────────────────────────────
  const [isPlayingResonance, setIsPlayingResonance] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const startResonance = (freq: number) => {
    try {
      stopResonance();

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0, ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.7);
      gainRef.current = mainGain;

      // Fundamental pure tone (Sine)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      osc1Ref.current = osc1;

      // Cozy harmonic secondary (Triangle)
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime);
      osc2Ref.current = osc2;

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.08, ctx.currentTime);

      // Lowpass filtering to make the sound soft and temple-like
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      setIsPlayingResonance(true);
      playHaptic('heavy');
    } catch (e) {
      console.error("Audio Context Failed", e);
    }
  };

  const stopResonance = () => {
    try {
      if (gainRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        gainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        
        const o1 = osc1Ref.current;
        const o2 = osc2Ref.current;
        const g = gainRef.current;
        const c = audioCtxRef.current;
        
        setTimeout(() => {
          try {
            o1?.stop();
            o2?.stop();
            c?.close();
          } catch {}
        }, 500);
      }
    } catch {}
    setIsPlayingResonance(false);
    osc1Ref.current = null;
    osc2Ref.current = null;
    gainRef.current = null;
    audioCtxRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopResonance();
    };
  }, [activeTab, selectedRashi]);

  // ── Auth state + load saved profiles ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const client = createClient();
    client.auth.getUser().then(({ data }) => {
      const loggedIn = !!data.user;
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        fetch('/api/jyotish/birth-profiles')
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.profiles) setSavedProfiles(d.profiles); })
          .catch(() => {});
      }
    });
  }, []);

  // ── Location autocomplete ─────────────────────────────────────────────────────
  function handleLocationChange(val: string) {
    setKundaliInput(prev => ({ ...prev, birthPlace: val }));
    setShowLocSuggestions(false);
    if (locTimerRef.current) clearTimeout(locTimerRef.current);
    if (val.length < 3) { setLocationSuggestions([]); return; }
    locTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/jyotish/geocode?q=${encodeURIComponent(val)}&multi=1`);
        if (!res.ok) return;
        const data = await res.json();
        // API returns single result — wrap in array for now
        const results = data.results ?? (data.lat ? [{ display: data.display ?? val, lat: data.lat, lng: data.lng, timezone: data.timezone }] : []);
        setLocationSuggestions(results.slice(0, 5));
        setShowLocSuggestions(results.length > 0);
      } catch { /* ignore */ }
    }, 400);
  }

  // ── Load recent searches from localStorage ────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kundali_recent');
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
    } catch {}
  }, []);

  // ── Live Vedic Hora Timing Calculator ─────────────────────────────────────────
  const getLiveHora = (): string => {
    const hr = today.getHours();
    const dayOfWeek = today.getDay(); // 0-6

    // Hours elapsed relative to standard 6:00 AM Sunrise
    const hoursSinceSunrise = (hr >= 6) ? (hr - 6) : (hr + 18);

    const WEEKDAY_BASE_PLANET = ['Surya (Sun)', 'Chandra (Moon)', 'Mangal (Mars)', 'Budha (Mercury)', 'Guru (Jupiter)', 'Shukra (Venus)', 'Shani (Saturn)'];
    const SEQUENCE = ['Surya (Sun)', 'Shukra (Venus)', 'Budha (Mercury)', 'Chandra (Moon)', 'Shani (Saturn)', 'Guru (Jupiter)', 'Mangal (Mars)'];

    const startPlanet = WEEKDAY_BASE_PLANET[dayOfWeek];
    const startIndex = SEQUENCE.indexOf(startPlanet);

    const activeIndex = (startIndex + hoursSinceSunrise) % 7;
    const planetName = SEQUENCE[activeIndex];

    const HORA_PURPOSES: Record<string, string> = {
      'Surya (Sun)': 'Auspicious for leadership, focus, and solar meditations.',
      'Chandra (Moon)': 'Highly auspicious for peace, emotional clarity, and devotion.',
      'Mangal (Mars)': 'Best for physical courage, organizing, and active sadhana.',
      'Budha (Mercury)': 'Auspicious for business meetings, shastra study, and writing.',
      'Guru (Jupiter)': 'Blessed for receiving spiritual mantras, yoga, and guru connection.',
      'Shukra (Venus)': 'Auspicious for music, temple art, relationships, and wellness.',
      'Shani (Saturn)': 'Auspicious for quiet solitude, discipline, and tapasya.'
    };

    return `${planetName} Hora · ${HORA_PURPOSES[planetName] ?? 'Auspicious for devotion'}`;
  };

  // ── Compute sky phase ────────────────────────────────────────────────────────
  const skyPhase = useMemo(() => {
    const nowMin      = today.getHours() * 60 + today.getMinutes();
    const sunriseMin  = parseSunTime(p.sunrise);
    const sunsetMin   = parseSunTime(p.sunset);
    return getSkyPhase(nowMin, sunriseMin, sunsetMin);
  }, [today, p.sunrise, p.sunset]);

  // ── Calendar grid ────────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const isToday   = isSameDay(selected, today);
  const dateLabel = selected.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const isNight  = skyPhase === 'night' || skyPhase === 'predawn' || skyPhase === 'evening';
  const orb      = SKY_ORB[skyPhase];

  async function share() {
    let text = '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shoonaya.com';

    if (activeTab === 'panchang') {
      const link = `${origin}/panchang`;
      text = `Read & check your panchang following this link to open the feature: ${link}\n\n` +
        `🪔 Panchang — ${dateLabel}\n\n` +
        `📅 Tithi: ${p.tithi} (${p.paksha} Paksha)\n` +
        `⭐ Nakshatra: ${p.nakshatra}\n🕉️ Yoga: ${p.yoga}\n📆 Vara: ${p.vara}\n` +
        `🌅 Sunrise: ${p.sunrise}  🌆 Sunset: ${p.sunset}\n` +
        `⚠️ Rahu Kaal: ${p.rahuKaal}\n✨ Abhijit Muhurat: ${p.abhijitMuhurat}\n\n— Shoonaya`;
    } else if (activeTab === 'rashiphal') {
      const h = getDailyHoroscope(selectedRashi, selected);
      const link = `${origin}/panchang?tab=rashiphal`;
      text = `Read & check your rashiphal following this link to open those features: ${link}\n\n` +
        `🐏 Daily Rashiphal for ${h.rashiSanskrit} (${h.rashi}) — ${dateLabel}\n\n` +
        `📿 Sadhana Focus: ${h.sadhanaFocus}\n` +
        `💼 Karma & Focus: ${h.karma}\n` +
        `🌿 Aura & Health: ${h.health}\n` +
        `✨ Lucky Color: ${h.luckyColor} | Lucky Number: ${h.luckyNumber}\n\n— Shoonaya`;
    } else {
      const link = `${origin}/panchang?tab=kundali`;
      text = `Read & check your Vedic Kundali chart following this link to open those features: ${link}\n\n` +
        `🛕 Vedic Kundali Chart for ${kundaliResult?.input.name ?? 'Pilgrim'}\n\n` +
        `🌟 Lagna Ascendant: ${kundaliResult?.lagnaSign} (${kundaliResult?.lagnaEnglish})\n` +
        `🔮 Alignment: ${kundaliResult?.lagnaReading}\n\n— Shoonaya`;
    }

    if (navigator.share) { try { await navigator.share({ title: 'Astrology Hub', text }); return; } catch {} }
    try {
      await navigator.clipboard.writeText(text);
      const toast = (await import('react-hot-toast')).default;
      toast.success('Copied to clipboard 📋');
    } catch { /* clipboard not available */ }
  }

  return (
    // Full-bleed atmospheric wrapper — extends behind safe areas
    <div className="relative -mx-4 -mt-4 pb-28 min-h-screen" style={{ background: SKY_GRADIENTS[skyPhase] }}>

      {/* ── Stars (night phases) ──────────────────────────────────────── */}
      {isNight && <Stars />}

      {/* ── Animated sky orb (sun / moon) ────────────────────────────── */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: orb.size, height: orb.size,
          background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
          top: '4%', left: '50%', translateX: '-50%',
          filter: 'blur(2px)',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [orb.opacity * 0.8, orb.opacity, orb.opacity * 0.8] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Horizon glow ─────────────────────────────────────────────── */}
      {(skyPhase === 'dawn' || skyPhase === 'dusk') && (
        <motion.div
          className="absolute inset-x-0 pointer-events-none"
          style={{
            top: '10%', height: '30%',
            background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${
              skyPhase === 'dawn' ? 'rgba(255,140,50,0.35)' : 'rgba(200,60,20,0.35)'
            }, transparent 70%)`,
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 px-4 pt-16 space-y-3">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/home"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <ArrowLeft size={16} className="text-white/80" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 600, color: '#F2EAD6', letterSpacing: '-0.01em', lineHeight: 1.2 }}>Astrology Hub</h1>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white/90"
                style={{ background: tradMeta.accent }}>
                {tradMeta.badge}
              </span>
            </div>
            <p className="text-white/50 text-xs mt-0.5">
              {PHASE_LABELS[skyPhase]}{city ? ` · 📍 ${city}` : ''}
            </p>
            {timezone && timezone !== 'Asia/Kolkata' && (
              <div className="mt-1 flex items-center gap-2">
                <button
                  onClick={() => setDisplayTz(t => t === 'local' ? 'ist' : 'local')}
                  className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  <span className={displayTz === 'local' ? 'text-[#C5A059]' : 'opacity-60'}>Your time</span>
                  <span className="opacity-40">↔</span>
                  <span className={displayTz === 'ist' ? 'text-[#C5A059]' : 'opacity-60'}>IST</span>
                </button>
              </div>
            )}
          </div>
          <button onClick={share}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }} aria-label="Share">
            <Share2 size={15} className="text-white/80" />
          </button>
        </div>

        {/* Unauthenticated Prompt */}
        {!isLoggedIn && lat === 28.6139 && lon === 77.2090 && (
          <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-sm">📍</span>
            <p className="text-[11px] text-white/70 flex-1">Showing panchang for New Delhi.</p>
            <Link href="/auth" className="text-[11px] font-bold text-[#C5A059] px-2 py-1 rounded bg-white/5">Sign in for local times</Link>
          </div>
        )}

        {/* Smart Banner */}
        {(() => {
          if (dismissedBanner || upcomingObservances.length === 0) return null;
          const todayIso = localSpiritualDate(timezone, 4);
          const todayObs = upcomingObservances.find(o => o.date === todayIso);
          if (!todayObs) return null;

          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-xl p-3 border"
              style={{
                background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.15), rgba(197, 160, 89, 0.05))',
                borderColor: 'rgba(197, 160, 89, 0.3)',
              }}
            >
              <button
                onClick={() => {
                  try { sessionStorage.setItem('shoonaya_dismissed_ekadashi', 'true'); } catch {}
                  setDismissedBanner(true);
                }}
                className="absolute top-2 right-2 text-[#C5A059]/60 hover:text-[#C5A059]"
              >
                <X size={14} />
              </button>
              <div className="flex items-center gap-2.5">
                <span className="text-xl leading-none">{todayObs.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-[#F2EAD6]">{todayObs.display_name}</p>
                  <p className="text-[11px] text-[#C5A059] font-medium opacity-90 mt-0.5">Today in your timezone</p>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Premium Hub Navigation Tabs */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-black/25 border border-white/5 backdrop-blur-sm">
          {[
            { id: 'panchang',  label: '📅 Panchang' },
            { id: 'rashiphal', label: '🐏 Rashiphal' },
            { id: 'kundali',   label: '🛕 Kundali' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                playHaptic('light');
              }}
              className={`py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-[#C5A059] text-[#1c1c1a] shadow-md font-bold'
                  : 'text-white/60 hover:text-white/90'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: PANCHANG CONTENT ─────────────────────────────────────── */}
        {activeTab === 'panchang' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {/* Paksha banner */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${tradMeta.accent}dd, ${tradMeta.accent}99)`, border: `1px solid rgba(255,255,255,0.12)` }}>
              <span className="text-2xl">🪔</span>
              <div>
                <p className="text-white font-bold text-sm">{p.paksha} Paksha · {p.masaName} {p.labels.monthLabel}</p>
                <p className="text-white/60 text-[11px] mt-0.5">{p.vara} · {tradMeta.note}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-white/80 text-xs font-semibold">{p.sunrise}</p>
                <p className="text-white/40 text-[10px]">sunrise</p>
              </div>
            </motion.div>

            {/* Festival Strip */}
            {upcomingObservances.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 snap-x">
                {upcomingObservances.filter(o => o.date !== localSpiritualDate(timezone, 4)).slice(0, 5).map(obs => {
                  const [y, m, d] = obs.date.split('-');
                  const localDateLabel = new Date(Number(y), Number(m)-1, Number(d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  
                  return (
                    <Link
                      href={obs.route_slug ? `/${obs.route_kind || 'festivals'}/${obs.route_slug}` : '#'}
                      key={`${obs.slug}-${obs.date}`}
                      className="snap-start flex-shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 border transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <span className="text-sm leading-none">{obs.emoji}</span>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-white/90 whitespace-nowrap">{obs.display_name}</span>
                        <span className="text-[9px] text-[#C5A059]">{localDateLabel}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Calendar */}
            <GlassCard className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={prevMonth}
                  className="w-11 h-11 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }} aria-label="Go back">
                  <ChevronLeft size={15} className="text-white/70" />
                </button>
                <div className="text-center">
                  <p className="font-semibold text-white text-sm">{MONTHS[viewMonth]} {viewYear}</p>
                  <p className="text-white/40 text-[10px] mt-0.5">
                    {p.masaName} {p.labels.monthLabel} · {p.calendarName}
                  </p>
                </div>
                <button onClick={nextMonth}
                  className="w-11 h-11 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }} aria-label="Next">
                  <ChevronRight size={15} className="text-white/70" />
                </button>
              </div>

              <div className="grid grid-cols-7" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {DAY_LABELS.map(d => (
                  <div key={d} className="py-2 text-center text-[10px] font-medium text-white/35">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 p-2 gap-1">
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={`e-${i}`} />;
                  const isSelected    = isSameDay(date, selected);
                  const isCurrentDay  = isSameDay(date, today);
                  const dayP = calculatePanchang(date, lat, lon);
                  return (
                    <motion.button
                      key={date.toISOString()}
                      onClick={() => { 
                        setSelected(date);
                        playHaptic('medium');
                      }}
                      whileTap={{ scale: 0.88 }}
                      className="relative flex flex-col items-center justify-center rounded-xl py-1.5 transition-all"
                      style={
                        isSelected    ? { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }
                        : isCurrentDay ? { border: `1px solid ${tradMeta.accent}`, background: `${tradMeta.accent}20` }
                        : { background: 'transparent' }
                      }>
                      <span className={`text-xs font-semibold leading-none ${isSelected ? 'text-white' : isCurrentDay ? 'text-white' : 'text-white/70'}`}>
                        {date.getDate()}
                      </span>
                      <span className={`text-[8px] leading-none mt-0.5 ${isSelected ? 'text-white/60' : 'text-white/30'}`}>
                        {dayP.tithiIndex}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </GlassCard>

            {/* Date label */}
            <div className="flex flex-col gap-1 px-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tradMeta.accent }} />
                <p className="text-xs font-semibold text-white/70">{isToday ? 'Today — ' : ''}{dateLabel}</p>
              </div>
              {isToday && (
                <div className="mt-1 flex items-center gap-1.5 bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] px-3 py-1.5 rounded-xl self-start">
                  <span className="animate-pulse text-[10px]">⏳</span>
                  <span className="text-[9px] font-bold tracking-wide uppercase">Live Hora:</span>
                  <span className="text-[10px] font-semibold text-white/95">{getLiveHora()}</span>
                </div>
              )}
            </div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2">

              <div className="space-y-2">
                <Row emoji="📅" label={t('tithi')} value={`${p.tithi} · ${p.paksha} Paksha`} upto={p.tithiUpto} accent={tradMeta.accent} infoKey="Tithi" />
                <Row emoji="⭐" label={t('nakshatra')} value={p.nakshatra} upto={p.nakshatraUpto} accent={tradMeta.accent} infoKey="Nakshatra" />
                <Row emoji="🕉️" label={t('yoga')} value={p.yoga} upto={p.yogaUpto} accent={tradMeta.accent} infoKey="Yoga" />
                <Row emoji="🃏" label="Karana" value={p.karana} upto={p.karanaUpto} accent={tradMeta.accent} infoKey="Karana" />
                <Row emoji="📆" label={t('vara')} value={p.vara} accent={tradMeta.accent} infoKey="Vara" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Row emoji="🌅" label={t('sunrise')} value={p.sunrise} accent={tradMeta.accent} infoKey="Sunrise" isLocal={displayTz === 'local' && !!timezone && timezone !== 'Asia/Kolkata'} />
                <Row emoji="🌆" label={t('sunset')}  value={p.sunset}  accent={tradMeta.accent} infoKey="Sunset" isLocal={displayTz === 'local' && !!timezone && timezone !== 'Asia/Kolkata'} />
              </div>

              {'brahmaMuhurta' in p && (
                <Row emoji="🌙" label="Brahma Muhurta" value={(p as any).brahmaMuhurta} accent={tradMeta.accent} infoKey="Brahma Muhurta" isLocal={displayTz === 'local' && !!timezone && timezone !== 'Asia/Kolkata'} />
              )}

              <Row emoji="⚠️" label={t('rahuKaal')} value={p.rahuKaal} accent={tradMeta.accent} warn infoKey="Rahu Kaal" isLocal={displayTz === 'local' && !!timezone && timezone !== 'Asia/Kolkata'} />
              <Row emoji="✨" label={t('abhijitMuhurat')} value={p.abhijitMuhurat} accent={tradMeta.accent} infoKey="Abhijit Muhurat" isLocal={displayTz === 'local' && !!timezone && timezone !== 'Asia/Kolkata'} />

              {'samvatYear' in p && (
                <div className="rounded-xl px-4 py-2.5 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Vikram Samvat</span>
                  <span className="text-white/80 text-sm font-semibold ml-auto">
                    {(p as any).samvatYear} {(p as any).samvatName}
                  </span>
                </div>
              )}

              <div className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,200,100,0.08)', border: '1px solid rgba(255,200,100,0.15)' }}>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  <span className="font-semibold text-amber-200">Today&apos;s guidance:</span>{' '}
                  {p.paksha === 'Shukla'
                    ? 'Shukla Paksha — auspicious for new beginnings, prayers, and blessings. Act and grow.'
                    : 'Krishna Paksha — quiet reflection. Focus on purification, ancestral gratitude, and inward practices.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── TAB 2: RASHIPHAL CONTENT ────────────────────────────────────── */}
        {activeTab === 'rashiphal' && (
          <div className="space-y-4">
            {/* Horizontal Rashi/Zodiac sign selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
              {RASHI_LIST.map((rashi) => {
                const isSelected = selectedRashi === rashi.key;
                return (
                  <button
                    key={rashi.key}
                    onClick={() => {
                      setSelectedRashi(rashi.key);
                      playHaptic('medium');
                    }}
                    className={`flex-shrink-0 snap-center flex flex-col items-center px-4 py-2.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#C5A059]/15 text-white'
                        : 'border-white/5 bg-black/25 text-white/50 hover:border-white/10'
                    }`}
                  >
                    <span className="text-xl">{rashi.symbol}</span>
                    <span className="text-xs font-bold mt-1">{rashi.sa}</span>
                    <span className="text-[9px] opacity-60 uppercase">{rashi.en}</span>
                  </button>
                );
              })}
            </div>

            {/* Generated Horoscope details */}
            {(() => {
              const h = getDailyHoroscope(selectedRashi, selected);
              return (
                <motion.div
                  key={selectedRashi}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {/* Hero Information Card */}
                  <div className="rounded-2xl p-4 border border-white/5 flex flex-col gap-3"
                    style={{ background: 'rgba(10,8,25,0.65)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-2xl">
                        {h.symbol}
                      </div>
                      <div>
                        <h2 className="font-serif text-lg font-bold text-[#F2EAD6]">{h.rashiSanskrit} ({h.rashi})</h2>
                        <p className="text-white/40 text-xs">Ruling Graha: {h.lord}</p>
                      </div>
                      <span className="ml-auto text-[10px] font-semibold bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full">
                        ● Active
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                      <div className="text-center p-2 rounded-xl bg-white/5">
                        <p className="text-[9px] text-white/30 uppercase font-medium">Lucky Color</p>
                        <p className="text-xs font-semibold text-white/80 mt-0.5">{h.luckyColor}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-white/5">
                        <p className="text-[9px] text-white/30 uppercase font-medium">Lucky Number</p>
                        <p className="text-xs font-semibold text-[#C5A059] mt-0.5">{h.luckyNumber}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-white/5">
                        <p className="text-[9px] text-white/30 uppercase font-medium">Lucky Time</p>
                        <p className="text-[9px] font-semibold text-white/80 mt-0.5 leading-tight">{h.luckyTime.split(' (')[0]}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pandit AI Cosmic Channeled Oracle */}
                  {'panditAiOracle' in h && (
                    <div className="rounded-2xl p-4 border border-[#C5A059]/40 space-y-2 relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.08) 0%, rgba(10,8,25,0.85) 100%)' }}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/10 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📿</span>
                        <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">Pandit AI Daily Oracle</h3>
                      </div>
                      <p className="text-sm font-medium text-[#F2EAD6]/90 leading-relaxed italic">
                        &ldquo;{(h as any).panditAiOracle}&rdquo;
                      </p>
                      <p className="text-[10px] text-white/35 leading-relaxed border-t border-white/5 pt-2">
                        {(h as any).accuracyNote}
                      </p>
                    </div>
                  )}

                  {/* True gochar layer */}
                  {'transitHighlights' in h && (
                    <div className="rounded-2xl p-4 border border-white/5 space-y-3"
                      style={{ background: 'rgba(10,8,25,0.65)' }}>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🪐</span>
                        <div>
                          <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">Gochar layer</h3>
                          <p className="text-[11px] text-white/45 mt-1 leading-relaxed">{(h as any).gocharSummary}</p>
                          <p className="text-[11px] text-[#F2EAD6]/75 mt-1 leading-relaxed">{(h as any).moonTransit}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(h as any).transitHighlights.slice(0, 4).map((item: any, idx: number) => (
                          <div key={`${item.title}-${idx}`}
                            className={`rounded-xl px-3 py-2 border ${
                              item.tone === 'support'
                                ? 'border-emerald-500/20 bg-emerald-500/8'
                                : item.tone === 'discipline'
                                  ? 'border-orange-500/25 bg-orange-500/8'
                                  : 'border-white/8 bg-white/4'
                            }`}>
                            <p className="text-[10px] font-bold text-white/75">{item.title}</p>
                            <p className="text-[10px] text-white/45 leading-relaxed mt-0.5">{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Planetary Dhyana Shloka */}
                  {'shloka' in h && (
                    <div className="rounded-2xl p-4 border border-white/5 space-y-3"
                      style={{ background: 'rgba(10,8,25,0.65)' }}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">📜</span>
                        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Graha Dhyana Shloka</h4>
                      </div>
                      <div className="text-center py-2 px-1">
                        <p className="font-serif text-base text-[#F2EAD6] font-medium leading-relaxed tracking-wide">
                          {(h as any).shloka}
                        </p>
                        <p className="text-xs text-[#C5A059]/90 italic mt-3 leading-relaxed">
                          &ldquo;{(h as any).shlokaTranslation}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Graha Sound Resonance (Web Audio API Synthesizer) */}
                  {'beejaMantra' in h && (
                    <div className="rounded-2xl p-4 border border-[#C5A059]/30 space-y-4 relative overflow-hidden"
                      style={{ background: 'rgba(10,8,25,0.75)' }}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔊</span>
                          <div>
                            <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider">Graha Sound Resonance</h4>
                            <p className="text-[10px] text-white/40 mt-0.5">Tune your energy into the planet&apos;s physical frequency</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-2 py-0.5 rounded-md">
                          {(h as any).beejaFrequency} Hz
                        </span>
                      </div>

                      {isPlayingResonance ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-4 border border-[#C5A059]/20 bg-[#C5A059]/5 rounded-xl">
                          {/* Pulsing expander ring */}
                          <div className="relative w-16 h-16 flex items-center justify-center">
                            <span className="absolute inset-0 rounded-full bg-[#C5A059]/20 animate-ping" />
                            <span className="absolute inset-2 rounded-full bg-[#C5A059]/30 animate-pulse" />
                            <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center text-[#1c1c1a] font-bold text-sm">
                              🕉️
                            </div>
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-xs text-white/40 uppercase tracking-wider font-bold">Resonating Mantra</p>
                            <p className="font-serif text-lg text-[#F2EAD6] font-bold tracking-wide">
                              {(h as any).beejaMantra}
                            </p>
                            <p className="text-[10px] text-white/50 italic mt-1">Close your eyes and hum along in perfect pitch</p>
                          </div>

                          <button
                            onClick={() => {
                              stopResonance();
                              playHaptic('light');
                            }}
                            className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-[#F2EAD6] border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition"
                          >
                            🛑 Stop Resonance Hum
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-white/60 leading-relaxed">
                              This sound engine generates a real-time deep temple drone at the cosmic pitch of <span className="text-[#C5A059] font-bold">{(h as any).beejaFrequency}Hz</span>. Chant the sacred beeja mantra while humming to balance the active Graha.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              startResonance((h as any).beejaFrequency);
                            }}
                            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-[#1c1c1a] bg-[#C5A059] hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2"
                          >
                            📿 Start Cosmic Sound Resonance
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Daily Sadhana Focus Card (Featured Shoonaya Experience!) */}
                  <div className="rounded-2xl p-4 border border-[#C5A059]/35 space-y-2 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.12) 0%, rgba(10,8,25,0.7) 100%)' }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📿</span>
                      <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">Today&apos;s Sadhana Focus</h3>
                    </div>
                    <p className="text-sm font-medium text-[#F2EAD6] leading-relaxed pr-6">{h.sadhanaFocus}</p>
                    {'sadhanaPlan' in h && (
                      <div className="grid gap-2 pt-2">
                        {(h as any).sadhanaPlan.map((step: any) => (
                          <div key={step.label} className="rounded-xl border border-[#C5A059]/15 bg-[#C5A059]/5 px-3 py-2">
                            <p className="text-[9px] uppercase tracking-wider font-bold text-[#C5A059]/75">{step.label}</p>
                            <p className="text-[11px] text-[#F2EAD6]/75 leading-relaxed mt-0.5">{step.action}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interpretations for work/life */}
                  <div className="space-y-2">
                    <div className="rounded-2xl p-4 border border-white/5 flex gap-3 items-start"
                      style={{ background: 'rgba(10,8,25,0.5)' }}>
                      <span className="text-xl mt-0.5">💼</span>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Karma &amp; Career</h4>
                        <p className="text-sm text-white/85 leading-relaxed">{h.karma}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl p-4 border border-white/5 flex gap-3 items-start"
                      style={{ background: 'rgba(10,8,25,0.5)' }}>
                      <span className="text-xl mt-0.5">🌿</span>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Vitality &amp; Health</h4>
                        <p className="text-sm text-white/85 leading-relaxed">{h.health}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl p-4 border border-white/5 flex gap-3 items-start"
                      style={{ background: 'rgba(10,8,25,0.5)' }}>
                      <span className="text-xl mt-0.5">💖</span>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Love &amp; Connections</h4>
                        <p className="text-sm text-white/85 leading-relaxed">{h.love}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}

        {/* ── TAB 3: KUNDALI CONTENT ──────────────────────────────────────── */}
        {activeTab === 'kundali' && (
          <div className="space-y-4">
            {kundaliResult === null ? (
              /* Generate Form */
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5 border border-white/5 space-y-4"
                style={{ background: 'rgba(10,8,25,0.65)' }}
              >
                <div className="text-center space-y-1">
                  <span className="text-3xl">🛕</span>
                  <h2 className="font-serif text-lg font-bold text-[#F2EAD6]">{t('vedicKundaliChart')}</h2>
                  <p className="text-white/40 text-xs">{t('enterBirthDetails')}</p>
                </div>

                <div className="space-y-3">
                  {/* Saved profiles (logged-in) — full card list with load + count */}
                  {isLoggedIn && savedProfiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase font-bold text-white/35 tracking-wider">
                          {t('savedCharts')} · {savedProfiles.length}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        {savedProfiles.map((sp: any) => (
                          <div key={sp.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 transition group">
                            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/25 flex items-center justify-center text-sm flex-shrink-0">
                              {sp.is_primary ? '⭐' : '🪐'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white/80 truncate">
                                {sp.full_name ?? sp.label ?? 'Chart'}
                              </p>
                              <p className="text-[9px] text-white/35 mt-0.5">
                                {sp.date_of_birth ?? ''}{sp.birth_city ? ` · ${sp.birth_city}` : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setKundaliInput(prev => ({
                                  ...prev,
                                  name:       sp.full_name ?? sp.label ?? '',
                                  birthDate:  sp.date_of_birth ?? '',
                                  birthTime:  sp.time_of_birth ?? '',
                                  birthPlace: sp.birth_city ?? '',
                                  lat:        sp.birth_lat ?? prev.lat,
                                  lng:        sp.birth_lng ?? prev.lng,
                                  timezone:   sp.birth_timezone ?? prev.timezone,
                                }));
                              }}
                              className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-bold border border-[#C5A059]/30 text-[#C5A059] bg-[#C5A059]/8 hover:bg-[#C5A059]/18 transition"
                            >
                              Load
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent searches quick-load */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase font-bold text-white/35 tracking-wider">{t('recent')}</p>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {recentSearches.map((rs, i) => (
                          <button
                            key={i}
                            onClick={() => setKundaliInput(rs)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-white/60 hover:text-white hover:border-white/20 transition"
                          >
                            🕐 {rs.name || rs.birthPlace || 'Chart'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">{t('fullName')}</label>
                    <input
                      type="text"
                      placeholder={t('enterName')}
                      value={kundaliInput.name}
                      onChange={e => setKundaliInput(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 outline-none text-white text-sm focus:border-[#C5A059]/50 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">{t('birthDate')}</label>
                      <input
                        type="date"
                        value={kundaliInput.birthDate}
                        onChange={e => setKundaliInput(prev => ({ ...prev, birthDate: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 outline-none text-white text-sm focus:border-[#C5A059]/50 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">{t('birthTime')}</label>
                      <input
                        type="time"
                        value={kundaliInput.birthTime}
                        onChange={e => setKundaliInput(prev => ({ ...prev, birthTime: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 outline-none text-white text-sm focus:border-[#C5A059]/50 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 relative">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">{t('birthLocation')}</label>
                    <input
                      type="text"
                      placeholder={t('birthLocationPlaceholder')}
                      value={kundaliInput.birthPlace}
                      onChange={e => handleLocationChange(e.target.value)}
                      onBlur={() => setTimeout(() => setShowLocSuggestions(false), 200)}
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 outline-none text-white text-sm focus:border-[#C5A059]/50 transition"
                    />
                    {showLocSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border border-white/10 overflow-hidden shadow-xl"
                        style={{ background: 'rgba(8,6,22,0.97)' }}>
                        {locationSuggestions.map((s, i) => (
                          <button
                            key={i}
                            onMouseDown={() => {
                              setKundaliInput(prev => ({
                                ...prev,
                                birthPlace: s.display,
                                lat: s.lat,
                                lng: s.lng,
                                timezone: s.timezone,
                              }));
                              setShowLocSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/8 border-b border-white/5 last:border-0 transition flex items-center gap-2"
                          >
                            <span className="text-[#C5A059]">📍</span>
                            {s.display}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kundaliInput.timeUnknown}
                      onChange={e => setKundaliInput(prev => ({ ...prev, timeUnknown: e.target.checked, birthTime: e.target.checked ? '' : prev.birthTime }))}
                      className="accent-[#C5A059]"
                    />
                    <span className="text-[10px] text-white/50">{t('birthTimeUnknown')}</span>
                  </label>
                </div>

                {kundaliError && (
                  <div className="rounded-xl px-4 py-2.5 text-xs text-red-300 border border-red-500/30 bg-red-500/10">
                    ⚠️ {kundaliError}
                  </div>
                )}

                <button
                  disabled={kundaliLoading}
                  onClick={async () => {
                    if (!kundaliInput.name || !kundaliInput.birthDate || !kundaliInput.birthPlace) {
                      const { default: toast } = await import('react-hot-toast');
                      toast.error('Please fill in name, date, and birth city');
                      return;
                    }
                    setKundaliError(null);
                    setKundaliLoading(true);
                    setChartSaved(false);
                    playHaptic('heavy');
                    try {
                      // 1. Geocode birth city → real lat/lng + IANA timezone
                      const geoRes = await fetch(
                        `/api/jyotish/geocode?q=${encodeURIComponent(kundaliInput.birthPlace)}`
                      );
                      if (!geoRes.ok) {
                        const { error } = await geoRes.json().catch(() => ({ error: 'Location not found' }));
                        throw new Error(`Could not find "${kundaliInput.birthPlace}": ${error}. Try a more specific city name.`);
                      }
                      const geo   = await geoRes.json();
                      const geoLat = geo.lat as number;
                      const geoLng = geo.lng as number;
                      const geoTz  = geo.timezone as string;

                      // 2. Compute real chart client-side using resolved coords
                      const fullInput: KundaliInput = {
                        name:        kundaliInput.name,
                        birthDate:   kundaliInput.birthDate,
                        birthTime:   kundaliInput.birthTime || '12:00',
                        birthPlace:  kundaliInput.birthPlace,
                        lat:         geoLat,
                        lng:         geoLng,
                        timezone:    geoTz,
                        timeUnknown: !kundaliInput.birthTime,
                      };
                      const result = generateKundali(fullInput, lang);
                      setKundaliResult(result);
                      // Auto-select current mahadasha so user sees it expanded immediately
                      const currentIdx = result.chart.dasha?.timeline?.findIndex((d: any) => d.isCurrent) ?? -1;
                      if (currentIdx >= 0) setSelectedDashaIdx(currentIdx);

                      // Save recent search to localStorage (last 5)
                      try {
                        const updated = [
                          fullInput,
                          ...recentSearches.filter(r => r.name !== fullInput.name),
                        ].slice(0, 5);
                        setRecentSearches(updated);
                        localStorage.setItem('kundali_recent', JSON.stringify(updated));
                      } catch {}

                    } catch (err) {
                      const msg = err instanceof Error ? err.message : 'Chart generation failed';
                      setKundaliError(msg);
                    } finally {
                      setKundaliLoading(false);
                    }
                  }}
                  className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-[#1c1c1a] bg-[#C5A059] hover:opacity-90 transition shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {kundaliLoading ? (
                    <>
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-[#1c1c1a]/30 border-t-[#1c1c1a] rounded-full" />
                      {t('calculatingChart')}
                    </>
                  ) : `🔮 ${t('generateVedicKundali')}`}
                </button>
              </motion.div>
            ) : (
              /* Display Results */
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`space-y-3 ${textSize === 'sm' ? 'text-[0.78rem] leading-snug' : textSize === 'lg' ? 'text-[1.08rem] leading-relaxed' : 'text-[0.9rem]'}`}
              >
                {/* Back Button + Toolbar (text size + language toggle) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setKundaliResult(null);
                      setKundaliError(null);
                      setChartSaved(false);
                      setSelectedDashaIdx(null);
                      playHaptic('light');
                    }}
                    className="flex items-center gap-1.5 text-xs text-[#C5A059] font-semibold border border-[#C5A059]/20 bg-[#C5A059]/5 rounded-xl px-3.5 py-1.5 hover:bg-[#C5A059]/10 transition"
                  >
                    ← {t('newChart')}
                  </button>
                  <div className="flex items-center gap-2 ml-auto">
                    {/* Language toggle: EN | हि */}
                    <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5">
                      {(['en', 'hi'] as const).map(l => (
                        <button
                          key={l}
                          onClick={() => setLang(l)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                            lang === l
                              ? 'bg-[#C5A059] text-[#1c1c1a]'
                              : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          {l === 'en' ? 'EN' : 'हि'}
                        </button>
                      ))}
                    </div>
                    {/* Text size: A / AA / AAA */}
                    <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5">
                      {(['sm', 'md', 'lg'] as const).map(sz => (
                        <button
                          key={sz}
                          onClick={() => setTextSize(sz)}
                          className={`px-2 py-1 rounded-lg font-bold transition ${
                            textSize === sz
                              ? 'bg-[#C5A059] text-[#1c1c1a]'
                              : 'text-white/40 hover:text-white/70'
                          } ${sz === 'sm' ? 'text-[9px]' : sz === 'md' ? 'text-[11px]' : 'text-[14px]'}`}
                        >
                          A
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lagna details banner */}
                <div className="rounded-2xl p-5 border border-white/5 space-y-3"
                  style={{ background: 'rgba(10,8,25,0.65)' }}>
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">{t('calculatedAscendant')}</span>
                    <h3 className="font-serif text-2xl font-bold text-[#F2EAD6]">{kundaliResult.lagnaSign} ({kundaliResult.lagnaEnglish})</h3>
                    <p className="text-white/40 text-xs">{t('chartGeneratedFor')}: {kundaliResult.input.name}</p>
                    {kundaliResult.chart.timeUnknown && (
                      <p className="text-[10px] text-amber-400/80 italic mt-1">
                        {t('birthTimeUnknownWarning')}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl p-4 border border-[#C5A059]/20 bg-white/5">
                    <p className="text-sm font-medium text-[#F2EAD6] leading-relaxed">{kundaliResult.lagnaReading}</p>
                  </div>
                </div>

                {/* Pandit AI Destiny Reading */}
                {'panditAiDestinyReading' in kundaliResult && (
                  <div className="rounded-2xl p-5 border border-[#C5A059]/40 space-y-3 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.08) 0%, rgba(10,8,25,0.85) 100%)' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔮</span>
                      <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">{t('panditAiDestinyReadingLabel')}</h3>
                    </div>
                    <div className="space-y-4 text-sm text-[#F2EAD6]/90 leading-relaxed font-medium">
                      {kundaliResult.panditAiDestinyReading.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Precision notes */}
                {kundaliResult.precisionNotes?.length > 0 && (
                  <div className="rounded-2xl p-4 border border-sky-400/20 space-y-2"
                    style={{ background: 'rgba(56, 189, 248, 0.07)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧭</span>
                      <h3 className="text-xs font-bold text-sky-200 uppercase tracking-wider">Calculation confidence</h3>
                    </div>
                    <div className="space-y-1">
                      {kundaliResult.precisionNotes.map((note, index) => (
                        <p key={index} className="text-[11px] text-white/55 leading-relaxed">• {note}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive interpretation sections */}
                {kundaliResult.interpretationSections?.length > 0 && (
                  <div className="rounded-2xl p-4 border border-white/5 space-y-3"
                    style={{ background: 'rgba(10,8,25,0.58)' }}>
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Pandit-style interpretation sections</h4>
                    <div className="space-y-2">
                      {kundaliResult.interpretationSections.map(section => (
                        <details key={section.id} className="group rounded-2xl border border-white/7 overflow-hidden bg-white/4">
                          <summary className="list-none cursor-pointer select-none px-4 py-3 flex items-start gap-3">
                            <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                              section.priority === 'foundation' ? 'bg-[#C5A059]'
                              : section.priority === 'timing' ? 'bg-sky-400'
                              : section.priority === 'caution' ? 'bg-orange-400'
                              : section.priority === 'sadhana' ? 'bg-emerald-400'
                              : 'bg-violet-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#F2EAD6]">{section.title}</p>
                              <p className="text-[11px] text-white/45 leading-relaxed mt-1">{section.summary}</p>
                            </div>
                            <span className="text-[#C5A059] group-open:rotate-180 transition-transform duration-300 text-xs">▼</span>
                          </summary>
                          <div className="px-4 pb-4 space-y-3 border-t border-white/5">
                            <div className="space-y-1.5 pt-3">
                              {section.points.map((point, idx) => (
                                <p key={idx} className="text-[11px] text-white/65 leading-relaxed">• {point}</p>
                              ))}
                            </div>
                            <div className="rounded-xl border border-[#C5A059]/15 bg-[#C5A059]/5 px-3 py-2 space-y-1">
                              <p className="text-[9px] text-[#C5A059]/75 uppercase tracking-wider font-bold">Actionable reading</p>
                              {section.actions.map((action, idx) => (
                                <p key={idx} className="text-[11px] text-[#F2EAD6]/75 leading-relaxed">• {action}</p>
                              ))}
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}

                {/* Styled North Indian Kundali SVG */}
                <div className="rounded-2xl p-4 border border-white/5 space-y-3 flex flex-col items-center"
                  style={{ background: 'rgba(10,8,25,0.65)' }}>
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider self-start">{t('northIndianRashiChart')}</h4>
                  <div className="w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden shadow-2xl"
                    dangerouslySetInnerHTML={{ __html: renderKundaliSVG(kundaliResult) }}
                  />
                  <span className="text-[10px] text-white/30 italic">{t('rashiPlacementsHint')}</span>
                </div>

                {/* Nakshatra + Dasha banner */}
                {kundaliResult.chart && (
                  <div className="rounded-2xl p-4 border border-white/5 space-y-4"
                    style={{ background: 'rgba(10,8,25,0.55)' }}>
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">{t('birthNakshatraDasha')}</h4>

                    {/* ── Nakshatra card ── */}
                    {kundaliResult.chart.nakshatra && (() => {
                      const nk = kundaliResult.chart.nakshatra;
                      const attrs = NAKSHATRA_ATTRS[nk.name];
                      return (
                        <div className="rounded-2xl p-4 border border-white/8 space-y-3"
                          style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                              style={{ background: 'rgba(197,160,89,0.12)', border: '1px solid rgba(197,160,89,0.2)' }}>
                              {attrs?.symbol ?? '⭐'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] text-white/35 uppercase font-bold tracking-wider">{t('janmaNakshatra')}</p>
                              <p className="font-serif text-lg font-bold text-[#F2EAD6] leading-tight">{nk.name}</p>
                              <p className="text-[10px] text-white/50 mt-0.5">Pada {nk.pada} · Lord: {nk.lord} · {nk.devata}</p>
                            </div>
                          </div>
                          {attrs && (
                            <div className="grid grid-cols-3 gap-2">
                              <div className={`rounded-lg px-2 py-1.5 border text-center text-[9px] font-bold ${GANA_COLOR[attrs.gana] ?? 'text-white/60 border-white/10'}`}>
                                <div className="text-white/30 text-[8px] mb-0.5">Gana</div>
                                {attrs.gana}
                              </div>
                              <div className={`rounded-lg px-2 py-1.5 border text-center text-[9px] font-bold ${ELEMENT_COLOR[attrs.element] ?? 'text-white/60 border-white/10'}`}>
                                <div className="text-white/30 text-[8px] mb-0.5">Tattva</div>
                                {attrs.element}
                              </div>
                              <div className="rounded-lg px-2 py-1.5 border border-white/10 text-center text-[9px] font-bold text-white/60">
                                <div className="text-white/30 text-[8px] mb-0.5">Animal</div>
                                {attrs.animal}
                              </div>
                            </div>
                          )}
                          {attrs?.syllable && (
                            <div className="rounded-xl px-3 py-2 bg-[#C5A059]/5 border border-[#C5A059]/15">
                              <p className="text-[9px] text-[#C5A059]/60 uppercase font-bold tracking-wider mb-1">Seed Syllables (Naam Akshar)</p>
                              <p className="text-[10px] text-[#C5A059] font-semibold tracking-widest">{attrs.syllable}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* ── Mahadasha card ── */}
                    {kundaliResult.chart.dasha?.current && (() => {
                      const dasha = kundaliResult.chart.dasha.current;
                      const timelineEntry = kundaliResult.chart.dasha.timeline?.find((d: any) => d.isCurrent);
                      const dashaYears = timelineEntry?.years ?? 16;
                      const endDate  = new Date(dasha.endDate);
                      const startDate = new Date(endDate.getTime() - dashaYears * 365.25 * 24 * 60 * 60 * 1000);
                      const now = new Date();
                      const elapsed = Math.max(0, now.getTime() - startDate.getTime());
                      const total   = Math.max(1, endDate.getTime() - startDate.getTime());
                      const pct     = Math.min(100, Math.round(elapsed / total * 100));
                      const antardasha = kundaliResult.chart.dasha.currentAntardasha;
                      return (
                        <div className="rounded-2xl p-4 border border-white/8 space-y-3"
                          style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                              style={{ background: 'rgba(197,160,89,0.12)', border: '1px solid rgba(197,160,89,0.2)' }}>
                              🔮
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] text-white/35 uppercase font-bold tracking-wider">{t('mahadasha')}</p>
                              <p className="font-serif text-lg font-bold text-[#F2EAD6] leading-tight">{dasha.planet} {t('mahadasha')}</p>
                              <p className="text-[10px] text-white/50 mt-0.5">
                                {startDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                {' – '}
                                {endDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                {' · '}{dashaYears}y period
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <p className="text-2xl font-bold text-[#C5A059]">{pct}%</p>
                              <p className="text-[9px] text-white/30">{t('elapsed')}</p>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="h-2.5 w-full rounded-full bg-white/5 border border-white/5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-[#C5A059] to-amber-300"
                              />
                            </div>
                            <div className="flex justify-between text-[8px] text-white/25">
                              <span>{t('start')}</span>
                              <span>{t('today')}</span>
                              <span>{t('end')}</span>
                            </div>
                          </div>
                          {/* Current antardasha */}
                          {antardasha && (
                            <div className="rounded-xl px-3 py-2.5 border border-[#C5A059]/20 bg-[#C5A059]/6 space-y-0.5">
                              <p className="text-[9px] text-[#C5A059]/60 uppercase font-bold tracking-wider">{t('currentAntardasha')}</p>
                              <p className="text-sm font-bold text-[#C5A059]">{antardasha.planet} Antardasha</p>
                              <p className="text-[10px] text-white/40">
                                {new Date(antardasha.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {' – '}
                                {new Date(antardasha.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* ── Interactive Dasha timeline ── */}
                    {kundaliResult.chart.dasha?.timeline && (() => {
                      const timeline = kundaliResult.chart.dasha.timeline as Array<{ planet: string; startDate: string; endDate: string; years: number; isCurrent: boolean }>;
                      const now = new Date();
                      return (
                        <div className="space-y-2">
                          <p className="text-[9px] text-white/30 uppercase font-bold tracking-wider">{t('vimshottariDashaExplore')}</p>
                          <div className="overflow-x-auto pb-2 scrollbar-none">
                            <div className="flex gap-2 w-max">
                              {timeline.slice(0, 9).map((d, i) => {
                                const wisdom = DASHA_WISDOM[d.planet];
                                const isSelected = selectedDashaIdx === i;
                                const isActive = d.isCurrent;
                                const isPast = new Date(d.endDate) < now;
                                return (
                                  <button
                                    key={i}
                                    onClick={() => setSelectedDashaIdx(isSelected ? null : i)}
                                    className={`flex-shrink-0 rounded-xl px-3 py-2.5 border text-center transition-all active:scale-95 ${
                                      isSelected
                                        ? `${wisdom?.bg ?? 'bg-white/10 border-white/20'} shadow-lg`
                                        : isActive
                                        ? 'bg-[#C5A059]/20 border-[#C5A059]/50'
                                        : isPast
                                        ? 'bg-white/2 border-white/5 opacity-50'
                                        : 'bg-white/5 border-white/8 hover:border-white/15'
                                    }`}
                                  >
                                    <div className="text-base mb-0.5">{wisdom?.emoji ?? '🪐'}</div>
                                    <p className={`text-[9px] font-bold ${isSelected ? (wisdom?.color ?? 'text-white') : isActive ? 'text-[#C5A059]' : 'text-white/50'}`}>
                                      {d.planet}
                                    </p>
                                    <p className="text-[8px] text-white/25 mt-0.5">{d.years}y</p>
                                    {isActive && <div className="w-1 h-1 rounded-full bg-[#C5A059] mx-auto mt-1 animate-pulse" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Expanded dasha detail panel */}
                          {selectedDashaIdx !== null && (() => {
                            const d = timeline[selectedDashaIdx];
                            const wisdom = DASHA_WISDOM[d.planet];
                            if (!wisdom) return null;
                            const antardasha = getAntardashaDates(d);
                            const dStart = new Date(d.startDate);
                            const dEnd   = new Date(d.endDate);
                            const isActive = d.isCurrent;
                            const isPast   = dEnd < now;
                            let pct = 0;
                            if (isActive) {
                                pct = Math.min(100, Math.round((now.getTime() - dStart.getTime()) / (dEnd.getTime() - dStart.getTime()) * 100));
                            } else if (isPast) { pct = 100; }

                            return (
                              <motion.div
                                key={selectedDashaIdx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-2xl p-4 border space-y-4 ${wisdom.bg}`}
                              >
                                {/* Header */}
                                <div className="flex items-start gap-3">
                                  <div className="text-3xl">{wisdom.emoji}</div>
                                  <div className="flex-1">
                                    <p className={`text-xs font-bold ${wisdom.color} uppercase tracking-wider`}>{wisdom.hi}</p>
                                    <p className="text-lg font-serif font-bold text-white/90">{d.planet} {t('mahadasha')} · {wisdom.en}</p>
                                    <p className="text-[10px] text-white/40 mt-0.5">
                                      {dStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                      {' – '}
                                      {dEnd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                      {' · '}{d.years} year period
                                      {isActive && <span className={`ml-2 font-bold ${wisdom.color}`}>● ACTIVE NOW</span>}
                                      {isPast && <span className="ml-2 text-white/30"> (past)</span>}
                                    </p>
                                  </div>
                                </div>

                                {/* Progress bar (active/past) */}
                                {pct > 0 && (
                                  <div className="space-y-1">
                                    <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut' }}
                                        className="h-full rounded-full bg-gradient-to-r from-[#C5A059] to-amber-300"
                                      />
                                    </div>
                                    <p className="text-[8px] text-white/25 text-right">{pct}% {t('elapsed')}</p>
                                  </div>
                                )}

                                {/* Domains */}
                                <div className="rounded-xl px-3 py-2.5 bg-white/5 border border-white/5">
                                  <p className="text-[9px] text-white/35 uppercase font-bold tracking-wider mb-1">{t('rulingDomains')}</p>
                                  <p className="text-[11px] text-white/70 leading-relaxed">{wisdom.domains}</p>
                                </div>

                                {/* Pros & Cons */}
                                <div className="grid grid-cols-1 gap-2">
                                  <div className="rounded-xl px-3 py-2.5 bg-emerald-500/8 border border-emerald-500/20">
                                    <p className="text-[9px] text-emerald-400 uppercase font-bold tracking-wider mb-1">{t('favourable')}</p>
                                    <p className="text-[11px] text-white/70 leading-relaxed">{wisdom.pros}</p>
                                  </div>
                                  <div className="rounded-xl px-3 py-2.5 bg-red-500/8 border border-red-500/20">
                                    <p className="text-[9px] text-red-400 uppercase font-bold tracking-wider mb-1">{t('challenges')}</p>
                                    <p className="text-[11px] text-white/70 leading-relaxed">{wisdom.cons}</p>
                                  </div>
                                  <div className="rounded-xl px-3 py-2.5 bg-[#C5A059]/8 border border-[#C5A059]/20">
                                    <p className="text-[9px] text-[#C5A059] uppercase font-bold tracking-wider mb-1">{t('upaya')}</p>
                                    <p className="text-[11px] text-white/70 leading-relaxed">{wisdom.remedies}</p>
                                  </div>
                                </div>

                                {/* Beeja Mantra */}
                                <div className="rounded-xl px-3 py-2.5 bg-violet-500/8 border border-violet-500/15 text-center">
                                  <p className="text-[9px] text-violet-400 uppercase font-bold tracking-wider mb-1">{t('beejaMantraLabel')}</p>
                                  <p className="text-[11px] font-semibold text-white/80 tracking-wider leading-relaxed">{wisdom.mantra}</p>
                                </div>

                                {/* Antardasha sub-periods */}
                                <div className="space-y-1.5">
                                  <p className="text-[9px] text-white/30 uppercase font-bold tracking-wider">Antardasha Sub-periods</p>
                                  {antardasha.map((a, ai) => {
                                    const aStart  = new Date(a.startDate);
                                    const aEnd    = new Date(a.endDate);
                                    const isNow   = aStart <= now && now < aEnd;
                                    const aWisdom = DASHA_WISDOM[a.planet];
                                    return (
                                      <div key={ai}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition ${
                                          isNow
                                            ? `${aWisdom?.bg ?? 'border-white/15'} shadow-sm`
                                            : 'border-white/5 bg-white/3'
                                        }`}>
                                        <span className="text-sm flex-shrink-0">{aWisdom?.emoji ?? '🪐'}</span>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-[10px] font-bold ${isNow ? (aWisdom?.color ?? 'text-white') : 'text-white/60'}`}>
                                            {a.planet} Antardasha
                                            {isNow && <span className="ml-1 text-[8px] animate-pulse">● NOW</span>}
                                          </p>
                                          <p className="text-[9px] text-white/30">
                                            {aStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {' – '}
                                            {aEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                          </p>
                                        </div>
                                        <span className="text-[9px] text-white/25 flex-shrink-0">
                                          {((aEnd.getTime() - aStart.getTime()) / (365.25 * 86400000)).toFixed(1)}y
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            );
                          })()}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Advanced Jyotish modules */}
                <div className="grid gap-3">
                  {kundaliResult.yogaResults?.length > 0 && (
                    <div className="rounded-2xl p-4 border border-violet-400/20 space-y-3"
                      style={{ background: 'rgba(124, 58, 237, 0.08)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🪷</span>
                        <h4 className="text-xs font-bold text-violet-200 uppercase tracking-wider">Detected yogas</h4>
                      </div>
                      <div className="space-y-2">
                        {kundaliResult.yogaResults.map(yoga => (
                          <div key={yoga.id} className="rounded-xl px-3 py-2 border border-white/8 bg-white/4">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-[#F2EAD6]">{yoga.name}</p>
                              <span className="text-[9px] rounded-full border border-violet-300/20 bg-violet-300/10 px-2 py-0.5 text-violet-200">
                                {yoga.strength}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/50 leading-relaxed mt-1">{yoga.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {kundaliResult.aspectResults?.length > 0 && (
                    <div className="rounded-2xl p-4 border border-white/5 space-y-3"
                      style={{ background: 'rgba(10,8,25,0.5)' }}>
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Close drishti contacts</h4>
                      <div className="grid gap-2">
                        {kundaliResult.aspectResults.slice(0, 8).map((aspect, idx) => (
                          <div key={`${aspect.from}-${aspect.to}-${idx}`} className="flex items-center gap-3 rounded-xl border border-white/7 bg-white/4 px-3 py-2">
                            <div className="w-9 h-9 rounded-xl bg-[#C5A059]/12 border border-[#C5A059]/20 flex items-center justify-center text-[10px] font-bold text-[#C5A059]">
                              {aspect.aspect}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-white/75">{aspect.from} → {aspect.to}</p>
                              <p className="text-[10px] text-white/40 leading-relaxed">{aspect.note} · orb {aspect.orbDegrees}°</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {kundaliResult.navamshaPlacements?.length > 0 && !kundaliResult.chart.timeUnknown && (
                    <div className="rounded-2xl p-4 border border-[#C5A059]/20 space-y-3"
                      style={{ background: 'rgba(197,160,89,0.06)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">Navamsha D9 layer</h4>
                        <span className="text-[9px] text-white/35">Inner maturity</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {kundaliResult.navamshaPlacements.slice(0, 10).map(p => (
                          <div key={`d9-${p.key}`} className="rounded-xl border border-white/7 bg-black/15 px-3 py-2">
                            <p className="text-[10px] font-bold text-white/70">{p.name}</p>
                            <p className="text-[10px] text-[#C5A059]/80 mt-0.5">{p.sign}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Chart section */}
                {chartSaved ? (
                  /* Saved confirmation */
                  <div className="rounded-2xl p-3 border border-green-500/30 bg-green-500/10 flex items-center gap-3">
                    <span className="text-lg">✅</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-green-400">Chart saved to your profile</p>
                      {isLoggedIn && savedProfiles.length > 0 && (
                        <p className="text-[10px] text-white/40 mt-0.5">{savedProfiles.length} chart{savedProfiles.length !== 1 ? 's' : ''} saved · load any from the form</p>
                      )}
                    </div>
                  </div>
                ) : saveError ? (
                  <div className="rounded-2xl p-3 border border-red-500/30 bg-red-500/10 text-center text-xs font-semibold text-red-400">
                    ⚠️ {saveError}
                  </div>
                ) : isLoggedIn ? (
                  /* Logged-in: manual save button */
                  <div className="rounded-2xl p-4 border border-[#C5A059]/25 flex items-center gap-3"
                    style={{ background: 'rgba(197,160,89,0.06)' }}>
                    <span className="text-xl flex-shrink-0">💾</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#C5A059]">Save this chart</p>
                      <p className="text-[10px] text-white/50 mt-0.5">
                        Add to your saved profiles · load instantly next time
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        setSaveError(null);
                        try {
                          const res = await fetch('/api/jyotish/chart', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              label:          kundaliResult.input.name || 'My Chart',
                              full_name:      kundaliResult.input.name,
                              date_of_birth:  kundaliResult.input.birthDate,
                              time_of_birth:  kundaliResult.input.timeUnknown ? null : kundaliResult.input.birthTime,
                              birth_city:     kundaliResult.input.birthPlace,
                              birth_lat:      kundaliResult.input.lat,
                              birth_lng:      kundaliResult.input.lng,
                              birth_timezone: kundaliResult.input.timezone,
                              is_primary:     savedProfiles.length === 0,
                            }),
                          });
                          const d = await res.json();
                          if (d.profile) {
                            setChartSaved(true);
                            setSavedProfiles(prev => [d.profile, ...prev.filter((p: any) => p.id !== d.profile.id)]);
                          } else if (d.error) {
                            setSaveError(d.error);
                          }
                        } catch {
                          setSaveError('Could not save chart');
                        }
                      }}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#C5A059] text-[#1c1c1a] hover:opacity-90 transition"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  /* Guest: sign-in prompt */
                  <div className="rounded-2xl p-4 border border-[#C5A059]/25 flex items-start gap-3"
                    style={{ background: 'rgba(197,160,89,0.06)' }}>
                    <span className="text-xl flex-shrink-0">💾</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#C5A059]">{t('saveYourKundali')}</p>
                      <p className="text-[10px] text-white/50 mt-0.5 leading-relaxed">
                        {t('signInToSaveChart')}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          let guestToken = sessionStorage.getItem('kundali_guest_token');
                          if (!guestToken) {
                            guestToken = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                            sessionStorage.setItem('kundali_guest_token', guestToken);
                          }
                          const res = await fetch('/api/jyotish/chart', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              label:          kundaliResult.input.name || 'My Chart',
                              full_name:      kundaliResult.input.name,
                              date_of_birth:  kundaliResult.input.birthDate,
                              time_of_birth:  kundaliResult.input.timeUnknown ? null : kundaliResult.input.birthTime,
                              birth_city:     kundaliResult.input.birthPlace,
                              birth_lat:      kundaliResult.input.lat,
                              birth_lng:      kundaliResult.input.lng,
                              birth_timezone: kundaliResult.input.timezone,
                              is_primary:     true,
                              session_token:  guestToken,
                            }),
                          });
                          if (res.status === 401) {
                            window.location.href = `/auth/signup?next=${encodeURIComponent('/panchang?tab=kundali')}&claim_token=${encodeURIComponent(guestToken)}`;
                            return;
                          }
                          if (res.ok) {
                            setChartSaved(true);
                            sessionStorage.removeItem('kundali_guest_token');
                            const { default: toast } = await import('react-hot-toast');
                            toast.success('Chart saved! ✨');
                          }
                        } catch { /* ignore */ }
                      }}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#C5A059] text-[#1c1c1a] hover:opacity-90 transition"
                    >
                      {t('saveBtn')}
                    </button>
                  </div>
                )}

                {/* Sade Sati detection */}
                {(() => {
                  try {
                    const moonRashiIndex = kundaliResult.chart.planets['Chandra']?.rashiIndex;
                    const saturnRashiIndex = todayTransits?.['Shani']?.rashiIndex;
                    if (moonRashiIndex === undefined || saturnRashiIndex === undefined) return null;
                    const ss = detectSadeSati(moonRashiIndex, saturnRashiIndex);
                    if (!ss.isActive) return null;
                    const phaseLabel = ss.phase === 'rising' ? t('sadeSatiRising')
                                     : ss.phase === 'peak'   ? t('sadeSatiPeak')
                                     :                         t('sadeSatiSetting');
                    return (
                      <div className="rounded-2xl p-4 border border-orange-500/30 space-y-2"
                        style={{ background: 'rgba(200,80,20,0.12)' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⚡</span>
                          <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider">{t('sadeSatiActive')}</h4>
                        </div>
                        <p className="text-sm font-semibold text-orange-200">{phaseLabel}</p>
                        <p className="text-[11px] text-white/50 leading-relaxed">
                          {t('sadeSatiDescription')
                            .replace('{saturnRashi}', ss.saturnRashi)
                            .replace('{moonRashi}', ss.moonRashi)}
                        </p>
                      </div>
                    );
                  } catch { return null; }
                })()}

                {/* Planet positions */}
                <div className="rounded-2xl p-4 border border-white/5 space-y-3"
                  style={{ background: 'rgba(10,8,25,0.5)' }}>
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">{t('grahasHousePlacements')}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {kundaliResult.placements.map(p => {
                      const grahaData = kundaliResult.chart.planets[p.key];
                      const dignity   = grahaData?.dignity;
                      const combust   = grahaData?.isCombust;
                      const dignityColor = dignity === 'exalted'     ? 'text-emerald-400'
                                         : dignity === 'debilitated' ? 'text-red-400'
                                         : dignity === 'own'         ? 'text-sky-400'
                                         : '';
                      const dignityLabel = dignity === 'exalted'     ? 'Uchcha'
                                         : dignity === 'debilitated' ? 'Neecha'
                                         : dignity === 'own'         ? 'Svakshetra'
                                         : null;
                      return (
                        <div key={p.key} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                          <div className="w-8 h-8 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center font-bold text-[#C5A059] text-xs flex-shrink-0">
                            {p.symbol}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white/80 flex items-center gap-1 flex-wrap">
                              {p.name}
                              {p.isRetrograde && <span className="text-[9px] text-orange-400">(R)</span>}
                              {combust && <span className="text-[9px] text-red-400">combust</span>}
                              {dignityLabel && <span className={`text-[9px] font-bold ${dignityColor}`}>{dignityLabel}</span>}
                            </p>
                            <p className="text-[10px] text-white/40">H{p.house} · {p.sign} {p.degree}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Graha Shadbala Strength Heatmap (Vedic Power Index) */}
                <div className="rounded-2xl p-4 border border-white/5 space-y-4"
                  style={{ background: 'rgba(10,8,25,0.5)' }}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">{t('grahaShadbalaStrength')}</h4>
                    <span className="text-[9px] font-bold text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-2 py-0.5 rounded-md">{t('vedicPowerIndex')}</span>
                  </div>

                  <div className="space-y-3">
                    {kundaliResult.placements.map(p => {
                      // Custom glowing bar colors for planets based on strength
                      const barColor = p.strength >= 80 ? 'from-[#C5A059] to-amber-300' 
                                     : p.strength >= 60 ? 'from-emerald-600 to-teal-400' 
                                     : 'from-orange-600 to-red-400';
                      return (
                        <div key={p.key} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-white/80 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[9px] font-bold text-[#C5A059]">
                                {p.symbol}
                              </span>
                              {p.name} <span className="text-[10px] text-white/40 font-medium">({p.sign})</span>
                            </span>
                            <span className="font-bold text-white/70">{p.strength}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden border border-white/5 relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${p.strength}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bhava readings */}
                <div className="rounded-2xl p-4 border border-white/5 space-y-3"
                  style={{ background: 'rgba(10,8,25,0.5)' }}>
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">{t('interactiveBhavaReadings')}</h4>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(house => (
                      <details key={house} className="group border border-white/5 rounded-xl overflow-hidden transition-all duration-300">
                        <summary className="flex justify-between items-center px-4 py-3 bg-white/5 cursor-pointer select-none hover:bg-white/10 list-none">
                          <span className="text-xs font-bold text-white/80 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#C5A059]/20 flex items-center justify-center text-[10px] text-[#C5A059] font-bold">
                              {house}
                            </span>
                            {t('houseReading').replace('{house}', house.toString())}
                          </span>
                          <span className="text-[#C5A059] group-open:rotate-180 transition-transform duration-300 text-xs">▼</span>
                        </summary>
                        <div className="px-4 py-3 bg-black/20 text-xs text-white/70 leading-relaxed border-t border-white/5">
                          {kundaliResult.houseReadings[house]}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
