'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import { createClient } from '@/lib/supabase';
import type { KundaliInput, KundaliResult } from '@/lib/jyotish/kundali-engine';

interface Props {
  lat: number;
  lon: number;
  city: string;
  timezone: string;
}

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
  Deva:     'text-emerald-700 bg-emerald-50 border-emerald-200',
  Manushya: 'text-amber-700 bg-amber-50 border-amber-200',
  Rakshasa: 'text-red-700 bg-red-50 border-red-200',
};

const ELEMENT_COLOR: Record<string, string> = {
  Earth: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Water: 'text-cyan-700 bg-cyan-50 border-cyan-200',
  Fire:  'text-orange-700 bg-orange-50 border-orange-200',
  Air:   'text-purple-700 bg-purple-50 border-purple-200',
};

const DASHA_WISDOM: Record<string, {
  hi: string;
  en: string;
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
    color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200',
    domains: 'Authority, government, father, health, vitality, career recognition',
    mantra: 'Om Hraam Hreem Hraum Sah Suryaya Namah',
    pros: 'Rise in career and social status, recognition from superiors, strong health and vitality, leadership opportunities, clarity of purpose.',
    cons: 'Ego conflicts, strained relationships with father figures, excessive pride, health issues related to heart and eyes.',
    remedies: 'Offer water to the rising sun daily, worship at a Shiva temple on Sundays, wear ruby (if well-placed).',
  },
  Chandra: {
    hi: 'चन्द्र महादशा', en: 'Moon', years: 10, emoji: '🌙',
    color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200',
    domains: 'Mind, emotions, mother, home, intuition, water, travel, public',
    mantra: 'Om Shraam Shreem Shraum Sah Chandraaya Namah',
    pros: 'Emotional fulfilment, strong intuition, public popularity, peaceful home life, good for spiritual pursuits and creative arts.',
    cons: 'Emotional instability, mood swings, over-sensitivity, disturbed sleep, issues with mother or women in life.',
    remedies: 'Fast on Mondays, worship Devi (Durga, Lakshmi), keep silver with you, chant Chandra mantra 108 times at night.',
  },
  Mangal: {
    hi: 'मंगल महादशा', en: 'Mars', years: 7, emoji: '🔴',
    color: 'text-red-800', bg: 'bg-red-50 border-red-200',
    domains: 'Courage, energy, siblings, land, property, discipline, surgery, sports',
    mantra: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',
    pros: 'Surge of physical energy, courage to take bold action, success in sports and physical endeavours, property gains, sibling support.',
    cons: 'Aggression, accidents, conflicts, surgery risks, impulsiveness, fire/blood-related health issues.',
    remedies: 'Worship Hanuman on Tuesdays, donate red lentils, avoid anger and haste, wear red coral (if well-placed).',
  },
  Rahu: {
    hi: 'राहु महादशा', en: 'Rahu (North Node)', years: 18, emoji: '🌀',
    color: 'text-violet-800', bg: 'bg-violet-50 border-violet-200',
    domains: 'Ambition, illusion, foreign lands, technology, unconventional paths, sudden events',
    mantra: 'Om Bhram Bhreem Bhraum Sah Rahave Namah',
    pros: 'Rapid material gains, success in technology and mass media, foreign travel and connections, breakthroughs via unconventional methods, sudden rise.',
    cons: 'Confusion, obsession, deception from others, hidden enemies, health issues hard to diagnose, karmic debts surfacing.',
    remedies: 'Worship Durga or Kali, feed dogs, donate blue/black items on Saturdays, meditate to strengthen inner clarity.',
  },
  Guru: {
    hi: 'गुरु महादशा', en: 'Jupiter', years: 16, emoji: '🪐',
    color: 'text-yellow-800', bg: 'bg-yellow-50 border-yellow-200',
    domains: 'Wisdom, dharma, children, higher education, spirituality, wealth, guru',
    mantra: 'Om Graam Greem Graum Sah Gurave Namah',
    pros: 'Spiritual awakening, academic success, wealth and prosperity, children\'s blessings, finding a genuine guru or mentor, deep dharmic clarity.',
    cons: 'Overconfidence, excess weight gain, liver problems, complacency, over-generosity leading to financial strain.',
    remedies: 'Worship Vishnu on Thursdays, offer turmeric and yellow flowers, donate to Brahmins, wear yellow sapphire (if suited).',
  },
  Shani: {
    hi: 'शनि महादशा', en: 'Saturn', years: 19, emoji: '⏳',
    color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200',
    domains: 'Karma, discipline, delays, service, longevity, old age, justice, labour',
    mantra: 'Om Praam Preem Praum Sah Shanaischaraya Namah',
    pros: 'Karmic purification, lasting rewards for honest effort, discipline and endurance, career stability through merit, spiritual depth through solitude.',
    cons: 'Slowdowns, delays, hardship and struggle, joint/bone issues, separation from loved ones, heavy responsibilities.',
    remedies: 'Worship Shani on Saturdays, light sesame oil lamp, serve the elderly and disabled, wear blue sapphire only after expert consultation.',
  },
  Budha: {
    hi: 'बुध महादशा', en: 'Mercury', years: 17, emoji: '☿',
    color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200',
    domains: 'Intellect, communication, business, writing, trade, education, youthfulness',
    mantra: 'Om Braam Breem Braum Sah Budhaya Namah',
    pros: 'Sharp intellect, business success, excellent communication, educational achievements, networking, writing and speaking opportunities.',
    cons: 'Over-thinking, nervous system stress, indecisiveness, skin or speech disorders, trust issues in partnerships.',
    remedies: 'Worship Vishnu on Wednesdays, donate green clothes or moong dal, read sacred texts, wear emerald (if well-placed).',
  },
  Ketu: {
    hi: 'केतु महादशा', en: 'Ketu (South Node)', years: 6, emoji: '☄️',
    color: 'text-teal-800', bg: 'bg-teal-50 border-teal-200',
    domains: 'Spirituality, liberation, past life karma, mysticism, healing, sudden events',
    mantra: 'Om Sraam Sreem Sraum Sah Ketave Namah',
    pros: 'Deep spiritual insights, psychic abilities, liberation from attachments, healing gifts, ancestral blessings, unexpected moksha-related experiences.',
    cons: 'Confusion about identity and direction, mysterious illnesses, isolation, sudden losses, difficulty in the material world.',
    remedies: 'Worship Ganesha, donate multi-coloured blankets, perform ancestral rites (Pitru Tarpan), avoid ego-driven ambitions.',
  },
  Shukra: {
    hi: 'शुक्र महादशा', en: 'Venus', years: 20, emoji: '💎',
    color: 'text-pink-800', bg: 'bg-pink-50 border-pink-200',
    domains: 'Love, marriage, beauty, arts, luxury, pleasure, relationships, women',
    mantra: 'Om Draam Dreem Draum Sah Shukraya Namah',
    pros: 'Romantic fulfilment, marriage and partnership bliss, artistic creativity, wealth and luxury, social charm, enjoyment of life\'s pleasures.',
    cons: 'Overindulgence, laziness, relationship complications, kidney or reproductive issues, materialistic attachment.',
    remedies: 'Worship Lakshmi on Fridays, donate white clothes or sweets, practice brahmacharya in thought, wear diamond or white sapphire (if suited).',
  },
};

function getAntardashaDates(dashaEntry: { planet: string; startDate: string; endDate: string }): Array<{ planet: string; startDate: string; endDate: string }> {
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
    const entry = {
      planet:    sub,
      startDate: new Date(cursor).toISOString().split('T')[0],
      endDate:   new Date(end).toISOString().split('T')[0],
    };
    cursor = end;
    return entry;
  });
}

export default function KundaliClient({ lat, lon, city, timezone }: Props) {
  const { t, lang, setLang } = useLanguage();
  const { playHaptic } = useZenithSensory();
  
  const [kundaliInput, setKundaliInput] = useState<KundaliInput>({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: city || '',
    lat: lat || 28.6139,
    lng: lon || 77.2090,
    timezone: timezone || 'Asia/Kolkata',
  });

  const [kundaliResult, setKundaliResult] = useState<KundaliResult | null>(null);
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [kundaliLoading, setKundaliLoading] = useState(false);
  const [kundaliError, setKundaliError] = useState<string | null>(null);
  const [chartSaved, setChartSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<KundaliInput[]>([]);
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [selectedDashaIdx, setSelectedDashaIdx] = useState<number | null>(null);

  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ display: string; lat: number; lng: number; timezone: string }>>([]);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const locTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [transits, setTransits] = useState<any>(null);
  const [sadeSati, setSadeSati] = useState<any>(null);

  // Dynamic Localization: Automatically translate Kundali output when language changes
  useEffect(() => {
    if (!kundaliResult) return;
    let active = true;
    import('@/lib/jyotish/kundali-engine').then(({ generateKundali, renderKundaliSVG }) => {
      if (!active) return;
      try {
        const result = generateKundali(kundaliResult.input, lang);
        const svg = renderKundaliSVG(result);
        setKundaliResult(result);
        setSvgHtml(svg);
      } catch (e) {
        console.error(e);
      }
    });
    return () => { active = false; };
  }, [lang, kundaliResult]);

  // Asynchronously compute Sade Sati when chart or transits change
  useEffect(() => {
    if (!kundaliResult) {
      setSadeSati(null);
      return;
    }
    let active = true;
    Promise.all([
      import('@/lib/jyotish/astro-engine')
    ]).then(([{ getTodayTransits, detectSadeSati }]) => {
      if (!active) return;
      try {
        const trans = getTodayTransits();
        setTransits(trans);
        const moonRashiIndex = kundaliResult.chart.planets['Chandra']?.rashiIndex;
        const saturnRashiIndex = trans?.['Shani']?.rashiIndex;
        if (moonRashiIndex !== undefined && saturnRashiIndex !== undefined) {
          const ss = detectSadeSati(moonRashiIndex, saturnRashiIndex);
          setSadeSati(ss);
        }
      } catch (e) {
        console.error(e);
      }
    });
    return () => { active = false; };
  }, [kundaliResult]);

  // Auth check + load profiles
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

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kundali_recent');
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
    } catch {}
  }, []);

  // Location autocomplete handler
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
        const results = data.results ?? (data.lat ? [{ display: data.display ?? val, lat: data.lat, lng: data.lng, timezone: data.timezone }] : []);
        setLocationSuggestions(results.slice(0, 5));
        setShowLocSuggestions(results.length > 0);
      } catch { /* ignore */ }
    }, 400);
  }

  async function share() {
    if (!kundaliResult) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shoonaya.com';
    const link = `${origin}/kundali`;
    const text = `Vedic Kundali Chart for ${kundaliResult.input.name}\n\n` +
      `🌟 Lagna Ascendant: ${kundaliResult.lagnaSign} (${kundaliResult.lagnaEnglish})\n` +
      `🔮 Alignment: ${kundaliResult.lagnaReading}\n\n` +
      `Check yours at: ${link}\n\n— Shoonaya`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Vedic Kundali', text });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      const toast = (await import('react-hot-toast')).default;
      toast.success('Copied to clipboard 📋');
    } catch { /* clipboard not available */ }
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--premium-ivory)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 pt-safe-top pb-4 flex items-center gap-3 border-b"
        style={{ backgroundColor: 'var(--premium-ivory)', borderColor: 'var(--premium-border)' }}>
        <Link href="/panchang"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition border"
          style={{ background: 'white', borderColor: 'var(--premium-border)' }}>
          <ArrowLeft size={16} style={{ color: 'var(--brand-primary-strong)' }} />
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-lg font-semibold tracking-tight"
            style={{ color: 'var(--brand-primary-strong)' }}>
            Vedic Kundali
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--brand-muted)' }}>
            Generate and explore birth charts
          </p>
        </div>
        {kundaliResult && (
          <button onClick={share}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition border"
            style={{ background: 'white', borderColor: 'var(--premium-border)' }}
            aria-label="Share">
            <Share2 size={15} style={{ color: 'var(--brand-primary-strong)' }} />
          </button>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">
        {kundaliResult === null ? (
          /* Generate Form */
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 border bg-white space-y-4 shadow-sm"
            style={{ borderColor: 'var(--premium-border)' }}
          >
            <div className="text-center space-y-1">
              <span className="text-3xl">🛕</span>
              <h2 className="font-serif text-lg font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
                {t('vedicKundaliChart')}
              </h2>
              <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>
                {t('enterBirthDetails')}
              </p>
            </div>

            <div className="space-y-4">
              {/* Saved profiles (logged-in) */}
              {isLoggedIn && savedProfiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                    {t('savedCharts')} · {savedProfiles.length}
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {savedProfiles.map((sp: any) => (
                      <div key={sp.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white/40 hover:bg-white/90 transition group"
                        style={{ borderColor: 'var(--premium-border)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 border"
                          style={{ background: 'var(--premium-gold-soft)', borderColor: 'var(--premium-border)' }}>
                          {sp.is_primary ? '⭐' : '🪐'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--brand-primary-strong)' }}>
                            {sp.full_name ?? sp.label ?? 'Chart'}
                          </p>
                          <p className="text-[9px] mt-0.5" style={{ color: 'var(--brand-muted)' }}>
                            {sp.date_of_birth ?? ''}{sp.birth_city ? ` · ${sp.birth_city}` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setKundaliInput({
                              name:       sp.full_name ?? sp.label ?? '',
                              birthDate:  sp.date_of_birth ?? '',
                              birthTime:  sp.time_of_birth ?? '',
                              birthPlace: sp.birth_city ?? '',
                              lat:        sp.birth_lat ?? lat,
                              lng:        sp.birth_lng ?? lon,
                              timezone:   sp.birth_timezone ?? timezone,
                              timeUnknown: !sp.time_of_birth,
                            });
                          }}
                          className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-bold border transition bg-white"
                          style={{ borderColor: 'var(--premium-gold)', color: 'var(--premium-gold)' }}
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
                  <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                    {t('recent')}
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {recentSearches.map((rs, i) => (
                      <button
                        key={i}
                        onClick={() => setKundaliInput(rs)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white text-[10px] font-semibold transition"
                        style={{ borderColor: 'var(--premium-border)', color: 'var(--brand-primary-strong)' }}
                      >
                        🕐 {rs.name || rs.birthPlace || 'Chart'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  placeholder={t('enterName')}
                  value={kundaliInput.name}
                  onChange={e => setKundaliInput(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white outline-none text-sm focus:border-[#C5A059] transition"
                  style={{ borderColor: 'var(--premium-border)', color: 'var(--brand-primary-strong)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                    {t('birthDate')}
                  </label>
                  <input
                    type="date"
                    value={kundaliInput.birthDate}
                    onChange={e => setKundaliInput(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white outline-none text-sm focus:border-[#C5A059] transition"
                    style={{ borderColor: 'var(--premium-border)', color: 'var(--brand-primary-strong)' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                    {t('birthTime')}
                  </label>
                  <input
                    type="time"
                    value={kundaliInput.birthTime}
                    disabled={kundaliInput.timeUnknown}
                    onChange={e => setKundaliInput(prev => ({ ...prev, birthTime: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white outline-none text-sm focus:border-[#C5A059] transition disabled:opacity-50"
                    style={{ borderColor: 'var(--premium-border)', color: 'var(--brand-primary-strong)' }}
                  />
                </div>
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                  {t('birthLocation')}
                </label>
                <input
                  type="text"
                  placeholder={t('birthLocationPlaceholder')}
                  value={kundaliInput.birthPlace}
                  onChange={e => handleLocationChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowLocSuggestions(false), 200)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white outline-none text-sm focus:border-[#C5A059] transition"
                  style={{ borderColor: 'var(--premium-border)', color: 'var(--brand-primary-strong)' }}
                />
                {showLocSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border overflow-hidden shadow-xl bg-white"
                    style={{ borderColor: 'var(--premium-border)' }}>
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
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b last:border-0 transition flex items-center gap-2"
                        style={{ borderBottomColor: 'var(--premium-border)', color: 'var(--brand-primary-strong)' }}
                      >
                        <span className="text-[#C5A059]">📍</span>
                        {s.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={kundaliInput.timeUnknown}
                  onChange={e => setKundaliInput(prev => ({ ...prev, timeUnknown: e.target.checked, birthTime: e.target.checked ? '' : prev.birthTime }))}
                  className="accent-[#C5A059]"
                />
                <span className="text-[10px]" style={{ color: 'var(--brand-muted)' }}>
                  {t('birthTimeUnknown')}
                </span>
              </label>
            </div>

            {kundaliError && (
              <div className="rounded-xl px-4 py-2.5 text-xs text-red-700 border border-red-200 bg-red-50">
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
                  
                  const { generateKundali, renderKundaliSVG } = await import('@/lib/jyotish/kundali-engine');
                  const result = generateKundali(fullInput, lang);
                  const svg = renderKundaliSVG(result);
                  setKundaliResult(result);
                  setSvgHtml(svg);
                  
                  const currentIdx = result.chart.dasha?.timeline?.findIndex((d: any) => d.isCurrent) ?? -1;
                  if (currentIdx >= 0) setSelectedDashaIdx(currentIdx);

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
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#C5A059] hover:opacity-90 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {kundaliLoading ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
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
            className={`space-y-4 ${
              textSize === 'sm' 
                ? 'text-[0.78rem] leading-snug' 
                : textSize === 'lg' 
                  ? 'text-[1.08rem] leading-relaxed' 
                  : 'text-[0.9rem]'
            }`}
          >
            {/* Back Button + Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setKundaliResult(null);
                  setSvgHtml(null);
                  setKundaliError(null);
                  setChartSaved(false);
                  setSelectedDashaIdx(null);
                  playHaptic('light');
                }}
                className="flex items-center gap-1.5 text-xs font-semibold border rounded-xl px-3.5 py-1.5 transition bg-white"
                style={{ borderColor: 'var(--premium-gold)', color: 'var(--premium-gold)' }}
              >
                ← {t('newChart')}
              </button>
              
              <div className="flex items-center gap-2 ml-auto">
                {/* Language toggle: EN | हि */}
                <div className="flex items-center rounded-xl border bg-white p-0.5"
                  style={{ borderColor: 'var(--premium-border)' }}>
                  {(['en', 'hi'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        lang === l
                          ? 'bg-[#C5A059] text-white'
                          : 'hover:text-black'
                      }`}
                      style={{ color: lang === l ? 'white' : 'var(--brand-muted)' }}
                    >
                      {l === 'en' ? 'EN' : 'हि'}
                    </button>
                  ))}
                </div>
                
                {/* Text size: A / AA / AAA */}
                <div className="flex items-center rounded-xl border bg-white p-0.5"
                  style={{ borderColor: 'var(--premium-border)' }}>
                  {(['sm', 'md', 'lg'] as const).map(sz => (
                    <button
                      key={sz}
                      onClick={() => setTextSize(sz)}
                      className={`px-2 py-1 rounded-lg font-bold transition ${
                        textSize === sz
                          ? 'bg-[#C5A059] text-white'
                          : 'hover:text-black'
                      } ${sz === 'sm' ? 'text-[9px]' : sz === 'md' ? 'text-[11px]' : 'text-[14px]'}`}
                      style={{ color: textSize === sz ? 'white' : 'var(--brand-muted)' }}
                    >
                      A
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timing confidence Card */}
            <div className="rounded-2xl p-4 border space-y-2 shadow-sm"
              style={{ 
                background: kundaliResult.chart.timeUnknown ? 'rgba(245, 158, 11, 0.04)' : 'rgba(56, 189, 248, 0.04)',
                borderColor: kundaliResult.chart.timeUnknown ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)'
              }}>
              <div className="flex items-center gap-2">
                <span className="text-base">{kundaliResult.chart.timeUnknown ? '⏳' : '🧭'}</span>
                <h3 className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: kundaliResult.chart.timeUnknown ? 'rgb(180, 83, 9)' : 'rgb(3, 105, 161)' }}>
                  {kundaliResult.chart.timeUnknown ? 'Timing Confidence: Partial' : 'Timing Confidence: High'}
                </h3>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                {kundaliResult.chart.timeUnknown
                  ? 'Birth time is unknown, so this reading is intentionally restricted to Moon sign, Nakshatra, Dasha, and sign-based guidance.'
                  : 'Birth time is available, so ascendant, houses, D9, and house-based interpretation are enabled.'}
              </p>
            </div>

            {/* Identity banner */}
            <div className="rounded-2xl p-5 border bg-white space-y-3 shadow-sm"
              style={{ borderColor: 'var(--premium-border)' }}>
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--premium-gold)' }}>
                  {kundaliResult.chart.timeUnknown ? 'Moon-Sign-Led Reading' : t('calculatedAscendant')}
                </span>
                <h3 className="font-serif text-2xl font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
                  {kundaliResult.chart.timeUnknown
                    ? `${kundaliResult.chart.planets['Chandra']?.rashiName ?? kundaliResult.lagnaSign} · ${kundaliResult.chart.nakshatra?.name ?? 'Nakshatra'}`
                    : `${kundaliResult.lagnaSign} (${kundaliResult.lagnaEnglish})`}
                </h3>
                <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>
                  {t('chartGeneratedFor')}: <span className="font-semibold text-gray-800">{kundaliResult.input.name}</span>
                </p>
                {kundaliResult.chart.timeUnknown && (
                  <p className="text-[10px] font-semibold text-amber-700 italic mt-1">
                    {t('birthTimeUnknownWarning')}
                  </p>
                )}
              </div>
              <div className="rounded-xl p-4 border"
                style={{ background: 'var(--premium-gold-soft)', borderColor: 'var(--premium-border)' }}>
                <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--brand-primary-strong)' }}>
                  {kundaliResult.lagnaReading}
                </p>
              </div>
            </div>

            {/* Pandit AI Destiny Reading */}
            {'panditAiDestinyReading' in kundaliResult && (
              <div className="rounded-2xl p-5 border space-y-3 relative overflow-hidden bg-white shadow-sm"
                style={{ borderColor: 'var(--premium-gold)' }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none"
                  style={{ background: 'var(--premium-gold-soft)' }} />
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔮</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--premium-gold)' }}>
                    {t('panditAiDestinyReadingLabel')}
                  </h3>
                </div>
                <div className="space-y-4 text-sm leading-relaxed font-medium" style={{ color: 'var(--brand-primary-strong)' }}>
                  {kundaliResult.panditAiDestinyReading.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Precision Notes */}
            {kundaliResult.precisionNotes?.length > 0 && (
              <div className="rounded-2xl p-4 border space-y-2"
                style={{ background: 'rgba(56, 189, 248, 0.04)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">🧭</span>
                  <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider">Calculation Confidence</h3>
                </div>
                <div className="space-y-1">
                  {kundaliResult.precisionNotes.map((note, index) => (
                    <p key={index} className="text-[11px] leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                      • {note}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Interpretation Sections */}
            {kundaliResult.interpretationSections?.length > 0 && (
              <div className="rounded-2xl p-4 border bg-white space-y-3 shadow-sm"
                style={{ borderColor: 'var(--premium-border)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                  Pandit-style interpretation sections
                </h4>
                <div className="space-y-2">
                  {kundaliResult.interpretationSections.map(section => (
                    <details key={section.id} className="group rounded-2xl border overflow-hidden bg-white"
                      style={{ borderColor: 'var(--premium-border)' }}>
                      <summary className="list-none cursor-pointer select-none px-4 py-3 flex items-start gap-3 hover:bg-gray-50/50">
                        <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          section.priority === 'foundation' ? 'bg-[#C5A059]'
                          : section.priority === 'timing' ? 'bg-sky-400'
                          : section.priority === 'caution' ? 'bg-orange-400'
                          : section.priority === 'sadhana' ? 'bg-emerald-400'
                          : 'bg-violet-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
                            {section.title}
                          </p>
                          <p className="text-[11px] leading-relaxed mt-1" style={{ color: 'var(--brand-muted)' }}>
                            {section.summary}
                          </p>
                        </div>
                        <span className="text-[#C5A059] group-open:rotate-180 transition-transform duration-300 text-xs">▼</span>
                      </summary>
                      <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--premium-border)' }}>
                        <div className="space-y-1.5 pt-3">
                          {section.points.map((point, idx) => (
                            <p key={idx} className="text-[11px] leading-relaxed" style={{ color: 'var(--brand-primary-strong)' }}>
                              • {point}
                            </p>
                          ))}
                        </div>
                        <div className="rounded-xl border px-3 py-2 space-y-1"
                          style={{ background: 'var(--premium-gold-soft)', borderColor: 'var(--premium-border)' }}>
                          <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'var(--premium-gold)' }}>
                            Actionable Reading
                          </p>
                          {section.actions.map((action, idx) => (
                            <p key={idx} className="text-[11px] leading-relaxed" style={{ color: 'var(--brand-primary-strong)' }}>
                              • {action}
                            </p>
                          ))}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Styled North Indian Kundali SVG */}
            {!kundaliResult.chart.timeUnknown && svgHtml && (
              <div className="rounded-2xl p-4 border bg-white space-y-3 flex flex-col items-center shadow-sm"
                style={{ borderColor: 'var(--premium-border)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider self-start" style={{ color: 'var(--brand-muted)' }}>
                  {t('northIndianRashiChart')}
                </h4>
                <div className="w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden shadow-md border"
                  style={{ borderColor: 'var(--premium-border)' }}
                  dangerouslySetInnerHTML={{ __html: svgHtml }}
                />
                <span className="text-[10px] italic" style={{ color: 'var(--brand-muted)' }}>
                  {t('rashiPlacementsHint')}
                </span>
              </div>
            )}

            {/* Nakshatra + Dasha card */}
            {kundaliResult.chart && (
              <div className="rounded-2xl p-4 border bg-white space-y-4 shadow-sm"
                style={{ borderColor: 'var(--premium-border)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                  {t('birthNakshatraDasha')}
                </h4>

                {/* Janma Nakshatra */}
                {kundaliResult.chart.nakshatra && (() => {
                  const nk = kundaliResult.chart.nakshatra;
                  const attrs = NAKSHATRA_ATTRS[nk.name];
                  return (
                    <div className="rounded-2xl p-4 border bg-white/40 space-y-3"
                      style={{ borderColor: 'var(--premium-border)' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border"
                          style={{ background: 'var(--premium-gold-soft)', borderColor: 'var(--premium-border)' }}>
                          {attrs?.symbol ?? '⭐'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                            {t('janmaNakshatra')}
                          </p>
                          <p className="font-serif text-lg font-bold leading-tight" style={{ color: 'var(--brand-primary-strong)' }}>
                            {nk.name}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-muted)' }}>
                            Pada {nk.pada} · Lord: {nk.lord} · {nk.devata}
                          </p>
                        </div>
                      </div>
                      {attrs && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className={`rounded-lg px-2 py-1.5 border text-center text-[9px] font-bold ${GANA_COLOR[attrs.gana] ?? 'border-white/10'}`}>
                            <div className="text-[8px] opacity-60 mb-0.5">Gana</div>
                            {attrs.gana}
                          </div>
                          <div className={`rounded-lg px-2 py-1.5 border text-center text-[9px] font-bold ${ELEMENT_COLOR[attrs.element] ?? 'border-white/10'}`}>
                            <div className="text-[8px] opacity-60 mb-0.5">Tattva</div>
                            {attrs.element}
                          </div>
                          <div className="rounded-lg px-2 py-1.5 border text-center text-[9px] font-bold bg-gray-50 border-gray-200 text-gray-700">
                            <div className="text-gray-400 text-[8px] mb-0.5">Animal</div>
                            {attrs.animal}
                          </div>
                        </div>
                      )}
                      {attrs?.syllable && (
                        <div className="rounded-xl px-3 py-2 border"
                          style={{ background: 'var(--premium-gold-soft)', borderColor: 'var(--premium-border)' }}>
                          <p className="text-[9px] uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--premium-gold)' }}>
                            Seed Syllables (Naam Akshar)
                          </p>
                          <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--brand-primary-strong)' }}>
                            {attrs.syllable}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Mahadasha Period */}
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
                    <div className="rounded-2xl p-4 border bg-white/40 space-y-3"
                      style={{ borderColor: 'var(--premium-border)' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border"
                          style={{ background: 'var(--premium-gold-soft)', borderColor: 'var(--premium-border)' }}>
                          🔮
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                            {t('mahadasha')}
                          </p>
                          <p className="font-serif text-lg font-bold leading-tight" style={{ color: 'var(--brand-primary-strong)' }}>
                            {dasha.planet} {t('mahadasha')}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-muted)' }}>
                            {startDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            {' – '}
                            {endDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            {' · '}{dashaYears}y period
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-2xl font-bold" style={{ color: 'var(--premium-gold)' }}>{pct}%</p>
                          <p className="text-[9px]" style={{ color: 'var(--brand-muted)' }}>{t('elapsed')}</p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="h-2.5 w-full rounded-full bg-gray-100 border overflow-hidden"
                          style={{ borderColor: 'var(--premium-border)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-[#C5A059] to-amber-300"
                          />
                        </div>
                        <div className="flex justify-between text-[8px]" style={{ color: 'var(--brand-muted)' }}>
                          <span>{t('start')}</span>
                          <span>{t('today')}</span>
                          <span>{t('end')}</span>
                        </div>
                      </div>
                      
                      {/* Current antardasha */}
                      {antardasha && (
                        <div className="rounded-xl px-3 py-2.5 border space-y-0.5 bg-amber-50/50"
                          style={{ borderColor: 'var(--premium-border)' }}>
                          <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--premium-gold)' }}>
                            {t('currentAntardasha')}
                          </p>
                          <p className="text-sm font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
                            {antardasha.planet} Antardasha
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--brand-muted)' }}>
                            {new Date(antardasha.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' – '}
                            {new Date(antardasha.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Vimshottari explore */}
                {kundaliResult.chart.dasha?.timeline && (() => {
                  const timeline = kundaliResult.chart.dasha.timeline as Array<{ planet: string; startDate: string; endDate: string; years: number; isCurrent: boolean }>;
                  const now = new Date();
                  return (
                    <div className="space-y-2">
                      <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                        {t('vimshottariDashaExplore')}
                      </p>
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
                                className={`flex-shrink-0 rounded-xl px-3 py-2.5 border text-center transition-all active:scale-95 bg-white ${
                                  isSelected
                                    ? 'shadow-md border-amber-300'
                                    : isActive
                                      ? 'border-[#C5A059] bg-[#C5A059]/5'
                                      : isPast
                                        ? 'opacity-40'
                                        : 'hover:border-gray-300'
                                }`}
                                style={{ borderColor: isSelected ? 'var(--premium-gold)' : isActive ? 'var(--premium-gold)' : 'var(--premium-border)' }}
                              >
                                <div className="text-base mb-0.5">{wisdom?.emoji ?? '🪐'}</div>
                                <p className="text-[9px] font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
                                  {d.planet}
                                </p>
                                <p className="text-[8px] mt-0.5" style={{ color: 'var(--brand-muted)' }}>{d.years}y</p>
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] mx-auto mt-1 animate-pulse" />}
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
                            className={`rounded-2xl p-4 border space-y-4`}
                            style={{ background: 'var(--premium-gold-soft)', borderColor: 'var(--premium-border)' }}
                          >
                            {/* Header */}
                            <div className="flex items-start gap-3">
                              <div className="text-3xl">{wisdom.emoji}</div>
                              <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--premium-gold)' }}>
                                  {wisdom.hi}
                                </p>
                                <p className="text-lg font-serif font-bold text-gray-800">
                                  {d.planet} {t('mahadasha')} · {wisdom.en}
                                </p>
                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-muted)' }}>
                                  {dStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                  {' – '}
                                  {dEnd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                  {' · '}{d.years} year period
                                  {isActive && <span className="ml-2 font-bold text-amber-700">● ACTIVE NOW</span>}
                                  {isPast && <span className="ml-2 opacity-50"> (past)</span>}
                                </p>
                              </div>
                            </div>

                            {/* Progress bar */}
                            {pct > 0 && (
                              <div className="space-y-1">
                                <div className="h-2 rounded-full bg-white/70 overflow-hidden border" style={{ borderColor: 'var(--premium-border)' }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                    className="h-full rounded-full bg-gradient-to-r from-[#C5A059] to-amber-300"
                                  />
                                </div>
                                <p className="text-[8px] text-right" style={{ color: 'var(--brand-muted)' }}>
                                  {pct}% {t('elapsed')}
                                </p>
                              </div>
                            )}

                            {/* Domains */}
                            <div className="rounded-xl px-3 py-2.5 bg-white/80 border" style={{ borderColor: 'var(--premium-border)' }}>
                              <p className="text-[9px] uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--premium-gold)' }}>
                                {t('rulingDomains')}
                              </p>
                              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--brand-primary-strong)' }}>
                                {wisdom.domains}
                              </p>
                            </div>

                            {/* Pros & Cons */}
                            <div className="grid grid-cols-1 gap-2">
                              <div className="rounded-xl px-3 py-2.5 bg-emerald-50 border border-emerald-200">
                                <p className="text-[9px] text-emerald-700 uppercase font-bold tracking-wider mb-1">{t('favourable')}</p>
                                <p className="text-[11px] text-emerald-950 leading-relaxed">{wisdom.pros}</p>
                              </div>
                              <div className="rounded-xl px-3 py-2.5 bg-red-50 border border-red-200">
                                <p className="text-[9px] text-red-700 uppercase font-bold tracking-wider mb-1">{t('challenges')}</p>
                                <p className="text-[11px] text-red-950 leading-relaxed">{wisdom.cons}</p>
                              </div>
                              <div className="rounded-xl px-3 py-2.5 bg-amber-50 border border-amber-200">
                                <p className="text-[9px] text-amber-700 uppercase font-bold tracking-wider mb-1">{t('upaya')}</p>
                                <p className="text-[11px] text-amber-950 leading-relaxed">{wisdom.remedies}</p>
                              </div>
                            </div>

                            {/* Beeja Mantra */}
                            <div className="rounded-xl px-3 py-2.5 bg-violet-50 border border-violet-200 text-center">
                              <p className="text-[9px] text-violet-700 uppercase font-bold tracking-wider mb-1">{t('beejaMantraLabel')}</p>
                              <p className="text-[11px] font-semibold text-violet-950 tracking-wider leading-relaxed">{wisdom.mantra}</p>
                            </div>

                            {/* Antardasha sub-periods */}
                            <div className="space-y-1.5">
                              <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                                Antardasha Sub-periods
                              </p>
                              {antardasha.map((a, ai) => {
                                const aStart  = new Date(a.startDate);
                                const aEnd    = new Date(a.endDate);
                                const isNow   = aStart <= now && now < aEnd;
                                const aWisdom = DASHA_WISDOM[a.planet];
                                return (
                                  <div key={ai}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition bg-white ${
                                      isNow ? 'border-[#C5A059]' : ''
                                    }`}
                                    style={{ borderColor: isNow ? 'var(--premium-gold)' : 'var(--premium-border)' }}
                                  >
                                    <span className="text-sm flex-shrink-0">{aWisdom?.emoji ?? '🪐'}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
                                        {a.planet} Antardasha
                                        {isNow && <span className="ml-1.5 text-[8px] text-amber-700 font-bold animate-pulse">● NOW</span>}
                                      </p>
                                      <p className="text-[9px]" style={{ color: 'var(--brand-muted)' }}>
                                        {aStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {' – '}
                                        {aEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </p>
                                    </div>
                                    <span className="text-[9px] flex-shrink-0" style={{ color: 'var(--brand-muted)' }}>
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
            {!kundaliResult.chart.timeUnknown && (
              <div className="grid gap-4">
                {/* Yogas */}
                {kundaliResult.yogaResults?.length > 0 && (
                  <div className="rounded-2xl p-4 border space-y-3"
                    style={{ background: 'rgba(124, 58, 237, 0.04)', borderColor: 'rgba(124, 58, 237, 0.2)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🪷</span>
                      <h4 className="text-xs font-bold text-violet-800 uppercase tracking-wider">Detected Yogas</h4>
                    </div>
                    <div className="space-y-2">
                      {kundaliResult.yogaResults.map(yoga => (
                        <div key={yoga.id} className="rounded-xl px-3 py-2 border bg-white"
                          style={{ borderColor: 'var(--premium-border)' }}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold" style={{ color: 'var(--brand-primary-strong)' }}>{yoga.name}</p>
                            <span className="text-[9px] rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-violet-700 font-semibold">
                              {yoga.strength}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed mt-1" style={{ color: 'var(--brand-muted)' }}>
                            {yoga.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drishti aspect contacts */}
                {kundaliResult.aspectResults?.length > 0 && (
                  <div className="rounded-2xl p-4 border bg-white space-y-3 shadow-sm"
                    style={{ borderColor: 'var(--premium-border)' }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                      Close Drishti Contacts
                    </h4>
                    <div className="grid gap-2">
                      {kundaliResult.aspectResults.slice(0, 8).map((aspect, idx) => (
                        <div key={`${aspect.from}-${aspect.to}-${idx}`} className="flex items-center gap-3 rounded-xl border bg-white px-3 py-2"
                          style={{ borderColor: 'var(--premium-border)' }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold border flex-shrink-0"
                            style={{ background: 'var(--premium-gold-soft)', borderColor: 'var(--premium-border)', color: 'var(--premium-gold)' }}>
                            {aspect.aspect}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
                              {aspect.from} → {aspect.to}
                            </p>
                            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                              {aspect.note} · orb {aspect.orbDegrees}°
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navamsha placements */}
                {kundaliResult.navamshaPlacements?.length > 0 && (
                  <div className="rounded-2xl p-4 border space-y-3 bg-white shadow-sm"
                    style={{ borderColor: 'var(--premium-border)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                        Navamsha D9 Layer
                      </h4>
                      <span className="text-[9px]" style={{ color: 'var(--brand-muted)' }}>Inner maturity</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {kundaliResult.navamshaPlacements.slice(0, 10).map(p => (
                        <div key={`d9-${p.key}`} className="rounded-xl border bg-gray-50 px-3 py-2"
                          style={{ borderColor: 'var(--premium-border)' }}>
                          <p className="text-[10px] font-bold" style={{ color: 'var(--brand-primary-strong)' }}>{p.name}</p>
                          <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--premium-gold)' }}>{p.sign}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save Chart actions */}
            {chartSaved ? (
              <div className="rounded-2xl p-3 border border-green-200 bg-green-50 flex items-center gap-3">
                <span className="text-lg">✅</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-green-800">Chart saved to your profile</p>
                  {isLoggedIn && savedProfiles.length > 0 && (
                    <p className="text-[10px] text-green-700/80 mt-0.5">
                      {savedProfiles.length} chart{savedProfiles.length !== 1 ? 's' : ''} saved · load any from the form
                    </p>
                  )}
                </div>
              </div>
            ) : saveError ? (
              <div className="rounded-2xl p-3 border border-red-200 bg-red-50 text-center text-xs font-semibold text-red-700">
                ⚠️ {saveError}
              </div>
            ) : isLoggedIn ? (
              <div className="rounded-2xl p-4 border flex items-center gap-3 bg-white shadow-sm"
                style={{ borderColor: 'var(--premium-border)' }}>
                <span className="text-xl flex-shrink-0">💾</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: 'var(--brand-primary-strong)' }}>Save this chart</p>
                  <p className="text-[10px]" style={{ color: 'var(--brand-muted)' }}>
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
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-[#C5A059] hover:opacity-90 transition shadow-sm"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="rounded-2xl p-4 border flex items-start gap-3 bg-white shadow-sm"
                style={{ borderColor: 'var(--premium-border)' }}>
                <span className="text-xl flex-shrink-0">💾</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: 'var(--premium-gold)' }}>{t('saveYourKundali')}</p>
                  <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
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
                        window.location.href = `/auth/signup?next=${encodeURIComponent('/kundali')}&claim_token=${encodeURIComponent(guestToken)}`;
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
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-[#C5A059] hover:opacity-90 transition shadow-sm"
                >
                  {t('saveBtn')}
                </button>
              </div>
            )}

            {/* Sade Sati Active Warning */}
            {sadeSati?.isActive && (
              <div className="rounded-2xl p-4 border border-orange-200 space-y-2 shadow-sm"
                style={{ background: 'rgba(200,80,20,0.06)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <h4 className="text-xs font-bold text-orange-700 uppercase tracking-wider">{t('sadeSatiActive')}</h4>
                </div>
                <p className="text-sm font-semibold text-orange-950">
                  {sadeSati.phase === 'rising' ? t('sadeSatiRising')
                    : sadeSati.phase === 'peak' ? t('sadeSatiPeak')
                    : t('sadeSatiSetting')}
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                  {t('sadeSatiDescription')
                    .replace('{saturnRashi}', sadeSati.saturnRashi)
                    .replace('{moonRashi}', sadeSati.moonRashi)}
                </p>
              </div>
            )}

            {/* Planet positions snapshots */}
            <div className="rounded-2xl p-4 border bg-white space-y-3 shadow-sm"
              style={{ borderColor: 'var(--premium-border)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                {kundaliResult.chart.timeUnknown ? 'Graha Sign Snapshot' : t('grahasHousePlacements')}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {kundaliResult.placements.map(p => {
                  const grahaData = kundaliResult.chart.planets[p.key];
                  const dignity   = grahaData?.dignity;
                  const combust   = grahaData?.isCombust;
                  const dignityColor = dignity === 'exalted'     ? 'text-emerald-700'
                                     : dignity === 'debilitated' ? 'text-red-700'
                                     : dignity === 'own'         ? 'text-sky-700'
                                     : '';
                  const dignityLabel = dignity === 'exalted'     ? 'Uchcha'
                                     : dignity === 'debilitated' ? 'Neecha'
                                     : dignity === 'own'         ? 'Svakshetra'
                                     : null;
                  return (
                    <div key={p.key} className="flex items-center gap-2 p-2 rounded-xl border bg-gray-50/50"
                      style={{ borderColor: 'var(--premium-border)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 border bg-white"
                        style={{ color: 'var(--premium-gold)', borderColor: 'var(--premium-border)' }}>
                        {p.symbol}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold flex items-center gap-1 flex-wrap" style={{ color: 'var(--brand-primary-strong)' }}>
                          {p.name}
                          {p.isRetrograde && <span className="text-[9px] text-orange-600">(R)</span>}
                          {combust && <span className="text-[9px] text-red-600">combust</span>}
                          {dignityLabel && <span className={`text-[9px] font-bold ${dignityColor}`}>{dignityLabel}</span>}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--brand-muted)' }}>
                          {kundaliResult.chart.timeUnknown ? `${p.sign} ${p.degree}` : `H${p.house} · ${p.sign} ${p.degree}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shadbala Strengths Heatmap */}
            {!kundaliResult.chart.timeUnknown && (
              <div className="rounded-2xl p-4 border bg-white space-y-4 shadow-sm"
                style={{ borderColor: 'var(--premium-border)' }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                    {t('grahaShadbalaStrength')}
                  </h4>
                  <span className="text-[9px] font-bold border px-2 py-0.5 rounded-md"
                    style={{ background: 'var(--premium-gold-soft)', borderColor: 'var(--premium-border)', color: 'var(--premium-gold)' }}>
                    {t('vedicPowerIndex')}
                  </span>
                </div>

                <div className="space-y-3">
                  {kundaliResult.placements.map(p => {
                    const barColor = p.strength >= 80 ? 'from-[#C5A059] to-amber-300' 
                                   : p.strength >= 60 ? 'from-emerald-600 to-teal-400' 
                                   : 'from-orange-600 to-red-400';
                    return (
                      <div key={p.key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--brand-primary-strong)' }}>
                            <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold border bg-white"
                              style={{ color: 'var(--premium-gold)', borderColor: 'var(--premium-border)' }}>
                              {p.symbol}
                            </span>
                            {p.name} <span className="text-[10px] font-medium" style={{ color: 'var(--brand-muted)' }}>({p.sign})</span>
                          </span>
                          <span className="font-bold" style={{ color: 'var(--brand-muted)' }}>{p.strength}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden border relative"
                          style={{ borderColor: 'var(--premium-border)' }}>
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
            )}

            {/* Bhava readings */}
            {!kundaliResult.chart.timeUnknown && (
              <div className="rounded-2xl p-4 border bg-white space-y-3 shadow-sm"
                style={{ borderColor: 'var(--premium-border)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                  {t('interactiveBhavaReadings')}
                </h4>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(house => (
                    <details key={house} className="group border rounded-xl overflow-hidden transition-all duration-300 bg-white"
                      style={{ borderColor: 'var(--premium-border)' }}>
                      <summary className="flex justify-between items-center px-4 py-3 bg-gray-50/50 cursor-pointer select-none hover:bg-gray-50 list-none">
                        <span className="text-xs font-bold flex items-center gap-2" style={{ color: 'var(--brand-primary-strong)' }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ background: 'var(--premium-gold-soft)', color: 'var(--premium-gold)' }}>
                            {house}
                          </span>
                          {t('houseReading').replace('{house}', house.toString())}
                        </span>
                        <span className="text-[#C5A059] group-open:rotate-180 transition-transform duration-300 text-xs">▼</span>
                      </summary>
                      <div className="px-4 py-3 text-xs leading-relaxed border-t"
                        style={{ color: 'var(--brand-muted)', borderColor: 'var(--premium-border)' }}>
                        {kundaliResult.houseReadings[house]}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
